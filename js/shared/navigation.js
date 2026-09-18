/* Navegação compartilhada: troca de tela usa estado em memória e atualiza dados em segundo plano. */
function scrollPageTop(){
  const reset=()=>{window.scrollTo({top:0,left:0,behavior:'auto'});document.documentElement.scrollTop=0;document.body.scrollTop=0;const page=document.querySelector('.page');if(page){page.scrollTop=0;page.scrollLeft=0;typeof page.scrollTo==='function'&&page.scrollTo({top:0,left:0,behavior:'auto'})}};
  reset();
}
function afterNavigation(){if(typeof closeOccupancyDayPopup==='function')closeOccupancyDayPopup();try{document.activeElement?.blur?.()}catch{}scrollPageTop()}
async function goHome(){
  if((state.role==='manager'&&state.managerPage==='home')||(state.role==='volunteer'&&state.volunteerPage==='home'))return;
  if(state.role==='manager')state.managerPage='home';else if(state.role==='volunteer')state.volunteerPage='home';render();afterNavigation();
  if(state.role==='manager'){
    if(typeof hydrateManagerSchedule==='function')hydrateManagerSchedule(_oleiroToday,_oleiroToday,{force:false}).then(()=>{if(state.managerPage==='home')render()}).catch(console.error);
    if(typeof hydrateManagerDashboardData==='function')hydrateManagerDashboardData({force:false}).catch(console.error);
    if(typeof window.hydrateManagerHomeOccupancy==='function')window.hydrateManagerHomeOccupancy({force:false}).catch(console.error);
  }
}
function navigateManager(page){
  page=String(page||'home');
  if(String(state.managerPage||'home')===page)return;
  if(page==='home'&&typeof restoreManagerBrowserCache==='function'){
    const restored=restoreManagerBrowserCache();
    state.managerTodayLoading=!restored.schedule;
    state.managerDashboardLoading=!restored.dashboard;
  }
  state.managerPage=page;
  if(page==='agenda'){
    if(!state.agendaFrom||!state.agendaTo){state.agendaFrom=_oleiroToday;state.agendaTo=_oleiroToday;state.agendaAnchor=_oleiroToday;state.selectedDate=_oleiroToday;}
  }
  render();afterNavigation();
  if(page==='volunteer'&&typeof refreshManagerApplications==='function')refreshManagerApplications().catch(error=>console.error('Não foi possível atualizar os voluntários:',error));
  if(page==='groups'&&typeof ensureManagerGroups==='function'&&!state.groupsLoaded)ensureManagerGroups().then(()=>{if(state.managerPage==='groups')render()}).catch(error=>{console.error(error);showToast('Não foi possível carregar os grupos.')});
  if(page==='agenda'&&typeof hydrateManagerSchedule==='function')hydrateManagerSchedule(state.agendaFrom,state.agendaTo,{force:true}).then(()=>{if(state.managerPage==='agenda')render()}).catch(error=>{console.error(error);showToast('Não foi possível atualizar a agenda.')});
  if(page==='home'){
    if(typeof hydrateManagerDashboardData==='function')hydrateManagerDashboardData({force:false}).catch(console.error);
    if(typeof hydrateManagerSchedule==='function')hydrateManagerSchedule(_oleiroToday,_oleiroToday,{force:false}).then(()=>{state.managerTodayLoading=false;if(state.managerPage==='home')render()}).catch(error=>{state.managerTodayLoading=false;console.error(error);if(state.managerPage==='home')render()});
    if(typeof window.hydrateManagerHomeOccupancy==='function')window.hydrateManagerHomeOccupancy({force:false}).catch(console.error);
  }
}
function navigateVolunteer(page){page=String(page||'home');if(String(state.volunteerPage||'home')===page)return;state.volunteerPage=page;render();afterNavigation()}
function header(){const volunteer=state.role==='volunteer';return `<header class="app-header simplified-header"><div class="brand-row"><div class="brand" role="button" tabindex="0" aria-label="Ir para a tela inicial" onclick="goHome()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goHome()}"><div class="brand-mark"><i class="fa-solid fa-seedling"></i></div><div class="brand-copy"><strong>Casa do Oleiro</strong></div></div><div class="header-actions">${volunteer?'<button class="icon-btn" type="button" onclick="navigateVolunteer(\'info\')" aria-label="Informações da Casa" title="Informações da Casa"><i class="fa-solid fa-circle-info"></i></button>':`<button class="icon-btn language-button" onclick="openLanguageModal()" aria-label="Idioma"><span class="current-language-code">${typeof currentLanguageCode==='function'?currentLanguageCode():'PT'}</span></button><button class="icon-btn" onclick="toggleTheme()" aria-label="Tema"><i class="fa-solid ${state.theme==='dark'?'fa-sun':'fa-moon'}"></i></button>`}</div></div></header>`;}
function managerNav(){const items=[['home','fa-house','Início'],['volunteer','fa-users','Voluntariado'],['agenda','fa-calendar-days','Agenda'],['groups','fa-people-group','Grupos'],['menu','fa-bars','Menu']];return `<nav class="bottom-nav">${items.map(([id,ic,tx])=>`<button class="nav-btn ${state.managerPage===id?'active':''}" onclick="navigateManager('${id}')"><i class="fa-solid ${ic}"></i><span>${tx}</span></button>`).join('')}</nav>`;}
function volunteerNav(){const approved=state.volunteerMode==='approved';const items=approved?[['home','fa-house','Início'],['agenda','fa-calendar-check','Agenda'],['project','fa-seedling','Projeto'],['profile','fa-user','Conta']]:[['home','fa-house','Início'],['plan','fa-calendar-plus','Planejamento'],['project','fa-seedling','Projeto'],['profile','fa-user','Conta']];if(approved&&state.volunteerPage==='plan')state.volunteerPage='agenda';return `<nav class="bottom-nav">${items.map(([id,ic,tx])=>`<button class="nav-btn ${state.volunteerPage===id?'active':''}" onclick="navigateVolunteer('${id}')"><i class="fa-solid ${ic}"></i><span>${tx}</span></button>`).join('')}<button class="nav-btn nav-logout" type="button" onclick="confirmVolunteerLogout()"><i class="fa-solid fa-right-from-bracket"></i><span>Sair</span></button></nav>`;}

if('scrollRestoration' in history)history.scrollRestoration='manual';
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
function openDatePicker(inputOrId){const input=typeof inputOrId==='string'?document.getElementById(inputOrId):inputOrId;if(!input||input.disabled)return;try{if(typeof input.showPicker==='function')input.showPicker();else input.focus()}catch{input.focus()}}
document.addEventListener('click',event=>{if(event.target.closest?.('input[type="date"]'))return;const input=event.target.closest?.('.date-field')?.querySelector?.('input[type="date"]');if(input)openDatePicker(input);});
