export async  function GetLable() {
      // انتظر 0.5 ثانية
  await new Promise(resolve => setTimeout(resolve, 500));
    console.log("بدء عمل  --> GetLable ");

    const request = indexedDB.open("BidStoryDB");
  
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction("lang", "readonly");
      const objectStore = transaction.objectStore("lang");
      const allElements = document.querySelectorAll("[id]");
  
      allElements.forEach((el) => {
        const id = el.id;
        if (/^\d+$/.test(id)) {
          const getRequest = objectStore.get(Number(id));
          
          getRequest.onsuccess = function() {
            const data = getRequest.result;
            el.textContent = data ? data.a : "❌ لا توجد بيانات";
          };
          
          getRequest.onerror = function() {
            el.textContent = "⚠️ خطأ في الجلب";
          };
        }
      });
    };
  }
