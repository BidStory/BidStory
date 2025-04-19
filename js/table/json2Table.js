/**
 * @file ملف يحتوي على دوال لإعادة بناء العناصر والجداول من بيانات JSON
 * @description يوفر هذا الملف وظائف لإنشاء عناصر DOM من بيانات JSON مع معالجة شاملة للأخطاء
 */

/**
 * @function handleCommonAttributes
 * @description تعيين السمات العامة للعنصر
 * @param {HTMLElement} element - العنصر المراد تعيين السمات عليه
 * @param {Object} elementData - بيانات العنصر
 * @param {string} elementTag - نوع العنصر (لأغراض التسجيل)
 */
function handleCommonAttributes(element, elementData, elementTag) {
    try {
        if (!element || !elementData || !elementTag) {
            throw new Error('معلمات الدالة غير صالحة');
        }

        const commonAttributes = ['id', 'class', 'title', 'disabled', 'hidden', 'tabIndex'];
        commonAttributes.forEach(attr => {
            try {
                if (elementData[attr] !== undefined && elementData[attr] !== null) {
                    element[attr === 'class' ? 'className' : attr] = elementData[attr];
                }
            } catch (error) {
                console.warn(`فشل في تعيين السمة العامة ${attr} للعنصر ${elementTag}`, error);
            }
        });
    } catch (error) {
        console.error('حدث خطأ في handleCommonAttributes:', error);
        throw error;
    }
}

/**
 * @function handleInputAttributes
 * @description معالجة السمات الخاصة بعناصر الإدخال (input)
 * @param {HTMLInputElement} element - عنصر الإدخال
 * @param {Object} elementData - بيانات العنصر
 */
function handleInputAttributes(element, elementData) {
    try {
        if (!element || !elementData) {
            throw new Error('معلمات الدالة غير صالحة');
        }

        const inputAttrs = ['type', 'value', 'placeholder', 'required', 'readOnly',
            'checked', 'maxLength', 'min', 'max', 'step', 'pattern'];
        
        inputAttrs.forEach(attr => {
            try {
                if (elementData[attr] !== undefined && elementData[attr] !== null) {
                    if (attr === 'maxLength' && elementData[attr] < 0) {
                        console.warn(`تجاهل قيمة maxLength غير صالحة: ${elementData[attr]}`);
                        return;
                    }
                    element[attr] = elementData[attr];
                }
            } catch (error) {
                console.warn(`فشل في تعيين سمة ${attr} للعنصر input`, error);
            }
        });
    } catch (error) {
        console.error('حدث خطأ في handleInputAttributes:', error);
        throw error;
    }
}

/**
 * @function handleTextareaAttributes
 * @description معالجة السمات الخاصة بعناصر textarea
 * @param {HTMLTextAreaElement} element - عنصر textarea
 * @param {Object} elementData - بيانات العنصر
 */
function handleTextareaAttributes(element, elementData) {
    try {
        if (!element || !elementData) {
            throw new Error('معلمات الدالة غير صالحة');
        }

        const textareaAttrs = ['value', 'placeholder', 'rows', 'cols', 'wrap'];
        textareaAttrs.forEach(attr => {
            try {
                if (elementData[attr] !== undefined && elementData[attr] !== null) {
                    element[attr] = elementData[attr];
                }
            } catch (error) {
                console.warn(`فشل في تعيين سمة ${attr} للعنصر textarea`, error);
            }
        });
    } catch (error) {
        console.error('حدث خطأ في handleTextareaAttributes:', error);
        throw error;
    }
}

/**
 * @function handleSelectAttributes
 * @description معالجة السمات الخاصة بعناصر select
 * @param {HTMLSelectElement} element - عنصر select
 * @param {Object} elementData - بيانات العنصر
 */
function handleSelectAttributes(element, elementData) {
    try {
        if (!element || !elementData) {
            throw new Error('معلمات الدالة غير صالحة');
        }

        if (elementData.multiple) element.multiple = elementData.multiple;
        if (elementData.size) element.size = elementData.size;

        if (elementData.options && Array.isArray(elementData.options)) {
            elementData.options.forEach(opt => {
                try {
                    const option = document.createElement('option');
                    option.value = opt.value || '';
                    option.textContent = opt.text || '';
                    if (opt.selected) option.selected = true;
                    if (opt.disabled) option.disabled = true;
                    element.appendChild(option);
                } catch (error) {
                    console.warn(`فشل في إنشاء خيار select`, error);
                }
            });
        }
    } catch (error) {
        console.error('حدث خطأ في handleSelectAttributes:', error);
        throw error;
    }
}

/**
 * @function handleMediaAttributes
 * @description معالجة السمات الخاصة بالعناصر الوسائط (img, video, audio)
 * @param {HTMLElement} element - عنصر الوسائط
 * @param {Object} elementData - بيانات العنصر
 * @param {string} elementType - نوع الوسائط ('img' أو 'video' أو 'audio')
 */
function handleMediaAttributes(element, elementData, elementType) {
    try {
        if (!element || !elementData || !elementType) {
            throw new Error('معلمات الدالة غير صالحة');
        }

        const mediaAttrsMap = {
            img: ['src', 'alt', 'width', 'height', 'loading'],
            video: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload', 'poster'],
            audio: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload']
        };

        const mediaAttrs = mediaAttrsMap[elementType];
        if (!mediaAttrs) {
            throw new Error(`نوع الوسائط غير معروف: ${elementType}`);
        }

        mediaAttrs.forEach(attr => {
            try {
                if (elementData[attr] !== undefined && elementData[attr] !== null) {
                    element[attr] = elementData[attr];
                }
            } catch (error) {
                console.warn(`فشل في تعيين سمة ${attr} للعنصر ${elementType}`, error);
            }
        });
    } catch (error) {
        console.error('حدث خطأ في handleMediaAttributes:', error);
        throw error;
    }
}

/**
 * @function handleAnchorAttributes
 * @description معالجة السمات الخاصة بالروابط (a)
 * @param {HTMLAnchorElement} element - عنصر الرابط
 * @param {Object} elementData - بيانات العنصر
 */
function handleAnchorAttributes(element, elementData) {
    try {
        if (!element || !elementData) {
            throw new Error('معلمات الدالة غير صالحة');
        }

        const anchorAttrs = ['href', 'target', 'download'];
        anchorAttrs.forEach(attr => {
            try {
                if (elementData[attr] !== undefined && elementData[attr] !== null) {
                    element[attr] = elementData[attr];
                }
            } catch (error) {
                console.warn(`فشل في تعيين سمة ${attr} للعنصر a`, error);
            }
        });
    } catch (error) {
        console.error('حدث خطأ في handleAnchorAttributes:', error);
        throw error;
    }
}

/**
 * @function handleButtonAttributes
 * @description معالجة السمات الخاصة بالأزرار (button)
 * @param {HTMLButtonElement} element - عنصر الزر
 * @param {Object} elementData - بيانات العنصر
 */
function handleButtonAttributes(element, elementData) {
    try {
        if (!element || !elementData) {
            throw new Error('معلمات الدالة غير صالحة');
        }

        const buttonAttrs = ['type', 'formAction', 'formMethod'];
        buttonAttrs.forEach(attr => {
            try {
                if (elementData[attr] !== undefined && elementData[attr] !== null) {
                    element[attr] = elementData[attr];
                }
                if (elementData.text !== undefined && elementData.text !== null) {
                    element.textContent = elementData.text; // استخدم textContent بدلاً من innerText
                }
        
            } catch (error) {
                console.warn(`فشل في تعيين سمة ${attr} للعنصر button`, error);
            }
        });
    } catch (error) {
        console.error('حدث خطأ في handleButtonAttributes:', error);
        throw error;
    }
}

/**
 * @function handleCustomAttributes
 * @description معالجة السمات المخصصة (data-*)
 * @param {HTMLElement} element - العنصر المراد تعيين السمات عليه
 * @param {Object} elementData - بيانات العنصر
 * @param {string} elementTag - نوع العنصر (لأغراض التسجيل)
 */
function handleCustomAttributes(element, elementData, elementTag) {
    try {
        if (!element || !elementData || !elementTag) {
            throw new Error('معلمات الدالة غير صالحة');
        }

        if (elementData.dataset && typeof elementData.dataset === 'object') {
            Object.keys(elementData.dataset).forEach(key => {
                try {
                    element.dataset[key] = elementData.dataset[key];
                } catch (error) {
                    console.warn(`فشل في تعيين dataset ${key} للعنصر ${elementTag}`, error);
                }
            });
        }
    } catch (error) {
        console.error('حدث خطأ في handleCustomAttributes:', error);
        throw error;
    }
}

/**
 * @function handleElementChildren
 * @description معالجة العناصر الفرعية للعنصر
 * @param {HTMLElement} element - العنصر الرئيسي
 * @param {Object} elementData - بيانات العنصر
 * @param {string} elementTag - نوع العنصر (لأغراض التسجيل)
 * @returns {void}
 */
function handleElementChildren(element, elementData, elementTag) {
    try {
        if (!element || !elementData || !elementTag) {
            throw new Error('معلمات الدالة غير صالحة');
        }

        if (elementData.children && Array.isArray(elementData.children)) {
            elementData.children.forEach(childData => {
                try {
                    const childElement = rebuildElement(childData);
                    element.appendChild(childElement);
                } catch (error) {
                    console.warn(`فشل في إنشاء طفل للعنصر ${elementTag}`, error);
                }
            });
        } else if (elementData.innerText) {
            try {
                element.textContent = elementData.innerText;
            } catch (error) {
                console.warn(`فشل في تعيين النص للعنصر ${elementTag}`, error);
            }
        }
    } catch (error) {
        console.error('حدث خطأ في handleElementChildren:', error);
        throw error;
    }
}

/**
 * @function rebuildElement
 * @description إعادة بناء العنصر من بيانات JSON مع معالجة الأخطاء
 * @param {Object} elementData - بيانات العنصر المراد بناؤه
 * @returns {HTMLElement} العنصر المعاد بناؤه
 * @throws {Error} إذا كانت بيانات العنصر غير صالحة
 */
function rebuildElement(elementData) {
    try {
        if (!elementData || !elementData.tag) {
            throw new Error('بيانات العنصر غير صالحة');
        }

        console.log(`إعادة بناء عنصر ${elementData.tag}`);
        const element = document.createElement(elementData.tag);

        // السمات العامة
        handleCommonAttributes(element, elementData, elementData.tag);

        // معالجة السمات الخاصة بكل نوع عنصر
        const attributeHandlers = {
            input: () => handleInputAttributes(element, elementData),
            textarea: () => handleTextareaAttributes(element, elementData),
            select: () => handleSelectAttributes(element, elementData),
            img: () => handleMediaAttributes(element, elementData, 'img'),
            video: () => handleMediaAttributes(element, elementData, 'video'),
            audio: () => handleMediaAttributes(element, elementData, 'audio'),
            a: () => handleAnchorAttributes(element, elementData),
            button: () => handleButtonAttributes(element, elementData)
        };

        if (attributeHandlers[elementData.tag]) {
            try {
                attributeHandlers[elementData.tag]();
            } catch (error) {
                console.warn(`فشل في معالجة سمات ${elementData.tag}`, error);
            }
        }

        // السمات المخصصة
        handleCustomAttributes(element, elementData, elementData.tag);

        // العناصر الفرعية
        handleElementChildren(element, elementData, elementData.tag);

        return element;
    } catch (error) {
        console.error(`خطأ جسيم في rebuildElement للعنصر ${elementData?.tag || 'غير معروف'}`, error);
        throw error;
    }
}
function processChildElements(element, tag, result) {
    try {
        if (element.children && element.children.length > 0) {
            result.children = Array.from(element.children).map((child, index) => {
                try {
                    return processElement(
                        child,
                        element.id,   // اسم الأب (مثل button_1_2_td_1_1_1)
                        index + 1     // ترتيب الطفل
                    );
                } catch (error) {
                    console.warn(`فشل في معالجة الطفل [${index + 1}] للعنصر ${tag}`, error);
                    return null;
                }
            }).filter(child => child !== null);
        } 
        // ... (باقي الكود كما هو)
    } catch (error) {
        console.warn(`فشل في معالجة العناصر الفرعية للعنصر ${tag}`, error);
    }
}
/**
 * @function rebuildTableFromStorage
 * @description إعادة بناء الجدول من localStorage مع معالجة الأخطاء
 * @param {string} tableId - معرف الجدول المراد إعادة بناؤه
 * @throws {Error} إذا لم تكن بيانات الجدول موجودة أو غير صالحة
 */
function rebuildTableFromStorage(tableId) {
    try {
        console.log(`بدء إعادة بناء الجدول ${tableId} من التخزين المحلي`);

        // التحقق من وجود البيانات في التخزين المحلي
        const storedData = localStorage.getItem("myTableData");
        if (!storedData) {
            throw new Error("لا توجد بيانات جدول في التخزين المحلي");
        }

        // التحقق من وجود الجدول في الصفحة
        const table = document.getElementById(tableId);
        if (!table) {
            throw new Error(`الجدول ذو المعرف ${tableId} غير موجود في الصفحة`);
        }

        // إعداد tbody
        let tbody = table.querySelector("tbody");
        if (!tbody) {
            tbody = document.createElement("tbody");
            table.appendChild(tbody);
        }
        tbody.innerHTML = "";

        // تحليل بيانات الجدول
        const data = JSON.parse(storedData);
        if (!Array.isArray(data)) {
            throw new Error("بيانات الجدول غير صالحة");
        }

        // بناء الصفوف والخلايا
        data.forEach((rowData, rowIndex) => {
            try {
                if (!rowData || !rowData.cells) {
                    console.warn(`بيانات الصف ${rowIndex} غير صالحة`);
                    return;
                }

                const row = document.createElement("tr");
                if (rowData.id) row.id = rowData.id;
                if (rowData.class) row.className = rowData.class;

                rowData.cells.forEach((cellData, cellIndex) => {
                    try {
                        if (!cellData) {
                            console.warn(`بيانات الخلية ${cellIndex} في الصف ${rowIndex} غير صالحة`);
                            return;
                        }

                        const cell = document.createElement("td");
                        if (cellData.id) cell.id = cellData.id;
                        if (cellData.class) cell.className = cellData.class;

                        if (cellData.children && Array.isArray(cellData.children)) {
                            cellData.children.forEach((childData, childIndex) => {
                                try {
                                    if (!childData) {
                                        console.warn(`بيانات الطفل ${childIndex} في الخلية ${cellIndex} غير صالحة`);
                                        return;
                                    }

                                    const childElement = rebuildElement(childData);
                                    cell.appendChild(childElement);
                                } catch (error) {
                                    console.warn(`فشل في إنشاء الطفل ${childIndex} للخلية ${cellIndex}`, error);
                                }
                            });
                        }

                        row.appendChild(cell);
                    } catch (error) {
                        console.warn(`فشل في إنشاء الخلية ${cellIndex}`, error);
                    }
                });

                tbody.appendChild(row);
            } catch (error) {
                console.warn(`فشل في إنشاء الصف ${rowIndex}`, error);
            }
        });

        console.log('تم إعادة بناء الجدول بنجاح');
    } catch (error) {
        console.error('حدث خطأ جسيم في rebuildTableFromStorage:', error);
        throw error;
    }
}

