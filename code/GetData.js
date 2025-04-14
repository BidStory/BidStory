function loadJSONtoIndexedDB() {
    fetch("output.json")
      .then((res) => res.json())
      .then((data) => {
        const dbRequest = indexedDB.open("BidStoryDB", 1);
  
        dbRequest.onupgradeneeded = function (event) {
          const db = event.target.result;
  
          // إنشاء ObjectStore لكل جدول في ملف JSON إذا لم يكن موجوداً مسبقاً
          for (const tableName in data) {
            if (!db.objectStoreNames.contains(tableName)) {
              // تأكد أن الجدول يحتوي على عناصر وأن العنصر الأول فيه يحتوي على "id"
              const sample = data[tableName][0];
              const keyPath = sample && sample.id !== undefined ? "id" : undefined;
  
              db.createObjectStore(tableName, keyPath ? { keyPath } : { autoIncrement: true });
            }
          }
        };
  
        dbRequest.onsuccess = function (event) {
          const db = event.target.result;
  
          // إدخال البيانات في كل جدول
          for (const tableName in data) {
            const transaction = db.transaction(tableName, "readwrite");
            const store = transaction.objectStore(tableName);
  
            data[tableName].forEach((row) => {
              store.put(row);
            });
  
            transaction.oncomplete = () => {
              console.log(`✅ تم تخزين جدول "${tableName}" بنجاح.`);
            };
  
            transaction.onerror = (e) => {
              console.error(`❌ خطأ أثناء تخزين جدول "${tableName}":`, e.target.error);
            };
          }
        };
  
        dbRequest.onerror = function (event) {
          console.error("❌ خطأ في فتح قاعدة البيانات:", event.target.error);
        };
      })
      .catch((err) => {
        console.error("❌ فشل في تحميل ملف JSON:", err);
      });
  }
  
  if (window.location.pathname.includes("index.html")) {
    loadJSONtoIndexedDB();
  }
  