/**
 * دالة شاملة ومتقدمة للتعامل مع IndexedDB
 * تشمل: إنشاء قاعدة البيانات، إضافة، تعديل، حذف، قراءة البيانات، ومعاملات متقدمة
 * @param {string} dbName - اسم قاعدة البيانات
 * @param {number} version - رقم النسخة (لتفعيل onupgradeneeded)
 * @param {Array} stores - مصفوفة تحتوي على أسماء الجداول (object stores) وتعريفها
 * @returns {object} - كائن يحتوي على جميع الدوال للتعامل مع قاعدة البيانات
 */
function manageIndexedDB(dbName, version, stores) {
  let db;
  let dbPromise;
  let isDbOpen = false;
  const listeners = {
    onOpen: [],
    onUpgrade: [],
    onError: [],
    onVersionChange: [],
    onClose: [],
  };

  // فتح الاتصال بقاعدة البيانات
  const openDatabase = () => {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);

        request.onupgradeneeded = function (event) {
          db = event.target.result;
          isDbOpen = false;

          console.log("يتم إنشاء أو تحديث قاعدة البيانات...");
          notifyListeners("onUpgrade", event);

          // إنشاء الجداول إذا لم تكن موجودة
          stores.forEach((store) => {
            if (!db.objectStoreNames.contains(store.name)) {
              const objectStore = db.createObjectStore(store.name, {
                keyPath: store.keyPath || "id",
                autoIncrement: store.autoIncrement || false,
              });

              // إنشاء الفهارس (indexes) إذا تم تحديدها
              if (store.indexes) {
                store.indexes.forEach((index) => {
                  objectStore.createIndex(index.name, index.keyPath, {
                    unique: index.unique || false,
                    multiEntry: index.multiEntry || false,
                  });
                });
              }
              console.log(`تم إنشاء الجدول: ${store.name}`);
            }
          });
        };

        request.onsuccess = function (event) {
          db = event.target.result;
          isDbOpen = true;
          console.log("تم فتح قاعدة البيانات بنجاح.");
          notifyListeners("onOpen", event);

          // إضافة معالج حدث إغلاق الاتصال
          db.onclose = () => {
            isDbOpen = false;
            notifyListeners("onClose");
          };

          // إضافة معالج حدث تغيير النسخة
          db.onversionchange = (event) => {
            notifyListeners("onVersionChange", event);
            db.close();
          };

          resolve(db);
        };

        request.onerror = function (event) {
          console.error("خطأ في فتح قاعدة البيانات:", event.target.error);
          notifyListeners("onError", event.target.error);
          reject(event.target.error);
        };
      });
    }
    return dbPromise;
  };

  // إضافة مستمع للأحداث
  function addListener(eventName, callback) {
    if (listeners[eventName]) {
      listeners[eventName].push(callback);
    }
  }

  // إزالة مستمع للأحداث
  function removeListener(eventName, callback) {
    if (listeners[eventName]) {
      listeners[eventName] = listeners[eventName].filter(
        (cb) => cb !== callback
      );
    }
  }

  // تنبيه المستمعين للأحداث
  function notifyListeners(eventName, data) {
    if (listeners[eventName]) {
      listeners[eventName].forEach((callback) => callback(data));
    }
  }

  // التأكد من أن قاعدة البيانات مفتوحة
  async function ensureDbOpen() {
    if (!isDbOpen) {
      await openDatabase();
    }
    return db;
  }

  // دوال CRUD الأساسية:

  // إضافة سجل أو سجلات
  async function addRecord(storeName, data, options = {}) {
    try {
      await ensureDbOpen();
      const tx = db.transaction([storeName], "readwrite", options);
      const store = tx.objectStore(storeName);

      const promises = Array.isArray(data)
        ? data.map(
            (item) =>
              new Promise((resolve, reject) => {
                const request = store.add(item);
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
              })
          )
        : [
            new Promise((resolve, reject) => {
              const request = store.add(data);
              request.onsuccess = () => resolve(request.result);
              request.onerror = (e) => reject(e.target.error);
            }),
          ];

      const results = await Promise.all(promises);
      return Array.isArray(data) ? results : results[0];
    } catch (error) {
      console.error("خطأ في الإضافة:", error);
      throw error;
    }
  }

  // تحديث سجل أو سجلات
  async function updateRecord(storeName, data, options = {}) {
    try {
      await ensureDbOpen();
      const tx = db.transaction([storeName], "readwrite", options);
      const store = tx.objectStore(storeName);

      const promises = Array.isArray(data)
        ? data.map(
            (item) =>
              new Promise((resolve, reject) => {
                const request = store.put(item);
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
              })
          )
        : [
            new Promise((resolve, reject) => {
              const request = store.put(data);
              request.onsuccess = () => resolve(request.result);
              request.onerror = (e) => reject(e.target.error);
            }),
          ];

      const results = await Promise.all(promises);
      return Array.isArray(data) ? results : results[0];
    } catch (error) {
      console.error("خطأ في التحديث:", error);
      throw error;
    }
  }

  // حذف سجل أو سجلات
  async function deleteRecord(storeName, key, options = {}) {
    try {
      await ensureDbOpen();
      const tx = db.transaction([storeName], "readwrite", options);
      const store = tx.objectStore(storeName);

      const promises = Array.isArray(key)
        ? key.map(
            (k) =>
              new Promise((resolve, reject) => {
                const request = store.delete(k);
                request.onsuccess = () => resolve();
                request.onerror = (e) => reject(e.target.error);
              })
          )
        : [
            new Promise((resolve, reject) => {
              const request = store.delete(key);
              request.onsuccess = () => resolve();
              request.onerror = (e) => reject(e.target.error);
            }),
          ];

      await Promise.all(promises);
    } catch (error) {
      console.error("خطأ في الحذف:", error);
      throw error;
    }
  }

  // قراءة سجل واحد بالمفتاح
  async function getRecord(storeName, key, options = {}) {
    try {
      await ensureDbOpen();
      const tx = db.transaction([storeName], "readonly", options);
      const store = tx.objectStore(storeName);

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (error) {
      console.error("خطأ في قراءة السجل:", error);
      throw error;
    }
  }

  // قراءة كل السجلات مع إمكانية التصفية والترتيب
  async function getAllRecords(storeName, options = {}) {
    try {
      await ensureDbOpen();
      const tx = db.transaction([storeName], "readonly", options);
      const store = tx.objectStore(storeName);

      return new Promise((resolve, reject) => {
        const request = options.index
          ? store.index(options.index).getAll(options.query, options.count)
          : store.getAll(options.query, options.count);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (error) {
      console.error("خطأ في قراءة السجلات:", error);
      throw error;
    }
  }

  // عد السجلات في الجدول
  async function countRecords(storeName, options = {}) {
    try {
      await ensureDbOpen();
      const tx = db.transaction([storeName], "readonly", options);
      const store = tx.objectStore(storeName);

      return new Promise((resolve, reject) => {
        const request = options.index
          ? store.index(options.index).count(options.query)
          : store.count(options.query);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (error) {
      console.error("خطأ في عد السجلات:", error);
      throw error;
    }
  }

  // دوال متقدمة:

  // تنفيذ معاملة (transaction) مخصصة
  async function executeTransaction(
    storeNames,
    mode,
    transactionLogic,
    options = {}
  ) {
    try {
      await ensureDbOpen();
      const tx = db.transaction(storeNames, mode, options);

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
        tx.onabort = (e) => reject(e.target.error);

        transactionLogic(tx);
      });
    } catch (error) {
      console.error("خطأ في المعاملة:", error);
      throw error;
    }
  }

  // البحث باستخدام المؤشر (cursor)
  async function iterateWithCursor(storeName, callback, options = {}) {
    try {
      await ensureDbOpen();
      const tx = db.transaction([storeName], "readonly", options);
      const store = tx.objectStore(storeName);
      const source = options.index ? store.index(options.index) : store;

      return new Promise((resolve, reject) => {
        const request = source.openCursor(options.query, options.direction);

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            callback(cursor.value, cursor);
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = (e) => reject(e.target.error);
      });
    } catch (error) {
      console.error("خطأ في التكرار باستخدام المؤشر:", error);
      throw error;
    }
  }

  // البحث باستخدام نطاق من المفاتيح
  async function getByKeyRange(storeName, keyRange, options = {}) {
    try {
      await ensureDbOpen();
      const tx = db.transaction([storeName], "readonly", options);
      const store = tx.objectStore(storeName);
      const source = options.index ? store.index(options.index) : store;

      return new Promise((resolve, reject) => {
        const request = source.getAll(keyRange);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (error) {
      console.error("خطأ في البحث بالنطاق:", error);
      throw error;
    }
  }

  // إنشاء نطاق مفاتيح
  function createKeyRange(lower, upper, lowerOpen = false, upperOpen = false) {
    return IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
  }

  // حذف قاعدة البيانات بالكامل
  async function deleteDatabase() {
    try {
      if (isDbOpen) {
        db.close();
        isDbOpen = false;
      }

      return new Promise((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(dbName);
        deleteRequest.onsuccess = () => {
          console.log("تم حذف قاعدة البيانات.");
          dbPromise = null;
          resolve();
        };
        deleteRequest.onerror = (e) => {
          console.error("خطأ في حذف القاعدة:", e.target.error);
          reject(e.target.error);
        };
        deleteRequest.onblocked = () => {
          console.warn("تم حظر حذف القاعدة بسبب وجود اتصال مفتوح.");
          reject(
            new Error("Database deletion blocked due to open connections")
          );
        };
      });
    } catch (error) {
      console.error("خطأ في حذف قاعدة البيانات:", error);
      throw error;
    }
  }

  // تصدير قاعدة البيانات ككائن JSON
  async function exportToJSON() {
    try {
      await ensureDbOpen();
      const exportData = {};

      for (const storeName of db.objectStoreNames) {
        const records = await getAllRecords(storeName);
        exportData[storeName] = records;
      }

      return exportData;
    } catch (error) {
      console.error("خطأ في تصدير البيانات:", error);
      throw error;
    }
  }

  /**
   * تصدير جدول معين من قاعدة البيانات إلى JSON
   * @param {string} storeName - اسم الجدول المراد تصديره
   * @returns {Promise<Object>} بيانات الجدول بصيغة JSON
   */
  async function exportStoreToJSON(storeName) {
    try {
      await ensureDbOpen();

      if (!db.objectStoreNames.contains(storeName)) {
        throw new Error(`الجدول ${storeName} غير موجود في قاعدة البيانات`);
      }

      const records = await getAllRecords(storeName);

      return {
        [storeName]: records,
        metadata: {
          exportedAt: new Date().toISOString(),
          recordCount: records.length,
          storeName: storeName,
        },
      };
    } catch (error) {
      console.error(`خطأ في تصدير الجدول ${storeName}:`, error);
      throw error;
    }
  }

  // استيراد بيانات من JSON
  async function importFromJSON(data, options = {}) {
    try {
      await ensureDbOpen();

      return executeTransaction(
        Array.from(db.objectStoreNames),
        "readwrite",
        (tx) => {
          for (const storeName in data) {
            if (db.objectStoreNames.contains(storeName)) {
              const store = tx.objectStore(storeName);
              data[storeName].forEach((record) => {
                store.put(record);
              });
            }
          }
        },
        options
      );
    } catch (error) {
      console.error("خطأ في استيراد البيانات:", error);
      throw error;
    }
  }

  /**
   * استيراد بيانات لجدول معين من JSON
   * @param {string} storeName - اسم الجدول المستهدف
   * @param {Array|Object} data - البيانات المراد استيرادها
   * @param {Object} [options] - خيارات إضافية
   */
  async function importStoreFromJSON(storeName, data, options = {}) {
    try {
      await ensureDbOpen();

      if (!db.objectStoreNames.contains(storeName)) {
        throw new Error(`الجدول ${storeName} غير موجود في قاعدة البيانات`);
      }

      // تحويل البيانات إذا كانت غير مصفوفة
      const records = Array.isArray(data) ? data : [data];

      return executeTransaction(
        [storeName],
        "readwrite",
        (tx) => {
          const store = tx.objectStore(storeName);
          records.forEach((record) => {
            store.put(record);
          });
        },
        options
      );
    } catch (error) {
      console.error(`خطأ في استيراد البيانات للجدول ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * تنزيل بيانات الجدول كملف JSON
   * @param {string} storeName - اسم الجدول
   * @param {string} [fileName] - اسم الملف (اختياري)
   */
  async function downloadStoreAsJSON(storeName, fileName) {
    try {
      const data = await exportStoreToJSON(storeName);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download =
        fileName ||
        `${storeName}_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();

      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 100);
    } catch (error) {
      console.error("خطأ في تنزيل الملف:", error);
      throw error;
    }
  }

  /**
   * استيراد بيانات من ملف JSON لجدول معين
   * @param {string} storeName - اسم الجدول
   * @param {File} file - ملف JSON
   */
  async function importStoreFromFile(storeName, file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await importStoreFromJSON(storeName, data[storeName] || data);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("خطأ في قراءة الملف"));
      };

      reader.readAsText(file);
    });
  }

  // إغلاق الاتصال بقاعدة البيانات
  function closeConnection() {
    if (isDbOpen) {
      db.close();
      isDbOpen = false;
      dbPromise = null;
      console.log("تم إغلاق الاتصال بقاعدة البيانات.");
    }
  }

  // إرجاع الدوال للاستخدام الخارجي
  return {
    // الدوال الأساسية
    open: openDatabase,
    close: closeConnection,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecord,
    getAllRecords,
    countRecords,

    // الدوال المتقدمة
    executeTransaction,
    iterateWithCursor,
    getByKeyRange,
    createKeyRange,

    // إدارة قاعدة البيانات
    deleteDatabase,
    exportToJSON,
    importFromJSON,

    // إدارة الأحداث
    addListener,
    removeListener,

    // معلومات قاعدة البيانات
    get db() {
      return db;
    },
    get isOpen() {
      return isDbOpen;
    },
    get name() {
      return dbName;
    },
    get version() {
      return version;
    },
  };
}
