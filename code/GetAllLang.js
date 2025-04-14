// 🔁 تحميل وتحويل البيانات من SQLite إلى IndexedDB
async function loadJSONtoIndexedDB() {
  const dbName = "BidStoryDB";
  console.log("🚀 بدء عمل الدالة loadJSONtoIndexedDB");

  // 🧹 حذف قاعدة البيانات القديمة
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

        // إنشاء الجداول من JSON
        for (const tableName in data) {
          const sample = data[tableName][0];
          const keyPath = sample && sample.id !== undefined ? "id" : undefined;
          db.createObjectStore(tableName, keyPath ? { keyPath } : { autoIncrement: true });
        }

        // جدول meta لتخزين آخر تعديل
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
      };

      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onerror = (e) => reject(e.target.error);
    });

    // تخزين البيانات في كل جدول
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

    // حفظ تاريخ آخر تعديل لملف output.json
    const headResponse = await fetch("code/output.json", { method: "HEAD", cache: "no-store" });
    const lastModified = headResponse.headers.get("Last-Modified");
    if (lastModified) {
      const tx = db.transaction("meta", "readwrite");
      tx.objectStore("meta").put(lastModified, "lastModified");
    }

    // 🔔 إشعار بأن قاعدة البيانات جاهزة
    document.dispatchEvent(new Event("BidStoryDBReady"));

  } catch (err) {
    console.error("❌ فشل في تحميل ملف JSON:", err);
  }
}



// ✅ التحقق مما إذا كانت قاعدة البيانات بحاجة إلى تحديث
async function checkIfDBUpdated() {
  const dbName = "BidStoryDB";
  const versionStore = "meta";
  const fileUrl = "code/data.db";

  return new Promise((resolve) => {
    const request = indexedDB.open(dbName);

    request.onsuccess = async (event) => {
      const db = event.target.result;

      // إذا لم يكن جدول meta موجودًا
      if (!db.objectStoreNames.contains(versionStore)) {
        console.warn("⏳ جدول meta غير موجود بعد. سيتم اعتبار القاعدة جديدة.");
        resolve(true);
        return;
      }

      try {
        const response = await fetch(fileUrl, { method: "HEAD", cache: "no-store" });
        const lastModified = response.headers.get("Last-Modified");

        if (!lastModified) {
          console.warn("⚠️ السيرفر لا يرجع Last-Modified. سيتم اعتبار الملف جديد.");
          return resolve(true);
        }

        const tx = db.transaction(versionStore, "readwrite");
        const store = tx.objectStore(versionStore);
        const getRequest = store.get("lastModified");

        getRequest.onsuccess = () => {
          const previous = getRequest.result;
          if (previous !== lastModified) {
            store.put(lastModified, "lastModified");
            resolve(true);
          } else {
            resolve(false);
          }
        };

        getRequest.onerror = () => {
          console.warn("⚠️ فشل في قراءة التاريخ السابق. سيتم اعتبار الملف محدث.");
          resolve(true);
        };
      } catch (err) {
        console.error("❌ خطأ أثناء فحص التحديث:", err);
        resolve(false);
      }
    };

    request.onerror = (event) => {
      console.error("❌ فشل في فتح قاعدة البيانات:", event.target.error);
      resolve(false);
    };
  });
}






// 🔄 تحويل قاعدة بيانات SQLite إلى ملف JSON
async function convertSQLiteToJSON(sqliteFilePath, outputJsonPath) {
  console.log("🚀 بدأ التحويل من:", sqliteFilePath);

  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  });

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

  // حفظ كـ ملف output.json للمستخدم
  const blob = new Blob([JSON.stringify(databaseJson, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = outputJsonPath;
  a.click();

  console.log(`✅ تم تحويل قاعدة البيانات وحفظها في: ${outputJsonPath}`);
}


   

const isLocalhost = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";

// ✅ التنفيذ عند فتح index.html أو الصفحة الرئيسية
if (
  window.location.pathname.includes("index.html") || 
  window.location.pathname === "/" || 
  window.location.pathname.endsWith("/BidStory/")
) {
  checkIfDBUpdated().then(async (shouldUpdate) => {
    if (shouldUpdate) {
      if (isLocalhost) {
        console.log("✅ يعمل فقط محليًا لتحويل قاعدة البيانات");
        await convertSQLiteToJSON("code/data.db", "code/output.json");
      } else {
        console.warn("⚠️ التحويل من SQLite إلى JSON غير مدعوم على GitHub Pages. سيتم استخدام JSON الموجود فقط.");
      }

      await loadJSONtoIndexedDB();
    } else {
      document.dispatchEvent(new Event("BidStoryDBReady"));
      console.log("✅ لا حاجة لتحديث قاعدة البيانات.");
    }
  });
}

