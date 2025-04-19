// أنماط التوليد
const IDPattern = {
    CHAR1_TIME: 'c1t',    // حرف صغير + وقت
    CHARS4_TIME: 'c4t',   // 4 حروف صغيرة + وقت
    MIXED4_TIME: 'Cc4t',  // 4 حروف مختلطة + وقت
    CHARS4_NUMS4: 'c4n',  // 4 حروف صغيرة + 4 أرقام
    MIXED4_NUMS4: 'Cc4n', // 4 حروف مختلطة + 4 أرقام
    CHARS2_NUMS2: 'c2n',  // 2 حروف صغيرة + 2 أرقام
    MIXED2_NUMS2: 'Cc2n'  // 2 حروف مختلطة + 2 أرقام
  };
  
  // توليد محارف عشوائية
  const generateRandom = (charset, count) => {
    let result = '';
    const charsetLength = charset.length;
    
    for (let i = 0; i < count; i++) {
      result += charset[Math.floor(Math.random() * charsetLength)];
    }
    return result;
  };
  
  // توليد معرف فريد
  function generateID(pattern = IDPattern.MIXED2_NUMS2, fixed = "") {
    const timestamp = Date.now();
    const smallChars = 'abcdefghijklmnopqrstuvwxyz';
    const mixedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
  
    const patternGenerators = {
      [IDPattern.CHAR1_TIME]: () => generateRandom(mixedChars, 1) + timestamp,
      [IDPattern.CHARS4_TIME]: () => generateRandom(smallChars, 4) + timestamp,
      [IDPattern.MIXED4_TIME]: () => generateRandom(mixedChars, 4) + timestamp,
      [IDPattern.CHARS4_NUMS4]: () => generateRandom(smallChars, 4) + generateRandom(digits, 4),
      [IDPattern.MIXED4_NUMS4]: () => generateRandom(mixedChars, 4) + generateRandom(digits, 4),
      [IDPattern.CHARS2_NUMS2]: () => generateRandom(smallChars, 2) + generateRandom(digits, 2),
      [IDPattern.MIXED2_NUMS2]: () => generateRandom(mixedChars, 2) + generateRandom(digits, 2)
    };
  
    if (!patternGenerators[pattern]) {
      throw new Error('نمط ID غير صالح');
    }
  
    const generatedID = fixed + patternGenerators[pattern]();
    console.log(generatedID);
    return generatedID;
  }


  /*
  generateID(IDPattern.MIXED2_NUMS2,"hgh"); // مثال على الاستخدام
  generateID(IDPattern.CHARS4_TIME); // مثال على الاستخدام
  generateID(IDPattern.MIXED4_NUMS4); // مثال على الاستخدام 
  generateID(IDPattern.CHAR1_TIME); // مثال على الاستخدام
  generateID(IDPattern.MIXED2_NUMS2); // مثال على الاستخدام
  */