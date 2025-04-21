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
