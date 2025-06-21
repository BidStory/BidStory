 
  // @ts-ignore
//رساله انتظار تحميل شئ 
//يجب ان تغلق ب  Swal.close();
async function waitMes ()
{
  // @ts-ignore
  const mes = getLang( 371 );
  // @ts-ignore
  Swal.fire( {
    title: false,
    text: mes,
    allowOutsideClick: false,
    didOpen: () =>
    {
      // @ts-ignore
      Swal.showLoading();
    }
  } );
}

async function showNumberInputDialog(titleText) {
     // @ts-ignore
  const agree = getLang( 34 );
      // @ts-ignore
    const dis_agree = getLang( 220 );
  // @ts-ignore
  const { value: number } = await Swal.fire({
    title: titleText,
    input: 'number',
    inputLabel: '',
    inputPlaceholder: '',
    showCancelButton: true,
    confirmButtonText: agree,
    cancelButtonText: dis_agree,
    inputAttributes: {
      min: 0,
      step: 1
    },
    allowOutsideClick: false
  });

  return number !== undefined ? Number(number) : null;
}

async function showMessageDialog(titleText, messageText) {
  // @ts-ignore
  await Swal.fire({
    title: titleText,
    text: messageText,
    icon: 'info',
    confirmButtonText: 'حسنًا',
    allowOutsideClick: false
  });
}
async function showConfirmDialog(titleText, messageText) {
         // @ts-ignore
  const agree = getLang( 34 );
      // @ts-ignore
    const dis_agree = getLang( 220 );
  // @ts-ignore
  const result = await Swal.fire({
    title: titleText,
    text: messageText,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: agree,
    cancelButtonText: dis_agree,
    allowOutsideClick: false
  });

  return result.isConfirmed; // ✅ ترجع true إذا اختار "موافق"، false إذا اختار "إلغاء"
}
