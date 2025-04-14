async function loadJSONtoIndexedDB() {
  const dbName = "BidStoryDB";

  // حذف قاعدة البيانات
  await new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    deleteRequest.onsuccess = () => {
      console.log("📛 تم حذف قاعدة البيانات القديمة.");
      resolve();
    };
    deleteRequest.onerror = (e) => {
      console.error("⚠️ فشل في حذف قاعدة البيانات:", e.target.error);
      reject(e);
    };
  });

  try {
    const response = await fetch("code/output.json");
    const data = await response.json();

    const db = await new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open(dbName, 1);

      dbRequest.onupgradeneeded = function (event) {
        const db = event.target.result;
        for (const tableName in data) {
          const sample = data[tableName][0];
          const keyPath = sample && sample.id !== undefined ? "id" : undefined;
          db.createObjectStore(tableName, keyPath ? { keyPath } : { autoIncrement: true });
        }
      };

      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onerror = (e) => reject(e.target.error);
    });

    for (const tableName in data) {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(tableName, "readwrite");
        const store = transaction.objectStore(tableName);
        data[tableName].forEach((row) => store.put(row));

        transaction.oncomplete = () => {
          console.log(`✅ تم تخزين جدول "${tableName}" بنجاح.`);
          resolve();
        };

        transaction.onerror = (e) => {
          console.error(`❌ خطأ أثناء تخزين جدول "${tableName}":`, e.target.error);
          reject(e);
        };
      });
    }

    // 🔔 إعلام أن القاعدة أصبحت جاهزة
    document.dispatchEvent(new Event("BidStoryDBReady"));

  } catch (err) {
    console.error("❌ فشل في تحميل ملف JSON:", err);
  }
}

// ✅ تشغيل الدالة فقط على index.html
if (window.location.pathname.includes("index.html")) {
  if(checkIfDBUpdated()==true){
    convertSQLiteToJSON("code/data.db", "code/output.json");
   
  }
  loadJSONtoIndexedDB();
}

async function checkIfDBUpdated() {
  const dbName = "BidStoryMetaDB";
  const storeName = "meta";
  const fileUrl = "code/data.db";

  // 1. الحصول على تاريخ التعديل من السيرفر
  const response = await fetch(fileUrl, { method: "HEAD" });

  if (!response.ok) {
    console.error("❌ فشل في جلب معلومات الملف");
    return false;
  }

  const lastModified = response.headers.get("Last-Modified");
  if (!lastModified) {
    console.error("❌ لم يتم العثور على Last-Modified في الهيدر");
    return false;
  }

  // 2. فتح قاعدة البيانات
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });

  // 3. مقارنة التاريخ مع التاريخ السابق في IndexedDB
  const previous = await new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const getRequest = store.get("lastModified");
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = (e) => reject(e.target.error);
  });

  if (!previous || previous.value !== lastModified) {
    // 4. تحديث القيمة في IndexedDB
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      store.put({ key: "lastModified", value: lastModified });
      transaction.oncomplete = resolve;
      transaction.onerror = (e) => reject(e.target.error);
    });

    console.log("📌 الملف تم تعديله، تم تحديث القيمة");
    return true;
  }

  console.log("✅ الملف لم يتم تعديله.");
  return false;
}

async function convertSQLiteToJSON(sqliteFilePath, outputJsonPath) {
  console.log("🚀 بدأ التحويل من:", sqliteFilePath);

  // تحميل مكتبة sql.js
  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  });

  // تحميل ملف SQLite كـ array buffer
  const response = await fetch(sqliteFilePath);
  const buffer = await response.arrayBuffer();
  const db = new SQL.Database(new Uint8Array(buffer));

  const databaseJson = {};
  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");

  if (!tablesResult[0]) {
    console.warn("⚠️ لا توجد جداول في قاعدة البيانات.");
  } else {
    const tableNames = tablesResult[0].values.map(row => row[0]);

    for (const tableName of tableNames) {
      const result = db.exec(`SELECT * FROM "${tableName}"`);
      if (result.length > 0) {
        const columns = result[0].columns;
        const values = result[0].values;

        databaseJson[tableName] = values.map(row =>
          Object.fromEntries(columns.map((col, i) => [col, row[i]]))
        );
      }
    }
  }

  // حفظ كـ ملف output.json محلي للمستخدم
  const blob = new Blob([JSON.stringify(databaseJson, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = outputJsonPath;
  a.click();

  console.log(`✅ تم تحويل قاعدة البيانات وحفظها في: ${outputJsonPath}`);
}
