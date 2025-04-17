// 🔁 الوظيفة الرئيسية لتحميل بيانات JSON وحفظها في IndexedDB
// هذه الدالة تقوم بتحميل ملف JSON من السيرفر وحفظه في قاعدة بيانات IndexedDB
async function loadJSONtoIndexedDB() {
  const dbName = "BidStoryDB"; // اسم قاعدة البيانات التي سنعمل عليها
  console.log("🚀 بدء عمل الدالة loadJSONtoIndexedDB");

  // 🧹 خطوة حذف قاعدة البيانات القديمة إن وجدت
  // نستخدم Promise لضمان اكتمال عملية الحذف قبل المتابعة
  await new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    
    deleteRequest.onsuccess = () => {
      console.log("📛 تم حذف قاعدة البيانات القديمة.");
      resolve(); // إكمال العملية عند نجاح الحذف
    };
    
    deleteRequest.onerror = (e) => {
      console.error("⚠️ فشل في حذف قاعدة البيانات:", e.target.error);
      reject(e); // رفض الـ Promise في حالة الخطأ
    };
  });

  try {
    // 📥 جلب بيانات JSON من السيرفر
    const response = await fetch("code/output.json"); // طلب ملف JSON
    const data = await response.json(); // تحويل البيانات إلى كائن JavaScript

    // 🏗️ إنشاء قاعدة البيانات الجديدة وهيكلها
    const db = await new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open(dbName, 1); // فتح قاعدة البيانات مع الإصدار 1

      // ⚙️ حدث ينشط عند الحاجة لترقية قاعدة البيانات (إنشاء الهيكل)
      dbRequest.onupgradeneeded = function (event) {
        const db = event.target.result; // الحصول على مرجع قاعدة البيانات

        // إنشاء جداول (مخازن كائنات) بناء على هيكل ملف JSON
        for (const tableName in data) {
          // تحديد مفتاح رئيسي للجدول (إن وجد)
          const sample = data[tableName][0]; // الحصول على عينة من البيانات
          const keyPath = sample && sample.id !== undefined ? "id" : undefined;
          
          // إنشاء مخزن الكائنات (الجدول) مع المفتاح الرئيسي أو الترقيم التلقائي
          db.createObjectStore(tableName, keyPath ? { keyPath } : { autoIncrement: true });
        }
      };

      dbRequest.onsuccess = () => resolve(dbRequest.result); // إرجاع قاعدة البيانات عند نجاح الفتح
      dbRequest.onerror = (e) => reject(e.target.error); // رفض الـ Promise في حالة الخطأ
    });

    // 💾 تخزين البيانات في كل جدول تم إنشاؤه
    for (const tableName in data) {
      await new Promise((resolve, reject) => {
        // بدء معاملة (transaction) للكتابة في الجدول
        const transaction = db.transaction(tableName, "readwrite");
        const store = transaction.objectStore(tableName); // الحصول على مخزن الكائنات
        
        // إضافة كل صف من البيانات إلى الجدول
        data[tableName].forEach((row) => store.put(row));

        // عند اكتمال المعاملة بنجاح
        transaction.oncomplete = () => {
          console.log(`✅ تم تخزين جدول "${tableName}" بنجاح.`);
          resolve();
        };

        // عند حدوث خطأ في المعاملة
        transaction.onerror = (e) => {
          console.error(`❌ خطأ أثناء تخزين جدول "${tableName}":`, e.target.error);
          reject(e);
        };
      });
    }

    // 🔔 إرسال إشعار بأن قاعدة البيانات جاهزة للاستخدام
    // هذا الحدث سيتم استقباله من قبل الكود الآخر الذي ينتظر جاهزية البيانات
    document.dispatchEvent(new Event("BidStoryDBReady"));

  } catch (err) {
    // ❌ معالجة الأخطاء التي قد تحدث أثناء العملية
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


   
// ✅ التنفيذ عند فتح index.html أو الصفحة الرئيسية
(async () => {
  if (window.location.hostname.includes("bidstory.github.io")) {
    
    document.dispatchEvent(new Event("BidStoryDBReady"));
    console.log("✅ انت الان علي الاستضافة الحقيقية");
  } else {
    // ✅ نعمل محليًا - نفحص إن كانت القاعدة تحتاج تحديث
    const shouldUpdate = await checkIfDBUpdated();

    if (shouldUpdate) {
      console.log("✅ يعمل فقط محليًا لتحويل قاعدة البيانات");
      await convertSQLiteToJSON("code/data.db", "code/output.json");
      await loadJSONtoIndexedDB();
      console.log("✅ تم تحديث قاعدة بيانات اللغة");
    } else {
      document.dispatchEvent(new Event("BidStoryDBReady"));
      console.log("✅ لا حاجة لتحديث قاعدة بيانات اللغة.");
    }
  }
})();




