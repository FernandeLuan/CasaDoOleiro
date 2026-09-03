/* R64 — integração da homologação: mantém o shell R62 sem bloquear os fluxos reais da UI. */
(function homologationIntegrationR64(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;

  function install(){
    if(window.__OLEIRO_R64_INTEGRATION_INSTALLED__)return;
    window.__OLEIRO_R64_INTEGRATION_INSTALLED__=true;

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

    function releaseStaleScrollLock(){
      if(typeof modalRoot!=='undefined'&&modalRoot?.querySelector?.('.modal-backdrop'))return;
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
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
            <div class="planning-profile-copy">
              <span class="eyebrow">Perfil do candidato</span>
              <div class="planning-profile-title-line"><h1>${escapeHtml(p.name||'Voluntário')}</h1></div>
              <div class="planning-profile-meta"><span>${escapeHtml(p.country||'—')}</span><b>•</b><span>${escapeHtml(p.unit||p.unitName||'—')}</span><b>•</b><span>${escapeHtml(planningDates(p))}</span>${planningBadge(p)}</div>
            </div>
          </div>
          <button class="planning-close-button" type="button" onclick="closePlanningDetail()" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        </header>
        <div class="planning-page-content">${loading?'<div class="empty compact-loading planning-page-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando planejamento...</div>':state.managerPlanningBody||'<div class="empty compact-loading planning-page-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando dados...</div>'}</div>
      </section>`;
    }
    function planningPageHtml(){return state.managerPlanningPersonId?planningDetailHtml():planningListHtml()}

    function dateParts(iso){
      const raw=String(iso||'');
      const match=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if(!match)return {day:'—',short:'—',weekday:'Dia',weekdayShort:'—'};
      const date=new Date(`${raw}T12:00:00`),locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
      let weekday=new Intl.DateTimeFormat(locale,{weekday:'long'}).format(date).replace(/-feira$/i,'');
      weekday=weekday.charAt(0).toUpperCase()+weekday.slice(1);
      const weekdayShort=weekday.slice(0,3).toUpperCase();
      return {day:match[3],short:`${match[3]}/${match[2]}`,weekday,weekdayShort};
    }

    function enhancePlanningDetail(){
      const root=app.querySelector('.planning-detail-page');if(!root)return;
      const p=planningPerson();if(!p)return;
      const tabs=root.querySelector('.person-refactor-tabs');
      const head=root.querySelector('.planning-profile-head');
      if(tabs&&head&&!tabs.classList.contains('planning-profile-tabs')){tabs.classList.add('planning-profile-tabs');head.appendChild(tabs)}
      root.querySelectorAll('details.planning-day-card[data-plan-date]').forEach(card=>{
        const summary=card.querySelector(':scope > summary');if(!summary||summary.classList.contains('planning-day-reference-head'))return;
        const date=card.dataset.planDate||'',parts=dateParts(date),rows=card.querySelectorAll('.planning-session-row').length;
        const oldTotal=summary.querySelector('.planning-day-total strong')?.textContent?.trim()||'0h';
        const adjustment=summary.querySelector('.badge')?.outerHTML||'';
        const confirmed=['meeting','approved'].includes(String(p.status||''));
        const label=rows===0?'Dia livre no cronograma':`${rows} ${rows===1?'atividade':'atividades'} ${confirmed?(rows===1?'confirmada':'confirmadas'):(rows===1?'planejada':'planejadas')}`;
        summary.className='planning-day-head planning-day-reference-head';
        summary.innerHTML=`<div class="planning-day-datebox"><strong>${escapeHtml(parts.day)}</strong><span>${escapeHtml(parts.weekdayShort)}</span></div><div class="planning-day-summarycopy"><strong>${escapeHtml(parts.weekday)} · ${escapeHtml(parts.short)}</strong><span>${escapeHtml(label)}</span>${adjustment}</div><div class="planning-day-total"><strong>${escapeHtml(oldTotal)}</strong><span>Total</span></div>`;
      });
    }

    function renderPlanningShell(){
      releaseStaleScrollLock();
      app.innerHTML=`<div class="admin-shell-r62">${sidebarHtml()}<div class="admin-content-r62">${header()}<main class="page">${planningPageHtml()}</main></div></div>`;
      navRoot.innerHTML=managerNav();
      enhancePlanningDetail();
      if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
      releaseStaleScrollLock();
    }
    function syncRenderedShell(){
      const old=app.querySelector('.admin-sidebar-r62');
      if(old)old.outerHTML=sidebarHtml();
      app.querySelectorAll('.manager-home-r62-count,.manager-home-count').forEach(node=>node.remove());
      releaseStaleScrollLock();
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

    if(!document.getElementById('r64AdminNavStyles')){
      const style=document.createElement('style');style.id='r64AdminNavStyles';style.textContent='@media(max-width:1023px){#navRoot .bottom-nav{grid-template-columns:repeat(6,minmax(0,1fr))}#navRoot .nav-btn span{font-size:.56rem}}@media(min-width:1024px){body:not(.modal-open){overflow-y:auto!important;height:auto!important;max-height:none!important}body:not(.modal-open) #app,body:not(.modal-open) .admin-shell-r62,body:not(.modal-open) .admin-content-r62{overflow:visible!important;height:auto!important;max-height:none!important}}';document.head.appendChild(style);
    }

    if(state.role==='manager')render();
  }

  const planningScript=document.querySelector('script[data-planning-page-r53]');
  if(typeof window.closePlanningDetail==='function')return install();
  if(planningScript){planningScript.addEventListener('load',install,{once:true});setTimeout(()=>{if(typeof window.closePlanningDetail==='function')install()},300);return;}
  const script=document.createElement('script');script.dataset.planningPageR53='1';script.src='../js/admin/planning-page-r53.js?v=20260903-r64';script.onload=install;document.body.appendChild(script);
})();
