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




   
// ✅ التنفيذ عند فتح index.html أو الصفحة الرئيسية
(async () => {
  if (window.location.hostname.includes("bidstory.github.io")) {
    
    document.dispatchEvent(new Event("BidStoryDBReady"));
    console.log("✅ انت الان علي الاستضافة الحقيقية");
  } else {
    
  }
})();




