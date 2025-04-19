/**
 * ملف لتحويل جدول HTML إلى تنسيق JSON مع معالجة شاملة للأخطاء
 * يحتوي على دوال مساعدة لمعالجة العناصر المختلفة
 */

// =============================================
// الدوال الرئيسية
// =============================================

/**
 * الدالة الرئيسية لتحويل الجدول إلى JSON
 * @param {string} tableId - معرف الجدول المراد تحويله
 * @returns {string} JSON string يحتوي على بيانات الجدول
 * @throws {Error} إذا لم يتم العثور على الجدول أو حدث خطأ في المعالجة
 */
function table2Json(tableId) {
  try {
    console.log(`بدء تحويل الجدول ${tableId} إلى JSON`);

    // الحصول على الجدول من DOM
    const table = getTableElement(tableId);

    // معالجة صفوف الجدول
    const tableData = processTableRows(table);

    // تحويل البيانات إلى JSON وحفظها
    return convertAndSaveData(tableData);
  } catch (error) {
    console.error("حدث خطأ جسيم في table2Json:", error);
    throw error;
  }
}

// =============================================
// دوال مساعدة لمعالجة الجدول
// =============================================

/**
 * الحصول على عنصر الجدول من DOM
 * @param {string} tableId - معرف الجدول
 * @returns {HTMLTableElement} عنصر الجدول
 * @throws {Error} إذا لم يتم العثور على الجدول
 */
function getTableElement(tableId) {
  const table = document.getElementById(tableId);
  if (!table) {
    throw new Error(`الجدول ذو المعرف ${tableId} غير موجود في الصفحة`);
  }
  return table;
}

/**
 * معالجة صفوف الجدول وتحويلها إلى هيكل بيانات
 * @param {HTMLTableElement} table - عنصر الجدول
 * @returns {Array} مصفوفة تحتوي على بيانات الصفوف
 */
function processTableRows(table) {
  try {
    return Array.from(table.querySelectorAll("tbody tr"))
      .map((row, rowIndex) => {
        try {
          return processTableRow(row, rowIndex + 1); // نبدأ العد من 1
        } catch (error) {
          console.warn(`فشل في معالجة الصف ${rowIndex + 1}:`, error);
          return null;
        }
      })
      .filter((row) => row !== null);
  } catch (error) {
    console.error("خطأ في معالجة صفوف الجدول:", error);
    throw error;
  }
}

/**
 * معالجة صف واحد من الجدول
 * @param {HTMLTableRowElement} row - عنصر صف الجدول
 * @returns {Object} كائن يمثل الصف
 */
function processTableRow(row, rowIndex) {
  // إعطاء الصف id جديدًا حتى لو كان لديه id مسبقًا
  const rowId = `row_${rowIndex}`;
  row.id = rowId;

  return {
    tag: "tr",
    id: rowId,
    class: row.className || undefined,
    cells: Array.from(row.querySelectorAll("td"))
      .map((cell, colIndex) => {
        try {
          return processTableCell(cell, rowIndex, colIndex + 1);
        } catch (error) {
          console.warn(
            `فشل في معالجة الخلية [${rowIndex}, ${colIndex + 1}]`,
            error
          );
          return null;
        }
      })
      .filter((cell) => cell !== null),
  };
}

/**
 * معالجة خلية الجدول
 * @param {HTMLTableCellElement} cell - عنصر خلية الجدول
 * @returns {Object} كائن يمثل الخلية
 */
function processTableCell(cell, rowIndex, colIndex) {
  // إعطاء الخلية id جديدًا حتى لو كان لديه id مسبقًا
  const cellId = `td_${rowIndex}_${colIndex}`;
  cell.id = cellId;

  return {
    tag: "td",
    id: cellId,
    class: cell.className || undefined,
    children: Array.from(cell.children)
      .map((child, childIndex) => {
        try {
          return processElement(child, cellId, childIndex + 1);
        } catch (error) {
          console.warn(
            `فشل في معالجة العنصر الفرعي [${child.tagName}, ${childIndex + 1}]`,
            error
          );
          return null;
        }
      })
      .filter((child) => child !== null),
  };
}

// =============================================
// دوال مساعدة لمعالجة العناصر العامة
// =============================================

/**
 * معالجة أي عنصر HTML وتحويله إلى كائن JSON
 * @param {HTMLElement} element - العنصر المراد معالجته
 * @returns {Object} كائن يمثل العنصر
 * @throws {Error} إذا كان العنصر غير صالح
 */
function processElement(element, parentId = null, childIndex = null) {
  try {
    if (!element || !element.tagName) throw new Error("عنصر غير صالح");

    const tag = element.tagName.toLowerCase();
    const result = { tag };

    // ─── إنشاء ID جديد وإعطائه للعنصر (حتى لو كان لديه id مسبقًا) ───
    let newId = tag;

    if (parentId) newId += `_${parentId}`;
    if (childIndex !== null) newId += `_${childIndex}`;

    // التأكد من أن الـ ID فريد (إذا كان مُكررًا نضيف رقمًا عشوائيًا)
    if (document.getElementById(newId)) {
      newId += `_${Math.floor(Math.random() * 1000)}`;
    }
    //يمكن الابقاء علي الـ ID القديم في حالة وجوده
    //يمكن اجراء بعض التعديلات والتحكم من هنا علي ال id  الخاص بالعناصر

    // تعيين الـ ID الجديد للعنصر في الـ DOM
    element.id = newId;
    result.id = newId;

    // ─── باقي المعالجة (كما هي) ───
    processCommonAttributes(element, result);
    processElementSpecificAttributes(element, tag, result);
    processChildElements(element, tag, result);
    processDataset(element, result);

    return result;
  } catch (error) {
    console.error(`خطأ في معالجة العنصر ${element.tagName}:`, error);
    throw error;
  }
}

/**
 * معالجة السمات المشتركة بين جميع العناصر
 * @param {HTMLElement} element - العنصر المراد معالجته
 * @param {Object} result - الكائن الذي سيتم إضافة السمات إليه
 */
function processCommonAttributes(element, result) {
  const commonAttributes = [
    "id",
    "className",
    "title",
    "disabled",
    "hidden",
    "tabIndex",
  ];

  commonAttributes.forEach((attr) => {
    try {
      const value = element[attr];
      if (value !== undefined && value !== null && value !== "") {
        result[attr === "className" ? "class" : attr] = value;
      }
    } catch (error) {
      console.warn(
        `فشل في معالجة السمة ${attr} للعنصر ${element.tagName}`,
        error
      );
    }
  });
}

/**
 * معالجة السمات الخاصة حسب نوع العنصر
 * @param {HTMLElement} element - العنصر المراد معالجته
 * @param {string} tag - نوع العنصر (اسم الوسم)
 * @param {Object} result - الكائن الذي سيتم إضافة السمات إليه
 */
function processElementSpecificAttributes(element, tag, result) {
  const attributeHandlers = {
    input: () => processInputAttributes(element, result),
    textarea: () => processTextareaAttributes(element, result),
    select: () => processSelectAttributes(element, result),
    img: () => processImageAttributes(element, result),
    video: () => processVideoAttributes(element, result),
    audio: () => processAudioAttributes(element, result),
    a: () => processAnchorAttributes(element, result),
    button: () => processButtonAttributes(element, result),
  };

  if (attributeHandlers[tag]) {
    try {
      attributeHandlers[tag]();
    } catch (error) {
      console.warn(`فشل في معالجة سمات ${tag} للعنصر`, error);
    }
  }
}

/**
 * معالجة العناصر الفرعية للعنصر
 * @param {HTMLElement} element - العنصر المراد معالجته
 * @param {string} tag - نوع العنصر (اسم الوسم)
 * @param {Object} result - الكائن الذي سيتم إضافة العناصر الفرعية إليه
 */
function processChildElements(element, tag, result) {
  try {
    // معالجة الأطفال إذا كان للعنصر أطفال
    if (element.children && element.children.length > 0) {
      result.children = Array.from(element.children)
        .map((child) => {
          try {
            return processElement(child);
          } catch (error) {
            console.warn(`فشل في معالجة الطفل للعنصر ${tag}`, error);
            return null;
          }
        })
        .filter((child) => child !== null);
    }
    // معالجة النص الداخلي إذا لم يكن هناك أطفال وكان النص موجودًا
    else if (
      element.innerText &&
      element.innerText.trim() &&
      ![
        "input",
        "textarea",
        "video",
        "audio",
        "img",
        "script",
        "style",
      ].includes(tag)
    ) {
      result.innerText = element.innerText.trim();
    }
  } catch (error) {
    console.warn(`فشل في معالجة العناصر الفرعية للعنصر ${tag}`, error);
  }
}

/**
 * معالجة بيانات data-* المخصصة للعنصر
 * @param {HTMLElement} element - العنصر المراد معالجته
 * @param {Object} result - الكائن الذي سيتم إضافة البيانات إليه
 */
function processDataset(element, result) {
  try {
    if (element.dataset && Object.keys(element.dataset).length > 0) {
      result.dataset = { ...element.dataset };
    }
  } catch (error) {
    console.warn(`فشل في معالجة dataset للعنصر`, error);
  }
}

// =============================================
// دوال معالجة السمات الخاصة بأنواع العناصر
// =============================================

/**
 * معالجة سمات عناصر input
 * @param {HTMLInputElement} element - عنصر input
 * @param {Object} result - الكائن الذي سيتم إضافة السمات إليه
 */
function processInputAttributes(element, result) {
  const inputAttrs = [
    "type",
    "value",
    "placeholder",
    "required",
    "readOnly",
    "checked",
    "maxLength",
    "min",
    "max",
    "step",
    "pattern",
  ];

  inputAttrs.forEach((attr) => {
    const value = element[attr];
    if (value !== undefined && value !== null && value !== "") {
      result[attr] = value;
    }
  });
}

/**
 * معالجة سمات عناصر textarea
 * @param {HTMLTextAreaElement} element - عنصر textarea
 * @param {Object} result - الكائن الذي سيتم إضافة السمات إليه
 */
function processTextareaAttributes(element, result) {
  const textareaAttrs = ["value", "placeholder", "rows", "cols", "wrap"];

  textareaAttrs.forEach((attr) => {
    const value = element[attr];
    if (value !== undefined && value !== null && value !== "") {
      result[attr] = value;
    }
  });
}

/**
 * معالجة سمات عناصر select
 * @param {HTMLSelectElement} element - عنصر select
 * @param {Object} result - الكائن الذي سيتم إضافة السمات إليه
 */
function processSelectAttributes(element, result) {
  if (element.multiple) result.multiple = true;
  if (element.size) result.size = element.size;

  const options = Array.from(element.options).map((opt) => ({
    value: opt.value,
    text: opt.text,
    selected: opt.selected,
    disabled: opt.disabled,
  }));

  if (options.length) result.options = options;
}

/**
 * معالجة سمات عناصر img
 * @param {HTMLImageElement} element - عنصر img
 * @param {Object} result - الكائن الذي سيتم إضافة السمات إليه
 */
function processImageAttributes(element, result) {
  const imgAttrs = ["src", "alt", "width", "height", "loading"];

  imgAttrs.forEach((attr) => {
    const value = element[attr];
    if (value !== undefined && value !== null && value !== "") {
      result[attr] = value;
    }
  });
}

/**
 * معالجة سمات عناصر video
 * @param {HTMLVideoElement} element - عنصر video
 * @param {Object} result - الكائن الذي سيتم إضافة السمات إليه
 */
function processVideoAttributes(element, result) {
  const mediaAttrs = [
    "src",
    "controls",
    "autoplay",
    "loop",
    "muted",
    "preload",
    "poster",
  ];

  mediaAttrs.forEach((attr) => {
    const value = element[attr];
    if (value !== undefined) {
      result[attr] = value;
    }
  });
}

/**
 * معالجة سمات عناصر audio
 * @param {HTMLAudioElement} element - عنصر audio
 * @param {Object} result - الكائن الذي سيتم إضافة السمات إليه
 */
function processAudioAttributes(element, result) {
  const mediaAttrs = [
    "src",
    "controls",
    "autoplay",
    "loop",
    "muted",
    "preload",
  ];

  mediaAttrs.forEach((attr) => {
    const value = element[attr];
    if (value !== undefined) {
      result[attr] = value;
    }
  });
}

/**
 * معالجة سمات عناصر a (روابط)
 * @param {HTMLAnchorElement} element - عنصر a
 * @param {Object} result - الكائن الذي سيتم إضافة السمات إليه
 */
function processAnchorAttributes(element, result) {
  const anchorAttrs = ["href", "target", "download"];

  anchorAttrs.forEach((attr) => {
    const value = element[attr];
    if (value !== undefined && value !== null && value !== "") {
      result[attr] = value;
    }
  });
}

/**
 * معالجة سمات عناصر button
 * @param {HTMLButtonElement} element - عنصر button
 * @param {Object} result - الكائن الذي سيتم إضافة السمات إليه
 */
function processButtonAttributes(element, result) {
    // السمات الرئيسية
    const buttonAttrs = ["type", "formAction", "formMethod"];
  
    buttonAttrs.forEach((attr) => {
      const value = element[attr];
      if (value !== undefined && value !== null && value !== "") {
        result[attr] = value;
      }
    });
  
    // إضافة خاصية النص فقط إذا كان هناك محتوى نصي
    if (element.textContent && element.textContent.trim() !== "") {
      result.text = element.textContent.trim();
    }
  }

// =============================================
// دوال التحويل النهائي والحفظ
// =============================================

/**
 * تحويل البيانات إلى JSON وحفظها في localStorage
 * @param {Array} data - البيانات المراد تحويلها
 * @returns {string} JSON string
 */
function convertAndSaveData(data) {
  try {
    const jsonResult = JSON.stringify(data, null, 2);
    localStorage.setItem("myTableData", jsonResult);
    console.log("تم تحويل الجدول إلى JSON وحفظه بنجاح");
    return jsonResult;
  } catch (error) {
    console.error("خطأ في تحويل البيانات أو حفظها:", error);
    throw error;
  }
}
