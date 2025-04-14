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

 loadJSONtoIndexedDB();
   



