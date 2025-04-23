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
        console.log( "✅ [openDB] تم فتح قاعدة البيانات بنجاح" );
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
      console.error( "❌ [isTableExist] خطأ أثناء التحقق:", error );
      return false;
    } finally
    {
      if ( db ) db.close();
    }
  };

  const keySet = async ( tableName, key, value ) =>
  {
    if ( !await isTableExist( tableName ) )
    {
      await ( await upgrade( dbName ) ).createKeyTable( tableName );
    }

    console.log( `📝 [keySet] محاولة تعيين key: ${ key } في الجدول ${ tableName }` );

    let db;
    try
    {
      db = await openDB();
      const transaction = db.transaction( [ tableName ], "readwrite" );
      const store = transaction.objectStore( tableName );
      const data = { key, value };
      const request = store.put( data );

      request.onsuccess = () =>
      {
        console.log( `✅ [keySet] تم إضافة العنصر (key: ${ key }, value: ${ value }) إلى ${ tableName }` );
      };

      request.onerror = () =>
      {
        console.error( `❌ [keySet] فشل في إضافة العنصر إلى ${ tableName }:`, request.error );
      };

      transaction.oncomplete = () =>
      {
        console.log( "🔚 [keySet] تم إنهاء المعاملة" );
        db.close();
      };
    } catch ( error )
    {
      console.error( "❌ [keySet] خطأ أثناء العملية:", error );
    }
  };

  const keyGet = async ( tableName, key ) =>
  {
    if ( await isTableExist( tableName ) )
    {
      console.log( `🔍 [keyGet] محاولة جلب العنصر من ${ tableName } بواسطة key: ${ key }` );
      let db;
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
        return null;
      } finally
      {
        if ( db ) db.close();
      }
    } else
    {
      console.warn( `⚠️ [keyGet] الجدول ${ tableName } غير موجود` );
      return null;
    }
  };


  const keyDelete = async ( tableName, key ) =>
  {
    if ( await isTableExist( tableName ) )
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
        console.error( `❌ [keyDelete] خطأ أثناء الحذف من ${ tableName }:`, error );
      } finally
      {
        if ( db ) db.close();
      }
    } else
    {
      console.warn( `⚠️ [keyDelete] الجدول ${ tableName } غير موجود` );
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
        if ( db ) db.close();
      }
    }
  };

  const insertInTable = async ( tableName, dataObject ) =>
  {
    if ( await isTableExist( tableName ) )
    {
      console.log( `➕ [insertInTable] محاولة إدخال بيانات في الجدول: ${ tableName }` );
      let db;
      try
      {
        db = await openDB();
        return new Promise( ( resolve, reject ) =>
        {
          const transaction = db.transaction( [ tableName ], "readwrite" );
          const store = transaction.objectStore( tableName );
          const request = store.add( dataObject );

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
      } finally
      {
        if ( db ) db.close();
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
    try
    {
      if ( !await ( await noUpgrade( dbName ) ).isTableExist( tableName ) )
      {
        console.log( `🛠️ [createKeyTable] إنشاء جدول ${ tableName }` );

        const db = await new Promise( ( resolve, reject ) =>
        {
          currentVersion += 1;
          const request = indexedDB.open( dbName, currentVersion );

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
              console.log( `✅ [createIdTable] تم إنشاء الجدول ${ tableName } بنجاح` );
            } else
            {
              console.warn( `⚠️ [createIdTable] الجدول ${ tableName } موجود بالفعل` );
            }
          };

          request.onsuccess = () => resolve( request.result );
          request.onerror = () => reject( request.error );
        } );

        db.close();
      }
    } catch ( error )
    {
      console.error( "❌ [createIdTable] خطأ أثناء الإنشاء:", error );
    }
  };

  const createTable = async ( tableName, columns ) =>
  {

    try
    {

      if ( ! await ( await noUpgrade( dbName ) ).isTableExist( tableName ) )
      {
        console.log( `🛠️ [createTable] إنشاء جدول ${ tableName } مع الأعمدة` );
        const db = await new Promise( ( resolve, reject ) =>
        {
          currentVersion += 1;
          const request = indexedDB.open( dbName, currentVersion );

          request.onupgradeneeded = ( event ) =>
          {
            // @ts-ignore
            const db = event.target.result;
            const objectStore = db.createObjectStore( tableName, {
              keyPath: "id",
              autoIncrement: true,
            } );

            columns.forEach( ( col ) =>
            {
              const indexName = col;
              const isUnique = col.endsWith( "_not" );
              objectStore.createIndex( indexName, indexName, { unique: isUnique } );
            } );

            console.log( `✅ [createTable] تم إنشاء جدول ${ tableName } مع الأعمدة` );
          };

          request.onsuccess = () => resolve( request.result );
          request.onerror = () => reject( request.error );
        } );

        db.close();
      }
    } catch ( error )
    {
      console.error( `❌ [createTable] خطأ أثناء إنشاء الجدول ${ tableName }:`, error );
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

function data2json ( databaseName )
{

  const Ctable = async ( tableName ) =>
  {
    return new Promise( ( resolve, reject ) =>
    {
      const request = indexedDB.open( databaseName );
      request.onsuccess = () =>
      {
        const db = request.result;

        if ( !db.objectStoreNames.contains( tableName ) )
        {
          console.warn( `⚠️ [convertTableToJSON] الجدول ${ tableName } غير موجود` );
          db.close();
          return resolve( null );
        }

        const transaction = db.transaction( tableName, "readonly" );
        const store = transaction.objectStore( tableName );

        const fields = Array.from( store.indexNames );
        if ( !fields.includes( "key" ) ) fields.push( "key" );
        if ( !fields.includes( "value" ) ) fields.push( "value" );

        const data = [];
        const cursorRequest = store.openCursor();

        cursorRequest.onsuccess = () =>
        {
          const cursor = cursorRequest.result;
          if ( cursor )
          {
            data.push( cursor.value );
            cursor.continue();
          } else
          {
            resolve( {
              tableName,
              fields,
              records: data,
            } );
            db.close();
          }
        };

        cursorRequest.onerror = () =>
        {
          console.error( `❌ [convertTableToJSON] خطأ أثناء قراءة ${ tableName }:`, cursorRequest.error );
          reject( cursorRequest.error );
        };
      };

      request.onerror = () =>
      {
        console.error( "❌ [convertTableToJSON] خطأ في فتح قاعدة البيانات:", request.error );
        reject( request.error );
      };
    } );
  };

  const Cdatabase = async () =>
  {
    return new Promise( ( resolve, reject ) =>
    {
      const request = indexedDB.open( databaseName );

      request.onsuccess = async () =>
      {
        const db = request.result;
        const allTables = Array.from( db.objectStoreNames );
        db.close(); // نغلق مباشرة بعد أخذ أسماء الجداول

        const tablePromises = allTables.map( Ctable );
        const tables = ( await Promise.all( tablePromises ) ).filter( Boolean );

        const jsonData = {
          database: databaseName,
          timestamp: new Date().toISOString(),
          tables: tables,
        };

        resolve( jsonData );
      };

      request.onerror = () =>
      {
        console.error( "❌ [convertDatabaseToJSON] خطأ في فتح قاعدة البيانات:", request.error );
        reject( request.error );
      };
    } );
  };

  return {
    Ctable,
    Cdatabase,
  };

}

function json2data ( databaseName )
{
  const importJSON = async ( jsonData ) =>
  {
    if ( !jsonData || !jsonData.tables || !Array.isArray( jsonData.tables ) )
    {
      console.error( "❌ [json2data] البيانات غير صالحة أو غير مكتملة" );
      return;
    }

    // تحديد النسخة الجديدة حسب عدد الجداول
    const newVersion = indexedDB.databases
      // @ts-ignore
      ? ( await indexedDB.databases() ).find( db => db.name === databaseName )?.version + 1 || 1
      : Math.floor( Math.random() * 1000 ) + 1;

    const openDB = indexedDB.open( databaseName, newVersion );

    openDB.onupgradeneeded = ( event ) =>
    {
      // @ts-ignore
      const db = event.target.result;
      console.log( `📦 [json2data] جاري إنشاء قاعدة البيانات "${ databaseName }"` );

      jsonData.tables.forEach( ( table ) =>
      {
        if ( !db.objectStoreNames.contains( table.tableName ) )
        {
          const store = db.createObjectStore( table.tableName, {
            keyPath: "id",
            autoIncrement: true,
          } );

          // إنشاء الفهارس
          table.fields.forEach( ( field ) =>
          {
            if ( field !== "id" )
            {
              store.createIndex( field, field, {
                unique: field === "key", // فقط المفتاح يكون فريد
              } );
            }
          } );

          console.log( `✅ [json2data] تم إنشاء الجدول "${ table.tableName }"` );
        }
      } );
    };

    openDB.onsuccess = async () =>
    {
      const db = openDB.result;

      for ( const table of jsonData.tables )
      {
        const tx = db.transaction( table.tableName, "readwrite" );
        const store = tx.objectStore( table.tableName );

        for ( const record of table.records )
        {
          // حذف "id" لنجعل IndexedDB ينشئه تلقائيًا (إذا كان autoIncrement)
          const { id, ...dataWithoutId } = record;
          store.add( dataWithoutId );
        }

        // @ts-ignore
        await tx.complete;
        console.log( `📥 [json2data] تم إدخال البيانات في الجدول "${ table.tableName }"` );
      }

      db.close();
      console.log( "🎉 [json2data] تم الاستيراد بنجاح!" );
    };

    openDB.onerror = () =>
    {
      console.error( "❌ [json2data] خطأ في فتح قاعدة البيانات:", openDB.error );
    };
  };

  return {
    importJSON,
  };
}
