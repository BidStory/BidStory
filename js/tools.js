// أنماط التوليد
const IDPattern = {
  CHAR1_TIME: 0, // حرف صغير + وقت
  CHARS4_TIME: 1, // 4 حروف صغيرة + وقت
  MIXED4_TIME: 2, // 4 حروف مختلطة + وقت
  CHARS4_NUMS4: 3, // 4 حروف صغيرة + 4 أرقام
  MIXED4_NUMS4: 4, // 4 حروف مختلطة + 4 أرقام
  CHARS2_NUMS2: 6, // 2 حروف مختلطة + 2 أرقام
};

// توليد محارف عشوائية
const generateRandom = (charset, count) => {
  let result = "";
  const charsetLength = charset.length;

  for (let i = 0; i < count; i++) {
    result += charset[Math.floor(Math.random() * charsetLength)];
  }
  return result;
};

// توليد معرف فريد
function CID(pattern = IDPattern.MIXED2_NUMS2, fixed = "") {
  const timestamp = Date.now();
  const smallChars = "abcdefghijklmnopqrstuvwxyz";
  const mixedChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";

  const patternGenerators = {
    [IDPattern.CHAR1_TIME]: () => generateRandom(mixedChars, 1) + timestamp,
    [IDPattern.CHARS4_TIME]: () => generateRandom(smallChars, 4) + timestamp,
    [IDPattern.MIXED4_TIME]: () => generateRandom(mixedChars, 4) + timestamp,
    [IDPattern.CHARS4_NUMS4]: () =>
      generateRandom(smallChars, 4) + generateRandom(digits, 4),
    [IDPattern.MIXED4_NUMS4]: () =>
      generateRandom(mixedChars, 4) + generateRandom(digits, 4),
    [IDPattern.CHARS2_NUMS2]: () =>
      generateRandom(smallChars, 2) + generateRandom(digits, 2),
    [IDPattern.MIXED2_NUMS2]: () =>
      generateRandom(mixedChars, 2) + generateRandom(digits, 2),
  };

  if (!patternGenerators[pattern]) {
    throw new Error("نمط ID غير صالح");
  }

  const generatedID = fixed + patternGenerators[pattern]();
  //console.log(generatedID);
  return generatedID;
}

/*
  CID(IDPattern.MIXED2_NUMS2,"hgh"); // مثال على الاستخدام
  CID(IDPattern.CHARS4_TIME); // مثال على الاستخدام
  CID(IDPattern.MIXED4_NUMS4); // مثال على الاستخدام 
  CID(IDPattern.CHAR1_TIME); // مثال على الاستخدام
  CID(IDPattern.MIXED2_NUMS2); // مثال على الاستخدام
  */


  async function watchingAllInputs2IndexDB  (target,dbNoUpgrade,tableName)
   {
    // أنواع حقول الإدخال التي نريد مراقبتها (بدون الأزرار)
    const inputSelectors = [
      'input[type="text"]',
      'input[type="date"]',
      'input[type="time"]',
      'input[type="radio"]',
      'input[type="checkbox"]',
      'input[type="number"]',
      'input[type="email"]',
      'input[type="password"]',
      'textarea',
      'select'
    ];
 
    const containerElement = document.getElementById( target );
 // التحقق من وجود العنصر، إذا لم يكن موجود نخرج من الدالة
 if ( !containerElement )
  {
    console.error( "❌ لم يتم توفير عنصر الحاوية (Watching) watchAndSaveInputs2Local." );
    return;
  }
    // البحث عن جميع حقول الإدخال في الصفحة
    const inputs = containerElement.querySelectorAll(inputSelectors.join(","));
  
    // مصفوفة لتخزين المعالجات (لإزالتها لاحقًا إذا لزم الأمر)
    const inputListeners = [];
  
    // مراقبة كل حقل إدخال
    inputs.forEach((input) => {
      // @ts-ignore
      // @ts-ignore
      // @ts-ignore
      // @ts-ignore
      // @ts-ignore
      // @ts-ignore
      const inputListener = (event) => {
        let value;
  
        // تحديد القيمة حسب نوع الحقل
        // @ts-ignore
        if (input.type === "checkbox") {
          // @ts-ignore
          value = input.checked;
        } 
        // @ts-ignore
        else if (input.type === "radio") {
          // @ts-ignore
          if (!input.checked) return;
          // @ts-ignore
          value = input.value;
        } 
        else {
          // @ts-ignore
          value = input.value;
        }
  
        // حفظ القيمة في قاعدة البيانات (إذا كانت الدالة متاحة)
        // @ts-ignore
        if (typeof dbNoUpgrade?.keySet === 'function') {
          // @ts-ignore
          dbNoUpgrade.keySet(tableName, input.id, value);
          console.log("💾 تم حفظ القيمة:", { id: input.id, value });
        }
      };
  
      // تحديد نوع الحدث المناسب (change للأزرار ومربعات الاختيار، input لباقي الحقول)
      const eventType = 
        // @ts-ignore
        input.type === "radio" || 
        // @ts-ignore
        input.type === "checkbox" || 
        input.tagName.toLowerCase() === "select"
          ? "change" 
          : "input";
  
      // إضافة المعالج للعنصر
      input.addEventListener(eventType, inputListener);
      
      // تخزين المرجع لإزالة المعالج لاحقًا إذا لزم الأمر
      inputListeners.push({ input, listener: inputListener });
    });
  
    console.log(`🔍 بدأ مراقبة ${inputs.length} من حقول الإدخال في الصفحة`);
    
    // إرجاع مصفوفة المعالجات لإمكانية إزالتها لاحقًا
    return inputListeners;
  };

  async function restoreAllInputsFromIndexDB(target, dbNoUpgrade, tableName) {
    // أنواع الحقول التي نسترجع لها القيم
    const inputSelectors = [
      'input[type="text"]',
      'input[type="date"]',
      'input[type="time"]',
      'input[type="radio"]',
      'input[type="checkbox"]',
      'input[type="number"]',
      'input[type="email"]',
      'input[type="password"]',
      'textarea',
      'select'
    ];
  
    const containerElement = document.getElementById(target);
    if (!containerElement) {
      console.error("❌ لم يتم توفير عنصر الحاوية (Restoring) restoreAllInputsFromIndexDB.");
      return;
    }
  
    const inputs = containerElement.querySelectorAll(inputSelectors.join(","));
  
    for (const input of inputs) {
      const inputId = input.id;
      if (!inputId) continue; // تخطي العناصر بدون ID
  
      try {
        // @ts-ignore
        const value = await dbNoUpgrade?.keyGet?.(tableName, inputId);
  
        if (value === undefined) continue;
  
        // @ts-ignore
        if (input.type === "checkbox") {
          // @ts-ignore
          input.checked = Boolean(value);
        // @ts-ignore
        } else if (input.type === "radio") {
          // @ts-ignore
          if (input.value === value) {
            // @ts-ignore
            input.checked = true;
          }
        } else {
          // @ts-ignore
          input.value = value;
        }
  
        console.log("♻️ تم استرجاع القيمة:", { id: inputId, value });
      } catch (error) {
        console.error(`⚠️ خطأ أثناء استرجاع الحقل ${inputId}:`, error);
      }
    }
  
    console.log(`✅ تم استرجاع القيم لجميع الحقول (${inputs.length}) داخل العنصر ${target}`);
  }
  
  function watchAndSaveInputs2Local() {
    const inputSelectors = [
      'input[type="text"]',
      'input[type="date"]',
      'input[type="time"]',
      'input[type="radio"]',
      'input[type="checkbox"]',
      'input[type="number"]',
      'input[type="email"]',
      'input[type="password"]',
      'textarea',
      'select'
    ];
  
    const inputs = document.querySelectorAll(inputSelectors.join(','));
    const inputListeners = [];
  
    inputs.forEach((input) => {
      const handleInputChange = () => {
        let value;
  
        // @ts-ignore
        if (input.type === 'checkbox') {
          // @ts-ignore
          value = input.checked;
        // @ts-ignore
        } else if (input.type === 'radio') {
          // @ts-ignore
          if (!input.checked) return;
          // @ts-ignore
          value = input.value;
        } else {
          // @ts-ignore
          value = input.value;
        }
  
        if (input.id) {
          localStorage.setItem(input.id, JSON.stringify(value));
          console.log(`💾 تم حفظ "${input.id}":`, value);
        } else {
          console.warn('⚠️ لا يمكن الحفظ: العنصر ليس له معرّف (id)', input);
        }
      };
  
      const eventType = 
        // @ts-ignore
        input.type === 'radio' || 
        // @ts-ignore
        input.type === 'checkbox' || 
        input.tagName.toLowerCase() === 'select'
          ? 'change'
          : 'input';
  
      input.addEventListener(eventType, handleInputChange);
      inputListeners.push({ input, listener: handleInputChange });
  
      // استرجاع القيم المحفوظة من localStorage عند التحميل
      if (input.id && localStorage.getItem(input.id)) {
        // @ts-ignore
        const savedValue = JSON.parse(localStorage.getItem(input.id));
  
        // @ts-ignore
        if (input.type === 'checkbox') {
          // @ts-ignore
          input.checked = savedValue;
        // @ts-ignore
        } else if (input.type === 'radio') {
          // @ts-ignore
          if (input.value === savedValue) input.checked = true;
        } else {
          // @ts-ignore
          input.value = savedValue;
        }
      }
    });
  
    console.log(`🔍 جاري مراقبة ${inputs.length} من حقول الإدخال`);
    return inputListeners;
  }
  
 
  
  
  const restoreInputsFromLocal = () => {
    // أنواع حقول الإدخال المطلوبة (نفس أنواع الدالة السابقة)
    const inputSelectors = [
      'input[type="text"]',
      'input[type="date"]',
      'input[type="time"]',
      'input[type="radio"]',
      'input[type="checkbox"]',
      'input[type="number"]',
      'input[type="email"]',
      'input[type="password"]',
      'textarea',
      'select'
    ];
  
    // البحث عن جميع حقول الإدخال في الصفحة
    const inputs = document.querySelectorAll(inputSelectors.join(','));
  
    let restoredCount = 0;
  
    inputs.forEach((input) => {
      if (!input.id) return; // تخطي العناصر بدون معرف
  
      const savedValue = localStorage.getItem(input.id);
      if (savedValue === null) return; // لا يوجد قيمة محفوظة
  
      try {
        const parsedValue = JSON.parse(savedValue);
  
        // تعيين القيمة حسب نوع الحقل
        // @ts-ignore
        if (input.type === 'checkbox') {
          // @ts-ignore
          input.checked = parsedValue;
          restoredCount++;
        } 
        // @ts-ignore
        else if (input.type === 'radio') {
          // @ts-ignore
          if (input.value === parsedValue) {
            // @ts-ignore
            input.checked = true;
            restoredCount++;
          }
        } 
        else {
          // @ts-ignore
          input.value = parsedValue;
          restoredCount++;
        }
  
      } catch (error) {
        console.error(`❌ خطأ في تحليل القيمة المحفوظة للعنصر ${input.id}:`, error);
      }
    });
  
    console.log(`♻️ تم استعادة ${restoredCount} من القيم من localStorage`);
    return restoredCount; // إرجاع عدد العناصر التي تمت استعادة قيمها
  };
  
  async function delay ( ms )
  {
    return new Promise( resolve => setTimeout( resolve, ms ) );
  }