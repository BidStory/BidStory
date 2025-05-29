/**
 * تهيئة معلمات عرض الجدول في واجهة المستخدم.
 * @param {string} tableContaner - معرف العنصر الذي سيتم فيه عرض الجدول.
 * @param {string} tableIdAndDataBaseName - اسم قاعدة البيانات المرتبطة بالجدول.
 * @param {string} divId2Copy - معرف العنصر الذي سيتم نسخ محتواه لتمثيل صف الجدول.
 * @param {string} altDivId2copy - معرف عنصر سيتم استخدامه عند الضغط علي صف معين.
 * @param {boolean} isShowHead - تحديد ما إذا كان سيتم عرض رأس الجدول أم لا.
 * @param {boolean} isAddAltDiv - تحديد ما إذا كان سيتم تضمين العنصر عند الضغط علي صف.
 * @param {boolean} isStartWithNew - هل تبدء بصف جديد دائما
 *   @param {boolean} isStartWithNew - هل تبدء بصف جديد دائما
 * @param {boolean} haveNumbringColumn - هل يحتوي الجدول على عمود ترقيم
 */

function setTableParameter(
  tableContaner,
  tableIdAndDataBaseName,
  divId2Copy,
  altDivId2copy,
  isShowHead,
  isAddAltDiv,
  isStartWithNew,
  haveNumbringColumn
)
{

  //#region 🧩 إعداد المتغيرات العامة والتهيئة

  // المعرف الخاص بمكان إنشاء الجدول داخل الصفحة
  let tableContaner_ = tableContaner;

  // خيار عرض رأس الجدول (true أو false أو فارغ)
  let showHead = isShowHead;

  // معرف الجدول الذي سيتم إنشاؤه وهو ايضا اسم قاعدة البيانات
  let tableId = tableIdAndDataBaseName;

  // معرف العنصر الذي يحتوي على النموذج الأساسي للصف (div جاهز يُنسخ منه)
  let divId2Copy_ = divId2Copy;
  //معرف العنصر الذي سوف يظهر تحت الصف في حاله الغط علية كليك
  let altDivId2Copy_ = altDivId2copy;

  // اسم الجدول المستخدم لحفظ بيانات الصفوف
  let rowsTable = "rows";

  // قواعد البيانات (قراءة فقط / مع إمكانية الترقية)
  let dbNoUpgrade = null;
  let dbUpgrade = null;

  // معرف الصف المحدد حاليًا
  let selectedRaw = null;

  // عدد الصفوف المضافة، يُستخدم لترتيبها
  let rawIndex = 0;

  // عند تفعيل هذا الخيار، يتم إضافة div تحت الصف عند النقر عليه
  let isAddAltDiv_ = isAddAltDiv;
  //جعل الجدول دائما به صف جديد 
  let isStartWithNew_ = isStartWithNew;
  //#endregion

  //#region 🏗️ إنشاء الجدول داخل عنصر محدد

  // تنشئ جدول فارغ داخل عنصر باستخدام tableId المحدد مسبقًا
  const createTableWithId = async () =>
  {
    const contaner = document.getElementById(tableContaner_);
    const table_1 = document.createElement("table");
    table_1.id = tableId;

    const tbody = document.createElement("tbody");
    table_1.appendChild(tbody);

    // @ts-ignore
    contaner.appendChild(table_1);
  };

  //#endregion

  //#region 🖱️ الاستماع لاختيار صف من الجدول (تحديده وعرض تفاصيله)

  const tableRawListener = async () =>
  {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = table.querySelectorAll("tr");

    rows.forEach((row) =>
    {
      if (row.hasAttribute('data-listeners-added'))
      {
        // إذا تم إضافة المستمعات مسبقًا، تجاهل هذا الصف
        return;
      }

      row.addEventListener("click", async () =>
      {
        await handleRowSelection(row);
      });

      let pressTimer;

      row.addEventListener("pointerdown", async (e) =>
      {
        if (
          (e.pointerType === "touch" && !e.isPrimary) ||
          (e.pointerType === "mouse" && e.button !== 0)
        )
        {
          return;
        }

        pressTimer = setTimeout(async () =>
        {
          console.log("🖐️ تم الضغط مطولاً بثبات");
          await handleRowSelection(row);
          // @ts-ignore
          showCustomButtonsDialog();
        }, 500);

        row.addEventListener("pointermove", cancelPressTimer);
      });

      const cancelPressTimer = () =>
      {
        clearTimeout(pressTimer);
        row.removeEventListener("pointermove", cancelPressTimer);
      };

      row.addEventListener("pointerup", cancelPressTimer);
      row.addEventListener("pointerleave", cancelPressTimer);

      // ضع العلم لتجنب إضافة مستمعات مرة أخرى على نفس الصف
      row.setAttribute('data-listeners-added', 'true');
    });

    console.log("🚨 بدأ الاستماع لنقرات الصفوف داخل الجدول.");
  };

  // ===== دوال مساعدة =====

  const handleRowSelection = async (row) =>
  {
    const table = row.closest("table");
    const rows = table.querySelectorAll("tr");

    clearSelection(rows);
    selectRow(row);

    if (isAddAltDiv_)
    {
      await insertAltDivBelowSelected(row);
    }

    await stopWatchingAllInputsAndButtons();
    await startWatchingAllInputsAndButtons(row.id);
    if (haveNumbringColumn)
    {
      await doublClickNumbring(row.id);
    }
  };

  const doublClickNumbring = async (rowId) =>
  {
    const numberingElements = document.querySelectorAll('[id="numbering"]');

    numberingElements.forEach(element =>
    {
      element.addEventListener('dblclick', async (event) =>
      {
        await numberingDialog();
        console.log('تم دوبل كليك على:', event.target, 'معرف الصف:', rowId);
      });
    });
  };


  const numberingDialog = async () =>
  {
    if (selectedRaw)
    {
      if (stop_ === 0)
      {
        stop_ = 1;
        // إرجاع التكبير إلى الحجم الطبيعي بطريقة متوافقة مع جميع المتصفحات
        resetPageZoom();
        // @ts-ignore
        Swal.fire({
          html: `
<div class="container">

  <div class="group">
    <button id="t_1218" class="buttonT"></button>
    <button id="t_1219" class="buttonT"></button>
  </div>

  <div class="group">
    <button id="t_301" class="buttonT"></button>
    <button id="t_302" class="buttonT"></button>
  </div>

</div>
      `,
          customClass: {
            popup: "swal2-centered-popup",
          },
          showCancelButton: false,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          backdrop: true, // خلفية سوداء خفيفة
          position: "center", // وسط الشاشة بالضبط
          didOpen: async () =>
          {

            isTableRun = true;
            // @ts-ignore
            document
              //تابع
              .getElementById("t_1218")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;
                const domRow = document.getElementById(selectedRaw.replace("_", ""));
                if (domRow)
                {
                  const inputNumbering = domRow.querySelector('[id="numbering"]');
                  if (inputNumbering)
                  {
                    // @ts-ignore
                    if (inputNumbering.value == '*' || inputNumbering.value == '-')
                    {
                      // @ts-ignore
                      inputNumbering.value = '';
                    }
                    // @ts-ignore
                    inputNumbering.value = inputNumbering.value + '.';
                  }
                }
                await inputNumbering();
                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
            // @ts-ignore
            document
              //غير تابع
              .getElementById("t_1219")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;

                const domRow = document.getElementById(selectedRaw.replace("_", ""));
                if (domRow)
                {
                  const inputNumbering = domRow.querySelector('[id="numbering"]');
                  if (inputNumbering)
                  {
                    // @ts-ignore
                    let value = inputNumbering.value;
                    if (value == '*' || value == '-')
                    {
                      value = '';
                    }

                    // نحذف أول نقطة فقط من النص
                    // @ts-ignore
                    inputNumbering.value = value.replace('.', '');

                  }
                }
                await inputNumbering();
                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
            // @ts-ignore
            document
              //عنوان
              .getElementById("t_301")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;
                const domRow = document.getElementById(selectedRaw.replace("_", ""));
                if (domRow)
                {
                  const inputNumbering = domRow.querySelector('[id="numbering"]');
                  if (inputNumbering)
                  {
                    // @ts-ignore
                    inputNumbering.value = '*';
                  }
                }
                await inputNumbering();
                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
            // @ts-ignore
            document
              //اجمالي
              .getElementById("t_302")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;
                const domRow = document.getElementById(selectedRaw.replace("_", ""));
                if (domRow)
                {
                  const inputNumbering = domRow.querySelector('[id="numbering"]');
                  if (inputNumbering)
                  {
                    // @ts-ignore
                    inputNumbering.value = '-';
                  }
                }
                await inputNumbering();

                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
            // @ts-ignore
            await setTextAndImage();
          },
        });
      }
    }
  };

  const insertAltDivBelowSelected = async (row) =>
  {
    const existing = document.querySelector(".alt-copy");
    if (existing) existing.remove();

    const original = document.getElementById(altDivId2Copy_);
    if (original)
    {
      const copy = original.cloneNode(true);
      // @ts-ignore
      copy.style.display = "";
      // @ts-ignore
      copy.classList.add("alt-copy");

      const targetId = row.id.replace(/_/g, "");
      const target = document.getElementById(targetId);
      if (target)
      {
        // @ts-ignore
        target.insertAdjacentElement("afterend", copy);
      }
    }
  };

  const clearSelection = async (rows) =>
  {
    rows.forEach((r) => r.classList.remove("selected"));
  };

  const selectRow = async (row) =>
  {
    row.classList.add("selected");
    selectedRaw = row.id;
    const event = new CustomEvent("selectRow", { detail: { Raw: selectedRaw, dataBase: tableId } });
    document.dispatchEvent(event);
    console.log("✅ تم اختيار الصف في احدي الجداول:", 'اسم الصف', selectedRaw, 'اسم القاعدة', tableId);
  };

  //#endregion

  //#region ⚙️ تحميل البيانات عند بدء تشغيل الصفحة

  // عند تحميل الداله نبدأ بتجهيز الجدول وتحميل البيانات ومراقبة المدخلات

  const fristStep = async () =>
  {

    await createTableWithId();
    await loadTableDataAtStartUP(tableId);
  };
  //#endregion

  //#region 🧠 تحميل بيانات الصفوف من قاعدة البيانات IndexedDB

  const loadTableDataAtStartUP = async (tableId) =>
  {
    // فتح قاعدة البيانات بوضع القراءة
    // @ts-ignore
    dbNoUpgrade = await new noUpgrade(tableId);

    // فتح قاعدة البيانات مع إمكانية الترقية
    // @ts-ignore
    dbUpgrade = await new upgrade(tableId);

    // جلب البيانات
    await getAllRowsData();
  };

  // تحميل كل الصفوف المحفوظة في جدول "rows" وعرضها
  const getAllRowsData = async () =>
  {
    const data = await dbNoUpgrade.getAllDataFromTable(rowsTable);
    if (data)
    {
      const sortedRaws = data.sort((a, b) => a.value - b.value);
      console.log("تم جلب الصفوف المحفوظة بالقاعدة مرتبة");

      for (const rawId of sortedRaws)
      {
        console.log(" معرف الصف " + rawId.key + "  ترتيبه  " + rawId.value);
        await createNewRow(rawId.key);
        if (!(await dbNoUpgrade.isTableExist(rawId.key)))
        {
          await dbUpgrade.createKeyTable(rawId.key);
        }

        await getInput(rawId.key);
        if (rawId == sortedRaws[0])
        {
          hideTableHeadInsideElement(rawId.key, showHead);
        }
      }
      if (sortedRaws.length === 0 && isStartWithNew_ === true)
      {
        console.log('لا يوجد صفوف سوف يتم انشاء صف جديد ');
        let row_ = await createNewRow();
        hideTableHeadInsideElement(row_?.id, showHead);
        if (haveNumbringColumn)
        {
          await await inputNumbering();
        }
      }
    } else
    {
      if (isStartWithNew_ === true)
      {
        console.log('لا يوجد صفوف سوف يتم انشاء صف جديد ');
        let row_ = await createNewRow();
        hideTableHeadInsideElement(row_?.id, showHead);
        if (haveNumbringColumn)
        {
          await await inputNumbering();
        }
      }
    }
  };
  const getAllRowsDataOnly = async () =>
  {
    const data = await dbNoUpgrade.getAllDataFromTable(rowsTable);
    if (data)
    {

      for (const rawId of data)
      {

        await getInput(rawId.key);

      }

    }
  };
  //#endregion

  //#region 📝 getInput: جلب القيم المحفوظة من قاعدة البيانات وتحديث الحقول المناسبة

  /**
   * تقوم هذه الدالة بجلب القيم المخزنة لكل الحقول داخل العنصر المحدد باستخدام rowId.
   * 🔹 يتم جلب القيم من قاعدة البيانات (dbNoUpgrade).
   * 🔹 تدعم أنواع الحقول المختلفة:
   *    - النصوص (input[type="text"])
   *    - التاريخ (input[type="date"])
   *    - الوقت (input[type="time"])
   *    - التاريخ والوقت (input[type="datetime-local"])
   *    - أزرار الراديو (input[type="radio"])
   *    - مربعات التحقق (input[type="checkbox"])
   *    - القوائم المنسدلة (select)
   *    - مربعات النص (textarea)
   */
  const getInput = async (rowId) =>
  {
    const containerElement = document.getElementById(rowId);

    if (!containerElement)
    {
      console.warn("❌ لم يتم توفير عنصر الحاوية (getInput).");
      return;
    }

    const inputs = containerElement.querySelectorAll(
      'input[type="text"], input[type="color"],  input[type="url"],input[type="number"], input[type="url"], input[type="date"], input[type="time"], input[type="datetime-local"], input[type="radio"], input[type="checkbox"], select, textarea'
    );

    for (const input of inputs)
    {
      try
      {
        const value = await dbNoUpgrade.keyGet(rowId, input.id);

        // @ts-ignore
        if (input.type === "checkbox")
        {
          // @ts-ignore
          input.checked = value ?? false;
          // @ts-ignore
        } else if (input.type === "radio")
        {
          // @ts-ignore
          if (input.value === value)
          {
            // @ts-ignore
            input.checked = true;
          }
        } else if (input.tagName.toLowerCase() === "select")
        {
          // @ts-ignore
          const option = Array.from(input.options).find(
            (option) => option.value === value
          );
          if (option)
          {
            option.selected = true;
          }
        } else
        {
          // @ts-ignore
          input.value = value ?? ""; // يشمل text, date, time, datetime-local, textarea
        }
      } catch (error)
      {
        console.error(`⚠️ خطأ أثناء جلب قيمة الحقل: ${input.id}`, error);
      }
    }

    console.log(`✅ تم تحميل القيم إلى الحقول داخل: ${rowId}`);
  };



  //#endregion

  //#region ➕ إنشاء صف جديد في الجدول

  // تنشئ صف جديد فارغ أو من قاعدة البيانات حسب ما إذا كان divId مُمررًا
  const createNewRow = async (divId = null, index = null) =>
  {
    // index تستخدم اذا اضفت صف جديد لاعلي او لاسفل
    //divId عند تحميل الصفحة حيث كل شي موجود
    try
    {
      const table = document.getElementById(tableId);

      const row = document.createElement("tr");
      row.className = "rowT";

      const cell = document.createElement("td");
      cell.className = "cellT";

      const original = document.getElementById(divId2Copy_);
      // @ts-ignore
      const copy = original.cloneNode(true);
      // @ts-ignore
      copy.style.display = "";

      if (divId == null)
      {
        // @ts-ignore
        copy.id = CID(IDPattern.MIXED4_TIME);
        // @ts-ignore
        row.id = copy.id + "_";
        if (index == null)
        {

          // @ts-ignore
          if (!(await dbNoUpgrade.isTableExist(rowsTable)))
          {
            await dbUpgrade.createKeyTable(rowsTable);
          }
          // @ts-ignore
          await dbNoUpgrade.keySet(rowsTable, copy.id, rawIndex);
        } else
        {
          if (!(await dbNoUpgrade.isTableExist(rowsTable)))
          {
            await dbUpgrade.createKeyTable(rowsTable);
          }
          // @ts-ignore
          await dbNoUpgrade.keySet(rowsTable, copy.id, index);
        }
        // @ts-ignore
        if (!(await dbNoUpgrade.isTableExist(copy.id)))
        {
          // @ts-ignore
          await dbUpgrade.createKeyTable(copy.id);
        }
      } else
      {
        // @ts-ignore
        copy.id = divId;
        // @ts-ignore
        row.id = copy.id + "_";
      }

      rawIndex++;

      cell.appendChild(copy);
      row.appendChild(cell);
      if (index != null)
      {
        return row;
      }
      // @ts-ignore
      const tbody = table.querySelector("tbody");
      if (!tbody) throw new Error("tbody not found in the table!");
      tbody.appendChild(row);

      await newRawListener();

      console.log(
        divId == null
          ? "➕  تم اضافة صف جديد وتم حفظة في القاعدة"
          : "✚  تم اضافة صف من القاعدة"
      );

      return row;
    } catch (error)
    {
      console.error("Error creating new row:", error);
      return null;
    }
  };
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  const newRawListener = async (params) =>
  {
    await tableRawListener();
    // await startWatchingAllInputsAndButtons();
  };
  //#endregion

  //#region 👁️ التحكم بعرض رأس الجدول
  const hideTableHeadInsideElement = async (elementId, showHead_ = false) =>
  {
    const container = document.getElementById(elementId);
    if (!container)
    {
      console.warn(`❗️العنصر بالمعرف "${elementId}" غير موجود.`);
      return;
    }

    const table = container.querySelector("table");
    if (!table)
    {
      console.warn(`❗️لم يتم العثور على جدول داخل العنصر "${elementId}".`);
      return;
    }

    const thead = table.querySelector("thead");
    if (thead)
    {
      thead.className = showHead_ ? "show-text" : "hide-text";
      console.log(
        `✅ <thead> داخل الجدول في العنصر "${elementId}" ${showHead_ ? "تم إظهاره" : "تم إخفاؤه"
        }.`
      );
    } else
    {
      console.warn(`❗️لا يوجد <thead> داخل الجدول في العنصر "${elementId}".`);
    }
  };

  const hideTableHeadOnlyIfVisible = async (elementId) =>
  {
    const container = document.getElementById(elementId);
    if (!container)
    {
      console.warn(`❗️العنصر بالمعرف "${elementId}" غير موجود.`);
      return;
    }

    const table = container.querySelector("table");
    if (!table)
    {
      console.warn(`❗️لم يتم العثور على جدول داخل العنصر "${elementId}".`);
      return;
    }

    const thead = table.querySelector("thead");
    if (thead)
    {
      const isHidden = thead.classList.contains("hide-text");

      if (!isHidden)
      {
        thead.className = "hide-text";
      }
    }
  };

  //#endregion

  //#region 🎯 مراقبة المدخلات النصية وحفظها تلقائيًا عند التغيير

  let inputListeners = [];

  //#region 🎯 startWatchingAllInputsAndButtons: مراقبة الحقول المختلفة وتحديث القيم في قاعدة البيانات + أزرار الضغط

  /**
   * وظيفة هذه الدالة:
   * 🔹 مراقبة جميع الحقول داخل العنصر المحدد بـ `tableContaner`.
   * 🔹 تشمل الحقول المدعومة:
   *    - النصوص (text)
   *    - التاريخ (date)
   *    - الوقت (time)
   *    - أزرار الراديو (radio)
   *    - مربعات التحقق (checkbox)
   *    - القوائم المنسدلة (select)
   *    - أزرار الضغط (button)
   * 🔹 عند أي تغيير، يتم حفظ القيمة الجديدة في قاعدة البيانات (dbNoUpgrade).
   * 🔹 عند الضغط على زر، يتم طباعة [button.id, parent.id] في الكونسول.
   */
  const clickButtonInRow = async (data) =>
  {
    const event = new CustomEvent("clickButtonInRow", { detail: { kind: data } });
    document.dispatchEvent(event);

  };

  const startWatchingAllInputsAndButtons = async (target) =>
  {
    // الحصول على عنصر الحاوية الذي يحتوي على الجدول
    const containerElement = document.getElementById(target);

    // التحقق من وجود العنصر، إذا لم يكن موجود نخرج من الدالة
    if (!containerElement)
    {
      console.warn("❌ لم يتم توفير عنصر الحاوية (Watching).");
      return;
    }

    // تحديد أنواع الحقول التي نريد مراقبتها
    const selectors = [
      'input[type="number"]', 'input[type="url"]',
      'input[type="text"]', // الحقول النصية
      'input[type="date"]', // حقول التاريخ
      'input[type="time"]', // حقول الوقت
      'input[type="radio"]', // أزرار الراديو
      'input[type="checkbox"]', // مربعات التحقق
      "select", // القوائم المنسدلة
      "button", // أزرار الضغط (جديدة)
      "textarea", // textarea
      'input[type="datetime-local"]', // datetime-local
      'input[type="color"]',
      'input[type="url"]', // حقول الملفات
    ];

    // البحث عن كل الحقول داخل الحاوية باستخدام CSS Selectors
    const inputs = containerElement.querySelectorAll(selectors.join(","));

    // تكرار على كل عنصر ومراقبته
    inputs.forEach((input) =>
    {
      // إن كان العنصر زر button، نضيف له سلوك خاص عند الضغط
      if (input.tagName.toLowerCase() === "button")
      {
        const buttonListener = () =>
        {
          console.log("✅✅ تم تحديد الصف من قبل زر:", target);

          // يمكنك الآن تنفيذ باقي العمليات بعد تحديد الصف
          const buttonId = input.id || "(no id)";

          clickButtonInRow([buttonId, target, tableId]);
        };

        input.addEventListener("click", buttonListener);
        inputListeners.push({ input, listener: buttonListener });
        return; // نخرج لأن الزر لا يحتاج إلى تخزين بيانات
      }

      // باقي الحقول: نراقب قيمها ونحدثها في القاعدة
      // @ts-ignore
      const inputListener = (event) =>
      {
        const selectedTable = selectedRaw.replace("_", "");
        let value;
        // @ts-ignore
        if (input.type === "checkbox")
        {
          // @ts-ignore
          value = input.checked;
          // @ts-ignore
        } else if (input.type === "radio")
        {
          // @ts-ignore
          if (!input.checked) return;
          // @ts-ignore
          value = input.value;
        } else
        {
          // @ts-ignore
          value = input.value;
        }

        // حفظ القيمة في قاعدة البيانات
        dbNoUpgrade.keySet(selectedTable, input.id, value);
      };

      // نوع الحدث المناسب لكل نوع من الحقول
      const eventType =
        // @ts-ignore
        input.type === "radio" ||
          // @ts-ignore
          input.type === "checkbox" ||
          input.tagName.toLowerCase() === "select"
          ? "change"
          : "input";

      // ربط الحدث بالحقل
      input.addEventListener(eventType, inputListener);

      // تخزين المرجع لإيقافه لاحقًا
      inputListeners.push({ input, listener: inputListener });
    });

    // طباعة رسالة توضح أن المراقبة بدأت
    console.log("🚨 بدأ مراقبة الجدول بما يحتوية من جميع الحقول والأزرار داخل: " + tableContaner_);
  };


  //#region 🛑 stopWatchingAllInputsAndButtons: إيقاف مراقبة جميع الحقول والأزرار

  /**
   * هذه الدالة تقوم بإيقاف جميع الـ event listeners التي تمت إضافتها عبر startWatchingAllInputsAndButtons.
   * 🔹 تُستخدم عند عدم الحاجة إلى المراقبة لتقليل استخدام الموارد أو قبل تدمير/إعادة بناء الواجهة.
   * 🔹 تشمل الإزالة من:
   *   - جميع الحقول النصية والاختيارات
   *   - أزرار الضغط
   *   - الحقول ذات الأحداث من نوع input أو change أو click
   */
  const stopWatchingAllInputsAndButtons = async () =>
  {
    inputListeners.forEach((item) =>
    {
      const element = item.input;
      const listener = item.listener;

      // تحديد نوع الحدث المستخدم حسب نوع العنصر
      const tag = element.tagName.toLowerCase();
      const type = element.type;

      let eventType;

      if (tag === "button")
      {
        eventType = "click";
      } else if (type === "radio" || type === "checkbox" || tag === "select")
      {
        eventType = "change";
      } else
      {
        eventType = "input";
      }

      // إزالة الـ event listener من العنصر
      element.removeEventListener(eventType, listener);
    });

    // تفريغ قائمة المراقبة
    inputListeners = [];

    // إعلام المستخدم
    console.log("🛑 تم إيقاف مراقبة جميع الحقول والأزرار بنجاح.");
  };

  //#endregion

  //#endregion

  //#endregion


  //#region العمليات علي الصفوف

  const deleteSelectedRow = async () =>
  {
    if (selectedRaw)
    {
      // البحث عن الصف باستخدام المعرف المختار
      const row = document.getElementById(selectedRaw);

      if (row)
      {
        const row_ = selectedRaw.replace("_", "");
        //حذف جدول بيانات الصف
        // @ts-ignore
        await deleteTable(tableId, row_);

        //حذف الصف من جدول بيانات الصفوف
        await dbNoUpgrade.keyDelete(rowsTable, row_);



        // حذف الصف من الجدول في html
        row.remove();
        console.log(`🟢 تم حذف الصف: ${selectedRaw}`);
        //اعدة ترتيب الصفوف
        // @ts-ignore
        await reorderRowsTable(rowsTable);
      } else
      {
        console.log("❌ الصف المحدد غير موجود.");
      }
      selectedRaw = null;
    } else
    {
      console.log("❌ لم يتم تحديد صف");
    }
  };

  const moveRow = async (up = true) =>
  {
    if (selectedRaw)
    {
      const row_ = selectedRaw.replace("_", "");

      let thisRawIndex = await dbNoUpgrade.keyGet(rowsTable, row_);
      if (up)
      {
        await dbNoUpgrade.keySet(rowsTable, row_, thisRawIndex - 1.1);
      } else
      {
        await dbNoUpgrade.keySet(rowsTable, row_, thisRawIndex + 1.1);
      }
      //اعدة ترتيب الصفوف
      // @ts-ignore
      await reorderRowsTable(rowsTable);

      const row = document.getElementById(selectedRaw);
      if (!row) return; // إذا لم يتم العثور على الصف

      const tbody = row.parentNode;
      if (up)
      {
        const prevRow = row.previousElementSibling;

        // لا يمكن تحريك الصف الأول لأعلى
        if (prevRow && prevRow.tagName === "TR")
        {
          // @ts-ignore
          tbody.insertBefore(row, prevRow);
        }
      } else
      {
        const nextRow = row.nextElementSibling;

        if (nextRow && nextRow.tagName === "TR")
        {
          // @ts-ignore
          tbody.insertBefore(nextRow, row);
        }
      }
      selectedRaw = null;
    } else
    {
      console.log("selectedRaw == null");
    }
  };

  const inserNewRow = async (up = true) =>
  {
    if (selectedRaw)
    {
      const existingRow = document.getElementById(selectedRaw);

      const row_ = selectedRaw.replace("_", "");
      let newRaw;
      let thisRawIndex = await dbNoUpgrade.keyGet(rowsTable, row_);

      if (up)
      {
        // إنشاء صف جديد بترتيب أقل قليلاً
        // @ts-ignore
        newRaw = await createNewRow(null, thisRawIndex - 0.5);
      } else
      {
        // إنشاء صف جديد بترتيب أعلى قليلاً
        newRaw = await createNewRow(null, thisRawIndex + 0.5);
      }



      // @ts-ignore
      const tbody = existingRow.parentNode;

      if (up)
      {
        // إدراج الصف الجديد قبل الصف الموجود
        // @ts-ignore
        tbody.insertBefore(newRaw, existingRow);
      } else
      {
        // إدراج الصف الجديد بعد الصف الموجود
        // @ts-ignore
        if (existingRow.nextSibling)
        {
          // @ts-ignore
          tbody.insertBefore(newRaw, existingRow.nextSibling);
        } else
        {
          // @ts-ignore
          tbody.appendChild(newRaw);
        }
      }


      // إعادة ترتيب الصفوف في قاعدة البيانات
      // @ts-ignore
      await reorderRowsTable(rowsTable);

      await newRawListener();
      selectedRaw = null;
    } else
    {
      console.log("selectedRaw == null");
    }
  };

  const inputNumbering = async () =>
  {
    try
    {
      if (haveNumbringColumn == true)
      {
        const data = await dbNoUpgrade.getAllDataFromTable(rowsTable);

        // 🟢 إذا كانت هناك بيانات موجودة في الجدول
        if (data)
        {
          // ترتيب البيانات حسب القيمة (value)
          const sortedRows = data.sort((a, b) => a.value - b.value);
          if (sortedRows)
          {
            let numbeList = [];
            let parentId = [];
            for (const row of sortedRows)
            {
              const domRow = document.getElementById(row.key);
              if (domRow)
              {
                let outPuts = domRow.querySelector('[id="numbering"]');
                if (outPuts)
                {
                  // @ts-ignore
                  numbeList.push(outPuts.value);
                  //row.key its equal to element id
                  parentId.push(row.key);
                }
              }
            }
            // إعادة الترقيم
            if (numbeList.length > 0)
            {
              // @ts-ignore
              let noAfterRenumber = reNumber(numbeList); // تأكد أن reNumber تعيد مصفوفة مرقمة حسب ترتيب re
              // @ts-ignore
              let index_ = null;
              // تعيين القيم الجديدة
              parentId.forEach((elId, index) =>
              {
                const index_ = noAfterRenumber[index];

                // تحديث البيانات في قاعدة البيانات
                dbNoUpgrade.keySet(elId, 'numbering', index_);

                // تعيين القيمة الجديدة للعناصر في DOM
                const domRow = document.getElementById(elId);
                if (domRow)
                {
                  const inputNumbering = domRow.querySelector('[id="numbering"]');
                  if (inputNumbering)
                  {
                    // @ts-ignore
                    inputNumbering.value = index_;
                  }
                }
              });

            }
          }
        }
      }
    }

    catch (error)
    {
      console.error("❌ خطأ أثناء إعادة ترتيب عمود الترقيم:", error);

    }
  };

  const reorderRowsTable = async (rowsTable) =>
  {
    try
    {
      // 🟡 جلب جميع البيانات من الجدول
      const data = await dbNoUpgrade.getAllDataFromTable(rowsTable);

      // 🟢 إذا كانت هناك بيانات موجودة في الجدول
      if (data)
      {
        // ترتيب البيانات حسب القيمة (value)
        const sortedRows = data.sort((a, b) => a.value - b.value);
        if (sortedRows)
        {
          // 🔵 إعادة الترقيم للقيم في الصفوف
          let newIndex = 0;
          for (const row of sortedRows)
          {
            const { key } = row;

            // إعادة تعيين القيمة الجديدة (ترقيمها من 0 وصاعداً)
            if (row.value !== newIndex)
            {
              await dbNoUpgrade.keySet(rowsTable, key, newIndex);
            }
            if (showHead == true && newIndex == 0)
            {
              hideTableHeadInsideElement(row?.key, showHead);
            }
            if (showHead == true && newIndex != 0)
            {
              hideTableHeadOnlyIfVisible(row?.key);
            }
            newIndex++;
          }


          await inputNumbering();


          if (newIndex == 0)
          {
            if (isStartWithNew_ === true)
            {
              let row_ = await createNewRow();
              hideTableHeadInsideElement(row_?.id, showHead);
              if (haveNumbringColumn)
              {
                await inputNumbering();
              }
            }
          }
        } else
        {
          if (isStartWithNew_ === true)
          {
            let row_ = await createNewRow();
            hideTableHeadInsideElement(row_?.id, showHead);
            if (haveNumbringColumn)
            {
              await await inputNumbering();
            }
          }
        }
      } else
      {
        if (isStartWithNew_ === true)
        {
          let row_ = await createNewRow();
          hideTableHeadInsideElement(row_?.id, showHead);
          if (haveNumbringColumn)
          {
            await await inputNumbering();
          }
        }
      }
    } catch (error)
    {
      console.error("❌ خطأ أثناء إعادة ترتيب rowsTable:", error);
    }
  };

  //#endregion

  let copyId = null;
  const copyRow = async () =>
  {
    if (selectedRaw)
    {
      let tableName = selectedRaw.replace("_", "");
      console.log("اسم الجدول الذي سوف ينسخ" + " " + tableName);
      // @ts-ignore
      let table_x = await exportTableWithSchemaAndData(tableId, tableName);
      // @ts-ignore
      copyId = CID(IDPattern.MIXED4_TIME);
      table_x.table = copyId;
      // @ts-ignore
      await importOrUpdateFromJSON(table_x);
    } else
    {
      console.log("لم يتم اختيار اي من الصفوف");
    }
  };

  const pastRow = async (up = true) =>
  {
    if (selectedRaw)
    {
      if (copyId == null)
      {
        return;
      }
      const existingRow = document.getElementById(selectedRaw);

      const row_ = selectedRaw.replace("_", "");
      let newRaw;
      let thisRawIndex = await dbNoUpgrade.keyGet(rowsTable, row_);

      if (up)
      {
        // إنشاء صف جديد بترتيب أقل قليلاً
        // @ts-ignore
        thisRawIndex = thisRawIndex - 0.5;
      } else
      {
        // إنشاء صف جديد بترتيب أعلى قليلاً
        // @ts-ignore
        thisRawIndex = thisRawIndex + 0.5;
      }

      // @ts-ignore
      if (!(await dbNoUpgrade.isTableExist(rowsTable)))
      {
        await dbUpgrade.createKeyTable(rowsTable);
      }
      // @ts-ignore
      await dbNoUpgrade.keySet(rowsTable, copyId, thisRawIndex);

      // إعادة ترتيب الصفوف في قاعدة البيانات
      await reorderRowsTable(rowsTable);
      newRaw = await createNewRow(copyId);
      // @ts-ignore
      const tbody = existingRow.parentNode;

      if (up)
      {
        // إدراج الصف الجديد قبل الصف الموجود
        // @ts-ignore
        tbody.insertBefore(newRaw, existingRow);
      } else
      {
        // إدراج الصف الجديد بعد الصف الموجود
        // @ts-ignore
        if (existingRow.nextSibling)
        {
          // @ts-ignore
          tbody.insertBefore(newRaw, existingRow.nextSibling);
        } else
        {
          // @ts-ignore
          tbody.appendChild(newRaw);
        }
      }

      await getInput(copyId);
      await newRawListener();
      copyId = null;
      selectedRaw = null;
    } else
    {
      console.log("لم يتم اختيار اي من الصفوف");
    }
  };

  let stop_ = 0;

  let isTableRun = false;//هذا المتغير يشير انا هناك عمليات تجري في الخلفية يجب انتظارها
  const checkProcessRun = async () =>
  {
    return isTableRun;
  };
  // @ts-ignore
  const showCustomButtonsDialog = async () =>
  {
    if (selectedRaw)
    {
      if (stop_ === 0)
      {
        stop_ = 1;
        // إرجاع التكبير إلى الحجم الطبيعي بطريقة متوافقة مع جميع المتصفحات
        resetPageZoom();
        // @ts-ignore
        Swal.fire({
          html: `
       <div class="container">

  <div class="group">
    <button id="btn1" class="buttonT">🔼 تحريك لأعلى</button>
    <button id="btn2" class="buttonT">🔽 تحريك لأسفل</button>
  </div>

  <div class="group">
    <button id="btn3" class="buttonT">➕🔼 صف جديد لأعلى</button>
    <button id="btn4" class="buttonT">➕🔽 صف جديد لأسفل</button>
  </div>

  <div class="group">
    <button id="btn7" class="buttonT">📄 نسخ</button>
    <button id="btn8" class="buttonT">📥🔼 لصق لأعلى</button>
    <button id="btn9" class="buttonT">📥🔽 لصق لأسفل</button>
  </div>

  <div class="group">
    <button id="btn5" class="buttonT">🗑️ حذف صف</button>
  </div>

  <div class="group">
    <button id="btn6" class="buttonT">❎ إلغاء</button>
  </div>

</div>
      `,
          customClass: {
            popup: "swal2-centered-popup",
          },
          showCancelButton: false,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          backdrop: true, // خلفية سوداء خفيفة
          position: "center", // وسط الشاشة بالضبط
          didOpen: async () =>
          {
            isTableRun = true;
            // @ts-ignore
            document
              .getElementById("btn1")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;
                await moveRow();

                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
            // @ts-ignore
            document
              .getElementById("btn2")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;
                await moveRow(false);
                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
            // @ts-ignore
            document
              .getElementById("btn3")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;
                await inserNewRow();
                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
            // @ts-ignore
            document
              .getElementById("btn4")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;
                await inserNewRow(false);
                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
            // @ts-ignore
            document
              .getElementById("btn5")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;
                await deleteSelectedRow();
                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
            // @ts-ignore
            document.getElementById("btn6")?.addEventListener("click", () =>
            {
              // @ts-ignore
              Swal.close();
              isTableRun = false;
              stop_ = 0;
            });
            // @ts-ignore
            document
              .getElementById("btn7")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;
                await copyRow();
                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
            // @ts-ignore
            document
              .getElementById("btn8")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;
                await pastRow();
                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
            // @ts-ignore
            document
              .getElementById("btn9")
              ?.addEventListener("click", async () =>
              {
                isTableRun = true;
                await pastRow(false);
                // @ts-ignore
                Swal.close();
                isTableRun = false;
                stop_ = 0;
              });
          },
        });
      }
    }
  };

  // دالة لضبط التكبير الطبيعي بطريقة تدعم جميع المتصفحات
  const resetPageZoom = async () =>
  {
    const html = document.documentElement;
    const body = document.body;

    // إعادة إعدادات التحويل لأي قيمة طبيعية
    html.style.transform = "scale(1)";
    html.style.transformOrigin = "top left";
    html.style.width = "100%";

    body.style.transform = "scale(1)";
    body.style.transformOrigin = "top left";
    body.style.width = "100%";

    // إذا كانت هناك خاصية zoom مدعومة، نلغيها أيضاً
    html.style.zoom = "100%";
    body.style.zoom = "100%";
  };

  //#region ⏱️ دالة تأخير بسيطة


  // تستخدم لتأخير التنفيذ عند الحاجة (مثلاً أثناء التحميل التدريجي)
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  const Delay = async (ms) =>
  {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  /**
  * تدمير الجدول بالكامل وإعادة تعيين جميع الموارد
  */
  async function destroyTable()
  {
    try
    {
      // 1. تنظيف الواجهة
      const table = document.getElementById(tableId);
      if (table) table.remove();

      document.querySelectorAll('.alt-copy').forEach(el => el.remove());
      document.querySelectorAll('.temp-dialog').forEach(el => el.remove());

      // 2. إزالة جميع Event Listeners
      const cleanEventListeners = () =>
      {
        // Listeners المدخلات
        inputListeners.forEach(({ input, listener }) =>
        {
          const eventType = input.tagName === 'BUTTON' ? 'click' :
            ['checkbox', 'radio'].includes(input.type) ? 'change' : 'input';
          input.removeEventListener(eventType, listener);
        });

        // Listeners الصفوف
        const rows = document.querySelectorAll(`#${tableId} tr`);
        rows.forEach(row =>
        {
          row.removeEventListener('click', handleRowSelection);
          // @ts-ignore
          row.removeEventListener('pointerdown', handlePointerDown);
        });
      };

      cleanEventListeners();


      // 4. إعادة تعيين جميع المتغيرات
      const resetAllVariables = () =>
      {
        // المتغيرات الأساسية
        // @ts-ignore
        tableContaner_ = null;
        // @ts-ignore
        tableId = null;
        // @ts-ignore
        divId2Copy_ = null;
        // @ts-ignore
        altDivId2Copy_ = null;
        // @ts-ignore
        rowsTable = null;
        // @ts-ignore
        showHead = null;

        // متغيرات الحالة
        selectedRaw = null;
        rawIndex = 0;
        // @ts-ignore
        isAddAltDiv_ = null;
        // @ts-ignore
        isStartWithNew_ = null;
        copyId = null;
        stop_ = 0;
        isTableRun = false;

        // متغيرات Listeners
        inputListeners = [];

        // متغيرات مؤقتة
        // @ts-ignore
        pressTimer = null;
        // @ts-ignore
        currentDialog = null;
      };

      resetAllVariables();

      console.log("♻️ تم التنظيف الكامل وإعادة التعيين بنجاح");
      return true;

    } catch (error)
    {
      console.error("❌ فشل في تدمير الجدول:", error);
      throw new Error("فشل في عملية التدمير الكامل");
    }
  }


  //#endregion
  fristStep();
  return {
    // العمليات الأساسية على الصفوف
    createNewRow,
    deleteSelectedRow,
    moveRow,
    inserNewRow,
    copyRow,
    pastRow,
    inputNumbering,
    reorderRowsTable,
    // إدارة البيانات
    getInput,
    getAllRowsData,
    getAllRowsDataOnly,
    // التحكم في العرض
    hideTableHeadInsideElement,
    destroyTable,
    checkProcessRun,
    // إدارة الأحداث
    startWatchingAllInputsAndButtons,
    stopWatchingAllInputsAndButtons,

    // الخصائص
    tableContaner: tableContaner_,
    tableId,
    selectedRaw,
    isTableRun,
    dbNoUpgrade,
    rowsTable,
  };

}