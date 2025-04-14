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

// تشغيل الدالة الرئيسية لبدء عملية التحميل والتخزين
loadJSONtoIndexedDB();

// استماع لحدث "BidStoryDBReady" الذي يشير إلى أن قاعدة البيانات جاهزة للاستخدام
document.addEventListener("BidStoryDBReady", () => {
    
  // فتح قاعدة البيانات المسماة "BidStoryDB" باستخدام IndexedDB
  const request = indexedDB.open("BidStoryDB");

  // عند نجاح فتح قاعدة البيانات
  request.onsuccess = function(event) {
    // الحصول على المرجع إلى قاعدة البيانات
    const db = event.target.result;
    
    // بدء معاملة (transaction) للوصول إلى مخزن الكائنات "lang" في وضع القراءة فقط
    const transaction = db.transaction("lang", "readonly");
    
    // الحصول على مخزن الكائنات "lang"
    const objectStore = transaction.objectStore("lang");

    // تحديد جميع العناصر في الصفحة التي تحتوي على سمة "id"
    const allElements = document.querySelectorAll("[id]");

    // تكرار عبر جميع العناصر التي تم العثور عليها
    allElements.forEach((el) => {
      // الحصول على قيمة السمة "id" للعنصر الحاليt
      const id = el.id;

      // التحقق مما إذا كان الـ ID يتكون من أرقام فقط (باستخدام تعبير منتظم)
      if (/^\d+$/.test(id)) {
        // طلب الحصول على البيانات من مخزن الكائنات باستخدام الـ ID (محول إلى رقم)
        const getRequest = objectStore.get(Number(id));

        // عند نجاح طلب الحصول على البيانات
        getRequest.onsuccess = function() {
          // الحصول على نتيجة الطلب (البيانات المخزنة)
          const data = getRequest.result;
          // تحديث محتوى العنصر بالبيانات المخزنة أو رسالة خطأ إذا لم توجد بيانات
          el.textContent = data ? data.a : "❌ لا توجد بيانات"; // "No data" in Arabic
        };
        // عند حدوث خطأ في طلب الحصول على البيانات
        getRequest.onerror = function() {
          // عرض رسالة خطأ في العنصر
          el.textContent = "⚠️ خطأ في الجلب"; // "Fetch error" in Arabic
        };
      }
    });
  };
});