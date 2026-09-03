/* Navegação compartilhada: troca de tela usa estado em memória e atualiza dados em segundo plano. */
function scrollPageTop(){
  const reset=()=>{window.scrollTo({top:0,left:0,behavior:'auto'});document.documentElement.scrollTop=0;document.body.scrollTop=0;const page=document.querySelector('.page');if(page){page.scrollTop=0;page.scrollLeft=0;typeof page.scrollTo==='function'&&page.scrollTo({top:0,left:0,behavior:'auto'})}};
  reset();requestAnimationFrame(reset);setTimeout(reset,40);
}
function afterNavigation(){try{document.activeElement?.blur?.()}catch{}scrollPageTop()}
async function goHome(){
  if(state.role==='manager')state.managerPage='home';else if(state.role==='volunteer')state.volunteerPage='home';render();afterNavigation();
  if(state.role==='manager'){
    if(typeof refreshManagerApplications==='function')refreshManagerApplications().catch(console.error);
    if(typeof hydrateManagerSchedule==='function')hydrateManagerSchedule(_oleiroToday,_oleiroToday,{force:true}).then(()=>{if(state.managerPage==='home')render()}).catch(console.error);
  }
}
function navigateManager(page){
  state.managerPage=page;
  if(page==='agenda'){
    if(!state.agendaFrom||!state.agendaTo){state.agendaFrom=_oleiroToday;state.agendaTo=_oleiroToday;state.agendaAnchor=_oleiroToday;state.selectedDate=_oleiroToday;}
  }
  render();afterNavigation();
  if(page==='volunteer'&&typeof refreshManagerApplications==='function')refreshManagerApplications().catch(error=>console.error('Não foi possível atualizar os voluntários:',error));
  if(page==='groups'&&typeof ensureManagerGroups==='function'&&!state.groupsLoaded)ensureManagerGroups().then(()=>{if(state.managerPage==='groups')render()}).catch(error=>{console.error(error);showToast('Não foi possível carregar os grupos.')});
  if(page==='agenda'&&typeof hydrateManagerSchedule==='function')hydrateManagerSchedule(state.agendaFrom,state.agendaTo,{force:true}).then(()=>{if(state.managerPage==='agenda')render()}).catch(error=>{console.error(error);showToast('Não foi possível atualizar a agenda.')});
}
function navigateVolunteer(page){state.volunteerPage=page;render();afterNavigation()}
function header(){return `<header class="app-header simplified-header"><div class="brand-row"><div class="brand" role="button" tabindex="0" aria-label="Ir para a tela inicial" onclick="goHome()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goHome()}"><div class="brand-mark"><i class="fa-solid fa-seedling"></i></div><div class="brand-copy"><strong>Casa do Oleiro</strong></div></div><div class="header-actions"><button class="icon-btn language-button" onclick="openLanguageModal()" aria-label="Idioma"><span class="current-language-code">${typeof currentLanguageCode==='function'?currentLanguageCode():'PT'}</span></button><button class="icon-btn" onclick="toggleTheme()" aria-label="Tema"><i class="fa-solid ${state.theme==='dark'?'fa-sun':'fa-moon'}"></i></button></div></div></header>`;}
function managerNav(){const items=[['home','fa-house','Início'],['volunteer','fa-users','Voluntariado'],['agenda','fa-calendar-days','Agenda'],['groups','fa-people-group','Grupos'],['menu','fa-bars','Menu']];return `<nav class="bottom-nav">${items.map(([id,ic,tx])=>`<button class="nav-btn ${state.managerPage===id?'active':''}" onclick="navigateManager('${id}')"><i class="fa-solid ${ic}"></i><span>${tx}</span></button>`).join('')}</nav>`;}
function volunteerNav(){const approved=state.volunteerMode==='approved';const items=approved?[['home','fa-house','Início'],['agenda','fa-calendar-check','Agenda'],['stay','fa-location-dot','Estadia'],['info','fa-circle-info','Informações'],['profile','fa-user','Perfil']]:[['home','fa-house','Início'],['plan','fa-calendar-plus','Planejamento'],['stay','fa-location-dot','Estadia'],['info','fa-circle-info','Informações'],['profile','fa-user','Perfil']];if(approved&&state.volunteerPage==='plan')state.volunteerPage='agenda';return `<nav class="bottom-nav">${items.map(([id,ic,tx])=>`<button class="nav-btn ${state.volunteerPage===id?'active':''}" onclick="navigateVolunteer('${id}')"><i class="fa-solid ${ic}"></i><span>${tx}</span></button>`).join('')}</nav>`;}

if('scrollRestoration' in history)history.scrollRestoration='manual';
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
function openDatePicker(inputOrId){const input=typeof inputOrId==='string'?document.getElementById(inputOrId):inputOrId;if(!input||input.disabled)return;try{if(typeof input.showPicker==='function')input.showPicker();else input.focus()}catch{input.focus()}}
document.addEventListener('click',event=>{if(event.target.closest?.('input[type="date"]'))return;const input=event.target.closest?.('.date-field')?.querySelector?.('input[type="date"]');if(input)openDatePicker(input);});

/* Homologação: somente Auth/IO e dados são substituídos quando ?demo=... está presente. */
(function loadHomologationData(){
  if(!new URLSearchParams(location.search).has('demo'))return;
  const current=document.currentScript?.src;if(!current||typeof document.write!=='function')return;
  const base=new URL('./',current);
  const files=['../demo/prod-copy-no-login.js','../demo/demo-mass-r62.js','../demo/demo-scenarios-r77.js'];
  document.write(files.map((file,index)=>`<script src="${new URL(`${file}?v=20260903-clean-${index+1}`,base).href}"><\/script>`).join(''));
})();

/* Homologação Admin: módulos visuais legados são carregados em ordem explícita, sem cadeia de onload entre patches. */
(function loadHomologationAdminUi(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  const current=document.currentScript?.src;if(!current)return;
  const base=new URL('./',current);
  const files=[
    '../admin/home-r62-final.js',
    '../admin/homologation-integration-r63.js',
    '../admin/planning-board-r65.js',
    '../admin/planning-person-agenda-r66.js',
    '../admin/home-r67-layout.js',
    '../admin/volunteer-status-inline-r68.js',
    '../admin/planning-profile-layout-r69.js',
    '../admin/account-consolidated-r70.js',
    '../admin/profile-polish-r72.js',
    '../admin/emergency-contact-sync-r73.js',
    '../admin/account-consistency-r74.js',
    '../admin/account-emergency-live-r75.js'
  ];
  const load=(file,index)=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.dataset.homologationUi=String(index+1);
    script.src=new URL(`${file}?v=20260903-clean-${index+1}`,base).href;
    script.onload=resolve;
    script.onerror=()=>reject(new Error(`Falha ao carregar módulo de homologação: ${file}`));
    document.body.appendChild(script);
  });
  window.addEventListener('load',async()=>{
    try{for(let index=0;index<files.length;index+=1)await load(files[index],index)}
    catch(error){console.error(error);if(typeof showToast==='function')showToast('Falha ao carregar a interface de homologação.')}
  },{once:true});
})();
