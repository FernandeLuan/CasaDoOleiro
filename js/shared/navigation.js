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

/* Homologação R62: carrega somente o adapter de Auth/Services quando ?demo=... estiver presente. */
(function loadProdCopyNoLogin(){
  if(!new URLSearchParams(location.search).has('demo'))return;
  const current=document.currentScript?.src;if(!current||typeof document.write!=='function')return;
  const base=new URL('./',current);
  const src=new URL('../demo/prod-copy-no-login.js?v=20260902-r62',base).href;
  const massSrc=new URL('../demo/demo-mass-r62.js?v=20260902-r62-mass1',base).href;
  document.write(`<script src="${src}"><\/script><script src="${massSrc}"><\/script>`);
})();

/* Homologação R62 Admin: aplica a composição final da Home somente depois que todos
   os refinamentos históricos já terminaram de carregar. Em seguida, a integração R65
   reconecta Planejamento/Ocupação, o board R65 redesenha o índice, a R66 transforma
   o planejamento individual em agenda semanal, a R67 compacta a Home/libera scroll
   e a R68 alinha os status ao nome na listagem de Voluntariado. */
(function loadFinalAdminHomeR62(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  const current=document.currentScript?.src;if(!current)return;
  window.addEventListener('load',()=>{
    if(document.querySelector('script[data-r62-admin-home]'))return;
    const script=document.createElement('script');
    script.dataset.r62AdminHome='true';
    script.src=new URL('../admin/home-r62-final.js?v=20260902-r62-home2',new URL('./',current)).href;
    script.onload=()=>{
      if(document.querySelector('script[data-r65-admin-integration]'))return;
      const integration=document.createElement('script');
      integration.dataset.r65AdminIntegration='true';
      integration.src=new URL('../admin/homologation-integration-r63.js?v=20260903-r65',new URL('./',current)).href;
      integration.onload=()=>{
        if(document.querySelector('script[data-r65-planning-board]'))return;
        const board=document.createElement('script');
        board.dataset.r65PlanningBoard='true';
        board.src=new URL('../admin/planning-board-r65.js?v=20260903-r65',new URL('./',current)).href;
        board.onload=()=>{
          if(document.querySelector('script[data-r66-planning-person-agenda]'))return;
          const agenda=document.createElement('script');
          agenda.dataset.r66PlanningPersonAgenda='true';
          agenda.src=new URL('../admin/planning-person-agenda-r66.js?v=20260903-r66',new URL('./',current)).href;
          agenda.onload=()=>{
            if(document.querySelector('script[data-r67-admin-home]'))return;
            const home=document.createElement('script');
            home.dataset.r67AdminHome='true';
            home.src=new URL('../admin/home-r67-layout.js?v=20260903-r67',new URL('./',current)).href;
            home.onload=()=>{
              if(document.querySelector('script[data-r68-volunteer-status-inline]'))return;
              const volunteer=document.createElement('script');
              volunteer.dataset.r68VolunteerStatusInline='true';
              volunteer.src=new URL('../admin/volunteer-status-inline-r68.js?v=20260903-r68',new URL('./',current)).href;
              document.body.appendChild(volunteer);
            };
            document.body.appendChild(home);
          };
          document.body.appendChild(agenda);
        };
        document.body.appendChild(board);
      };
      document.body.appendChild(integration);
    };
    document.body.appendChild(script);
  },{once:true});
})();
