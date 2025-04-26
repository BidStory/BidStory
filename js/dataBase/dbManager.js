// fdb.js file
function noUpgrade ( dbName )
{
  const openDB = async () =>
  {
    console.log( "🚀 [openDB] محاولة فتح قاعدة البيانات..." );
    return new Promise( ( resolve, reject ) =>
    {
      const request = indexedDB.open( dbName );
      request.onsuccess = () =>
      {
        console.log( "🌟 [openDB] تم فتح قاعدة البيانات بنجاح" );
        resolve( request.result );
      };
      request.onerror = () =>
      {
        console.error( "❌ [openDB] فشل في فتح قاعدة البيانات:", request.error );
        reject( request.error );
      };
    } );
  };

  const isTableExist = async ( tableName ) =>
  {
    console.log( `🔍 [isTableExist] التحقق من وجود الجدول: ${ tableName }` );
    let db;
    try
    {
      db = await openDB();
      const exists = db.objectStoreNames.contains( tableName );
      console.log( `📦 [isTableExist] ${ exists ? "الجدول موجود ✅" : "الجدول غير موجود ⚠️" }` );
      return exists;
    } catch ( error )
    {
      db.close(); console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );
      console.error( "❌ [isTableExist] خطأ أثناء التحقق:", error );
      return false;
    } finally
    {
      if ( db ) { db.close(); console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName ); }
    }
  };

  /**
 * تعيين أو تحديث قيمة في جدول IndexedDB
 * @param {string} tableName - اسم الجدول
 * @param {string} key - المفتاح الفريد
 * @param {any} value - القيمة المراد تخزينها
 * @returns {Promise<void>}
 */
  const keySet = async ( tableName, key, value ) =>
  {


    let db;
    try
    {
      db = await openDB();
      const transaction = db.transaction( [ tableName ], "readwrite" );
      const store = transaction.objectStore( tableName );

      // 1. التحقق من وجود المفتاح
      const existing = await new Promise( ( resolve, reject ) =>
      {
        const request = store.index( 'key' ).get( key ); // استخدام الفهرس للبحث بالمفتاح
        request.onsuccess = () => resolve( request.result || null );
        request.onerror = ( e ) => reject( e.target.error );
      } );

      // 2. استخدام put() للإضافة أو التحديث
      await new Promise( ( resolve, reject ) =>
      {
        const data = existing
          ? { id: existing.id, key, value } // الحفاظ على نفس ID للتحديث
          : { key, value }; // إنشاء جديد بدون تحديد ID (سيتم توليده تلقائياً)

        const request = store.put( data );

        // @ts-ignore
        request.onsuccess = () => resolve();
        request.onerror = ( e ) => reject( e.target.error );
      } );

      await new Promise( resolve =>
      {
        transaction.oncomplete = resolve;
      } );

    } catch ( error )
    {
      db.close(); console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );
      console.error( `❌ خطأ في keySet (${ tableName }, ${ key }):`, error );
      throw error;
    } finally
    {
      if ( db )
      {
        db.close(); console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );
      }
    }
  };

  const keyGet = async ( tableName, key ) =>
  {
    let db;

    console.log( `🔍 [keyGet] محاولة جلب العنصر من ${ tableName } بواسطة key: ${ key }` );

    try
    {
      db = await openDB();
      const transaction = db.transaction( [ tableName ], "readonly" );
      const objectStore = transaction.objectStore( tableName );
      const index = objectStore.index( "key" ); // نستخدم الفهرس بدلاً من المفتاح الأساسي

      const value = await new Promise( ( resolve, reject ) =>
      {
        const request = index.get( key );
        request.onsuccess = () =>
        {
          if ( request.result )
          {
            console.log( `✅ [keyGet] تم العثور على القيمة في ${ tableName }:`, request.result.value );
            resolve( request.result.value );
          } else
          {
            console.log( `⚠️ [keyGet] لا توجد قيمة لهذا المفتاح '${ key }' في ${ tableName }` );
            resolve( null );
          }
        };
        request.onerror = () =>
        {
          console.error( `❌ [keyGet] خطأ أثناء القراءة من ${ tableName }:`, request.error );
          reject( request.error );
        };
      } );

      return value;
    } catch ( error )
    {
      console.error( `❌ [keyGet] خطأ عام أثناء الجلب من ${ tableName }:`, error );
      db.close(); console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );

      return null;
    } finally
    {
      if ( db ) { db.close(); console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName ); };

    }

  };

  const keyDelete = async ( tableName, key ) =>
  {

    console.log( `🗑️ [keyDelete] محاولة حذف العنصر ذو المفتاح: ${ key } من ${ tableName }` );
    let db;
    try
    {
      db = await openDB();
      const transaction = db.transaction( [ tableName ], "readwrite" );
      const store = transaction.objectStore( tableName );
      const index = store.index( "key" );

      const getRequest = index.get( key );
      getRequest.onsuccess = () =>
      {
        const result = getRequest.result;
        if ( result )
        {
          const deleteRequest = store.delete( result.id ); // نحذف باستخدام id
          deleteRequest.onsuccess = () =>
          {
            console.log( `✅ [keyDelete] تم حذف العنصر (key: ${ key }) بنجاح من ${ tableName }` );
          };
          deleteRequest.onerror = () =>
          {
            console.error( `❌ [keyDelete] فشل في حذف العنصر من ${ tableName }:`, deleteRequest.error );
          };
        } else
        {
          console.warn( `⚠️ [keyDelete] لم يتم العثور على أي عنصر بالمفتاح: ${ key } في ${ tableName }` );
        }
      };

      getRequest.onerror = () =>
      {
        console.error( `❌ [keyDelete] خطأ أثناء البحث عن المفتاح: ${ key } في ${ tableName }:`, getRequest.error );
      };

      transaction.oncomplete = () =>
      {
        console.log( "🔚 [keyDelete] تم إنهاء المعاملة" );
        db.close();
      };
    } catch ( error )
    {
      db.close(); console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );

      console.error( `❌ [keyDelete] خطأ أثناء الحذف من ${ tableName }:`, error );
    } finally
    {
      if ( db )
      {
        db.close(); console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );
      }
    }

  };

  const getAllDataFromTable = async ( tableName ) =>
  {
    if ( await isTableExist( tableName ) )
    {
      console.log( `📥 [getAllDataFromTable] محاولة جلب كل البيانات من الجدول: ${ tableName }` );
      let db;
      try
      {
        db = await openDB();
        return new Promise( ( resolve, reject ) =>
        {
          const transaction = db.transaction( tableName, "readonly" );
          const objectStore = transaction.objectStore( tableName );
          const request = objectStore.getAll();

          request.onsuccess = () =>
          {
            console.log( `✅ [getAllDataFromTable] تم جلب البيانات من ${ tableName }` );
            resolve( request.result );
          };
          request.onerror = () =>
          {
            console.error( "❌ [getAllDataFromTable] فشل في جلب البيانات:", request.error );
            reject( "❌ فشل في جلب البيانات: " + request.error );
          };
        } );
      } catch ( error )
      {
        console.error( "❌ [getAllDataFromTable] خطأ:", error );
        return [];
      } finally
      {
        if ( db ) { db.close(); console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName ); };
      }
    }
  };

  /// <summary>
  /// دالة تقوم بإدخال البيانات في جدول معين من خلال ترتيب القيم فقط دون الحاجة لتحديد أسماء الأعمدة.
  /// تعتمد على ترتيب الـ Indexes المعرفة مسبقًا داخل الجدول.
  /// </summary>
  /// <param name="tableName">اسم الجدول</param>
  /// <param name="values">مصفوفة القيم المرتبة</param>
  const insertInTable = async ( tableName, values ) =>
  {
    try
    {
      // فتح قاعدة البيانات
      const db = await openDB();

      // فتح transaction للكتابة
      const transaction = db.transaction( [ tableName ], "readwrite" );
      const store = transaction.objectStore( tableName );

      // استخراج أسماء الأعمدة (باستثناء المفتاح الأساسي keyPath)
      const indexNames = Array.from( store.indexNames );

      if ( values.length !== indexNames.length )
      {
        throw new Error( `❌ عدد القيم (${ values.length }) لا يطابق عدد الأعمدة (${ indexNames.length }) في الجدول ${ tableName }.` );
      }

      // بناء الكائن الذي سيتم إدخاله
      const dataObject = {};
      for ( let i = 0; i < indexNames.length; i++ )
      {
        dataObject[ indexNames[ i ] ] = values[ i ];
      }

      // إدخال البيانات
      const request = store.add( dataObject );

      return await new Promise( ( resolve, reject ) =>
      {
        request.onsuccess = () =>
        {
          console.log( `✅ [insertInTable] تم إدخال البيانات بنجاح في ${ tableName }` );
          resolve( true );
        };

        request.onerror = ( event ) =>
        {
          console.error( "❌ [insertInTable] فشل في إدخال البيانات:", event.target.error );
          reject( event.target.error );
        };
      } );

    } catch ( error )
    {
      console.error( "❌ [insertInTable] خطأ أثناء الإدخال:", error );
      return false;
    }
  };


  /*
  await getRow("users", 1); // البحث عن صف بالـ id
  await getRow("users", "email", "test@example.com"); // البحث عن صف بالبريد
  */
  const getRow = async ( tableName, ...args ) =>
  {
    if ( !await isTableExist( tableName ) )
    {
      console.warn( `⚠️ [getRow] الجدول ${ tableName } غير موجود` );
      return null;
    }

    console.log( `🔍 [getRow] محاولة جلب صف من الجدول: ${ tableName }` );

    let db;
    try
    {
      db = await openDB();
      const transaction = db.transaction( [ tableName ], "readonly" );
      const store = transaction.objectStore( tableName );

      // إذا تم تمرير id فقط
      if ( args.length === 1 )
      {
        const id = args[ 0 ];
        console.log( `🆔 [getRow] البحث باستخدام id: ${ id }` );
        return await new Promise( ( resolve, reject ) =>
        {
          const request = store.get( id );
          request.onsuccess = () =>
          {
            const result = request.result;
            if ( result )
            {
              console.log( "✅ [getRow] تم العثور على الصف:", result );
              resolve( result );
            } else
            {
              console.warn( `⚠️ [getRow] لم يتم العثور على صف بـ id = ${ id }` );
              resolve( null );
            }
          };
          request.onerror = () =>
          {
            console.error( "❌ [getRow] خطأ أثناء البحث:", request.error );
            reject( request.error );
          };
        } );
      }

      // إذا تم تمرير [columnName, value]
      else if ( args.length === 2 )
      {
        const [ columnName, value ] = args;
        console.log( `🔎 [getRow] البحث في العمود '${ columnName }' عن القيمة '${ value }'` );
        if ( !store.indexNames.contains( columnName ) )
        {
          console.warn( `⚠️ [getRow] لا يوجد فهرس بهذا الاسم: '${ columnName }'` );
          return null;
        }

        const index = store.index( columnName );
        return await new Promise( ( resolve, reject ) =>
        {
          const request = index.get( value );
          request.onsuccess = () =>
          {
            const result = request.result;
            if ( result )
            {
              console.log( "✅ [getRow] تم العثور على الصف:", result );
              resolve( result );
            } else
            {
              console.warn( `⚠️ [getRow] لم يتم العثور على صف حيث ${ columnName } = ${ value }` );
              resolve( null );
            }
          };
          request.onerror = () =>
          {
            console.error( "❌ [getRow] خطأ أثناء البحث:", request.error );
            reject( request.error );
          };
        } );
      }

      else
      {
        console.error( "❌ [getRow] عدد الوسائط غير صحيح. استخدم: getRow(tableName, id) أو getRow(tableName, columnName, value)" );
        return null;
      }

    } catch ( error )
    {
      console.error( "❌ [getRow] خطأ عام:", error );
      return null;
    } finally
    {
      if ( db ) db.close();
    }
  };

  /*
  await dbTools.deleteRow("users", 7); // حذف باستخدام id
  await dbTools.deleteRow("users", "email", "ahmed@example.com"); // حذف باستخدام البريد
  */
  const deleteRow = async ( tableName, ...args ) =>
  {
    if ( !await isTableExist( tableName ) )
    {
      console.warn( `⚠️ [deleteRow] الجدول ${ tableName } غير موجود` );
      return false;
    }

    let db;
    try
    {
      db = await openDB();
      const transaction = db.transaction( [ tableName ], "readwrite" );
      const store = transaction.objectStore( tableName );

      // حذف باستخدام ID مباشر
      if ( args.length === 1 )
      {
        const id = args[ 0 ];
        console.log( `🗑️ [deleteRow] حذف الصف باستخدام id: ${ id }` );
        return await new Promise( ( resolve, reject ) =>
        {
          const request = store.delete( id );
          request.onsuccess = () =>
          {
            console.log( `✅ [deleteRow] تم حذف الصف بـ id = ${ id } من ${ tableName }` );
            db.close();
            console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );

            resolve( true );
          };
          request.onerror = () =>
          {
            console.error( "❌ [deleteRow] فشل الحذف:", request.error );
            db.close();
            console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );

            reject( request.error );
          };
        } );
      }

      // حذف باستخدام columnName و value
      else if ( args.length === 2 )
      {
        const [ columnName, value ] = args;
        console.log( `🗑️ [deleteRow] حذف الصف حيث ${ columnName } = ${ value }` );

        if ( !store.indexNames.contains( columnName ) )
        {
          console.warn( `⚠️ [deleteRow] لا يوجد فهرس باسم '${ columnName }' في ${ tableName }` );
          db.close();
          console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );

          return false;
        }

        const index = store.index( columnName );
        return await new Promise( ( resolve, reject ) =>
        {
          const getRequest = index.get( value );
          getRequest.onsuccess = () =>
          {
            const result = getRequest.result;
            if ( result && result.id !== undefined )
            {
              const deleteRequest = store.delete( result.id );
              deleteRequest.onsuccess = () =>
              {
                console.log( `✅ [deleteRow] تم حذف الصف حيث ${ columnName } = ${ value }` );
                db.close();
                console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );

                resolve( true );
              };
              deleteRequest.onerror = () =>
              {
                console.error( "❌ [deleteRow] فشل الحذف:", deleteRequest.error );
                db.close();
                console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );

                reject( deleteRequest.error );
              };
            } else
            {
              console.warn( `⚠️ [deleteRow] لم يتم العثور على صف حيث ${ columnName } = ${ value }` );
              resolve( false );
            }
          };
          getRequest.onerror = () =>
          {
            console.error( "❌ [deleteRow] خطأ أثناء البحث:", getRequest.error );
            reject( getRequest.error );
          };
        } );
      }

      else
      {
        console.error( "❌ [deleteRow] الوسائط غير صحيحة. استخدم: deleteRow(tableName, id) أو deleteRow(tableName, columnName, value)" );
        return false;
      }

    } catch ( error )
    {
      db.close();
      console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );
      console.error( "❌ [deleteRow] خطأ عام:", error );
      return false;
    } finally
    {
      if ( db )
      {
        db.close(); console.log( "🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );
      }
    }
  };




  return {
    openDB,
    isTableExist,
    keySet,
    keyGet,
    keyDelete,
    getAllDataFromTable,
    getRow,
    deleteRow,
    insertInTable
  };
}

function upgrade ( dbName )
{
  let currentVersion = 1;

  const getCurrentVersion = async () =>
  {
    console.log( "📊 [getCurrentVersion] محاولة الحصول على نسخة القاعدة الحالية" );
    try
    {
      const db = await new Promise( ( resolve, reject ) =>
      {
        const request = indexedDB.open( dbName );
        request.onsuccess = () => resolve( request.result );
        request.onerror = () => reject( request.error );
      } );

      currentVersion = db.version;
      console.log( `📈 [getCurrentVersion] النسخة الحالية هي: ${ currentVersion }` );
      db.close();
      return currentVersion;
    } catch ( error )
    {
      console.error( "❌ [getCurrentVersion] خطأ:", error );
      return currentVersion;
    }
  };

  const createKeyTable = async ( tableName ) =>
  {
    let db;
    try
    {

      console.log( `🛠️ [createKeyTable] إنشاء جدول مفهرس ${ tableName }` );

      db = await new Promise( ( resolve, reject ) =>
      {
        currentVersion += 1;
        const request = indexedDB.open( dbName, currentVersion );
        console.log( "🌟🌟 [openDB] تم فتح قاعدة البيانات بنجاح" );
        request.onupgradeneeded = ( event ) =>
        {
          // @ts-ignore
          const db = event.target.result;
          if ( !db.objectStoreNames.contains( tableName ) )
          {
            const objectStore = db.createObjectStore( tableName, {
              keyPath: "id",
              autoIncrement: true,
            } );
            objectStore.createIndex( "key", "key", { unique: true } );
            objectStore.createIndex( "value", "value", { unique: false } );
            console.log( `✅ [createIdTable] تم إنشاء الجدول مفهرس ${ tableName } بنجاح` );
          } else
          {
            console.warn( `⚠️ [createIdTable] الجدول ${ tableName } موجود بالفعل` );
          }
        };

        request.onsuccess = () => resolve( request.result );
        request.onerror = () => reject( request.error );
      } );

      db.close();
      console.log( "🛑🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );


    } catch ( error )
    {
      db.close();
      console.log( "🛑🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );
      console.error( "❌ [createIdTable] خطأ أثناء الإنشاء:", error );
    }finally{
      db.close();
      console.log( "🛑🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );
     

    }
  };

  /**
  * 📦 دالة لإنشاء جدول في قاعدة بيانات IndexedDB مع دعم للـ Index المرن
  * @param {string} tableName - اسم الجدول المراد إنشاؤه
  * @param {(string | [string, boolean])[]} columns - مصفوفة الأعمدة (الاسم فقط أو [الاسم, isUnique])
  */
  const createTable = async ( tableName, columns ) =>
  {
    try
    {
      if ( !await ( await noUpgrade( dbName ) ).isTableExist( tableName ) )
      {
        console.log( `🛠️ [createTableFlexible] إنشاء جدول ${ tableName } مع الأعمدة المرنة` );

        const db = await new Promise( ( resolve, reject ) =>
        {
          currentVersion += 1;
          const request = indexedDB.open( dbName, currentVersion );

          request.onupgradeneeded = ( event ) =>
          {
            // @ts-ignore
            const db = event.target.result;

            // إنشاء جدول بمفتاح رئيسي auto-increment
            const objectStore = db.createObjectStore( tableName, {
              keyPath: "id",
              autoIncrement: true,
            } );

            // إنشاء الفهارس بناءً على مدخلات الأعمدة
            columns.forEach( col =>
            {
              let name, isUnique;

              if ( typeof col === "string" )
              {
                name = col;
                isUnique = false; // القيمة الافتراضية
              } else if ( Array.isArray( col ) && col.length === 2 )
              {
                name = col[ 0 ];
                isUnique = col[ 1 ];
              }

              objectStore.createIndex( name, name, { unique: isUnique } );
            } );

            console.log( `✅ [createTableFlexible] تم إنشاء جدول ${ tableName } بنجاح` );
          };

          request.onsuccess = () => resolve( request.result );
          request.onerror = () => reject( request.error );
        } );

        db.close();
      }
    } catch ( error )
    {
      console.error( `❌ [createTableFlexible] خطأ أثناء إنشاء الجدول ${ tableName }:`, error );
    }
  };


  return ( async () =>
  {
    await getCurrentVersion();
    return {
      createKeyTable,
      createTable,
      currentVersion
    };
  } )();
}


async function Delay ( ms )
{
  return new Promise( resolve => setTimeout( resolve, ms ) );
}

async function exportTableWithSchemaAndData ( dbName, storeName )
{
  console.log( "🔄 بدء عملية استخراج البيانات من قاعدة البيانات..." );

  return new Promise( ( resolve, reject ) =>
  {
    const request = indexedDB.open( dbName );

    request.onerror = ( event ) =>
    {
      // @ts-ignore
      console.error( "❌ فشل في فتح قاعدة البيانات:", event.target.error );
      reject( "❌ فشل في فتح قاعدة البيانات." );
    };

    request.onsuccess = () =>
    {
      const db = request.result;
      console.log( `✅ تم فتح قاعدة البيانات: ${ dbName }` );

      if ( !db.objectStoreNames.contains( storeName ) )
      {
        console.error( `❌ الجدول "${ storeName }" غير موجود في قاعدة البيانات.` );
        reject( `❌ الجدول "${ storeName }" غير موجود.` );
        return;
      }

      const transaction = db.transaction( storeName, "readonly" );
      const store = transaction.objectStore( storeName );

      console.log( "🔄 بدء استخراج هيكل الجدول والبيانات..." );

      const schema = {
        keyPath: store.keyPath,
        autoIncrement: store.autoIncrement,
        indexes: [],
        columns: []
      };

      // استخراج الفهارس
      for ( let i = 0; i < store.indexNames.length; i++ )
      {
        const indexName = store.indexNames[ i ];
        const index = store.index( indexName );
        // @ts-ignore
        schema.indexes.push( {
          name: index.name,
          keyPath: index.keyPath,
          unique: index.unique,
          multiEntry: index.multiEntry
        } );
      }

      console.log( "✅ تم استخراج الفهارس بنجاح." );

      // استخراج البيانات من الجدول
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () =>
      {
        const data = getAllRequest.result;
        console.log( "✅ تم استخراج البيانات بنجاح." );

        // استخراج أسماء الأعمدة من أول سجل
        if ( data.length > 0 )
        {
          // @ts-ignore
          schema.columns = Object.keys( data[ 0 ] ).map( col => ( {
            name: col,
            type: typeof data[ 0 ][ col ]
          } ) );
        }

        // تحويل البيانات إلى شكل جديد مع أسماء الأعمدة
        const formattedData = data.map( item =>
        {
          const newItem = {};
          schema.columns.forEach( col =>
          {
            // @ts-ignore
            newItem[ col.name ] = item[ col.name ];
          } );
          return newItem;
        } );

        // تجهيز الكائن النهائي للتصدير
        const exportObject = {
          database: dbName,
          table: storeName,
          schema: schema,
          data: formattedData,
          exported_at: new Date().toISOString()
        };

        console.log( "✅ تم تجهيز البيانات للتصدير." );
        resolve( exportObject );
      };

      getAllRequest.onerror = ( event ) =>
      {
        // @ts-ignore
        console.error( "❌ فشل في جلب البيانات من الجدول:", event.target.error );
        reject( "❌ فشل في جلب البيانات من الجدول." );
      };
    };
  } );
}

//#region   ///importOrUpdateFromJSON

/**
 * @typedef {Object} IndexDefinition
 * @property {string} name
 * @property {string|string[]} keyPath
 * @property {boolean} unique
 * @property {boolean} multiEntry
 *
 * @typedef {Object} StoreSchema
 * @property {string} keyPath
 * @property {boolean} autoIncrement
 * @property {IndexDefinition[]} indexes
 * @property {{ name: string, type: string }[]} columns  // defines mapping for array-to-object entries
 *
 * @typedef {Object} StoreData
 * @property {string} table
 * @property {StoreSchema} schema
 * @property {Array<Object>|Array<any[]>} data
 *
 * @typedef {Object} ImportJSON
 * @property {string} database
 * @property {StoreData[]} [stores]  // for multiple stores
 * @property {string} [table]        // for single store
 * @property {StoreSchema} [schema]  // for single store
 * @property {Array<Object>|Array<any[]>} [data] // for single store
 */

/** Opens an IndexedDB database optionally at a specific version. */
function openDatabase ( name, version )
{
  return new Promise( ( resolve, reject ) =>
  {
    const request = indexedDB.open( name, version );
    request.onsuccess = () => resolve( request.result );
    // @ts-ignore
    request.onerror = ( e ) => reject( e.target.error );
  } );
}

/** Gets the names of existing object stores in a database. */
async function getExistingStoreNames ( dbName )
{
  const db = await openDatabase( dbName );
  const names = Array.from( db.objectStoreNames );
  db.close();
  return names;
}

/** Determines the next version number for a database (current + 1). */
async function getNextVersion ( dbName )
{
  const db = await openDatabase( dbName );
  const next = db.version + 1;
  db.close();
  return next;
}

/** Creates any missing object stores based on provided definitions. */
async function upgradeDatabase ( dbName, missingStores )
{
  if ( !missingStores.length ) return;
  const newVersion = await getNextVersion( dbName );
  await new Promise( ( resolve, reject ) =>
  {
    const request = indexedDB.open( dbName, newVersion );
    request.onupgradeneeded = ( e ) =>
    {
      // @ts-ignore
      const db = e.target.result;
      missingStores.forEach( store =>
      {
        if ( !db.objectStoreNames.contains( store.table ) )
        {
          const os = db.createObjectStore( store.table, {
            keyPath: store.schema.keyPath,
            autoIncrement: store.schema.autoIncrement
          } );
          store.schema.indexes.forEach( idx =>
            os.createIndex( idx.name, idx.keyPath, { unique: idx.unique, multiEntry: idx.multiEntry } )
          );
          console.log( `🔧 Created store: ${ store.table }` );
        }
      } );
    };
    // @ts-ignore
    request.onsuccess = () => { request.result.close(); resolve(); };
    // @ts-ignore
    request.onerror = ( e ) => reject( e.target.error );
  } );
}

/**
 * Imports or updates data into a specific object store.
 * Converts array entries to objects using schema.columns mapping.
 */
async function importDataToStore ( dbName, store )
{
  const db = await openDatabase( dbName );
  const tx = db.transaction( store.table, 'readwrite' );
  const os = tx.objectStore( store.table );
  const colNames = store.schema.columns.map( c => c.name );

  store.data.forEach( entry =>
  {
    const record = Array.isArray( entry )
      ? entry.reduce( ( obj, val, i ) => ( obj[ colNames[ i ] ] = val, obj ), {} )
      : entry;
    os.put( record );
  } );

  return new Promise( ( resolve, reject ) =>
  {
    // @ts-ignore
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = ( e ) => { db.close(); reject( e.target.error ); };
  } );
}

/**
 * Main function: handles both single-store and multi-store JSON formats.
 * @param {ImportJSON} json
 */
async function importOrUpdateFromJSON ( json )
{
  console.log( '📦 Starting import/update process...' );
  const dbName = json.database;

  // Normalize to array of StoreData
  const stores = json.stores
    ? json.stores
    : [ { table: json.table, schema: json.schema, data: json.data } ];

  // Determine which stores need to be created
  const existing = await getExistingStoreNames( dbName );
  const missing = stores.filter( s => !existing.includes( s.table ) );

  if ( missing.length )
  {
    console.log( `🛠️ Upgrading DB to add ${ missing.length } new store(s)...` );
    await upgradeDatabase( dbName, missing );
    console.log( '✅ Upgrade complete.' );
  } else
  {
    console.log( '✅ No upgrade needed; all stores exist.' );
  }

  // Import data for each store
  for ( const store of stores )
  {
    console.log( `🔄 Importing data into store: ${ store.table }` );
    await importDataToStore( dbName, store );
    console.log( `✅ Data imported for store: ${ store.table }` );
  }

  console.log( '🎉 All stores processed successfully!' );
}

//#endregion

async function exportEntireDatabase ( dbName )
{
  console.log( "📦 بدء تصدير قاعدة البيانات بالكامل..." );
  return new Promise( ( resolve, reject ) =>
  {
    const request = indexedDB.open( dbName );

    request.onerror = ( event ) =>
    {
      // @ts-ignore
      console.error( "❌ فشل في فتح القاعدة:", event.target.error );
      reject( "❌ فشل في فتح القاعدة." );
    };

    request.onsuccess = async () =>
    {
      const db = request.result;
      const storeNames = Array.from( db.objectStoreNames );
      db.close();

      const allExports = [];
      for ( const storeName of storeNames )
      {
        try
        {
          const exportData = await exportTableWithSchemaAndData( dbName, storeName );

          // إزالة الحقول المكررة وإعادة هيكلة البيانات
          const simplifiedExport = {
            table: exportData.table,
            schema: exportData.schema,
            data: exportData.data
          };

          allExports.push( simplifiedExport );
        } catch ( err )
        {
          console.warn( `⚠️ تخطى الجدول "${ storeName }" بسبب خطأ:`, err );
        }
      }

      console.log( "✅ تم تصدير كل الجداول بنجاح." );
      resolve( {
        database: dbName,
        exported_at: new Date().toISOString(),
        stores: allExports
      } );
    };
  } );
}
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
async function importEntireDatabase ( json )
{
  /* console.log("📥 بدء استيراد قاعدة بيانات كاملة...");
  const { database, stores } = json;

  for (const store of stores) {
    try {

      // @ts-ignore
      await importMultipleTables({
        database: database,
        table: store.table,
        schema: store.schema,
        data: store.data
      });
      await new Promise(resolve => setTimeout(resolve, 500)); // تأخير 100ms
console.log((await upgrade(database)).currentVersion)
    } catch (err) {
      console.error(`❌ فشل في استيراد الجدول "${store.table}":`, err);
    }
  }

  console.log("✅ تم استيراد جميع الجداول بنجاح.");

 */
}

async function deleteTable ( dbName, storeName )
{
  console.log( `🧹 بدء مسح الجدول "${ storeName }" من القاعدة "${ dbName }"...` );

  return new Promise( ( resolve, reject ) =>
  {
    const request = indexedDB.open( dbName );
    request.onerror = ( event ) =>
    {
      // @ts-ignore
      console.error( "❌ فشل في فتح القاعدة:", event.target.error );
    
      reject( "❌ فشل في فتح القاعدة." );
    };

    request.onsuccess = () =>
    {
      console.log( "🌟🌟🌟 [deleteTable] تم فتح قاعدة البيانات بنجاح" );

      const db = request.result;

      if ( !db.objectStoreNames.contains( storeName ) )
      {
        console.warn( `⚠️ الجدول "${ storeName }" غير موجود في القاعدة.` );
        db.close();
        console.log( "🛑🛑🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );

        resolve( "⚠️ لا يوجد جدول للمسح." );
        return;
      }

      const transaction = db.transaction( storeName, "readwrite" );
      const store = transaction.objectStore( storeName );
      const clearRequest = store.clear();

      clearRequest.onsuccess = () =>
      {
        console.log( `✅ تم مسح جميع البيانات من الجدول "${ storeName }".` );
        db.close();
        console.log( "🛑🛑🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );

        // @ts-ignore
        resolve();
      };

      clearRequest.onerror = ( event ) =>
      {
        // @ts-ignore
        console.error( "❌ فشل في مسح الجدول:", event.target.error );
        db.close();
        console.log( "🛑🛑🛑 تم إغلاق قاعدة البيانات بنجاح" + " " + dbName );

        reject( "❌ فشل في مسح الجدول." );
      };
    };
  } );
}

async function deleteDatabase ( dbName )
{
  console.log( `🗑️ بدء حذف قاعدة البيانات "${ dbName }"...` );

  return new Promise( ( resolve, reject ) =>
  {
    const deleteRequest = indexedDB.deleteDatabase( dbName );

    deleteRequest.onsuccess = () =>
    {
      console.log( `✅ تم حذف قاعدة البيانات "${ dbName }" بنجاح.` );
      // @ts-ignore
      resolve();
    };

    deleteRequest.onerror = ( event ) =>
    {
      // @ts-ignore
      console.error( "❌ فشل في حذف القاعدة:", event.target.error );
      reject( "❌ فشل في حذف القاعدة." );
    };

    deleteRequest.onblocked = () =>
    {
      console.warn( "⚠️ تم حظر حذف القاعدة، تأكد من إغلاق جميع التبويبات التي تستخدمها." );
      reject( "⚠️ القاعدة قيد الاستخدام." );
    };
  } );
}
