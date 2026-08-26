/* Navegação compartilhada: troca de tela usa estado em memória. */
function scrollPageTop(){
  const reset=()=>{window.scrollTo({top:0,left:0,behavior:'auto'});document.documentElement.scrollTop=0;document.body.scrollTop=0;const page=document.querySelector('.page');if(page){page.scrollTop=0;page.scrollLeft=0;typeof page.scrollTo==='function'&&page.scrollTo({top:0,left:0,behavior:'auto'})}};
  reset();requestAnimationFrame(reset);setTimeout(reset,40);
}
function afterNavigation(){try{document.activeElement?.blur?.()}catch{}scrollPageTop()}
async function goHome(){
  if(state.role==='manager')state.managerPage='home';else if(state.role==='volunteer')state.volunteerPage='home';render();afterNavigation();
  if(state.role==='manager'&&typeof hydrateManagerSchedule==='function'&&(state.scheduleFrom!==_oleiroToday||state.scheduleTo!==_oleiroToday))hydrateManagerSchedule(_oleiroToday,_oleiroToday).then(()=>{if(state.managerPage==='home')render()}).catch(console.error);
}
function navigateManager(page){
  state.managerPage=page;
  if(page==='agenda'){
    if(!state.agendaFrom||!state.agendaTo){state.agendaFrom=_oleiroToday;state.agendaTo=_oleiroToday;state.agendaAnchor=_oleiroToday;state.selectedDate=_oleiroToday;}
  }
  render();afterNavigation();
  if(page==='groups'&&typeof ensureManagerGroups==='function'&&!state.groupsLoaded)ensureManagerGroups().then(()=>{if(state.managerPage==='groups')render()}).catch(error=>{console.error(error);showToast('Não foi possível carregar os grupos.')});
  if(page==='agenda'&&typeof hydrateManagerSchedule==='function'&&(state.scheduleFrom!==state.agendaFrom||state.scheduleTo!==state.agendaTo))hydrateManagerSchedule(state.agendaFrom,state.agendaTo).then(()=>{if(state.managerPage==='agenda')render()}).catch(error=>{console.error(error);showToast('Não foi possível atualizar a agenda.')});
}
function navigateVolunteer(page){state.volunteerPage=page;render();afterNavigation()}
function header(_subtitle,showBell=false){return `<header class="app-header simplified-header"><div class="brand-row"><div class="brand" role="button" tabindex="0" aria-label="Ir para a tela inicial" onclick="goHome()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goHome()}"><div class="brand-mark"><i class="fa-solid fa-seedling"></i></div><div class="brand-copy"><strong>Casa do Oleiro</strong></div></div><div class="header-actions">${showBell?`<button class="icon-btn" onclick="openNotifications()" aria-label="Atualizações"><i class="fa-regular fa-bell"></i></button>`:''}<button class="icon-btn language-button" onclick="openLanguageModal()" aria-label="Idioma"><span class="current-language-code">${typeof currentLanguageCode==='function'?currentLanguageCode():'PT'}</span></button><button class="icon-btn" onclick="toggleTheme()" aria-label="Tema"><i class="fa-solid ${state.theme==='dark'?'fa-sun':'fa-moon'}"></i></button></div></div></header>`;}
function managerNav(){const items=[['home','fa-house','Início'],['volunteer','fa-users','Voluntariado'],['agenda','fa-calendar-days','Agenda'],['groups','fa-people-group','Grupos'],['menu','fa-bars','Menu']];return `<nav class="bottom-nav">${items.map(([id,ic,tx])=>`<button class="nav-btn ${state.managerPage===id?'active':''}" onclick="navigateManager('${id}')"><i class="fa-solid ${ic}"></i><span>${tx}</span></button>`).join('')}</nav>`;}
function volunteerNav(){const approved=state.volunteerMode==='approved';const items=approved?[['home','fa-house','Início'],['agenda','fa-calendar-check','Agenda'],['stay','fa-location-dot','Estadia'],['info','fa-circle-info','Informações'],['profile','fa-user','Perfil']]:[['home','fa-house','Início'],['plan','fa-calendar-plus','Planejamento'],['stay','fa-location-dot','Estadia'],['info','fa-circle-info','Informações'],['profile','fa-user','Perfil']];if(approved&&state.volunteerPage==='plan')state.volunteerPage='agenda';return `<nav class="bottom-nav">${items.map(([id,ic,tx])=>`<button class="nav-btn ${state.volunteerPage===id?'active':''}" onclick="navigateVolunteer('${id}')"><i class="fa-solid ${ic}"></i><span>${tx}</span></button>`).join('')}</nav>`;}

if('scrollRestoration' in history)history.scrollRestoration='manual';
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
function openDatePicker(inputOrId){const input=typeof inputOrId==='string'?document.getElementById(inputOrId):inputOrId;if(!input||input.disabled)return;try{if(typeof input.showPicker==='function')input.showPicker();else{input.focus();input.click()}}catch{input.focus()}}
document.addEventListener('click',event=>{const input=event.target.closest?.('input[type="date"]')||event.target.closest?.('.date-field,.field')?.querySelector?.('input[type="date"]');if(input)openDatePicker(input);});
