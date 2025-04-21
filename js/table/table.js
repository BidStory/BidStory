let showHead_ = ""; // استبدل هذا بالقيمة التي تريدها (true أو false) أو استخدم القيمة الافتراضية
let tableId = ""; // استبدل هذا بمعرف الجدول الخاص بك
let divId2Copy = ""; // استبدل هذا بمعرف العنصر الذي يحتوي على النموذج الأصلي
let db = null;
let rowsTable='rows'; // اسم الجدول الذي سوف يتم حفظ بيانات الصفوف به
document.addEventListener("DOMContentLoaded", () => {
  const tables = document.querySelectorAll("[TableId]");
  const div = document.querySelectorAll("[DivId]");
  tables.forEach((table) => {
    tableId = table.id;
    console.log("معرف الجدول:", tableId);
    db = new DBManager(tableId);
    letsGo2Table(tableId);
  });
  div.forEach((div) => {
    divId2Copy = div.id;
    console.log("معرف العنصر:", divId2Copy);
  });
});

function createNewRow() {
  try {
    // Get the table and verify it exists
    const table = document.getElementById(tableId);
    if (!table) {
      console.error("Table not found with ID:", tableId);
      return null;
    }

    // Get or create tbody
    let tbody = table.querySelector("tbody");
    if (!tbody) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }

    // Create new row
    const row = document.createElement("tr");
    row.className = "rowT";

    // Create cell
    const cell = document.createElement("td");
    cell.className = "cellT";

    // Clone the input template
    const original = document.getElementById(divId2Copy);
    if (!original) {
      console.error(
        ` '${divId2Copy}'لم يتم العصور علي معرف العنصر الذي سوف يتم نسخة`
      );
      return null;
    }
    const copy = original.cloneNode(true);
    copy.style.display = ""; // جعلة مرئي
    copy.id = CID(IDPattern.MIXED4_TIME, tableId); //اضافة المعرف الجديد للنسخة الجديدة

    // Append elements
    cell.appendChild(copy);
    row.appendChild(cell);
    tbody.appendChild(row);

    return row;
  } catch (error) {
    console.error("Error creating new row:", error);
    return null;
  }
}

// لعرض رائس الجدول في عنصر معين
function showHeadForElement(tableId, show = null) {
  const table = document.getElementById(tableId);
  const thead = table.querySelector("thead");
  if (show === true) {
    thead.style.display = "";
  } else if (show === false) {
    thead.style.display = "none";
  } else {
    thead.style.display = thead.style.display === "none" ? "" : "none";
  }
}

function watchTableChanges(tableId, callback) {
  const targetTable = document.getElementById(tableId);

  if (!targetTable) {
    console.error(`الجدول بالمعرف "${tableId}" غير موجود.`);
    return;
  }

  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (
        mutation.type === "childList" ||
        mutation.type === "subtree" ||
        mutation.type === "attributes"
      ) {
        callback(mutation);
        break;
      }
    }
  });

  observer.observe(targetTable, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  console.log(`بدأت مراقبة التغييرات على الجدول "${tableId}".`);
}

function changeInTable(tableId) {

  const table = document.getElementById(tableId);
  if (!table) {
    console.error(`لم يتم العثور على جدول بالمعرف: ${tableId}`);
    return;
  }
 
  // نحصل على كل العناصر داخل الجدول التي يبدأ معرفها بـ "tableId"
  const matchingElements = table.querySelectorAll(`[id^="${tableId}"]`);
  let index = 0;
  matchingElements.forEach((element) => {
    console.log("تم العثور على عنصر:", element.id);
    db.idSet(rowsTable, element.id, index);
    index++;
   
  });
}

async function getAllData(tableId) {
  const data = await db.getAllData(tableId);
  const sortedUsers = data.sort((a, b) => a.y - b.y);

  for (const user of sortedUsers) {
    console.log(user.x);
  }
}
function Delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function letsGo2Table(tableId) {
 
  
  watchTableChanges(tableId, (mutation) => {
    console.log("🚨 تم تغيير الجدول!");
    changeInTable(tableId);
  });
  db.idSet(rowsTable," element.id", "index");

  const tableNames = db.getAllTableNames();
  console.log("الجداول الموجودة:", tableNames);
await  getAllData(rowsTable);
}

window.onload = () => {
    
};