//this is tools.js file

//#region  متغيرات عامة

//#region متغيرات تكلفة البند
let pricing_Table = null;
let selectedSections = null;
//#endregion

//#region متغيرات البند المختار
let selectedPandId = null;
//#endregion

//#region متغيرات  الدفعات

let dbNoUp_PandBill = null;
let dbNoUp_PandBillPrevious = null;
let dataBaseIdForPandBill = null;
let dataBaseIdForPandBillPrevious = null;
let PandBillTable = null;
let pandPrice = "37";
let lastBill = 0;
let buttonShowIndexSet = new Set(); // لتفادي التكرار

//#endregion

//#endregion

// دالة غير متزامنة تنتظر ظهور عنصر معين في الصفحة بناءً على محدد (Selector)
async function waitForElement ( selector )
{
  return new Promise( ( resolve ) =>
  { // تُعيد الدالة Promise لكي تتمكن من انتظار ظهور العنصر
    // التحقق مما إذا كان العنصر موجودًا بالفعل في الصفحة
    if ( document.querySelector( selector ) )
    {
      // إذا كان موجودًا، نعيده مباشرة وننهي الـ Promise
      return resolve( document.querySelector( selector ) );
    }

    // إذا لم يكن العنصر موجودًا، نستخدم MutationObserver لمراقبة تغييرات DOM
    const observer = new MutationObserver( () =>
    {
      // في كل مرة يحدث فيها تغيير في DOM، نتحقق مجددًا من وجود العنصر
      if ( document.querySelector( selector ) )
      {
        observer.disconnect(); // نوقف المراقبة بمجرد العثور على العنصر
        resolve( document.querySelector( selector ) ); // نُرجع العنصر وننهي الـ Promise
      }
    } );

    // نبدأ مراقبة تغييرات DOM في body، ونراقب كل العناصر الفرعية (subtree)
    observer.observe( document.body, {
      childList: true, // نراقب التغييرات في الأطفال (إضافة/إزالة عناصر)
      subtree: true    // نراقب أيضًا التغييرات داخل العناصر الفرعية
    } );
  } );
}




// دالة التحقق من صحه المعرف اول اربع حروف ثم ارقام
function isValidIdFormat ( x )
{
  return /^[a-zA-Z]{4}\d+$/.test( x );
}
function parseDateTime ( str )
{
  const t = new Date( str );
  // @ts-ignore
  if ( isNaN( t ) )
  {
    console.warn( "⚠️ التاريخ غير صالح:", str );
    return null;
  }
  return t.getTime(); // عدد الميلي ثانية
}
function formatDuration ( ms )
{
  if ( typeof ms !== "number" || isNaN( ms ) ) return "مدة غير صالحة";

  const totalMinutes = Math.floor( Math.abs( ms ) / 60000 );
  const days = Math.floor( totalMinutes / 1440 ); // 1440 دقيقة في اليوم
  const hours = Math.floor( ( totalMinutes % 1440 ) / 60 );
  const minutes = totalMinutes % 60;

  let parts = [];
  //211 day
  // 1011 hour
  // 1040 minute

  // @ts-ignore
  if ( days > 0 ) parts.push( `${ days } ` + getLang( 211 ) );
  // @ts-ignore
  if ( hours > 0 ) parts.push( `${ hours } ` + getLang( 1011 ) );
  // @ts-ignore
  if ( minutes > 0 || parts.length === 0 ) parts.push( `${ minutes } ` + getLang( 1040 ) );

  return parts.join( " " );
}
function isDefined ( variableName )
{
  try
  {
    const value = window[ variableName ];
    // @ts-ignore
    return value !== undefined && value !== null && value !== '';
  } catch ( error )
  {
    console.warn( `⚠️ isDefined: خطأ أثناء فحص ${ variableName }`, error );
    return false;
  }
}

function isNumeric ( value )
{
  if ( value === null || value === undefined ) return false;

  const str = String( value ).trim();
  if ( str === '' ) return false;

  // @ts-ignore
  return !isNaN( str ) && !isNaN( parseFloat( str ) );
}

//#region دوال توليد المعرفات الفريدة 
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
const generateRandom = ( charset, count ) =>
{
  let result = "";
  const charsetLength = charset.length;

  for ( let i = 0; i < count; i++ )
  {
    result += charset[ Math.floor( Math.random() * charsetLength ) ];
  }
  return result;
};

// توليد معرف فريد
function CID ( pattern = IDPattern.MIXED2_NUMS2, fixed = "" )
{
  const timestamp = Date.now();
  const smallChars = "abcdefghijklmnopqrstuvwxyz";
  const mixedChars = "vPzTyXnRaEhAsWgDpMqVeFoUjYdGcQtOuNfBxZmSlKbCrJiIwHkL";
  const digits = "0123456789";

  const patternGenerators = {
    [ IDPattern.CHAR1_TIME ]: () => generateRandom( mixedChars, 1 ) + timestamp,
    [ IDPattern.CHARS4_TIME ]: () => generateRandom( smallChars, 4 ) + timestamp,
    [ IDPattern.MIXED4_TIME ]: () => generateRandom( mixedChars, 4 ) + timestamp,
    [ IDPattern.CHARS4_NUMS4 ]: () =>
      generateRandom( smallChars, 4 ) + generateRandom( digits, 4 ),
    [ IDPattern.MIXED4_NUMS4 ]: () =>
      generateRandom( mixedChars, 4 ) + generateRandom( digits, 4 ),
    [ IDPattern.CHARS2_NUMS2 ]: () =>
      generateRandom( smallChars, 2 ) + generateRandom( digits, 2 ),
    [ IDPattern.MIXED2_NUMS2 ]: () =>
      generateRandom( mixedChars, 2 ) + generateRandom( digits, 2 ),
  };

  if ( !patternGenerators[ pattern ] )
  {
    throw new Error( "نمط ID غير صالح" );
  }

  const generatedID = fixed + patternGenerators[ pattern ]();
  return generatedID;
}

/*
  CID(IDPattern.MIXED2_NUMS2,"hgh"); // مثال على الاستخدام
  CID(IDPattern.CHARS4_TIME); // مثال على الاستخدام
  CID(IDPattern.MIXED4_NUMS4); // مثال على الاستخدام 
  CID(IDPattern.CHAR1_TIME); // مثال على الاستخدام
  CID(IDPattern.MIXED2_NUMS2); // مثال على الاستخدام
  */
//#endregion

//#region دوال حفظ واسترجاع البيانات
async function watchingAllInputs2IndexDB ( target, dbNoUpgrade, tableName )
{
  q( '🟡 watchingAllInputs2IndexDB -> ' + tableName );

  // أنواع الحقول التي سيتم مراقبتها
  const inputSelectors = [
    'input[type="text"]',
    'input[type="date"]',
    'input[type="time"]',
    'input[type="radio"]',
    'input[type="checkbox"]',
    'input[type="number"]',
    'input[type="url"]',
    'input[type="email"]',
    'input[type="password"]',
    'textarea',
    'select'
  ];

  const containerElement = document.getElementById( target );

  if ( !containerElement )
  {
    console.error( "❌ لم يتم العثور على العنصر المستهدف (watchingAllInputs2IndexDB)." );
    return;
  }

  const inputs = containerElement.querySelectorAll( inputSelectors.join( "," ) );
  const inputListeners = [];

  // ⛔️ تنظيف أي مستمعين سابقين
  // @ts-ignore
  removeInputListenersFromTarget( window.__inputListenersGlobal__?.[ target ] || [] );

  inputs.forEach( ( input ) =>
  {
    // @ts-ignore
    // @ts-ignore
    const inputListener = ( event ) =>
    {
      let value;

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

      if ( typeof dbNoUpgrade?.keySet === 'function' )
      {
        dbNoUpgrade.keySet( tableName, input.id, value );
        console.log( "💾 تم حفظ القيمة:", { id: input.id, value } );
      }
    };

    const eventType = (
      // @ts-ignore
      input.type === "checkbox" ||
      // @ts-ignore
      input.type === "radio" ||
      input.tagName.toLowerCase() === "select"
    ) ? "change" : "input";

    input.addEventListener( eventType, inputListener );
    inputListeners.push( { input, listener: inputListener } );
  } );

  // 🔁 حفظ قائمة المستمعين بشكل عام حتى يمكن إزالتهم لاحقًا عند الحاجة
  // @ts-ignore
  window.__inputListenersGlobal__ = window.__inputListenersGlobal__ || {};
  // @ts-ignore
  window.__inputListenersGlobal__[ target ] = inputListeners;

  console.log( `🔍 بدأ مراقبة ${ inputs.length } من الحقول داخل العنصر ${ target }` );

  return inputListeners;
}

function removeInputListenersFromTarget ( inputListeners )
{
  if ( !Array.isArray( inputListeners ) )
  {
    console.warn( "⚠️ المعطى ليس مصفوفة من المستمعين." );
    return;
  }

  inputListeners.forEach( ( { input, listener } ) =>
  {
    if ( !input || !listener )
    {
      console.warn( "⚠️ عنصر أو مستمع غير صالح:", { input, listener } );
      return;
    }

    const type = input.type;
    const eventType =
      type === 'checkbox' || type === 'radio' || input.tagName.toLowerCase() === 'select'
        ? 'change'
        : 'input';

    input.removeEventListener( eventType, listener );
  } );

  console.log( `🧹 تم إزالة ${ inputListeners.length } من مستمعي الأحداث.` );
}

async function restoreAllInputsFromIndexDB ( target, dbNoUpgrade, tableName )
{
  // أنواع الحقول التي نسترجع لها القيم
  const inputSelectors = [
    'input[type="text"]',
    'input[type="date"]',
    'input[type="time"]',
    'input[type="radio"]',
    'input[type="checkbox"]',
    'input[type="number"]',
    'input[type="url"]',
    'input[type="email"]',
    'input[type="password"]',
    'textarea',
    'select'
  ];

  const containerElement = document.getElementById( target );
  if ( !containerElement )
  {
    console.warn( "❌ لم يتم توفير عنصر الحاوية (Restoring) restoreAllInputsFromIndexDB." );
    return;
  }

  const inputs = containerElement.querySelectorAll( inputSelectors.join( "," ) );

  for ( const input of inputs )
  {
    const inputId = input.id;
    if ( !inputId ) continue; // تخطي العناصر بدون ID

    try
    {
      // @ts-ignore
      let value = await dbNoUpgrade?.keyGet?.( tableName, inputId );

      if ( value === undefined ) continue;

      // @ts-ignore
      if ( input.type === "checkbox" )
      {
        // @ts-ignore
        input.checked = Boolean( value );
        // @ts-ignore
      } else if ( input.type === "radio" )
      {
        // @ts-ignore
        if ( input.value === value )
        {
          // @ts-ignore
          input.checked = true;
        }
      } else
      {
        // @ts-ignore
       if ( input.type === 'number' )
        {
          // @ts-ignore
          value = Number( value ).toFixed( DecimalPoint );
        } 
        // @ts-ignore
        input.value = value;
      }

      console.log( "♻️ تم استرجاع القيمة:", { id: inputId, value } );
    } catch ( error )
    {
      console.error( `⚠️ خطأ أثناء استرجاع الحقل ${ inputId }:`, error );
    }
  }

  console.log( `✅ تم استرجاع القيم لجميع الحقول (${ inputs.length }) داخل العنصر ${ target }` );
}

//#endregion

//#region دوال حفظ واسترجاع البيانات من localStorage
function watchAndSaveInputs2Local ( target )
{
  // @ts-ignore
  if ( selectedPage == 'setting' )
  {
    const inputSelectors = [
      'input[type="text"]',
      'input[type="date"]',
      'input[type="time"]',
      'input[type="radio"]',
      'input[type="checkbox"]',
      'input[type="number"]',
      'input[type="url"]',
      'input[type="email"]',
      'input[type="password"]',
      'textarea',
      'select'
    ];
    const containerElement = document.getElementById( target );
    // التحقق من وجود العنصر، إذا لم يكن موجود نخرج من الدالة
    if ( !containerElement )
    {
      console.warn( "❌ لم يتم توفير عنصر الحاوية (watchAndSaveInputs2Local) ." );
      return;
    }
    const inputs = containerElement.querySelectorAll( inputSelectors.join( ',' ) );
    const inputListeners = [];

    inputs.forEach( ( input ) =>
    {
      const handleInputChange = () =>
      {
        let value;

        // @ts-ignore
        if ( input.type === 'checkbox' )
        {
          // @ts-ignore
          value = input.checked ? 'true' : 'false';
          // @ts-ignore
        } else if ( input.type === 'radio' )
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

        if ( input.id )
        {
          localStorage.setItem( input.id, value );
          console.log( `💾 تم حفظ "${ input.id }":`, value );
        } else
        {
          console.warn( '⚠️ لا يمكن الحفظ: العنصر ليس له معرّف (id)', input );
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

      input.addEventListener( eventType, handleInputChange );
      inputListeners.push( { input, listener: handleInputChange } );

      // استرجاع القيم المحفوظة من localStorage عند التحميل
      if ( input.id && localStorage.getItem( input.id ) !== null )
      {
        const savedValue = localStorage.getItem( input.id );

        // @ts-ignore
        if ( input.type === 'checkbox' )
        {
          // @ts-ignore
          input.checked = savedValue === 'true';
          // @ts-ignore
        } else if ( input.type === 'radio' )
        {
          // @ts-ignore
          if ( input.value === savedValue ) input.checked = true;
        } else
        {
          // @ts-ignore
          input.value = savedValue;
        }
      }
    } );

    console.log( `🔍 جاري مراقبة ${ inputs.length } من حقول الإدخال` );

    return inputListeners;
  }
}

//#endregion 

//هذة الداله تقوم بالترقيم علي طريقة البنود حيث تراعي العلامات الخاصة مثل * و _ و فواصل . الارقام
function reNumber ( inlet )
{
  const final = []; // الناتج النهائي بعد المعالجة
  const lisNum = []; // لتجميع العناصر بين العلامات *
  const dashIndexes = []; // أماكن وجود عناصر "-" لإعادتها لاحقاً
  let index = 0;

  // دالة داخلية لإعادة ترقيم العناصر حسب مستويات الترقيم (مثل 1، 1.1، 1.2)
  function reNumberx ( ss )
  {
    const final = [ ...ss ]; // نسخ القائمة لتجنب التعديل المباشر
    const count = final.length;

    for ( let i = 0; i < count; i++ )
    {
      if ( i === 0 )
      {
        final[ i ] = "1"; // العنصر الأول دوماً هو "1"
      } else
      {
        const previous = final[ i - 1 ];
        const current = final[ i ];
        const dotCountP = ( previous.match( /\./g ) || [] ).length;
        const dotCountC = ( current.match( /\./g ) || [] ).length;

        if ( dotCountC === 0 )
        {
          // مستوى رئيسي جديد
          let a = 1;
          while ( true )
          {
            if ( !final[ i - a ].includes( '.' ) )
            {
              final[ i ] = ( parseInt( final[ i - a ] ) + 1 ).toString();
              break;
            }
            a++;
          }
        } else
        {
          if ( !previous.includes( '.' ) )
          {
            final[ i ] = previous + ".1"; // بداية مستوى فرعي جديد
          } else
          {
            if ( dotCountC === dotCountP )
            {
              // نفس مستوى الفرعية
              const parts = previous.split( '.' );
              const lastNum = parseInt( parts[ parts.length - 1 ] ) + 1;
              parts[ parts.length - 1 ] = lastNum.toString();
              final[ i ] = parts.join( '.' );
            } else if ( dotCountC > dotCountP )
            {
              // مستوى أعمق
              final[ i ] = previous + ".1";
            } else if ( dotCountC < dotCountP )
            {
              // الرجوع إلى مستوى أعلى
              let a = 1;
              while ( true )
              {
                const backItem = final[ i - a ];
                if ( backItem.includes( '.' ) )
                {
                  const p = ( backItem.match( /\./g ) || [] ).length;
                  if ( p === dotCountC )
                  {
                    const parts = backItem.split( '.' );
                    const lastNum = parseInt( parts[ parts.length - 1 ] ) + 1;
                    parts[ parts.length - 1 ] = lastNum.toString();
                    final[ i ] = parts.join( '.' );
                    break;
                  }
                }
                a++;
              }
            }
          }
        }
      }
    }
    return final;
  }

  try
  {
    for ( const item of inlet )
    {
      if ( item === "*" )
      {
        if ( lisNum.length > 0 )
        {
          const reLisNum = reNumberx( lisNum );
          final.push( ...reLisNum );
          lisNum.length = 0; // إفراغ القائمة
        }
        final.push( item ); // إضافة العلامة كما هي
      } else if ( item === "-" )
      {
        dashIndexes.push( index ); // تخزين موقع -
      } else
      {
        lisNum.push( item ); // تجميع العناصر التي تحتاج ترقيم
      }
      index++;
    }

    // إعادة ترقيم آخر مجموعة إن وُجدت
    if ( lisNum.length > 0 )
    {
      const reLisNum = reNumberx( lisNum );
      final.push( ...reLisNum );
    }

    // إعادة إدراج "-" في أماكنها الأصلية
    for ( const i of dashIndexes )
    {
      final.splice( i, 0, "-" );
    }

  } catch ( err )
  {
    console.error( "❌ Error:", err );
  }

  return final;
}

//#region لتبسيط استدعاء الكتابة في الكونسول
function q ( output )
{

  console.log( output );
}
function Q ( output )
{
  console.log( output );
}
function ض ( output )
{
  console.log( output );
}
//#endregion

async function delay ( ms )
{
  return new Promise( resolve => setTimeout( resolve, ms ) );
}

//#region الانتقال بين الصفحات


/**
* دالة تنقل المستخدم إلى قسم معين داخل index.html
* @param {string} sectionName - اسم القسم (مثل "home", "setting", "definition", "pands")
*/
// @ts-ignore
window.navigateToSection = function ( sectionName )
{
  try
  {
    if ( !sectionName || typeof sectionName !== 'string' )
    {
      console.warn( "❗ يرجى تمرير اسم القسم بشكل صحيح." );
      return;
    }

    // استخدم الدالة العالمية showSection (المعرفة في index.html)
    // @ts-ignore
    showSection( sectionName );
  } catch ( error )
  {
    console.error( "❌ خطأ أثناء محاولة الانتقال إلى القسم:", error );
  }
};

//#endregion

//#region مستمع احداث قاعدة البيانات
let isTableWatcherEnabled = true; // هذا المتغير للتحكم في تشغيل الكود
let storeName = null;
let dataName = null;

document.addEventListener( 'tableDataChanged', async ( event ) =>
{
  try
  {
    if ( event )
    {
      // @ts-ignore
      storeName = event.detail.storeName;
      // @ts-ignore
      dataName = event.detail.dataName;
      console.log( "isTableWatcherEnabled state -> ", isTableWatcherEnabled, ' ' );
      // @ts-ignore
      if ( !isTableWatcherEnabled ) return; // إذا كان الكود مغلقًا، سيتم تخطي الكود هنا.
      console.log( 'chang in table -> ', storeName, ' at dataBase -> ', dataName, ' nnnnnnnnnn' );

      //تم اختيار قاعدة البيانات الخاصة ببنود مشروع 
      if ( dataName.includes( "ite_" ) )
      {
        // @ts-ignore
        if ( selectedPage == 'pands' )
        {

        }
        // @ts-ignore
        if ( selectedPage == 'selectedPand' && selectedPage_selectedPand == 'units' )
        {
          // @ts-ignore
          await calTot();
        }


      }
      if ( dataName.includes( "bill_" ) )
      {

        // @ts-ignore
        await calSumBillSection( dataName, storeName );

      }
      if ( dataName.includes( "raw_" ) || dataName.includes( "equipments_" ) || dataName.includes( "labor_" ) || dataName.includes( "transport_" ) || dataName.includes( "other_" ) )
      {

        // @ts-ignore
        await calTotSection( dataName, storeName );

      }

      if ( dataName.includes( "Timeline_" ) )
      {
        // @ts-ignore
        await calDuration( dataName, storeName );
      }
      // @ts-ignore
      if ( selectedPage_selectedPand == 'condations' )
      {

      }

      if ( storeName == 'definition' )
      {
        // @ts-ignore
        if ( selectedPage == 'definition' )
        {
          // @ts-ignore
          await setupDefinationData();
        }
      }

    }
  } catch ( er ) { console.error( er ); }

} );

//#endregion

//#region مستمع احداث الجدول
let buttomClickedId = null;
let rowClickedId = null;
let dataBaseClickedId = null;
document.addEventListener( 'clickButtonInRow', async ( event ) =>
{
  // @ts-ignore
  buttomClickedId = event.detail.kind[ 0 ];
  // @ts-ignore
  rowClickedId = event.detail.kind[ 1 ];
  // @ts-ignore
  dataBaseClickedId = event.detail.kind[ 2 ];
  // @ts-ignore
  console.log( 'buttomClickedId -> ', buttomClickedId, '   ', 'rowClickedId -> ', rowClickedId, '  ', 'dataBaseClickedId -> ', dataBaseClickedId );
  if ( buttomClickedId == 't_138_open' )
  {
    console.log( `📢 فتح احد البنود` );
    localStorage.setItem( 'selectedPand', rowClickedId.replace( '_', '' ) );
    await delay( 100 );
    //حذف المقطع المحمل الخاص بالبند
    // @ts-ignore
    if ( typeof unloadAllSections_selectedPand == 'function' )
    {
      // @ts-ignore
      await unloadAllSections_selectedPand();
    }
    // @ts-ignore
    navigateToSection( "selectedPand" );


  }

  if ( buttomClickedId == 't_1266_openLink' )
  {

    // @ts-ignore
    await openLinkInDiv( rowClickedId );
  }

} );

let rawSelected = null;
let dataBaseSelected = null;
document.addEventListener( "selectRow", async ( event ) =>
{
  // @ts-ignore
  rawSelected = event.detail.Raw;
  // @ts-ignore
  dataBaseSelected = event.detail.dataBase;
  // @ts-ignore
  q( 'rawSelected->', rawSelected, 'dataBaseSelected->', dataBaseSelected );
  if ( dataBaseSelected == 'allPro' )
  {
    localStorage.setItem( 'selectedProject', rawSelected.replace( '_', '' ) );
    await delay( 100 );
    const nav_ = document.getElementById( "nav2" );
    // @ts-ignore
    nav_.style.display = "";
  }

} );

let newRawSelected = null;
let newDataBaseSelected = null;
document.addEventListener( "addNewRowEvent", async ( event ) =>
{

  // @ts-ignore
  newRawSelected = event.detail.RowId;
  // @ts-ignore
  newDataBaseSelected = event.detail.dataBase;
  // @ts-ignore
  if ( newDataBaseSelected.includes( "bill_" ) )
  {
    // @ts-ignore
    while ( await PandBillTable.checkProcessRun() == true )
    {
      await delay( 50 );
    }
    // @ts-ignore
    await initialValues();
  }

} );


//#endregion

let useArabic = true;
let savedLang = "en";
let DecimalPoint = 2;
let langSelectList0 = '';
let langSelectList1 = '';
let langSelectList2 = '';
async function getSetting ()
{
  const storedLang = localStorage.getItem( "languageSelect" );
  // التحقق من صحة قيمة اللغة
  savedLang = ( storedLang === "ar" || storedLang === "en" ) ? storedLang : "en";
  if ( savedLang === "ar" ) { useArabic = true; } else { useArabic = false; }
  // التحقق من صحة قيمة النقطة العشرية
  const storedDecimalPoint = localStorage.getItem( "DecimalPoint" );
  DecimalPoint = storedDecimalPoint ? Math.min( Math.max( parseInt( JSON.parse( storedDecimalPoint ) ) || 2, 0 ), 5 ) : 2;
  if ( useArabic ) { langSelectList0 = 'arabic_name'; langSelectList1 = 'not1Arabic'; langSelectList2 = 'not2Arabic'; } else { langSelectList0 = 'english_name'; langSelectList1 = 'not1English'; langSelectList2 = 'not2English'; }

  console.log( 'savedLang ->', savedLang, 'DecimalPoint ->', DecimalPoint );



}

// تأكد من تنفيذ الدالة بشكل متزامن عند بدء التطبيق
( async () =>
{
  await getSetting();
} )();