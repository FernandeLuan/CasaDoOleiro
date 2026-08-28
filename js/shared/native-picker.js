/* Native date/time pickers: the whole input opens the browser picker when supported. */
(function nativePickerInputs(){
  function openPicker(input){
    if(!input||input.disabled||input.readOnly)return;
    try{
      if(typeof input.showPicker==='function'){input.showPicker();return}
    }catch(error){
      if(!['InvalidStateError','NotAllowedError','SecurityError'].includes(String(error?.name||'')))console.debug('Native picker indisponível:',error?.message||error);
    }
    try{input.focus({preventScroll:true})}catch{input.focus()}
  }
  document.addEventListener('click',event=>{
    const input=event.target?.closest?.('input[type="date"],input[type="time"]');
    if(input)openPicker(input);
  });
  window.OleiroNativePicker={open:openPicker};
})();
