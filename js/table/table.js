//#region 🧩 إعداد المتغيرات العامة والتهيئة

// المعرف الخاص بمكان إنشاء الجدول داخل الصفحة
let tableContaner = "table1";

// خيار عرض رأس الجدول (true أو false أو فارغ)
let showHead_ = "";

// معرف الجدول الذي سيتم إنشاؤه وهو ايضا اسم قاعدة البيانات
let tableId = "t1";

// معرف العنصر الذي يحتوي على النموذج الأساسي للصف (div جاهز يُنسخ منه)
let divId2Copy = "RawTable1";

// قواعد البيانات (قراءة فقط / مع إمكانية الترقية)
let dbNoUpgrade = null;
let dbUpgrade = null;

// اسم الجدول المستخدم لحفظ بيانات الصفوف
let rowsTable = 'rows';

// معرف الصف المحدد حاليًا
let selectedRaw = null;

// عدد الصفوف المضافة، يُستخدم لترتيبها
let rawIndex = 0;

// عند تفعيل هذا الخيار، يتم إضافة div تحت الصف عند النقر عليه
let addAltDiv = true;

//#endregion

//#region 🏗️ إنشاء الجدول داخل عنصر محدد

// تنشئ جدول فارغ داخل عنصر باستخدام tableId المحدد مسبقًا
async function createTableWithId ()
{
  const contaner = document.getElementById( tableContaner );
  const table = document.createElement( 'table' );
  table.id = tableId;

  const tbody = document.createElement( 'tbody' );
  table.appendChild( tbody );

  // @ts-ignore
  contaner.appendChild( table );
}

//#endregion

//#region 🖱️ الاستماع لاختيار صف من الجدول (تحديده وعرض تفاصيله)





async function tableRawListener() {
  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = table.querySelectorAll('tr');

  rows.forEach(row => {
    row.addEventListener('click', async () => {
      await handleRowSelection(row);
    });

    let pressTimer;

    row.addEventListener('pointerdown', (e) => {
      // ✅ تجاهل الأحداث العارضة
      if (
        (e.pointerType === 'touch' && !e.isPrimary) || 
        (e.pointerType === 'mouse' && e.button !== 0)
      ) {
        return;
      }

      pressTimer = setTimeout(async () => {
        console.log("🖐️ تم الضغط مطولاً بثبات");
        await handleRowSelection(row);
        showCustomButtonsDialog();
      }, 500);

      // ✅ إضافة مراقبة للحركة لإلغاء المؤقت عند السحب
      row.addEventListener('pointermove', cancelPressTimer);
    });

    row.addEventListener('pointerup', cancelPressTimer);
    row.addEventListener('pointerleave', cancelPressTimer);

    function cancelPressTimer() {
      clearTimeout(pressTimer);
      row.removeEventListener('pointermove', cancelPressTimer);
    }
  });

  console.log("🚨 بدأ الاستماع لنقرات الصفوف داخل الجدول.");
}








// ===== دوال مساعدة =====

async function handleRowSelection(row) {
  const table = row.closest('table');
  const rows = table.querySelectorAll('tr');

  clearSelection(rows);
  selectRow(row);

  if (addAltDiv) {
    await insertAltDivBelowSelected(row);
  }

  await stopWatchingAllInputsAndButtons();
  await startWatchingAllInputsAndButtons(row.id);
}

function clearSelection(rows) {
  rows.forEach(r => r.classList.remove('selected'));
}

function selectRow(row) {
  row.classList.add('selected');
  selectedRaw = row.id;
  console.log('✅ تم اختيار الصف:', selectedRaw);
}

async function insertAltDivBelowSelected(row) {
  const existing = document.querySelector('.alt-copy');
  if (existing) existing.remove();

  const original = document.getElementById('RawAltTable1');
  if (original) {
    const copy = original.cloneNode(true);
    // @ts-ignore
    copy.style.display = '';
    // @ts-ignore
    copy.classList.add('alt-copy');

    const targetId = row.id.replace(/_/g, '');
    const target = document.getElementById(targetId);
    if (target) {
      // @ts-ignore
      target.insertAdjacentElement("afterend", copy);
    }
  }
}






// ===== دوال مساعدة =====

function clearSelection(rows) {
  rows.forEach(r => r.classList.remove('selected'));
}

function selectRow(row) {
  row.classList.add('selected');
  selectedRaw = row.id;
  console.log('✅ تم اختيار الصف:', selectedRaw);
}

async function insertAltDivBelowSelected(row) {
  const existing = document.querySelector('.alt-copy');
  if (existing) existing.remove();

  const original = document.getElementById('RawAltTable1');
  if (original) {
    const copy = original.cloneNode(true);
    // @ts-ignore
    copy.style.display = '';
    // @ts-ignore
    copy.classList.add('alt-copy');

    const targetId = row.id.replace('_', '');
    const target = document.getElementById(targetId);
    if (target) {
      // @ts-ignore
      target.insertAdjacentElement("afterend", copy);
    }
  }
}


//#endregion

//#region ⚙️ تحميل البيانات عند بدء تشغيل الصفحة

// عند تحميل الصفحة نبدأ بتجهيز الجدول وتحميل البيانات ومراقبة المدخلات
document.addEventListener( "DOMContentLoaded", async () =>
{
  await createTableWithId();
  await loadTableDataAtStartUP( tableId );

} );

//#endregion

//#region 🧠 تحميل بيانات الصفوف من قاعدة البيانات IndexedDB

async function loadTableDataAtStartUP ( tableId )
{
  // فتح قاعدة البيانات بوضع القراءة
  dbNoUpgrade = await noUpgrade( tableId );

  // فتح قاعدة البيانات مع إمكانية الترقية
  dbUpgrade = await upgrade( tableId );

  // جلب البيانات
  await getAllRowsData();
}

// تحميل كل الصفوف المحفوظة في جدول "rows" وعرضها
async function getAllRowsData ()
{
  const data = await dbNoUpgrade.getAllDataFromTable( rowsTable );
  if ( data )
  {
    const sortedRaws = data.sort( ( a, b ) => a.value - b.value );
    console.log( "الصفوف المحفوظة بالقاعدة مرتبة" );

    for ( const rawId of sortedRaws )
    {
      console.log( " معرف الصف " + rawId.key + "  ترتيبه  " + rawId.value );
      await createNewRow( rawId.key );
      if ( ! await dbNoUpgrade.isTableExist( rawId.key ) )
      {
        await dbUpgrade.createKeyTable( rawId.key );
      }

      await getInput( rawId.key );
    }
  }
}

//#endregion

//#region 📝 getInput: جلب القيم المحفوظة من قاعدة البيانات وتحديث الحقول المناسبة

/**
 * تقوم هذه الدالة بجلب القيم المخزنة لكل الحقول داخل العنصر المحدد باستخدام rowId.
 * 🔹 يتم جلب القيم من قاعدة البيانات (dbNoUpgrade).
 * 🔹 تدعم أنواع الحقول المختلفة:
 *    - النصوص (input[type="text"])
 *    - التاريخ (input[type="date"])
 *    - الوقت (input[type="time"])
 *    - أزرار الراديو (input[type="radio"])
 *    - مربعات التحقق (input[type="checkbox"])
 *    - القوائم المنسدلة (select)
 * 🔹 يتم تحديث القيمة المناسبة في الحقل (مربعات التحقق تتعامل مع `checked`، وأزرار الراديو مع `value`، إلخ).
 */
async function getInput ( rowId )
{
  const containerElement = document.getElementById( rowId );

  // التحقق من وجود العنصر
  if ( !containerElement )
  {
    console.error( "❌ لم يتم توفير عنصر الحاوية (getInput)." );
    return;
  }

  // البحث عن الحقول التي نريد مراقبتها
  const inputs = containerElement.querySelectorAll( 'input[type="text"], input[type="date"], input[type="time"], input[type="radio"], input[type="checkbox"], select' );

  // تكرار على الحقول وجلب قيمها من قاعدة البيانات
  for ( const input of inputs )
  {
    try
    {
      const value = await dbNoUpgrade.keyGet( rowId, input.id );

      // التعامل مع مختلف أنواع الحقول
      // @ts-ignore
      if ( input.type === 'checkbox' )
      {
        // @ts-ignore
        input.checked = value ?? false; // القيم هنا تكون true/false
        // @ts-ignore
      } else if ( input.type === 'radio' )
      {
        // @ts-ignore
        if ( input.value === value )
        {
          // @ts-ignore
          input.checked = true; // تفعيل الزر الذي يطابق القيمة المخزنة
        }
      } else if ( input.tagName.toLowerCase() === 'select' )
      {
        // @ts-ignore
        const option = Array.from( input.options ).find( option => option.value === value );
        if ( option )
        {
          option.selected = true; // تحديد العنصر الذي يطابق القيمة المخزنة
        }
      } else
      {
        // @ts-ignore
        input.value = value ?? ''; // بالنسبة للنصوص أو التاريخ أو الوقت
      }
    } catch ( error )
    {
      console.error( `⚠️ خطأ أثناء جلب قيمة الحقل: ${ input.id }`, error );
    }
  }

  // طباعة إشعار عند اكتمال تحميل القيم
  console.log( `✅ تم تحميل القيم إلى الحقول داخل: ${ rowId }` );
}

//#endregion

//#region ➕ إنشاء صف جديد في الجدول

// تنشئ صف جديد فارغ أو من قاعدة البيانات حسب ما إذا كان divId مُمررًا
async function createNewRow ( divId = null, index = null )
{
  // index تستخدم اذا اضفت صف جديد لاعلي او لاسفل
//divId عند تحميل الصفحة حيث كل شي موجود
  try
  {
    const table = document.getElementById( 't1' );

    const row = document.createElement( "tr" );
    row.className = "rowT";

    const cell = document.createElement( "td" );
    cell.className = "cellT";

    const original = document.getElementById( divId2Copy );
    // @ts-ignore
    const copy = original.cloneNode( true );
    // @ts-ignore
    copy.style.display = "";

    if ( divId == null )
    {
      // @ts-ignore
      copy.id = CID( IDPattern.MIXED4_TIME, tableId );
      // @ts-ignore
      row.id = copy.id + '_';
      if ( index == null )
      {
        // @ts-ignore
        if ( !await dbNoUpgrade.isTableExist( rowsTable ) )
        {
          await dbUpgrade.createKeyTable( rowsTable );
        }
        // @ts-ignore
        await dbNoUpgrade.keySet( rowsTable, copy.id, rawIndex );
      } else
      {
        if ( !await dbNoUpgrade.isTableExist( rowsTable ) )
        {
          await dbUpgrade.createKeyTable( rowsTable );
        }
        // @ts-ignore
        await dbNoUpgrade.keySet( rowsTable, copy.id, index );

      }
      // @ts-ignore
      if ( ! await dbNoUpgrade.isTableExist( copy.id ) )
      {
        // @ts-ignore
        await dbUpgrade.createKeyTable( copy.id );
      }
    } else
    {
      // @ts-ignore
      copy.id = divId;
      // @ts-ignore
      row.id = copy.id + '_';
    }
  
      rawIndex++;
    

    cell.appendChild( copy );
    row.appendChild( cell );
    if ( index != null )
    {
      return row;
    }
    // @ts-ignore
    const tbody = table.querySelector( 'tbody' );
    if ( !tbody ) throw new Error( "tbody not found in the table!" );
    tbody.appendChild( row );

    await newRawListener();

    console.log( divId == null ? "➕  تم اضافة صف جديد وتم حفظة في القاعدة" : "✚  تم اضافة صف من القاعدة" );

    return row;

  } catch ( error )
  {
    console.error( "Error creating new row:", error );
    return null;
  }
}
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
async function newRawListener ( params )
{
  await tableRawListener();
  // await startWatchingAllInputsAndButtons();
}
//#endregion

//#region 👁️ التحكم بعرض رأس الجدول

function showHeadForElement ( tableId, show = null )
{
  const table = document.getElementById( tableId );
  // @ts-ignore
  const thead = table.querySelector( "thead" );

  if ( show === true )
  {
    // @ts-ignore
    thead.style.display = "";
  } else if ( show === false )
  {
    // @ts-ignore
    thead.style.display = "none";
  } else
  {
    // @ts-ignore
    thead.style.display = thead.style.display === "none" ? "" : "none";
  }
}

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
function clickButtonInRow ( data )
{
  const event = new CustomEvent( 'clickButtonInRow', { detail: { kind: data } } );
  document.dispatchEvent( event );
}
async function startWatchingAllInputsAndButtons ( target )
{
  // الحصول على عنصر الحاوية الذي يحتوي على الجدول
  const containerElement = document.getElementById( target );

  // التحقق من وجود العنصر، إذا لم يكن موجود نخرج من الدالة
  if ( !containerElement )
  {
    console.error( "❌ لم يتم توفير عنصر الحاوية (Watching)." );
    return;
  }

  // تحديد أنواع الحقول التي نريد مراقبتها
  const selectors = [
    'input[type="text"]',     // الحقول النصية
    'input[type="date"]',     // حقول التاريخ
    'input[type="time"]',     // حقول الوقت
    'input[type="radio"]',    // أزرار الراديو
    'input[type="checkbox"]', // مربعات التحقق
    'select',                 // القوائم المنسدلة
    'button'                  // أزرار الضغط (جديدة)
  ];

  // البحث عن كل الحقول داخل الحاوية باستخدام CSS Selectors
  const inputs = containerElement.querySelectorAll( selectors.join( ',' ) );

  // تكرار على كل عنصر ومراقبته
  inputs.forEach( input =>
  {
    // إن كان العنصر زر button، نضيف له سلوك خاص عند الضغط
    if ( input.tagName.toLowerCase() === 'button' )
    {
      const buttonListener = () =>
      {

        console.log( "✅✅ تم تحديد الصف من قبل زر:", target );

        // يمكنك الآن تنفيذ باقي العمليات بعد تحديد الصف
        const buttonId = input.id || '(no id)';

        clickButtonInRow( [ buttonId, target ] );

      };

      input.addEventListener( 'click', buttonListener );
      inputListeners.push( { input, listener: buttonListener } );
      return; // نخرج لأن الزر لا يحتاج إلى تخزين بيانات
    }


    // باقي الحقول: نراقب قيمها ونحدثها في القاعدة
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    const inputListener = ( event ) =>
    {
      const selectedTable = selectedRaw.replace( '_', '' );
      let value;
      // استخراج القيمة بشكل صحيح حسب نوع الحقل
      // @ts-ignore
      if ( input.type === "checkbox" )
      {
        // @ts-ignore
        value = input.checked;
        // @ts-ignore
      } else if ( input.type === "radio" )
      {
        // @ts-ignore
        if ( !input.checked ) return;
        // @ts-ignore
        value = input.value;
      } else
      {
        // @ts-ignore
        value = input.value;
      }

      // حفظ القيمة في قاعدة البيانات
      dbNoUpgrade.keySet( selectedTable, input.id, value );
    };

    // نوع الحدث المناسب لكل نوع من الحقول
    const eventType =
      // @ts-ignore
      ( input.type === 'radio' || input.type === 'checkbox' || input.tagName.toLowerCase() === 'select' )
        ? 'change'
        : 'input';

    // ربط الحدث بالحقل
    input.addEventListener( eventType, inputListener );

    // تخزين المرجع لإيقافه لاحقًا
    inputListeners.push( { input, listener: inputListener } );
  } );

  // طباعة رسالة توضح أن المراقبة بدأت
  console.log( "🚨 بدأ مراقبة جميع الحقول والأزرار داخل: " + tableContaner );
}
//#region 🛑 stopWatchingAllInputsAndButtons: إيقاف مراقبة جميع الحقول والأزرار

/**
 * هذه الدالة تقوم بإيقاف جميع الـ event listeners التي تمت إضافتها عبر startWatchingAllInputsAndButtons.
 * 🔹 تُستخدم عند عدم الحاجة إلى المراقبة لتقليل استخدام الموارد أو قبل تدمير/إعادة بناء الواجهة.
 * 🔹 تشمل الإزالة من:
 *   - جميع الحقول النصية والاختيارات
 *   - أزرار الضغط
 *   - الحقول ذات الأحداث من نوع input أو change أو click
 */
function stopWatchingAllInputsAndButtons ()
{
  inputListeners.forEach( item =>
  {
    const element = item.input;
    const listener = item.listener;

    // تحديد نوع الحدث المستخدم حسب نوع العنصر
    const tag = element.tagName.toLowerCase();
    const type = element.type;

    let eventType;

    if ( tag === 'button' )
    {
      eventType = 'click';
    } else if ( type === 'radio' || type === 'checkbox' || tag === 'select' )
    {
      eventType = 'change';
    } else
    {
      eventType = 'input';
    }

    // إزالة الـ event listener من العنصر
    element.removeEventListener( eventType, listener );
  } );

  // تفريغ قائمة المراقبة
  inputListeners = [];

  // إعلام المستخدم
  console.log( "🛑 تم إيقاف مراقبة جميع الحقول والأزرار بنجاح." );
}

//#endregion

//#endregion





//#endregion

//#region العمليات علي الصفوف

async function deleteSelectedRow ()
{
  if ( selectedRaw )
  {
    // البحث عن الصف باستخدام المعرف المختار
    const row = document.getElementById( selectedRaw );

    if ( row )
    {

      const row_ = selectedRaw.replace( '_', '' );
      //حذف جدول بيانات الصف
      await deleteTable( tableId, row_ );

      //حذف الصف من جدول بيانات الصفوف
      await dbNoUpgrade.keyDelete( rowsTable, row_ );

      //اعدة ترتيب الصفوف
      await reorderRowsTable( rowsTable );

      // حذف الصف من الجدول في html
      row.remove();
      console.log( `🟢 تم حذف الصف: ${ selectedRaw }` );
    } else
    {
      console.log( "❌ الصف المحدد غير موجود." );
    }
  } else
  {
    console.log( "❌ لم يتم تحديد صف" );
  }


}

async function moveRow ( up = true )
{

  const row_ = selectedRaw.replace( '_', '' );

  let thisRawIndex = await dbNoUpgrade.keyGet( rowsTable, row_ );
  if ( up )
  {
    await dbNoUpgrade.keySet( rowsTable, row_, thisRawIndex - 1.1 );
  } else
  {
    await dbNoUpgrade.keySet( rowsTable, row_, thisRawIndex + 1.1 );

  }
  //اعدة ترتيب الصفوف
  await reorderRowsTable( rowsTable );

  const row = document.getElementById( selectedRaw );
  if ( !row ) return; // إذا لم يتم العثور على الصف

  const tbody = row.parentNode;
  if ( up )
  {
    const prevRow = row.previousElementSibling;

    // لا يمكن تحريك الصف الأول لأعلى
    if ( prevRow && prevRow.tagName === 'TR' )
    {
      // @ts-ignore
      tbody.insertBefore( row, prevRow );
    }
  } else
  {
    const nextRow = row.nextElementSibling;

    if ( nextRow && nextRow.tagName === 'TR' )
    {
      // @ts-ignore
      tbody.insertBefore( nextRow, row );
    }
  }
}

async function inserNewRow ( up = true )
{
  const existingRow = document.getElementById( selectedRaw );

  const row_ = selectedRaw.replace( '_', '' );
  let newRaw;
  let thisRawIndex = await dbNoUpgrade.keyGet( rowsTable, row_ );

  if ( up )
  {
    // إنشاء صف جديد بترتيب أقل قليلاً
    // @ts-ignore
    newRaw = await createNewRow( null, thisRawIndex - 0.5 );
  } else
  {
    // إنشاء صف جديد بترتيب أعلى قليلاً
    newRaw = await createNewRow( null, thisRawIndex + 0.5 );
  }

  // إعادة ترتيب الصفوف في قاعدة البيانات
  await reorderRowsTable( rowsTable );

  // @ts-ignore
  const tbody = existingRow.parentNode;

  if ( up )
  {
    // إدراج الصف الجديد قبل الصف الموجود
    // @ts-ignore
    tbody.insertBefore( newRaw, existingRow );
  } else
  {
    // إدراج الصف الجديد بعد الصف الموجود
    // @ts-ignore
    if ( existingRow.nextSibling )
    {
      // @ts-ignore
      tbody.insertBefore( newRaw, existingRow.nextSibling );
    } else
    {
      // @ts-ignore
      tbody.appendChild( newRaw );
    }
  }

  await newRawListener();
}



const reorderRowsTable = async ( rowsTable ) =>
{
  try
  {
    // 🟡 جلب جميع البيانات من الجدول
    const data = await dbNoUpgrade.getAllDataFromTable( rowsTable );

    // 🟢 إذا كانت هناك بيانات موجودة في الجدول
    if ( data )
    {
      // ترتيب البيانات حسب القيمة (value)
      const sortedRows = data.sort( ( a, b ) => a.value - b.value );
      console.log( "الصفوف المحفوظة بالقاعدة مرتبة" );

      // 🔵 إعادة الترقيم للقيم في الصفوف
      let newIndex = 0;
      for ( const row of sortedRows )
      {
        const { key } = row;

        // إعادة تعيين القيمة الجديدة (ترقيمها من 0 وصاعداً)
        if ( row.value !== newIndex )
        {
          await dbNoUpgrade.keySet( rowsTable, key, newIndex );
          console.log( `🔄 إعادة ترقيم: ${ key } => ${ newIndex }` );
        }

        newIndex++;
      }

      console.log( "✅ تم إعادة ترتيب rowsTable بنجاح" );
    } else
    {
      console.log( "⚠️ لا توجد بيانات لإعادة ترتيبها" );
    }
  } catch ( error )
  {
    console.error( "❌ خطأ أثناء إعادة ترتيب rowsTable:", error );
  }
};


//#endregion

//#region الاحداث


//#endregion
let copyId=null;
async function copyRow()
{
  let table_=await exportTableWithSchemaAndData(tableId,selectedRaw.replace('_',''))
   // @ts-ignore
   copyId=CID(IDPattern.MIXED4_TIME, tableId );
  table_.table = copyId;
//let jsonData=JSON.stringify( table_, null, 2 );
await importOrUpdateFromJSON(table_);
}
async function pastRow ( up = true )
{
  if(   copyId==null){return;}
  const existingRow = document.getElementById( selectedRaw );

  const row_ = selectedRaw.replace( '_', '' );
  let newRaw;
  let thisRawIndex = await dbNoUpgrade.keyGet( rowsTable, row_ );

  if ( up )
  {
    // إنشاء صف جديد بترتيب أقل قليلاً
    // @ts-ignore
    thisRawIndex= thisRawIndex - 0.5 ;
  } else
  {
    // إنشاء صف جديد بترتيب أعلى قليلاً
       // @ts-ignore
       thisRawIndex= thisRawIndex + 0.5 ;
  }


// @ts-ignore
if ( !await dbNoUpgrade.isTableExist( rowsTable ) )
  {
    await dbUpgrade.createKeyTable( rowsTable );
  }
  // @ts-ignore
  await dbNoUpgrade.keySet( rowsTable, copyId, thisRawIndex );


  // إعادة ترتيب الصفوف في قاعدة البيانات
  await reorderRowsTable( rowsTable );
  newRaw = await createNewRow( copyId);
  // @ts-ignore
  const tbody = existingRow.parentNode;

  if ( up )
  {
    // إدراج الصف الجديد قبل الصف الموجود
    // @ts-ignore
    tbody.insertBefore( newRaw, existingRow );
  } else
  {
    // إدراج الصف الجديد بعد الصف الموجود
    // @ts-ignore
    if ( existingRow.nextSibling )
    {
      // @ts-ignore
      tbody.insertBefore( newRaw, existingRow.nextSibling );
    } else
    {
      // @ts-ignore
      tbody.appendChild( newRaw );
    }
  }
  
  await getInput( copyId );
  await newRawListener();
  copyId=null;
}
let stop_ = 0;
async function showCustomButtonsDialog() {
  if (stop_ === 0) {
    stop_ = 1;
    // @ts-ignore
    Swal.fire({
      html: `
        <div style="text-align:center;">
          <button id="btn1" class="buttonT">تحريك لأعلى</button>
          <br><br>
          <button id="btn2" class="buttonT">تحريك لأسفل</button>
          <br><br>
          <button id="btn3" class="buttonT">صف جديد لأعلى</button>
          <br><br>
          <button id="btn4" class="buttonT">صف جديد لأسفل</button>
          <br><br>
          <button id="btn5" class="buttonT">حذف صف</button>
          <br><br>
          <button id="btn6" class="buttonT">إلغاء</button>
           <br><br>
          <button id="btn7" class="buttonT">نسخ</button>
           <br><br>
          <button id="btn8" class="buttonT">لصق لاعلي</button>
           <br><br>
          <button id="btn9" class="buttonT">لصق لاسفل</button>
          
        </div>
      `,
      customClass: {
        popup: 'swal2-centered-popup'
      },
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: true, // خلفية سوداء خفيفة
      position: 'center', // وسط الشاشة بالضبط
      didOpen: () => {
        // @ts-ignore
        document.getElementById('btn1')?.addEventListener('click', async () => { await moveRow(); Swal.close(); stop_ = 0; });
        // @ts-ignore
        document.getElementById('btn2')?.addEventListener('click', async () => { await moveRow(false); Swal.close(); stop_ = 0; });
        // @ts-ignore
        document.getElementById('btn3')?.addEventListener('click', async () => { await inserNewRow(); Swal.close(); stop_ = 0; });
        // @ts-ignore
        document.getElementById('btn4')?.addEventListener('click', async () => { await inserNewRow(false); Swal.close(); stop_ = 0; });
        // @ts-ignore
        document.getElementById('btn5')?.addEventListener('click', async () => { await deleteSelectedRow(); Swal.close(); stop_ = 0; });
        // @ts-ignore
        document.getElementById('btn6')?.addEventListener('click', () => { Swal.close(); stop_ = 0; });
         // @ts-ignore
         document.getElementById('btn7')?.addEventListener('click', async () => { await copyRow(); Swal.close(); stop_ = 0; });
         // @ts-ignore
         document.getElementById('btn8')?.addEventListener('click', async () => { await pastRow(); Swal.close(); stop_ = 0; });
         // @ts-ignore
         document.getElementById('btn9')?.addEventListener('click', async () => { await pastRow(false); Swal.close(); stop_ = 0; });
   
   
      }
    });
  }
}

//#region ⏱️ دالة تأخير بسيطة

// تستخدم لتأخير التنفيذ عند الحاجة (مثلاً أثناء التحميل التدريجي)
async function Delay ( ms )
{
  return new Promise( resolve => setTimeout( resolve, ms ) );
}

//#endregion
