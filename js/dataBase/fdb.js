function noUpgrade(dbName) {
  const openDB = async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const isTableExist = async (tableName) => {
    let db;
    try {
      db = await openDB();
      return db.objectStoreNames.contains(tableName);
    } finally {
      if (db) db.close();
    }
  };

  const idSet = async (id, value) => {
    let db;
    try {
      db = await openDB();
      const transaction = db.transaction(["IdTable"], "readwrite");
      const store = transaction.objectStore("IdTable");
      const data = { id, value };
      const request = store.put(data);

      request.onsuccess = () => {
        console.log(`✅ تم إضافة العنصر (id: ${id}, value: ${value}) بنجاح إلى IdTable`);
      };

      request.onerror = () => {
        console.error("❌ فشل في إضافة العنصر إلى IdTable:", request.error);
      };

      transaction.oncomplete = () => db.close();
    } catch (error) {
      console.error("❌ خطأ أثناء فتح قاعدة البيانات:", error);
    }
  };

  const idGet = async (id) => {
    let db;
    try {
      db = await openDB();
      const transaction = db.transaction(["IdTable"], "readonly");
      const objectStore = transaction.objectStore("IdTable");
      const value = await new Promise((resolve, reject) => {
        const request = objectStore.get(id);
        request.onsuccess = () => {
          if (request.result) {
            console.log("🔍 تم العثور على القيمة:", request.result.value);
            resolve(request.result.value);
          } else {
            console.log("⚠️ لا توجد قيمة لهذا المعرف");
            resolve(null);
          }
        };
        request.onerror = () => {
          console.error("❌ خطأ أثناء القراءة:", request.error);
          reject(request.error);
        };
      });

      db.close();
      return value;
    } catch (error) {
      console.error("❌ خطأ عام:", error);
      return null;
    } finally {
      if (db) db.close();
    }
  };

  const idDelete = async (id) => {
    let db;
    try {
      db = await openDB();
      const transaction = db.transaction(["IdTable"], "readwrite");
      const store = transaction.objectStore("IdTable");
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`🗑️ تم حذف العنصر ذو المعرف (${id}) بنجاح`);
      };

      request.onerror = () => {
        console.error("❌ فشل في حذف العنصر:", request.error);
      };

      transaction.oncomplete = () => db.close();
    } catch (error) {
      console.error("❌ خطأ أثناء حذف العنصر:", error);
    } finally {
      if (db) db.close();
    }
  };

  const getAllDataFromTable = async (tableName) => {
    let db;
    try {
      db = await openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(tableName, "readonly");
        const objectStore = transaction.objectStore(tableName);
        const request = objectStore.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("❌ فشل في جلب البيانات: " + request.error);
      });
    } catch (error) {
      console.error("❌ خطأ:", error);
      return [];
    } finally {
      if (db) db.close();
    }
  };

  const insertInTable = async (tableName, dataObject) => {
    let db;
    try {
      db = await openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([tableName], "readwrite");
        const store = transaction.objectStore(tableName);
        const request = store.add(dataObject);

        request.onsuccess = () => {
          console.log(`✅ تم إدخال البيانات في جدول ${tableName} بنجاح`);
          resolve(true);
        };

        request.onerror = (event) => {
          console.error("❌ فشل في إدخال البيانات:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("❌ خطأ أثناء الإدخال:", error);
      return false;
    } finally {
      if (db) db.close();
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
function Upgrade(dbName) {
  let currentVersion = 1;

  const getCurrentVersion = async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    currentVersion = db.version;
    db.close();
    return currentVersion;
  };

  const createIdTable = async () => {
    const db = await new Promise((resolve, reject) => {
      currentVersion += 1;
      const request = indexedDB.open(dbName, currentVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const objectStore = db.createObjectStore("IdTable", {
          keyPath: "id",
          autoIncrement: false,
        });
        objectStore.createIndex("value", "value", { unique: false });
        console.log("✅ تم إنشاء الجدول المفهرس بنجاح");
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
  };

  const createTable = async (tableName, columns) => {
    const db = await new Promise((resolve, reject) => {
      currentVersion += 1;
      const request = indexedDB.open(dbName, currentVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const objectStore = db.createObjectStore(tableName, {
          keyPath: "id",
          autoIncrement: true,
        });

        columns.forEach((col) => {
          const indexName = col;
          const isUnique = col.endsWith("_not");
          objectStore.createIndex(indexName, indexName, {
            unique: isUnique,
          });
        });

        console.log(`✅ تم إنشاء جدول ${tableName} مع الأعمدة المطلوبة`);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
  };

  return {
    getCurrentVersion,
    createIdTable,
    createTable
  };
}
