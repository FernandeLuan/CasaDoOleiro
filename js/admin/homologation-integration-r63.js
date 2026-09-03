/* R63 — integração da homologação: mantém o shell R62 sem bloquear os fluxos reais da UI. */
(function homologationIntegrationR63(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;

  function install(){
    if(window.__OLEIRO_R63_INTEGRATION_INSTALLED__)return;
    window.__OLEIRO_R63_INTEGRATION_INSTALLED__=true;

    const baseRenderManager=window.renderManager||renderManager;

    function sidebarItem(active,icon,label,action){
      return `<button class="admin-sidebar-item-r62 ${active?'active':''}" type="button" onclick="${action}"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;
    }
    function sidebarHtml(){
      const menuActive=['menu','groups'].includes(state.managerPage);
      return `<aside class="admin-sidebar-r62" aria-label="Navegação da gestão">
        <button class="admin-sidebar-brand-r62" type="button" onclick="goHome()" aria-label="Ir para o início">
          <span class="admin-sidebar-brand-mark-r62"><i class="fa-solid fa-seedling"></i></span>
          <span class="admin-sidebar-brand-copy-r62"><strong>Casa do Oleiro</strong><small>Gestão</small></span>
        </button>
        <nav class="admin-sidebar-nav-r62">
          ${sidebarItem(state.managerPage==='home','fa-house','Início',"navigateManager('home')")}
          ${sidebarItem(state.managerPage==='volunteer','fa-users','Voluntariado',"navigateManager('volunteer')")}
          ${sidebarItem(state.managerPage==='planning','fa-calendar-check','Planejamento',"navigateManager('planning')")}
          ${sidebarItem(state.managerPage==='agenda','fa-calendar-days','Agenda',"navigateManager('agenda')")}
          ${sidebarItem(false,'fa-bed','Ocupação','openManagerOccupancy()')}
          ${sidebarItem(menuActive,'fa-bars','Menu',"navigateManager('menu')")}
        </nav>
        <div class="admin-sidebar-spacer-r62"></div>
        <div class="admin-sidebar-tools-r62">
          ${sidebarItem(false,'fa-language',typeof currentLanguageCode==='function'?`Idioma · ${currentLanguageCode()}`:'Idioma · PT','openLanguageModal()')}
          ${sidebarItem(false,state.theme==='dark'?'fa-sun':'fa-moon',state.theme==='dark'?'Tema claro':'Tema escuro','toggleTheme()')}
        </div>
        <div class="admin-sidebar-account-r62">
          ${sidebarItem(false,'fa-user','Minha conta','openMyAccount()')}
          ${sidebarItem(false,'fa-right-from-bracket','Sair','logout()')}
        </div>
      </aside>`;
    }

    function planningPerson(){return typeof candidateById==='function'?candidateById(state.managerPlanningPersonId):null}
    function planningDates(p){
      const from=String(p?.stayStart||p?.from||'').slice(0,10),to=String(p?.stayEnd||p?.to||'').slice(0,10);
      return from&&to?`${fmtDate(from,true)} → ${fmtDate(to,true)}`:'Período não informado';
    }
    function planningBadge(p){
      const meta=typeof statusMeta==='function'?statusMeta(p?.status):[p?.status||'Status',''];
      return `<span class="badge ${escapeHtml(meta?.[1]||'')}">${escapeHtml(meta?.[0]||'Status')}</span>`;
    }
    function planningListHtml(){
      const rows=(state.candidates||[]).filter(p=>p.status!=='rejected');
      const body=typeof candidateListHtml==='function'?candidateListHtml(rows):rows.map(personCompact).join('');
      return `<section class="section planning-index-page compact-page-top">
        <div class="planning-index-head"><div><span class="eyebrow">Planejamento</span><h1>Planejamentos dos voluntários</h1><p>Consulte, revise e acompanhe os planejamentos em uma tela dedicada.</p></div></div>
        <div class="candidate-tools candidate-tools-compact planning-index-tools"><div class="filter-search candidate-search"><i class="fa-solid fa-magnifying-glass"></i><input id="planningCandidateSearch" class="input" type="search" value="${escapeHtml(state.candidateSearch||'')}" placeholder="Buscar voluntário por nome" oninput="updatePlanningCandidateSearch(this.value)"></div></div>
        <div class="planning-index-count"><span>${rows.length} ${rows.length===1?'perfil':'perfis'} nesta página</span></div>
        <div id="planningCandidateList" class="list planning-candidate-list">${body||'<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>Nenhum planejamento encontrado.</div>'}</div>
      </section>`;
    }
    function planningDetailHtml(){
      const p=planningPerson();
      if(!p)return planningListHtml();
      const loading=state.managerPlanningLoading&&!state.managerPlanningBody;
      return `<section class="section planning-detail-page compact-page-top" data-person-id="${escapeHtml(String(p.id))}">
        <header class="planning-profile-head">
          <div class="planning-profile-heading">
            <button class="planning-back-button" type="button" onclick="closePlanningDetail()" aria-label="Voltar"><i class="fa-solid fa-arrow-left"></i></button>
            <div class="planning-profile-copy"><span class="eyebrow">Perfil do candidato</span><div class="planning-profile-title-line"><h1>${escapeHtml(p.name||'Voluntário')}</h1>${planningBadge(p)}</div><p>${escapeHtml(p.country||'—')} <b>•</b> ${escapeHtml(p.unit||p.unitName||'—')} <b>•</b> ${escapeHtml(planningDates(p))}</p></div>
          </div>
          <button class="planning-close-button" type="button" onclick="closePlanningDetail()" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        </header>
        <div class="planning-page-content">${loading?'<div class="empty compact-loading planning-page-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando planejamento...</div>':state.managerPlanningBody||'<div class="empty compact-loading planning-page-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando dados...</div>'}</div>
      </section>`;
    }
    function planningPageHtml(){return state.managerPlanningPersonId?planningDetailHtml():planningListHtml()}

    function renderPlanningShell(){
      app.innerHTML=`<div class="admin-shell-r62">${sidebarHtml()}<div class="admin-content-r62">${header()}<main class="page">${planningPageHtml()}</main></div></div>`;
      navRoot.innerHTML=managerNav();
      if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
    }
    function syncRenderedShell(){
      const old=app.querySelector('.admin-sidebar-r62');
      if(old)old.outerHTML=sidebarHtml();
      app.querySelectorAll('.manager-home-r62-count,.manager-home-count').forEach(node=>node.remove());
    }

    managerNav=function(){
      const item=(icon,label,action,active=false)=>`<button class="nav-btn ${active?'active':''}" onclick="${action}"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;
      return `<nav class="bottom-nav">${item('fa-house','Início',"navigateManager('home')",state.managerPage==='home')}${item('fa-users','Voluntariado',"navigateManager('volunteer')",state.managerPage==='volunteer')}${item('fa-calendar-check','Planejamento',"navigateManager('planning')",state.managerPage==='planning')}${item('fa-calendar-days','Agenda',"navigateManager('agenda')",state.managerPage==='agenda')}${item('fa-bed','Ocupação','openManagerOccupancy()',false)}${item('fa-bars','Menu',"navigateManager('menu')",['menu','groups'].includes(state.managerPage))}</nav>`;
    };
    window.managerNav=managerNav;

    const oldOccupancyPeople=typeof occupancyPeopleOnDate==='function'?occupancyPeopleOnDate:null;
    occupancyPeopleOnDate=function(iso){
      const source=Array.isArray(state.occupancyCandidates)?state.occupancyCandidates:(state.candidates||[]);
      if(!source.length&&oldOccupancyPeople)return oldOccupancyPeople(iso);
      return source.filter(p=>p.status==='approved'&&!p.inactive&&p.from&&p.to&&p.from<=iso&&p.to>=iso);
    };
    window.occupancyPeopleOnDate=occupancyPeopleOnDate;

    window.openManagerOccupancy=async function(){
      try{
        if(typeof occupancyMonthAnchor==='function'&&window.OleiroServices?.applications?.listOccupancyMonth){
          const anchor=occupancyMonthAnchor();
          const month=`${anchor.getFullYear()}-${String(anchor.getMonth()+1).padStart(2,'0')}`;
          state.occupancyCandidates=await window.OleiroServices.applications.listOccupancyMonth(month,{unitId:'all'})||[];
        }
        if(typeof window.openOccupancyCalendar==='function')return window.openOccupancyCalendar();
        if(typeof openOccupancyCalendar==='function')return openOccupancyCalendar();
        throw new Error('Calendário de ocupação indisponível.');
      }catch(error){
        console.error('Falha ao abrir ocupação:',error);
        if(typeof showToast==='function')showToast('Não foi possível abrir o calendário de ocupação.');
      }
    };
    shiftOccupancyMonth=async function(delta){
      const d=occupancyMonthAnchor();d.setMonth(d.getMonth()+delta,1);state.occupancyMonthAnchor=occupancyIso(d);return window.openManagerOccupancy();
    };
    window.shiftOccupancyMonth=shiftOccupancyMonth;

    renderManager=function(){
      if(state.managerPage==='planning')return renderPlanningShell();
      const result=baseRenderManager();
      syncRenderedShell();
      navRoot.innerHTML=managerNav();
      if(typeof applyI18n==='function')applyI18n(navRoot);
      return result;
    };
    window.renderManager=renderManager;
    render=function(){return renderManager()};
    window.render=render;

    if(!document.getElementById('r63AdminNavStyles')){
      const style=document.createElement('style');style.id='r63AdminNavStyles';style.textContent='@media(max-width:1023px){#navRoot .bottom-nav{grid-template-columns:repeat(6,minmax(0,1fr))}#navRoot .nav-btn span{font-size:.56rem}}';document.head.appendChild(style);
    }

    if(state.role==='manager')render();
  }

  const planningScript=document.querySelector('script[data-planning-page-r53]');
  if(typeof window.closePlanningDetail==='function')return install();
  if(planningScript){planningScript.addEventListener('load',install,{once:true});setTimeout(()=>{if(typeof window.closePlanningDetail==='function')install()},300);return;}
  const script=document.createElement('script');script.dataset.planningPageR53='1';script.src='../js/admin/planning-page-r53.js?v=20260903-r53';script.onload=install;document.body.appendChild(script);
})();
