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

  const idSet = async ( id, value ) =>
  {
    if ( !await isTableExist( "IdTable" ) )
    {
      await ( await upgrade( dbName ) ).createIdTable();
    }
    console.log( `📝 [idSet] محاولة تعيين id: ${ id }` );
    let db;
    try
    {
      db = await openDB();
      const transaction = db.transaction( [ "IdTable" ], "readwrite" );
      const store = transaction.objectStore( "IdTable" );
      const data = { id, value };
      const request = store.put( data );

      request.onsuccess = () =>
      {
        console.log( `✅ [idSet] تم إضافة العنصر (id: ${ id }, value: ${ value }) إلى IdTable` );
      };

      request.onerror = () =>
      {
        console.error( "❌ [idSet] فشل في إضافة العنصر:", request.error );
      };

      transaction.oncomplete = () =>
      {
        console.log( "🔚 [idSet] تم إنهاء المعاملة" );
        db.close();
      };
    } catch ( error )
    {
      console.error( "❌ [idSet] خطأ أثناء العملية:", error );
    }
  };

  const idGet = async ( id ) =>
  {
    if ( await isTableExist( "IdTable" ) )
    {
      console.log( `🔍 [idGet] محاولة جلب العنصر بواسطة id: ${ id }` );
      let db;
      try
      {
        db = await openDB();
        const transaction = db.transaction( [ "IdTable" ], "readonly" );
        const objectStore = transaction.objectStore( "IdTable" );
        const value = await new Promise( ( resolve, reject ) =>
        {
          const request = objectStore.get( id );
          request.onsuccess = () =>
          {
            if ( request.result )
            {
              console.log( "✅ [idGet] تم العثور على القيمة:", request.result.value );
              resolve( request.result.value );
            } else
            {
              console.log( "⚠️ [idGet] لا توجد قيمة لهذا المعرف" );
              resolve( null );
            }
          };
          request.onerror = () =>
          {
            console.error( "❌ [idGet] خطأ أثناء القراءة:", request.error );
            reject( request.error );
          };
        } );

        return value;
      } catch ( error )
      {
        console.error( "❌ [idGet] خطأ عام:", error );
        return null;
      } finally
      {
        if ( db ) db.close();
      }
    }
  };

  const idDelete = async ( id ) =>
  {
    if ( await isTableExist( "IdTable" ) )
    {
      console.log( `🗑️ [idDelete] محاولة حذف العنصر ذو المعرف: ${ id }` );
      let db;
      try
      {
        db = await openDB();
        const transaction = db.transaction( [ "IdTable" ], "readwrite" );
        const store = transaction.objectStore( "IdTable" );
        const request = store.delete( id );

        request.onsuccess = () =>
        {
          console.log( `✅ [idDelete] تم حذف العنصر (${ id }) بنجاح` );
        };

        request.onerror = () =>
        {
          console.error( "❌ [idDelete] فشل في حذف العنصر:", request.error );
        };

        transaction.oncomplete = () =>
        {
          console.log( "🔚 [idDelete] تم إنهاء المعاملة" );
          db.close();
        };
      } catch ( error )
      {
        console.error( "❌ [idDelete] خطأ أثناء الحذف:", error );
      } finally
      {
        if ( db ) db.close();
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
    idSet,
    idGet,
    idDelete,
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

  const createIdTable = async () =>
  {
    console.log( "🛠️ [createIdTable] إنشاء جدول IdTable" );
    try
    {
      const db = await new Promise( ( resolve, reject ) =>
      {
        currentVersion += 1;
        const request = indexedDB.open( dbName, currentVersion );

        request.onupgradeneeded = ( event ) =>
        {
          // @ts-ignore
          const db = event.target.result;
          const objectStore = db.createObjectStore( "IdTable", {
            keyPath: "id",
            autoIncrement: false,
          } );
          objectStore.createIndex( "value", "value", { unique: false } );
          console.log( "✅ [createIdTable] تم إنشاء الجدول بنجاح" );
        };

        request.onsuccess = () => resolve( request.result );
        request.onerror = () => reject( request.error );
      } );

      db.close();
    } catch ( error )
    {
      console.error( "❌ [createIdTable] خطأ أثناء الإنشاء:", error );
    }
  };

  const createTable = async ( tableName, columns ) =>
  {
    console.log( `🛠️ [createTable] إنشاء جدول ${ tableName } مع الأعمدة` );
    try
    {
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
    } catch ( error )
    {
      console.error( `❌ [createTable] خطأ أثناء إنشاء الجدول ${ tableName }:`, error );
    }
  };

  return ( async () =>
  {
    await getCurrentVersion();
    return {
      createTable,
      currentVersion
    };
  } )();
}

function Convert2json(dataBaseName){

  
}
