if('scrollRestoration' in history)history.scrollRestoration='manual';

function scrollPageTop(){
  const reset=()=>{
    window.scrollTo(0,0);
    document.documentElement.scrollTop=0;
    document.body.scrollTop=0;
    const page=document.querySelector('.page');
    if(page){page.scrollTop=0;page.scrollLeft=0}
  };
  reset();requestAnimationFrame(reset);setTimeout(reset,60);
}
function navigateManager(page){
  state.managerPage=page;
  if(page==='agenda'){
    state.agendaFrom=_oleiroToday;state.agendaTo=_oleiroToday;state.agendaAnchor=_oleiroToday;state.selectedDate=_oleiroToday;
  }
  render();scrollPageTop();
}
function navigateVolunteer(page){state.volunteerPage=page;render();scrollPageTop()}
function openDatePicker(inputOrId){
  const input=typeof inputOrId==='string'?document.getElementById(inputOrId):inputOrId;
  if(!input||input.disabled)return;
  try{if(typeof input.showPicker==='function')input.showPicker();else{input.focus();input.click()}}catch{input.focus()}
}
document.addEventListener('click',event=>{
  const input=event.target.closest?.('input[type="date"]');
  if(input)openDatePicker(input);
});
