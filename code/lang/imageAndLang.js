function importJSONToIndexedDB(jsonInput, dbName = "BidStoryDB", version = 1) {
  console.log("🚀 بدء عملية استيراد JSON مع حذف القاعدة القديمة إن وجدت...");

  let jsonData;

  try {
    jsonData = typeof jsonInput === "string" ? JSON.parse(jsonInput) : jsonInput;
    console.log("✅ تم تحليل JSON بنجاح.");
  } catch (err) {
    console.error("❌ فشل في تحليل JSON:", err);
    return;
  }

  const storeNames = Object.keys(jsonData);

  // 1. حذف قاعدة البيانات إن وجدت
  const deleteRequest = indexedDB.deleteDatabase(dbName);

  deleteRequest.onerror = function (event) {
    // @ts-ignore
    console.error("❌ فشل حذف قاعدة البيانات:", event.target.error);
  };

  deleteRequest.onsuccess = function () {
    console.log("🗑️ تم حذف قاعدة البيانات القديمة (إن وجدت).");

    // 2. فتح قاعدة البيانات وإنشاؤها من جديد
    const openRequest = indexedDB.open(dbName, version);

    openRequest.onupgradeneeded = function (event) {
      console.log("⚙️ جاري إنشاء قاعدة بيانات جديدة...");
      // @ts-ignore
      const db = event.target.result;

      for (const storeName of storeNames) {
        const sampleItem = jsonData[storeName][0];
        const keyPath = sampleItem && sampleItem.id !== undefined ? "id" : undefined;

        db.createObjectStore(storeName, keyPath ? { keyPath } : { autoIncrement: true });
        console.log(`✅ تم إنشاء Object Store: ${storeName}`);
      }
    };

    openRequest.onsuccess = function (event) {
      // @ts-ignore
      const db = event.target.result;
      console.log("📦 تم فتح قاعدة البيانات بنجاح بعد الحذف.");

      const tx = db.transaction(storeNames, "readwrite");

      tx.oncomplete = () => {
        console.log("✅ تم إنهاء المعاملة بنجاح.");
        db.close();
        console.log("🔒 تم إغلاق قاعدة البيانات.");
      };

      tx.onerror = (e) => {
        console.error("❌ خطأ أثناء المعاملة:", e.target.error);
        db.close();
        console.log("🔒 تم إغلاق قاعدة البيانات بعد الخطأ.");
      };

      try {
        for (const storeName of storeNames) {
          const store = tx.objectStore(storeName);
          const items = jsonData[storeName];

          if (Array.isArray(items)) {
            for (const item of items) {
              store.put(item);
            }
            console.log(`📥 تم إدخال ${items.length} عنصر في "${storeName}".`);
          } else {
            console.warn(`⚠️ البيانات في "${storeName}" ليست مصفوفة.`);
          }
        }
      } catch (err) {
        console.error("❌ خطأ أثناء إدخال البيانات:", err);
        tx.abort();
      }
    };

    openRequest.onerror = function (event) {
      // @ts-ignore
      console.error("❌ فشل فتح قاعدة البيانات الجديدة:", event.target.errorCode);
    };
  };
}

function exportIndexedDBToJSON(dbName = "BidStoryDB") {
  return new Promise((resolve, reject) => {
    console.log(`📤 بدء استخراج البيانات من قاعدة البيانات "${dbName}"...`);

    const request = indexedDB.open(dbName);

    request.onerror = (event) => {
      // @ts-ignore
      console.error("❌ فشل في فتح قاعدة البيانات:", event.target.errorCode);
      // @ts-ignore
      reject(event.target.errorCode);
    };

    request.onsuccess = (event) => {
      // @ts-ignore
      const db = event.target.result;
      const storeNames = Array.from(db.objectStoreNames);
      const result = {};
      let remainingStores = storeNames.length;

      if (remainingStores === 0) {
        console.warn("⚠️ لا توجد جداول في قاعدة البيانات.");
        db.close();
        resolve(result);
        return;
      }

      const tx = db.transaction(storeNames, "readonly");

      tx.onerror = (e) => {
        console.error("❌ خطأ أثناء القراءة من قاعدة البيانات:", e.target.error);
        db.close();
        reject(e.target.error);
      };

      for (const storeName of storeNames) {
        const store = tx.objectStore(storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          result[storeName] = getAllRequest.result;
          console.log(`📦 تم استخراج ${getAllRequest.result.length} عنصر من "${storeName}".`);

          remainingStores--;
          if (remainingStores === 0) {
            db.close();
            console.log("✅ تم الانتهاء من استخراج البيانات.");
            resolve(result);
          }
        };

        getAllRequest.onerror = (err) => {
          console.error(`❌ خطأ أثناء القراءة من "${storeName}":`, err.target.error);
          remainingStores--;
          if (remainingStores === 0) {
            db.close();
            reject(err.target.error);
          }
        };
      }
    };
  });
}

let images = null;
let lang = null;

async function loadData() {
  try {
    const imageFilePath = "/BidStory/code/lang/data_image.json";
    const langFilePath = "/BidStory/code/lang/data_lang.json";

    console.log(`📥 تحميل الملف من: ${imageFilePath}`);
    console.log(`📥 تحميل الملف من: ${langFilePath}`);

    const [responseImage, responseLang] = await Promise.all([
      fetch(imageFilePath),
      fetch(langFilePath)
    ]);

    if (!responseImage.ok || !responseLang.ok) {
      throw new Error(`❌ فشل تحميل أحد الملفين:\n📄 image: ${responseImage.status}\n📄 lang: ${responseLang.status}`);
    }

    const [textImage, textLang] = await Promise.all([
      responseImage.text(),
      responseLang.text()
    ]);

    // إضافة رسائل للتأكد من النصوص المحملة
   // console.log("📄 النص المحمل من data_image.json:", textImage);
   // console.log("📄 النص المحمل من data_lang.json:", textLang);

    try {
      images = JSON.parse(textImage);
      lang = JSON.parse(textLang);
      console.log("✅ تم تحويل كلا الملفين إلى كائن JSON بنجاح.");
      document.dispatchEvent(new Event("BidStoryDBReady"));

    } catch (parseError) {
      console.error("❌ فشل في تحليل أحد الملفين إلى JSON:", parseError);
      throw parseError;
    }

  } catch (err) {
    console.error("💥 حدث خطأ أثناء تحميل أو تحليل الملفات:", err);
  }
}




function getImage(clableValue) {
  console.log(images);
  if (!images || !Array.isArray(images.image)) {
    console.error("❌ الكائن المدخل غير صالح أو لا يحتوي على مصفوفة 'image'.");
    return null;
  }

  const foundItem = images.image.find(item => item.Clable === clableValue);

  if (foundItem) {
    console.log(`✅ تم العثور على العنصر بـ Clable = "${clableValue}".`);
    return foundItem.Cdata;
  } else {
    console.warn(`⚠️ لا يوجد عنصر بـ Clable = "${clableValue}".`);
    return null;
  }
}


(async () => {
  if (window.location.hostname.includes("bidstory.github.io")) {
    console.log("✅ انت الان على الاستضافة الحقيقية (GitHub Pages).");
    document.dispatchEvent(new Event("BidStoryDBReady"));
  } else {
    console.log("🧪 انت الان في بيئة تطوير محلية (Localhost أو نطاق تجريبي).");
   await loadData();

  }
})();





