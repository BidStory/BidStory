document.addEventListener('DOMContentLoaded', function() {
    const dbNameInput = document.getElementById('db-name');
    const dbVersionInput = document.getElementById('db-version');
    const storeNameInput = document.getElementById('store-name');
    const keyPathInput = document.getElementById('key-path');
    const autoIncrementCheckbox = document.getElementById('auto-increment');
    const columnsContainer = document.getElementById('columns-container');
    const addColumnBtn = document.getElementById('add-column');
    const generateCodeBtn = document.getElementById('generate-code');
    const testCodeBtn = document.getElementById('test-code');
    const codeOutput = document.getElementById('code-output');
    const testResult = document.getElementById('test-result');

    // إضافة عمود جديد
    addColumnBtn.addEventListener('click', function() {
        const columnId = Date.now();
        const columnHtml = `
            <div class="column-item" id="column-${columnId}">
                <button class="remove-column" onclick="removeColumn(${columnId})">حذف</button>
                <div class="form-group">
                    <label for="column-name-${columnId}">اسم العمود:</label>
                    <input type="text" id="column-name-${columnId}" placeholder="مثال: name">
                </div>
                <div class="form-group">
                    <label for="column-type-${columnId}">نوع البيانات:</label>
                    <select id="column-type-${columnId}">
                        <option value="string">نص (String)</option>
                        <option value="number">رقم (Number)</option>
                        <option value="boolean">منطقي (Boolean)</option>
                        <option value="date">تاريخ (Date)</option>
                        <option value="array">مصفوفة (Array)</option>
                        <option value="object">كائن (Object)</option>
                        <option value="blob">بيانات ثنائية (Blob)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="column-index-${columnId}">إنشاء فهرس (Index):</label>
                    <input type="checkbox" id="column-index-${columnId}">
                </div>
                <div class="form-group index-options" style="display: none;">
                    <label for="column-index-unique-${columnId}">فريد (Unique):</label>
                    <input type="checkbox" id="column-index-unique-${columnId}">
                </div>
            </div>
        `;
        columnsContainer.insertAdjacentHTML('beforeend', columnHtml);

        // إظهار/إخفاء خيارات الفهرس عند تغيير حالة checkbox الفهرس
        document.getElementById(`column-index-${columnId}`).addEventListener('change', function(e) {
            const indexOptions = e.target.closest('.column-item').querySelector('.index-options');
            indexOptions.style.display = e.target.checked ? 'block' : 'none';
        });
    });

    // إنشاء الكود
    generateCodeBtn.addEventListener('click', function() {
        const dbName = dbNameInput.value.trim();
        const dbVersion = parseInt(dbVersionInput.value);
        const storeName = storeNameInput.value.trim();
        const keyPath = keyPathInput.value.trim();
        const autoIncrement = autoIncrementCheckbox.checked;

        if (!dbName || !storeName || !keyPath) {
            alert('الرجاء إدخال جميع الحقول المطلوبة');
            return;
        }

        // جمع معلومات الأعمدة
        const columns = [];
        const columnItems = columnsContainer.querySelectorAll('.column-item');
        columnItems.forEach(item => {
            const id = item.id.replace('column-', '');
            const name = document.getElementById(`column-name-${id}`).value.trim();
            const type = document.getElementById(`column-type-${id}`).value;
            const isIndex = document.getElementById(`column-index-${id}`).checked;
            const isUnique = isIndex ? document.getElementById(`column-index-unique-${id}`).checked : false;

            if (name) {
                columns.push({
                    name,
                    type,
                    isIndex,
                    isUnique
                });
            }
        });

        // إنشاء كود تعريف قاعدة البيانات
        let code = `// تعريف قاعدة البيانات والجدول\n`;
        code += `const dbConfig = {\n`;
        code += `  dbName: '${dbName}',\n`;
        code += `  version: ${dbVersion},\n`;
        code += `  stores: [{\n`;
        code += `    name: '${storeName}',\n`;
        code += `    keyPath: '${keyPath}',\n`;
        code += `    autoIncrement: ${autoIncrement},\n`;

        // إضافة الفهارس إذا وجدت
        const indexes = columns.filter(col => col.isIndex);
        if (indexes.length > 0) {
            code += `    indexes: [\n`;
            indexes.forEach((col, idx) => {
                code += `      {\n`;
                code += `        name: '${col.name}',\n`;
                code += `        keyPath: '${col.name}',\n`;
                code += `        unique: ${col.isUnique}\n`;
                code += `      }${idx < indexes.length - 1 ? ',' : ''}\n`;
            });
            code += `    ]\n`;
        } else {
            code += `    indexes: []\n`;
        }

        code += `  }]\n`;
        code += `};\n\n`;

        // إنشاء كود تهيئة قاعدة البيانات
        code += `// تهيئة قاعدة البيانات\n`;
        code += `const dbManager = manageIndexedDB(\n`;
        code += `  dbConfig.dbName,\n`;
        code += `  dbConfig.version,\n`;
        code += `  dbConfig.stores\n`;
        code += `);\n\n`;

        // إضافة دالة لفتح الاتصال
        code += `// فتح الاتصال بقاعدة البيانات\n`;
        code += `dbManager.open().then(() => {\n`;
        code += `  console.log('تم فتح قاعدة البيانات بنجاح');\n`;
        code += `}).catch(err => {\n`;
        code += `  console.error('حدث خطأ في فتح قاعدة البيانات:', err);\n`;
        code += `});\n\n`;

        // إضافة أمثلة لاستخدام الدوال CRUD
        code += `// مثال لإضافة سجل جديد\n`;
        code += `async function addNewRecord() {\n`;
        code += `  const newRecord = {\n`;
        code += `    ${keyPath}: ${autoIncrement ? 'undefined' : '1'},\n`;
        columns.forEach(col => {
            code += `    ${col.name}: ${getDefaultValueForType(col.type)},\n`;
        });
        code += `  };\n\n`;
        code += `  try {\n`;
        code += `    const result = await dbManager.addRecord('${storeName}', newRecord);\n`;
        code += `    console.log('تمت إضافة السجل بنجاح:', result);\n`;
        code += `    return result;\n`;
        code += `  } catch (error) {\n`;
        code += `    console.error('حدث خطأ أثناء الإضافة:', error);\n`;
        code += `    throw error;\n`;
        code += `  }\n`;
        code += `}\n\n`;

        code += `// مثال لقراءة جميع السجلات\n`;
        code += `async function getAllRecords() {\n`;
        code += `  try {\n`;
        code += `    const records = await dbManager.getAllRecords('${storeName}');\n`;
        code += `    console.log('السجلات:', records);\n`;
        code += `    return records;\n`;
        code += `  } catch (error) {\n`;
        code += `    console.error('حدث خطأ أثناء قراءة السجلات:', error);\n`;
        code += `    throw error;\n`;
        code += `  }\n`;
        code += `}\n`;

        codeOutput.textContent = code;
    });

    // اختبار الكود
    testCodeBtn.addEventListener('click', async function() {
        try {
            testResult.style.display = 'none';
            
            // تنفيذ الكود المولد
            const code = codeOutput.textContent;
            if (!code) {
                alert('لا يوجد كود لاختباره. الرجاء إنشاء الكود أولاً.');
                return;
            }

            // إنشاء دالة جديدة تحتوي على الكود وتنفيذها
            const testFunction = new Function(code + '\nreturn { dbManager, addNewRecord, getAllRecords };');
            const { dbManager, addNewRecord, getAllRecords } = testFunction();

            // اختبار فتح قاعدة البيانات
            await dbManager.open();
            
            // اختبار إضافة سجل
            const addResult = await addNewRecord();
            
            // اختبار قراءة السجلات
            const records = await getAllRecords();
            
            // عرض نتيجة الاختبار
            testResult.style.display = 'block';
            testResult.className = 'success';
            testResult.innerHTML = `
                <h3>تم تنفيذ الاختبار بنجاح!</h3>
                <p>تمت إضافة سجل جديد بمفتاح: ${addResult}</p>
                <p>عدد السجلات في الجدول: ${records.length}</p>
                <p>آخر سجل:</p>
                <pre>${JSON.stringify(records[records.length - 1], null, 2)}</pre>
            `;
            
        } catch (error) {
            testResult.style.display = 'block';
            testResult.className = 'error';
            testResult.innerHTML = `
                <h3>حدث خطأ أثناء الاختبار!</h3>
                <p>${error.message}</p>
                <p>${error.stack}</p>
            `;
            console.error('حدث خطأ أثناء الاختبار:', error);
        }
    });

    // دالة مساعدة للحصول على القيمة الافتراضية لنوع البيانات
    function getDefaultValueForType(type) {
        switch(type) {
            case 'number': return '0';
            case 'boolean': return 'false';
            case 'date': return 'new Date()';
            case 'array': return '[]';
            case 'object': return '{}';
            case 'blob': return 'new Blob()';
            default: return "''"; // string
        }
    }
});

// دالة حذف العمود (يجب أن تكون عامة لتعمل مع الأحداث المباشرة)
function removeColumn(id) {
    const columnElement = document.getElementById(`column-${id}`);
    if (columnElement) {
        columnElement.remove();
    }
}