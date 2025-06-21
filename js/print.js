//لانشاء الجدول
const TableRenderer = ( function ()
{
    const config = {
        containerId: 'tablePrintContaner',
        noDataMessage: '📭 لا توجد بيانات لعرضها.',
        tableStyle: {
            width: '100%',
            borderCollapse: 'collapse',
            direction: 'ltr'
        },
        headerStyle: {
            backgroundColor: '#f0f0f0',
            textAlign: 'center',
            verticalAlign: 'middle',
            border: '1px solid black',
            padding: '5px'
        },
        cellStyle: {
            padding: '5px',
            textAlign: 'center',
            verticalAlign: 'middle',
            border: '1px solid black'
        },
        firstColumnCellStyle: {
            padding: '5px',
            textAlign: 'center',
            verticalAlign: 'top',
            border: '1px solid black'
        },
        bottomMiddleCellStyle: {
            padding: '5px',
            textAlign: 'center',
            verticalAlign: 'bottom',
            border: '1px solid black'
        }
    };

    const createTableElement = () =>
    {
        const table = document.createElement( 'table' );
        Object.assign( table.style, config.tableStyle );
        table.id = "table1";
        return table;
    };

    const createTableHeader = ( headers ) =>
    {
        const thead = document.createElement( 'thead' );
        const headRow = document.createElement( 'tr' );

        headers.forEach( headerText =>
        {
            const th = document.createElement( 'th' );
            th.textContent = headerText;
            Object.assign( th.style, config.headerStyle );
            headRow.appendChild( th );
        } );

        thead.appendChild( headRow );
        return thead;
    };

    const createTableCell = ( value, options = {} ) =>
    {
        const td = document.createElement( 'td' );

        if ( options.isFirstColumn )
        {
            Object.assign( td.style, config.firstColumnCellStyle );
        } else if ( options.isEstimateBottomColumn )
        {
            Object.assign( td.style, config.bottomMiddleCellStyle );
        } else
        {
            Object.assign( td.style, config.cellStyle );
        }

        if ( options.isEstimateColumn )
        {
            td.style.textAlign = options.useArabic ? 'right' : 'left';
        }

        if ( options.colSpan )
        {
            td.colSpan = options.colSpan;
        }

        let cellValue = value || '';
        if ( typeof cellValue === 'string' )
        {
            cellValue = cellValue.replace( /\n/g, "<br>" );
        }

        td.innerHTML = cellValue;
        return td;
    };

    const createTableBody = ( data, columns, kind, useArabic ) =>
    {
        const tbody = document.createElement( 'tbody' );

        data.forEach( item =>
        {
            const row = document.createElement( 'tr' );

            let skipUntilIndex = -1;

            columns.forEach( ( key, index ) =>
            {
                if ( index <= skipUntilIndex ) return;

                const isEstimateColumn = ( kind === 'Estimate' && index === 1 );
                const isFirstColumn = index === 0;
                const isEstimateBottomColumn = ( kind === 'Estimate' && index >= 2 && index <= 5 );

                // ✅ تحقق من شرط الدمج في kind = Estimate
                if ( kind === 'Estimate' && index === 1 )
                {
                    const fristValue = item[ columns[ 0 ] ];
                    const thirdValue = item[ columns[ 2 ] ];
                    const isThirdValueEmpty = thirdValue === null || thirdValue === undefined || String( thirdValue ).trim() === '';
                    const isDash = fristValue === "-";

                    if ( isDash )
                    {
                        const cell = createTableCell( item[ key ], {
                            isEstimateColumn,
                            useArabic,
                            colSpan: 4 // دمج الأعمدة 2 إلى 5 فقط
                        } );
                        row.appendChild( cell );

                        // ✅ أضف العمود السادس كما هو (index 6 = columns[5])
                        const sixthCell = createTableCell( item[ columns[ 5 ] ], {
                            isEstimateBottomColumn,
                            useArabic
                        } );
                        row.appendChild( sixthCell );

                        skipUntilIndex = 5; // تخطي الأعمدة 2 إلى 5 (أي index 2,3,4,5)
                        return;
                    }

                    if ( isThirdValueEmpty )
                    {
                        const cell = createTableCell( item[ key ], {
                            isEstimateColumn,
                            useArabic,
                            colSpan: 5 // من العمود 2 إلى 6
                        } );
                        row.appendChild( cell );
                        skipUntilIndex = 5;
                        return;
                    }
                }



                const cell = createTableCell( item[ key ], {
                    isFirstColumn,
                    isEstimateColumn,
                    isEstimateBottomColumn,
                    useArabic
                } );

                row.appendChild( cell );
            } );

            tbody.appendChild( row );
        } );

        return tbody;
    };

    const showNoDataMessage = ( container ) =>
    {
        container.textContent = config.noDataMessage;
    };

    const renderTable = ( data, headers, kind, useArabic ) =>
    {
        const container = document.getElementById( config.containerId );
        // @ts-ignore
        container.innerHTML = '';

        if ( !data || data.length === 0 )
        {
            showNoDataMessage( container );
            return;
        }

        const columns = Object.keys( data[ 0 ] );
        const table = createTableElement();
        table.style.direction = useArabic ? 'rtl' : 'ltr';

        table.appendChild( createTableHeader( headers ) );
        table.appendChild( createTableBody( data, columns, kind, useArabic ) );

        // @ts-ignore
        container.appendChild( table );
    };

    return {
        renderTable: renderTable
    };
} )();




// مثال على الاستخدام:
// TableRenderer.renderTable(data, headers, kind, useArabic);




// 📦 وحدة تصدير الجداول إلى Excel
const ExcelExporter = ( () =>
{
    // 🛠️ الدوال المساعدة
    const utils = {
        // تحويل RGB إلى HEX
        rgbToHex: ( rgb ) =>
        {
            const result = rgb.match( /\d+/g );
            return result ? result.map( x => parseInt( x ).toString( 16 ).padStart( 2, '0' ) ).join( '' ).toUpperCase() : 'FFFFFF';
        },

        // تحويل الصور إلى Base64
        getBase64ImageFromUrl: async ( url ) =>
        {
            try
            {
                const response = await fetch( url );
                const blob = await response.blob();
                return new Promise( ( resolve, reject ) =>
                {
                    const reader = new FileReader();
                    // @ts-ignore
                    reader.onloadend = () => resolve( reader.result.split( ',' )[ 1 ] );
                    reader.onerror = reject;
                    reader.readAsDataURL( blob );
                } );
            } catch ( error )
            {
                console.warn( 'تعذر تحميل الصورة:', url );
                return null;
            }
        },

        // استخراج المحتوى النصي للخلية
        extractCellContent: ( cell ) =>
        {
            return [ ...cell.childNodes ].map( child =>
            {
                if ( child.nodeType === 3 ) return child.textContent;
                if ( child.nodeType === 1 )
                {
                    if ( child.tagName === 'IMG' ) return '[IMAGE]';
                    if ( child.tagName === 'A' ) return child.textContent;
                    return child.textContent;
                }
                return '';
            } ).join( ' ' ).trim();
        },

        // حساب أقصى ارتفاع للصف
        calculateMaxRowHeight: ( cells ) =>
        {
            return Math.max( ...Array.from( cells ).map( cell => cell.offsetHeight ) );
        }
    };

    // 🎨 معالج التنسيقات
    const styleProcessor = {
        // تطبيق تنسيقات الخط
        applyFontStyles: ( excelCell, computedStyle ) =>
        {
            const fontWeight = computedStyle.fontWeight;
            const fontColor = computedStyle.color;
            const fontFamily = computedStyle.fontFamily.split( ',' )[ 0 ].replace( /['"]/g, '' ).trim();
            const textDecoration = computedStyle.textDecorationLine;
            const fontSize = parseInt( computedStyle.fontSize );

            excelCell.font = {
                name: fontFamily || 'Arial',
                bold: fontWeight === "bold" || parseInt( fontWeight ) >= 600,
                underline: textDecoration.includes( 'underline' ),
                italic: textDecoration.includes( 'italic' ),
                color: { argb: utils.rgbToHex( fontColor ) },
                size: fontSize
            };
        },

        // تطبيق تنسيقات الخلفية
        applyBackground: ( excelCell, computedStyle ) =>
        {
            const bgColor = computedStyle.backgroundColor;
            if ( bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent' )
            {
                const hexColor = utils.rgbToHex( bgColor );
                if ( hexColor !== 'FFFFFF' )
                {
                    excelCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: hexColor }
                    };
                }
            }
        },

        // تطبيق تنسيقات المحاذاة
        applyAlignment: ( excelCell, computedStyle ) =>
        {
            const textAlign = computedStyle.textAlign;
            const verticalAlign = computedStyle.verticalAlign;
            const paddingLeft = parseInt( computedStyle.paddingLeft || 0 );
            const paddingRight = parseInt( computedStyle.paddingRight || 0 );
            const horizontal = textAlign === 'right' ? 'right' : textAlign === 'left' ? 'left' : 'center';
            const vertical = verticalAlign === 'top' ? 'top' : verticalAlign === 'bottom' ? 'bottom' : 'middle';

            excelCell.alignment = {
                horizontal,
                vertical,
                wrapText: true,
                indent: Math.floor( ( paddingLeft + paddingRight ) / 10 )
            };
        },

        // تطبيق تنسيقات الرأس
        applyHeaderStyles: ( excelCell ) =>
        {
            excelCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F0F0F0' }
            };
            excelCell.font = {
                name: 'Arial',
                bold: true,
                size: 12
            };
        }
    };

    // 📊 معالج الجداول
    const tableProcessor = {
        // معالجة دمج الخلايا
        processMergedCells: ( sheet, mergeInfo ) =>
        {
            mergeInfo.forEach( m =>
            {
                sheet.mergeCells( m.start.r, m.start.c, m.end.r, m.end.c );
            } );
        },

        // معالجة الروابط التشعبية
        processHyperlinks: ( cell, excelCell ) =>
        {
            const anchor = cell.querySelector( "a" );
            if ( anchor && anchor.href )
            {
                excelCell.value = { text: anchor.textContent, hyperlink: anchor.href };
                excelCell.font.underline = true;
                excelCell.font.color = { argb: "0000FF" };
            }
        },

        // معالجة الصور
        processImages: async ( cell, sheet, colIndex, r, colspan ) =>
        {
            const imgs = cell.querySelectorAll( "img" );
            const computedStyle = window.getComputedStyle( cell );
            const textAlign = computedStyle.textAlign;

            for ( const img of imgs )
            {
                const base64 = await utils.getBase64ImageFromUrl( img.src );
                if ( !base64 ) continue;

                const extension = img.src.includes( ".png" ) ? "png" : "jpeg";
                const imageId = sheet.workbook.addImage( { base64, extension } );

                const imgWidth = img.width;
                const imgHeight = img.height;
                const colWidth = sheet.columns[ colIndex - 1 ].width * 7.5 * colspan;

                let alignFactor = 0;
                if ( textAlign === 'right' ) alignFactor = 1;
                else if ( textAlign === 'center' ) alignFactor = 0.5;

                const offset = ( colWidth - imgWidth ) * alignFactor / 7.5;

                sheet.addImage( imageId, {
                    tl: { col: colIndex - 1 + offset / 10, row: r + 0.5 - 1 },
                    ext: { width: imgWidth, height: imgHeight },
                    editAs: 'oneCell'
                } );
            }
        }
    };

    // 📤 الواجهة الرئيسية للتصدير
    return {
        exportToExcel: async ( tableId, fileName ) =>
        {
            try
            {
                // تهيئة المصنف
                // @ts-ignore
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet( fileName.replace( /\.xlsx$/, "" ) );
                const table = document.getElementById( tableId );
                // @ts-ignore
                const rows = table.rows;
                const mergeInfo = [];

                // ضبط عرض الأعمدة بناءً على الصف الأول
                const firstRowCells = rows[ 0 ].cells;
                sheet.columns = Array.from( firstRowCells ).map( cell => ( { width: cell.offsetWidth / 7.5 } ) );

                // معالجة كل صف
                for ( let r = 0; r < rows.length; r++ )
                {
                    const htmlRow = rows[ r ];
                    const row = sheet.addRow( [] );
                    const cells = htmlRow.cells;

                    // ضبط ارتفاع الصف
                    const maxCellHeight = utils.calculateMaxRowHeight( cells );
                    sheet.getRow( r + 1 ).height = maxCellHeight * 0.75;

                    let colIndex = 1;

                    // معالجة كل خلية
                    for ( let c = 0; c < cells.length; c++ )
                    {
                        const cell = cells[ c ];
                        const colspan = parseInt( cell.getAttribute( "colspan" ) || "1" );
                        const rowspan = parseInt( cell.getAttribute( "rowspan" ) || "1" );
                        const excelCell = row.getCell( colIndex );

                        // تعيين قيمة الخلية
                        excelCell.value = utils.extractCellContent( cell );

                        // تطبيق التنسيقات
                        const computedStyle = window.getComputedStyle( cell );
                        const isHeader = r === 0;

                        if ( isHeader )
                        {
                            styleProcessor.applyHeaderStyles( excelCell );
                        } else
                        {
                            styleProcessor.applyBackground( excelCell, computedStyle );
                            styleProcessor.applyFontStyles( excelCell, computedStyle );
                        }

                        styleProcessor.applyAlignment( excelCell, computedStyle );

                        // الحدود
                        excelCell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };

                        // معالجة العناصر الخاصة
                        tableProcessor.processHyperlinks( cell, excelCell );
                        await tableProcessor.processImages( cell, sheet, colIndex, r, colspan );

                        // تسجيل معلومات الدمج
                        if ( colspan > 1 || rowspan > 1 )
                        {
                            mergeInfo.push( {
                                start: { r: r + 1, c: colIndex },
                                end: { r: r + rowspan, c: colIndex + colspan - 1 }
                            } );
                        }

                        colIndex += colspan;
                    }
                }

                // تطبيق دمج الخلايا
                tableProcessor.processMergedCells( sheet, mergeInfo );

                // حفظ الملف
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob( [ buffer ], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                } );
                // @ts-ignore
                saveAs( blob, fileName );

            } catch ( error )
            {
                console.error( 'حدث خطأ أثناء التصدير:', error );
                throw new Error( 'فشل تصدير الملف: ' + error.message );
            }
        }
    };
} )();


const TablePrinter = ( () =>
{
    // متغير لتخزين حالة العناصر الأصلية
    let originalStyles = new Map();

    /**
     * حفظ الأنماط الأصلية للعناصر
     */
    const saveOriginalStyles = () =>
    {
        document.querySelectorAll( '*' ).forEach( el =>
        {
            originalStyles.set( el, el.getAttribute( 'style' ) );
        } );
    };

    /**
     * استعادة الأنماط الأصلية للعناصر
     */
    const restoreOriginalStyles = () =>
    {
        originalStyles.forEach( ( style, el ) =>
        {
            if ( style )
            {
                el.setAttribute( 'style', style );
            } else
            {
                el.removeAttribute( 'style' );
            }
        } );
        originalStyles.clear();
    };
    /**
     * وظيفة لطباعة جدول مع الحفاظ على أنماطه الأصلية
     * @param {string} tableId - معرّف الجدول المراد طباعته
     * @param {string} title - عنوان التقرير (اختياري)
     */
    const printTable = ( tableId, title = '' ) =>
    {
        try
        {
            saveOriginalStyles(); // حفظ الحالة الأصلية قبل الطباعة

            const printWindow = openPrintWindow();
            const tableContent = getTableContent( tableId );
            const printDocument = buildPrintDocument( tableContent, title );

            writeToPrintWindow( printWindow, printDocument );
            setupPrintWindowEvents( printWindow );
        } catch ( error )
        {
            console.error( 'حدث خطأ أثناء محاولة الطباعة:', error );
            alert( 'حدث خطأ أثناء محاولة الطباعة. يرجى المحاولة مرة أخرى.' );
            restoreOriginalStyles(); // استعادة الحالة الأصلية في حالة الخطأ
        }
    };

    /**
     * فتح نافذة الطباعة الجديدة
     * @returns {Window} نافذة الطباعة
     */
    const openPrintWindow = () =>
    {
        const printWindow = window.open( '', '_blank' );
        if ( !printWindow )
        {
            throw new Error( 'تعذر فتح نافذة الطباعة. يرجى تعطيل مانع النوافذ المنبثقة.' );
        }
        return printWindow;
    };

    /**
     * الحصول على محتوى الجدول مع أنماطه الأصلية
     * @param {string} tableId - معرّف الجدول
     * @returns {string} محتوى HTML للجدول
     */
    const getTableContent = ( tableId ) =>
    {
        const tableElement = document.getElementById( tableId );
        if ( !tableElement )
        {
            throw new Error( `لا يوجد جدول بالمعرف ${ tableId }` );
        }

        // استنساخ الجدول للحفاظ على الأنماط الأصلية
        const tableClone = tableElement.cloneNode( true );

        // الحصول على الأنماط المطبقة على الجدول
        const originalStyles = getOriginalStyles( tableElement );

        // @ts-ignore
        return originalStyles + tableClone.outerHTML;
    };

    /**
     * الحصول على الأنماط الأصلية للعنصر
     * @param {HTMLElement} element - العنصر المراد استخلاص أنماطه
     * @returns {string} أنماط CSS للعنصر
     */
    const getOriginalStyles = ( element ) =>
    {
        const styles = window.getComputedStyle( element );
        let cssText = '';

        // إضافة أنماط العنصر نفسه
        cssText += `#${ element.id } { ${ styles.cssText } }\n`;

        // إضافة أنماط العناصر الفرعية
        const allElements = element.getElementsByTagName( '*' );
        for ( let el of allElements )
        {
            const elStyles = window.getComputedStyle( el );
            // @ts-ignore
            const selector = getCssSelector( el );
            cssText += `${ selector } { ${ elStyles.cssText } }\n`;
        }

        return `<style>${ cssText }</style>`;
    };

    /**
     * إنشاء محدد CSS للعنصر
     * @param {HTMLElement} element - العنصر
     * @returns {string} محدد CSS
     */
    const getCssSelector = ( element ) =>
    {
        if ( element.id ) return `#${ element.id }`;

        let selector = element.tagName.toLowerCase();
        if ( element.className )
        {
            selector += '.' + element.className.split( ' ' ).join( '.' );
        }

        return selector;
    };

    /**
     * بناء مستند الطباعة الكامل
     * @param {string} tableContent - محتوى الجدول
     * @param {string} title - عنوان التقرير
     * @returns {string} مستند HTML كامل للطباعة
     */
    const buildPrintDocument = ( tableContent, title ) =>
    {
        const headerFooterStyle = createHeaderFooterStyle( title );
        const printStyles = createPrintStyles( headerFooterStyle );
        const currentDate = new Date().toLocaleDateString( 'ar-EG' );

        return `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${ title || 'طباعة الجدول' }</title>
                ${ printStyles }
            </head>
            <body>
                <div id="print-section">
                    ${ title ? `<h1 class="print-title">${ title }</h1>` : '' }
                    ${ tableContent }
                    <div class="print-footer">
                        تم الطباعة في ${ currentDate }
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    /**
     * إنشاء أنماط الترويسة والتذييل للطباعة
     * @param {string} title - عنوان التقرير
     * @returns {string} أنماط CSS للترويسة والتذييل
     */
    const createHeaderFooterStyle = ( title ) =>
    {
        return `
            @page {
                @top-center {
                    content: "${ title }";
                    font-family: 'Arial', sans-serif;
                    font-size: 12pt;
                }
                @bottom-right {
                    content: "الصفحة " counter(page);
                    font-family: 'Arial', sans-serif;
                    font-size: 10pt;
                }
                size: auto;
                margin: 15mm;
            }
        `;
    };

    /**
     * إنشاء أنماط الطباعة العامة
     * @param {string} headerFooterStyle - أنماط الترويسة والتذييل
     * @returns {string} أنماط CSS كاملة للطباعة
     */
    const createPrintStyles = ( headerFooterStyle ) =>
    {
        return `
            <style>
                ${ headerFooterStyle }
                
                body {
                    font-family: 'Arial', sans-serif;
                    direction: rtl;
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                .print-title {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #333;
                }
                
                .print-footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 10pt;
                    color: #666;
                }
                
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    
                    #print-section, #print-section * {
                        visibility: visible;
                    }
                    
                    #print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    
                    .print-footer {
                        display: none;
                    }
                }
            </style>
        `;
    };

    /**
     * كتابة المحتوى إلى نافذة الطباعة
     * @param {Window} printWindow - نافذة الطباعة
     * @param {string} content - المحتوى المراد كتابته
     */
    const writeToPrintWindow = ( printWindow, content ) =>
    {
        printWindow.document.write( content );
        printWindow.document.close();
    };

    /**
     * إعداد أحداث نافذة الطباعة
     * @param {Window} printWindow - نافذة الطباعة
     */

    const setupPrintWindowEvents = ( printWindow ) =>
    {
        printWindow.onload = function ()
        {
            setTimeout( () =>
            {
                printWindow.focus();

                // إضافة حدث بعد الطباعة لاستعادة الحالة الأصلية
                printWindow.onafterprint = () =>
                {
                    restoreOriginalStyles();
                    if ( !printWindow.closed )
                    {
                        printWindow.close();
                    }
                };

                printWindow.print();
            }, 300 );
        };
    };
    // تصدير الوظائف العامة فقط
    return {
        printTable
    };
} )();

// مثال على الاستخدام:
// TablePrinter.printTable('myTableId', 'تقرير الجدول');

