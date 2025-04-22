function dbi(dbName) {
    let currentVersion = 1;

    const openDB = async (version) => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, version);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const getCurrentVersion = async () => {
        let db;
        try {
            db = await openDB();
            currentVersion = db.version;
            return currentVersion;
        } finally {
            if (db) db.close();
        }
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


    const createIdTable = async () => {
        try {
            const tableExists = await isTableExist('IdTable');

            if (!tableExists) {
              
                currentVersion = currentVersion + 1;

                const db = await new Promise((resolve, reject) => {
                    const request = indexedDB.open(dbName, currentVersion);

                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;
                        const objectStore = db.createObjectStore('IdTable', {
                            keyPath: 'id',
                            autoIncrement: false
                        });
                        objectStore.createIndex('value', 'value', { unique: false });
                        console.log('✅ تم إنشاء الجدول بنجاح');
                    };

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                db.close();
            } else {
                console.log('ℹ️ الجدول موجود بالفعل');
            }
        } catch (error) {
            console.error('❌ خطأ:', error);
        }
    };



    const getAllIdTableData = async () => {
        let db;
        try {

            db = await openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction('IdTable', 'readonly');
                const objectStore = transaction.objectStore('IdTable');
                const request = objectStore.getAll();

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject('❌ فشل في جلب البيانات: ' + request.error);
                };
            });

        } catch (error) {
            console.error('❌ خطأ:', error);
            return [];
        } finally {
            if (db) db.close();
        }
    };




    // Return an object with all methods and the currentVersion
    return (async () => {
        await getCurrentVersion();
        return {
            getCurrentVersion,
            isTableExist,
            openDB,
            dbName,
            createIdTable,
            getAllIdTableData,
            currentVersion // Now exposing currentVersion
        };
    })();
}