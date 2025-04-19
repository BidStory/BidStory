/**
 * عناصر HTML المدعومة للإضافة إلى الجدول
 * @constant {Object}
 */
const SUPPORTED_ELEMENTS = {
    Div: "div",
    Span: "span",
    Input: "input",
    Textarea: "textarea",
    Button: "button",
    Label: "label",
    Select: "select",
    Img: "img",
    Video: "video",
    Audio: "audio",
    Canvas: "canvas",
};

/**
 * ينشئ معرف عشوائي فريد
 * @returns {string} المعرف المولد
 */
function generateRandomId() {
    try {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    } catch (error) {
        console.error('Error generating random ID:', error);
        return 'id_' + Date.now(); // Fallback ID using timestamp
    }
}

/**
 * تنسخ عنصر div وتولد معرفات جديدة لعناصره الداخلية
 * @param {string} divId - معرف الـ div المراد نسخه
 * @returns {HTMLElement|null} العنصر المنسوخ أو null إذا فشلت العملية
 */
function copyDiv(divId) {
    try {
        const original = document.getElementById(divId);
        if (!original) {
            throw new Error(`Div with ID ${divId} not found`);
        }

        const copy = original.cloneNode(true);
        copy.id = generateRandomId();

        // توليد معرفات جديدة للعناصر الداخلية
        const allChildren = copy.querySelectorAll('*');
        allChildren.forEach(child => {
            if (!child.id) {
                child.id = generateRandomId();
            }
        });

        return copy;
    } catch (error) {
        console.error('Error copying div:', error);
        return null;
    }
}

/**
 * تنشئ خلية جدول تحتوي على عنصر إدخال
 * @param {HTMLElement} cell - عنصر الخلية
 * @returns {HTMLElement} الخلية مع عنصر الإدخال المضاف
 */
function createInputCell(cell) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = generateRandomId();
    input.className = 'inputT';
    cell.appendChild(input);
    return cell;
}

/**
 * تنشئ خلية جدول تحتوي على زر
 * @param {HTMLElement} cell - عنصر الخلية
 * @returns {HTMLElement} الخلية مع الزر المضاف
 */
function createButtonCell(cell) {
    const btn = document.createElement('button');
    btn.innerText = 'زر';
    btn.id = generateRandomId();
    btn.onclick = () => alert('تم الضغط!');
    btn.className = 'buttonT';
    cell.appendChild(btn);
    return cell;
}

/**
 * تنشئ خلية جدول تحتوي على مساحة نصية
 * @param {HTMLElement} cell - عنصر الخلية
 * @returns {HTMLElement} الخلية مع المساحة النصية المضاف
 */
function createTextareaCell(cell) {
    const textarea = document.createElement('textarea');
    textarea.id = generateRandomId();
    textarea.className = 'textareaT';
    cell.appendChild(textarea);
    return cell;
}

/**
 * تنشئ خلية جدول تحتوي على div مخصص
 * @param {HTMLElement} cell - عنصر الخلية
 * @param {Array} divInfo - مصفوفة تحتوي على معلومات الـ div
 * @returns {HTMLElement} الخلية مع الـ div المضاف
 */
function createCustomDivCell(cell, divInfo) {
    const div = copyDiv(divInfo[1]);
    if (div) {
        div.style.display = '';
        div.className = 'divT';
        cell.appendChild(div);
    }
    return cell;
}

/**
 * تنشئ خلية جدول تحتوي على عنصر محدد (select)
 * @param {HTMLElement} cell - عنصر الخلية
 * @returns {HTMLElement} الخلية مع العنصر المحدد المضاف
 */
function createSelectCell(cell) {
    const select = document.createElement('select');
    select.id = generateRandomId();
    select.className = 'selectT';

    // إضافة خيارات افتراضية
    for (let i = 1; i <= 2; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.textContent = `خيار ${i}`;
        select.appendChild(option);
    }

    cell.appendChild(select);
    return cell;
}

/**
 * تنشئ خلية جدول تحتوي على وسائط متعددة (صورة، فيديو، صوت)
 * @param {HTMLElement} cell - عنصر الخلية
 * @param {string} type - نوع الوسائط (img/video/audio)
 * @returns {HTMLElement} الخلية مع عنصر الوسائط المضاف
 */
function createMediaCell(cell, type) {
    let mediaElement;
    const mediaId = generateRandomId();

    switch (type) {
        case SUPPORTED_ELEMENTS.Img:
            mediaElement = document.createElement('img');
            mediaElement.src = 'https://via.placeholder.com/100';
            mediaElement.alt = 'صورة';
            mediaElement.style.maxWidth = '100px';
            mediaElement.className = 'imgT';
            break;
        case SUPPORTED_ELEMENTS.Video:
            mediaElement = document.createElement('video');
            mediaElement.controls = true;
            mediaElement.src = 'https://www.w3schools.com/html/mov_bbb.mp4';
            mediaElement.style.maxWidth = '150px';
            mediaElement.className = 'videoT';
            break;
        case SUPPORTED_ELEMENTS.Audio:
            mediaElement = document.createElement('audio');
            mediaElement.controls = true;
            mediaElement.src = 'https://www.w3schools.com/html/horse.mp3';
            mediaElement.className = 'audioT';
            break;
        default:
            return cell;
    }

    mediaElement.id = mediaId;
    cell.appendChild(mediaElement);
    return cell;
}

/**
 * تنشئ صفًا جديدًا في الجدول مع الخلايا المطلوبة
 * @param {string} tableId - معرف الجدول
 * @param {Array} elements - مصفوفة تحدد أنواع العناصر في كل خلية
 * @returns {HTMLElement|null} الصف المنشأ أو null إذا فشلت العملية
 */
function createNewRow(tableId, elements) {
    try {
        // التحقق من صحة المدخلات
        if (!tableId || !elements || elements.length === 0) {
            throw new Error('معرف الجدول أو قائمة العناصر غير صالحة');
        }

        const table = document.getElementById(tableId);
        if (!table) {
            throw new Error(`الجدول بالمعرف ${tableId} غير موجود`);
        }

        const tbody = table.querySelector('tbody');
        if (!tbody) {
            throw new Error('لم يتم العثور على tbody في الجدول');
        }

        // إنشاء الصف الجديد
        const row = document.createElement('tr');
        row.id = generateRandomId();
        row.className = 'rowT';

        // إضافة الخلايا إلى الصف
        elements.forEach(elType => {
            const cell = document.createElement('td');
            cell.id = generateRandomId();
            cell.className = 'cellT';

            try {
                switch (elType) {
                    case SUPPORTED_ELEMENTS.Input:
                        createInputCell(cell);
                        break;
                    case SUPPORTED_ELEMENTS.Button:
                        createButtonCell(cell);
                        break;
                    case SUPPORTED_ELEMENTS.Textarea:
                        createTextareaCell(cell);
                        break;
                    case SUPPORTED_ELEMENTS.Label:
                        const label = document.createElement('label');
                        label.textContent = 'تسمية';
                        label.id = generateRandomId();
                        label.className = 'labelT';
                        cell.appendChild(label);
                        break;
                    case SUPPORTED_ELEMENTS.Select:
                        createSelectCell(cell);
                        break;
                    case SUPPORTED_ELEMENTS.Img:
                    case SUPPORTED_ELEMENTS.Video:
                    case SUPPORTED_ELEMENTS.Audio:
                        createMediaCell(cell, elType);
                        break;
                    case SUPPORTED_ELEMENTS.Canvas:
                        const canvas = document.createElement('canvas');
                        canvas.id = generateRandomId();
                        canvas.width = 150;
                        canvas.height = 100;
                        canvas.style.border = '1px solid black';
                        canvas.className = 'canvasT';
                        cell.appendChild(canvas);
                        break;
                    case SUPPORTED_ELEMENTS.Span:
                        const span = document.createElement('span');
                        span.id = generateRandomId();
                        span.className = 'spanT';
                        cell.appendChild(span);
                        break;
                    default:
                        if (Array.isArray(elType) && elType[0] === SUPPORTED_ELEMENTS.Div) {
                            createCustomDivCell(cell, elType);
                        }
                        break;
                }
            } catch (error) {
                console.error(`Error creating cell for element type ${elType}:`, error);
                // إضافة خلية فارغة في حالة الخطأ
                cell.textContent = 'خطأ في إنشاء العنصر';
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
        return row;
    } catch (error) {
        console.error('Error creating new row:', error);
        return null;
    }
}