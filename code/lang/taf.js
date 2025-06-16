class SetCurrencyData
{
    constructor ( countryId )
    {
        const NoCurrency = 0;

        if ( countryId === NoCurrency )
        {
            this.CurrencyID = NoCurrency;
            this.CurrencyCode = "nan";
            this.IsCurrencyNameFeminine = true;
            this.EnglishCurrencyName = "";
            this.EnglishPluralCurrencyName = "";
            this.EnglishCurrencyPartName = "";
            this.EnglishPluralCurrencyPartName = "";
            this.Arabic1CurrencyName = "";
            this.Arabic2CurrencyName = "";
            this.Arabic310CurrencyName = "";
            this.Arabic1199CurrencyName = "";
            this.Arabic1CurrencyPartName = "";
            this.Arabic2CurrencyPartName = "";
            this.Arabic310CurrencyPartName = "";
            this.Arabic1199CurrencyPartName = "";
            this.PartPrecision = 0;
            this.IsCurrencyPartNameFeminine = false;
        } else
        {
            const countryData = getCountryDataById( countryId );  // ✅ استخدام الدالة الحقيقية

            if ( !countryData )
            {
                throw new Error( `❌ لم يتم العثور على بيانات للدولة بالرقم ${ countryId }` );
            }

            this.CurrencyID = this.c2i0( countryData.id );
            this.CurrencyCode = countryData.CurrencyCode;
            this.IsCurrencyNameFeminine = this.c2bool( countryData.IsCurrencyNameFeminine );
            this.EnglishCurrencyName = countryData.EnglishCurrencyName;
            this.EnglishPluralCurrencyName = countryData.EnglishPluralCurrencyName;
            this.EnglishCurrencyPartName = countryData.EnglishCurrencyPartName;
            this.EnglishPluralCurrencyPartName = countryData.EnglishPluralCurrencyPartName;
            this.Arabic1CurrencyName = countryData.Arabic1CurrencyName;
            this.Arabic2CurrencyName = countryData.Arabic2CurrencyName;
            this.Arabic310CurrencyName = countryData.Arabic310CurrencyName;
            this.Arabic1199CurrencyName = countryData.Arabic1199CurrencyName;
            this.Arabic1CurrencyPartName = countryData.Arabic1CurrencyPartName;
            this.Arabic2CurrencyPartName = countryData.Arabic2CurrencyPartName;
            this.Arabic310CurrencyPartName = countryData.Arabic310CurrencyPartName;
            this.Arabic1199CurrencyPartName = countryData.Arabic1199CurrencyPartName;
            this.PartPrecision = this.c2i0( countryData.PartPrecision );
            this.IsCurrencyPartNameFeminine = this.c2bool( countryData.IsCurrencyPartNameFeminine );
        }
    }

    // دالة مساعدة للتحويل إلى عدد صحيح
    c2i0 ( value )
    {
        return value ? parseInt( value ) : 0;
    }

    // دالة مساعدة للتحويل إلى قيمة بولية
    c2bool ( value )
    {
        return value === true || value === 'true' || value === '1';
    }
}


class ToWord
{
    constructor ( number, currency, options = {} )
    {
        this.Number = number;
        this.Currency = currency;
        this.EnglishPrefixText = options.englishPrefixText || "";
        this.EnglishSuffixText = options.englishSuffixText || "";
        this.ArabicPrefixText = options.arabicPrefixText || "";
        this.ArabicSuffixText = options.arabicSuffixText || "";

        this._intergerValue = 0;
        this._decimalValue = 0;

        this.extractIntegerAndDecimalParts();
    }

    extractIntegerAndDecimalParts ()
    {
        const numberStr = this.Number.toString();
        const splits = numberStr.split( '.' );

        this._intergerValue = parseInt( splits[ 0 ] ) || 0;

        if ( splits.length > 1 )
        {
            const decimalPart = this.getDecimalValue( splits[ 1 ] );
            this._decimalValue = parseInt( decimalPart ) || 0;
        }
    }

    getDecimalValue ( decimalPart )
    {
        let result;
        if ( this.Currency.PartPrecision !== decimalPart.length )
        {
            const firstPart = decimalPart.substring( 0, this.Currency.PartPrecision );
            const secondPart = decimalPart.substring( this.Currency.PartPrecision );
            result = `${ firstPart }.${ secondPart }`;
            result = Math.round( parseFloat( result ) ).toString();
        } else
        {
            result = decimalPart;
        }

        while ( result.length < this.Currency.PartPrecision )
        {
            result += "0";
        }

        return result;
    }

    // التحويل إلى الإنجليزية
    convertToEnglish ()
    {
        const tempNumber = this.Number;

        if ( tempNumber === 0 )
        {
            return "Zero";
        }

        const decimalString = this.processGroup( this._decimalValue );

        let retVal = "";
        let group = 0;
        let remainingNumber = Math.abs( tempNumber );

        if ( remainingNumber < 1 )
        {
            retVal = this.englishOnes[ 0 ];
        } else
        {
            while ( remainingNumber >= 1 )
            {
                const numberToProcess = Math.floor( remainingNumber % 1000 );
                remainingNumber = Math.floor( remainingNumber / 1000 );

                const groupDescription = this.processGroup( numberToProcess );

                if ( groupDescription !== "" )
                {
                    if ( group > 0 )
                    {
                        retVal = `${ this.englishGroup[ group ] } ${ retVal }`;
                    }

                    retVal = `${ groupDescription } ${ retVal }`;
                }

                group++;
            }
        }

        let formattedNumber = "";
        formattedNumber += this.EnglishPrefixText ? `${ this.EnglishPrefixText } ` : "";
        formattedNumber += retVal ? retVal : "";
        formattedNumber += retVal ?
            ( this._intergerValue === 1 ? this.Currency.EnglishCurrencyName : this.Currency.EnglishPluralCurrencyName )
            : "";
        formattedNumber += decimalString ? " and " : "";
        formattedNumber += decimalString ? decimalString : "";
        formattedNumber += decimalString ?
            " " + ( this._decimalValue === 1 ? this.Currency.EnglishCurrencyPartName : this.Currency.EnglishPluralCurrencyPartName )
            : "";
        formattedNumber += this.EnglishSuffixText ? ` ${ this.EnglishSuffixText }` : "";

        return formattedNumber.trim();
    }

    processGroup ( groupNumber )
    {
        const tens = groupNumber % 100;
        const hundreds = Math.floor( groupNumber / 100 );

        let retVal = "";

        if ( hundreds > 0 )
        {
            retVal = `${ this.englishOnes[ hundreds ] } ${ this.englishGroup[ 0 ] }`;
        }

        if ( tens > 0 )
        {
            if ( tens < 20 )
            {
                retVal += retVal ? " " : "";
                retVal += this.englishOnes[ tens ];
            } else
            {
                const ones = tens % 10;
                const tenIndex = Math.floor( tens / 10 ) - 2;

                retVal += retVal ? " " : "";
                retVal += this.englishTens[ tenIndex ];

                if ( ones > 0 )
                {
                    retVal += retVal ? " " : "";
                    retVal += this.englishOnes[ ones ];
                }
            }
        }

        return retVal;
    }

    // التحويل إلى العربية
    convertToArabic ()
    {
        const tempNumber = this.Number;

        if ( tempNumber === 0 )
        {
            return "صفر";
        }

        const decimalString = this.processArabicGroup( this._decimalValue, -1, 0 );

        let retVal = "";
        let group = 0;
        let remainingNumber = Math.abs( tempNumber );

        while ( remainingNumber >= 1 )
        {
            const numberToProcess = Math.floor( remainingNumber % 1000 );
            remainingNumber = Math.floor( remainingNumber / 1000 );

            const groupDescription = this.processArabicGroup( numberToProcess, group, remainingNumber );

            if ( groupDescription !== "" )
            {
                if ( group > 0 )
                {
                    if ( retVal !== "" )
                    {
                        retVal = `و ${ retVal }`;
                    }

                    if ( numberToProcess !== 2 )
                    {
                        if ( numberToProcess % 100 !== 1 )
                        {
                            if ( numberToProcess >= 3 && numberToProcess <= 10 )
                            {
                                retVal = `${ this.arabicPluralGroups[ group ] } ${ retVal }`;
                            } else
                            {
                                if ( retVal !== "" )
                                {
                                    retVal = `${ this.arabicAppendedGroup[ group ] } ${ retVal }`;
                                } else
                                {
                                    retVal = `${ this.arabicGroup[ group ] } ${ retVal }`;
                                }
                            }
                        }
                    }
                }

                retVal = `${ groupDescription } ${ retVal }`;
            }

            group++;
        }

        let formattedNumber = "";
        formattedNumber += this.ArabicPrefixText ? `${ this.ArabicPrefixText } ` : "";
        formattedNumber += retVal ? retVal : "";

        if ( this._intergerValue !== 0 )
        {
            const remaining100 = this._intergerValue % 100;

            if ( remaining100 === 0 )
            {
                formattedNumber += this.Currency.Arabic1CurrencyName;
            } else if ( remaining100 === 1 )
            {
                formattedNumber += this.Currency.Arabic1CurrencyName;
            } else if ( remaining100 === 2 )
            {
                formattedNumber += ( this._intergerValue === 2 ) ?
                    this.Currency.Arabic2CurrencyName : this.Currency.Arabic1CurrencyName;
            } else if ( remaining100 >= 3 && remaining100 <= 10 )
            {
                formattedNumber += this.Currency.Arabic310CurrencyName;
            } else if ( remaining100 >= 11 && remaining100 <= 99 )
            {
                formattedNumber += this.Currency.Arabic1199CurrencyName;
            }
        }

        formattedNumber += this._decimalValue ? " و " : "";
        formattedNumber += this._decimalValue ? decimalString : "";

        if ( this._decimalValue )
        {
            formattedNumber += " ";
            const remaining100 = this._decimalValue % 100;

            if ( remaining100 === 0 )
            {
                formattedNumber += this.Currency.Arabic1CurrencyPartName;
            } else if ( remaining100 === 1 )
            {
                formattedNumber += this.Currency.Arabic1CurrencyPartName;
            } else if ( remaining100 === 2 )
            {
                formattedNumber += this.Currency.Arabic2CurrencyPartName;
            } else if ( remaining100 >= 3 && remaining100 <= 10 )
            {
                formattedNumber += this.Currency.Arabic310CurrencyPartName;
            } else if ( remaining100 >= 11 && remaining100 <= 99 )
            {
                formattedNumber += this.Currency.Arabic1199CurrencyPartName;
            }
        }

        formattedNumber += this.ArabicSuffixText ? ` ${ this.ArabicSuffixText }` : "";

        return formattedNumber.trim();
    }

    processArabicGroup ( groupNumber, groupLevel, remainingNumber )
    {
        const tens = groupNumber % 100;
        const hundreds = Math.floor( groupNumber / 100 );

        let retVal = "";

        if ( hundreds > 0 )
        {
            if ( tens === 0 && hundreds === 2 )
            {
                retVal = this.arabicAppendedTwos[ 0 ];
            } else
            {
                retVal = this.arabicHundreds[ hundreds ];
            }
        }

        if ( tens > 0 )
        {
            if ( tens < 20 )
            {
                if ( tens === 2 && hundreds === 0 && groupLevel > 0 )
                {
                    if ( this._intergerValue === 2000 || this._intergerValue === 2000000 ||
                        this._intergerValue === 2000000000 || this._intergerValue === 2000000000000 )
                    {
                        retVal = this.arabicAppendedTwos[ groupLevel ];
                    } else
                    {
                        retVal = this.arabicTwos[ groupLevel ];
                    }
                } else
                {
                    if ( retVal !== "" )
                    {
                        retVal += " و ";
                    }

                    if ( tens === 1 && groupLevel > 0 )
                    {
                        retVal += this.arabicGroup[ groupLevel ];
                    } else if ( ( tens === 1 || tens === 2 ) && ( groupLevel === 0 || groupLevel === -1 ) &&
                        hundreds === 0 && remainingNumber === 0 )
                    {
                        retVal += "";
                    } else
                    {
                        retVal += this.getDigitFeminineStatus( tens, groupLevel );
                    }
                }
            } else
            {
                const ones = tens % 10;
                const tenIndex = Math.floor( tens / 10 ) - 2;

                if ( ones > 0 )
                {
                    if ( retVal !== "" )
                    {
                        retVal += " و ";
                    }
                    retVal += this.getDigitFeminineStatus( ones, groupLevel );
                }

                if ( retVal !== "" )
                {
                    retVal += " و ";
                }

                retVal += this.arabicTens[ tenIndex ];
            }
        }

        return retVal;
    }

    getDigitFeminineStatus ( digit, groupLevel )
    {
        if ( groupLevel === -1 )
        {
            return this.Currency.IsCurrencyPartNameFeminine ?
                this.arabicFeminineOnes[ digit ] : this.arabicOnes[ digit ];
        } else if ( groupLevel === 0 )
        {
            return this.Currency.IsCurrencyNameFeminine ?
                this.arabicFeminineOnes[ digit ] : this.arabicOnes[ digit ];
        } else
        {
            return this.arabicOnes[ digit ];
        }
    }

    // مصفوفات الكلمات الإنجليزية
    englishOnes = [
        "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];

    englishTens = [
        "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    englishGroup = [
        "Hundred", "Thousand", "Million", "Billion", "Trillion", "Quadrillion", "Quintillion", "Sextillian",
        "Septillion", "Octillion", "Nonillion", "Decillion", "Undecillion", "Duodecillion", "Tredecillion",
        "Quattuordecillion", "Quindecillion", "Sexdecillion", "Septendecillion", "Octodecillion", "Novemdecillion",
        "Vigintillion", "Unvigintillion", "Duovigintillion", "10^72", "10^75", "10^78", "10^81", "10^84", "10^87",
        "Vigintinonillion", "10^93", "10^96", "Duotrigintillion", "Trestrigintillion"
    ];

    // مصفوفات الكلمات العربية
    arabicOnes = [
        "", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة",
        "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"
    ];

    arabicFeminineOnes = [
        "", "إحدى", "اثنتان", "ثلاث", "أربع", "خمس", "ست", "سبع", "ثمان", "تسع",
        "عشر", "إحدى عشرة", "اثنتا عشرة", "ثلاث عشرة", "أربع عشرة", "خمس عشرة", "ست عشرة", "سبع عشرة", "ثماني عشرة", "تسع عشرة"
    ];

    arabicTens = [
        "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"
    ];

    arabicHundreds = [
        "", "مائة", "مئتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"
    ];

    arabicAppendedTwos = [
        "مئتا", "ألفا", "مليونا", "مليارا", "تريليونا", "كوادريليونا", "كوينتليونا", "سكستيليونا"
    ];

    arabicTwos = [
        "مئتان", "ألفان", "مليونان", "ملياران", "تريليونان", "كوادريليونان", "كوينتليونان", "سكستيليونان"
    ];

    arabicGroup = [
        "مائة", "ألف", "مليون", "مليار", "تريليون", "كوادريليون", "كوينتليون", "سكستيليون"
    ];

    arabicAppendedGroup = [
        "", "ألفاً", "مليوناً", "ملياراً", "تريليوناً", "كوادريليوناً", "كوينتليوناً", "سكستيليوناً"
    ];

    arabicPluralGroups = [
        "", "آلاف", "ملايين", "مليارات", "تريليونات", "كوادريليونات", "كوينتليونات", "سكستيليونات"
    ];
}

function getCountryDataById ( countryId )
{
    console.log( 'this is data', country );

    // التأكد من وجود AllCountry وأنها مصفوفة
    if ( !country || !Array.isArray( country.AllCountry ) )
    {
        console.error( "❌ country.json غير محمّل أو ليس بصيغة صحيحة." );
        return null;
    }

    // البحث عن الدولة المطلوبة
    const countryData = country.AllCountry.find( c => parseInt( c.id ) === parseInt( countryId ) );

    if ( !countryData )
    {
        throw new Error( `❌ لم يتم العثور على بيانات للدولة بالرقم ${ countryId }` );
    }

    return countryData;
}

function amount2words ( amount, countryId ) 
{
    try
    {
        const currencyData = new SetCurrencyData( countryId );
        let lang;
        if ( useArabic == true )
        {
            lang = {

                arabicPrefixText: "فقط",
                arabicSuffixText: "لا غير."
            };
        } else
        {
            lang = {
                englishPrefixText: "only",
                englishSuffixText: "payable."
            };
        }
        const converter = new ToWord( amount, currencyData, lang );
        if ( useArabic == true )
        {
            return converter.convertToArabic();
        } else
        {
            return converter.convertToEnglish();
        }

    } catch ( error )
    {
        console.error( 'Error in amount2words:', error );
        return '';
    }
}

/* how use 
 console.log( TimeUnitConverter.convert( "3", "5", "0", "", 0 ) );
 console.log( TimeUnitConverter.convert( "", "", "", "3#2#1", 0 ) );
*/
class TimeUnitConverter
{
    /**
     * تحويل الوحدات الزمنية إلى نص مكتوب
     * @param {string} days - عدد الأيام
     * @param {string} months - عدد الأشهر
     * @param {string} years - عدد السنوات
     * @param {string} combinedValues - قيم مجمعة مفصولة بـ #
     * @param {number} language - اللغة (0 للعربية، 1 للإنجليزية)
     * @returns {string} النص المنسق للوحدات الزمنية
     */
    static convert ( days, months, years, combinedValues, language )
    {
        try
        {
            // معالجة القيم المدخلة
            const { processedDays, processedMonths, processedYears } = this.#processInputValues(
                days,
                months,
                years,
                combinedValues
            );

            // تحويل كل وحدة زمنية
            const daysText = this.#convertUnit( processedDays, 'day', language );
            const monthsText = this.#convertUnit( processedMonths, 'month', language );
            const yearsText = this.#convertUnit( processedYears, 'year', language );

            // دمج النتائج مع الروابط المناسبة
            return this.#combineResults( daysText, monthsText, yearsText, language );
        } catch ( error )
        {
            console.error( 'Error in TimeUnitConverter:', error );
            return '';
        }
    }

    /**
     * معالجة القيم المدخلة وفصل القيم المجمعة إذا لزم الأمر
     */
    static #processInputValues ( days, months, years, combinedValues )
    {
        let result = { processedDays: days, processedMonths: months, processedYears: years };

        if ( combinedValues?.trim() )
        {
            const values = combinedValues.split( '#' );
            result = {
                processedDays: values[ 0 ] || days,
                processedMonths: values[ 1 ] || months,
                processedYears: values[ 2 ] || years,
            };
        }

        return result;
    }

    /**
     * تحويل وحدة زمنية واحدة إلى نص
     */
    static #convertUnit ( value, unitType, language )
    {
        if ( !this.#isNumeric( value ) ) return '';

        const numValue = parseFloat( value );
        if ( numValue === 0 ) return '';

        // إنشاء محول الأرقام
        const currencyData = new SetCurrencyData( 0 );
        const converter = new ToWord( numValue, currencyData, {
            englishPrefixText: '',
            englishSuffixText: '',
            arabicPrefixText: '',
            arabicSuffixText: '',
        } );

        // الحصول على النص حسب اللغة
        const numberText = language === 0
            ? converter.convertToArabic()
            : converter.convertToEnglish();

        // الحصول على تسمية الوحدة المناسبة
        const unitLabel = this.#getUnitLabel( numValue, unitType, language );

        return numberText + unitLabel;
    }

    /**
     * الحصول على تسمية الوحدة حسب العدد واللغة
     */
    static #getUnitLabel ( value, unitType, language )
    {
        const intValue = parseInt( value );
        const units = {
            day: {
                singular: language === 0 ? ' يوم' : ' day',
                plural: language === 0 ? ' أيام' : ' days',
                dual: language === 0 ? ' يومين' : 'two days',
            },
            month: {
                singular: language === 0 ? ' شهر' : ' month',
                plural: language === 0 ? ' أشهر' : ' months',
                dual: language === 0 ? ' شهرين' : 'two months',
            },
            year: {
                singular: language === 0 ? ' سنة' : ' year',
                plural: language === 0 ? ' سنين' : ' years',
                dual: language === 0 ? ' سنتين' : 'two years',
            },
        };

        if ( intValue === 1 ) return units[ unitType ].singular;
        if ( intValue === 2 ) return units[ unitType ].dual;
        if ( intValue >= 3 && intValue <= 10 ) return units[ unitType ].plural;
        return units[ unitType ].plural; // Default for numbers > 10
    }

    /**
     * دمج النصوص الناتجة مع الروابط المناسبة
     */
    static #combineResults ( daysText, monthsText, yearsText, language )
    {
        const parts = [ daysText, monthsText, yearsText ].filter( Boolean );
        if ( parts.length === 0 ) return '';

        if ( parts.length === 1 ) return parts[ 0 ];

        const connector = language === 0 ? ' و' : ' and ';
        return parts.join( connector );
    }

    /**
     * التحقق من أن القيمة رقمية
     */
    static #isNumeric ( value )
    {
        return !isNaN( parseFloat( value ) ) && isFinite( value );
    }
}



