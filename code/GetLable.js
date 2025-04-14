const request = indexedDB.open("BidStoryDB");

request.onsuccess = function(event) {
  const db = event.target.result;
  const transaction = db.transaction("lang", "readonly");
  const objectStore = transaction.objectStore("lang");

  // الحصول على كل العناصر في الصفحة التي لديها id عبارة عن رقم
  const allElements = document.querySelectorAll("[id]");

  allElements.forEach((el) => {
    const id = el.id;

    // تأكد أن الـ id هو رقم صحيح فقط
    if (/^\d+$/.test(id)) {
      const getRequest = objectStore.get(Number(id));

      getRequest.onsuccess = function() {
        const data = getRequest.result;
        if (data) {
          el.textContent = data.a;
        } else {
          el.textContent = "❌ لا توجد بيانات";
        }
      };

      getRequest.onerror = function() {
        el.textContent = "⚠️ خطأ في الجلب";
      };
    }
  });
};
