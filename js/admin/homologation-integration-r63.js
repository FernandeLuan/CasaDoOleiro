/* R65 — integração da homologação: shell desktop + Planejamento/Ocupação como páginas reais. */
(function homologationIntegrationR65(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;

  function install(){
    if(window.__OLEIRO_R65_INTEGRATION_INSTALLED__)return;
    window.__OLEIRO_R65_INTEGRATION_INSTALLED__=true;

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
          ${sidebarItem(state.managerPage==='occupancy','fa-bed','Ocupação','openManagerOccupancy()')}
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
      const raw=String(iso||''),match=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if(!match)return {day:'—',short:'—',weekday:'Dia',weekdayShort:'—'};
      const date=new Date(`${raw}T12:00:00`),locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
      let weekday=new Intl.DateTimeFormat(locale,{weekday:'long'}).format(date).replace(/-feira$/i,'');
      weekday=weekday.charAt(0).toUpperCase()+weekday.slice(1);
      return {day:match[3],short:`${match[3]}/${match[2]}`,weekday,weekdayShort:weekday.slice(0,3).toUpperCase()};
    }
    function enhancePlanningDetail(){
      const root=app.querySelector('.planning-detail-page');if(!root)return;
      const p=planningPerson();if(!p)return;
      const tabs=root.querySelector('.person-refactor-tabs'),head=root.querySelector('.planning-profile-head');
      if(tabs&&head&&!tabs.classList.contains('planning-profile-tabs')){tabs.classList.add('planning-profile-tabs');head.appendChild(tabs)}
      root.querySelectorAll('details.planning-day-card[data-plan-date]').forEach(card=>{
        const summary=card.querySelector(':scope > summary');if(!summary||summary.classList.contains('planning-day-reference-head'))return;
        const parts=dateParts(card.dataset.planDate||''),rows=card.querySelectorAll('.planning-session-row').length;
        const oldTotal=summary.querySelector('.planning-day-total strong')?.textContent?.trim()||'0h',adjustment=summary.querySelector('.badge')?.outerHTML||'';
        const confirmed=['meeting','approved'].includes(String(p.status||''));
        const label=rows===0?'Dia livre no cronograma':`${rows} ${rows===1?'atividade':'atividades'} ${confirmed?(rows===1?'confirmada':'confirmadas'):(rows===1?'planejada':'planejadas')}`;
        summary.className='planning-day-head planning-day-reference-head';
        summary.innerHTML=`<div class="planning-day-datebox"><strong>${escapeHtml(parts.day)}</strong><span>${escapeHtml(parts.weekdayShort)}</span></div><div class="planning-day-summarycopy"><strong>${escapeHtml(parts.weekday)} · ${escapeHtml(parts.short)}</strong><span>${escapeHtml(label)}</span>${adjustment}</div><div class="planning-day-total"><strong>${escapeHtml(oldTotal)}</strong><span>Total</span></div>`;
      });
    }

    function occupancyMonth(){return String(state.occupancyScreenMonth||_oleiroToday.slice(0,7))}
    function occupancyMonthParts(){const [year,month]=occupancyMonth().split('-').map(Number);return {year,monthIndex:Math.max(0,(month||1)-1)}}
    function occupancyMonthTitle(){
      const {year,monthIndex}=occupancyMonthParts(),locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
      const text=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(new Date(year,monthIndex,1,12));return text.charAt(0).toUpperCase()+text.slice(1);
    }
    function occupancyWeekdays(){
      const locale=typeof currentLocale==='function'?currentLocale():'pt-BR',sunday=new Date(2021,7,1,12);
      return Array.from({length:7},(_,i)=>{const d=new Date(sunday);d.setDate(sunday.getDate()+i);return new Intl.DateTimeFormat(locale,{weekday:'short'}).format(d).replace('.','').slice(0,3).toUpperCase()});
    }
    function occupancyCells(){
      const {year,monthIndex}=occupancyMonthParts(),first=new Date(year,monthIndex,1,12),last=new Date(year,monthIndex+1,0,12),cells=[];
      for(let i=0;i<first.getDay();i++)cells.push('<span class="occupancy-day occupancy-blank" aria-hidden="true"></span>');
      for(let day=1;day<=last.getDate();day++){
        const iso=`${year}-${String(monthIndex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const people=occupancyPeopleOnDate(iso),dots=typeof occupancyDots==='function'?occupancyDots(people):(people.length?`<small>${people.length}</small>`:'');
        cells.push(`<button class="occupancy-day ${iso===_oleiroToday?'today':''} ${people.length?'has-people':''}" type="button" onclick="openOccupancyDay('${iso}')"><strong>${day}</strong><span class="occupancy-dots">${dots}</span></button>`);
      }
      return cells.join('');
    }
    function occupancyPageHtml(){
      const loading=state.occupancyScreenLoading===true;
      return `<section class="section occupancy-page-screen compact-page-top">
        <div class="planning-index-head occupancy-page-title"><div><span class="eyebrow">Ocupação</span><h1>Ocupação da Casa</h1><p>Visualize os voluntários hospedados em cada dia.</p></div></div>
        <div class="occupancy-screen-nav"><button class="icon-btn" type="button" onclick="shiftOccupancyMonth(-1)" aria-label="Mês anterior"><i class="fa-solid fa-chevron-left"></i></button><strong>${escapeHtml(occupancyMonthTitle())}</strong><button class="icon-btn" type="button" onclick="shiftOccupancyMonth(1)" aria-label="Próximo mês"><i class="fa-solid fa-chevron-right"></i></button></div>
        ${state.occupancyScreenError?`<div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div>${escapeHtml(state.occupancyScreenError)}</div></div>`:''}
        <div class="occupancy-legend occupancy-screen-legend"><span><i class="legend-dot male"></i>Homem</span><span><i class="legend-dot female"></i>Mulher</span><span><i class="legend-dot couple"></i>Casal</span></div>
        <div class="occupancy-weekdays">${occupancyWeekdays().map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>
        <div class="occupancy-calendar occupancy-screen-calendar ${loading?'is-loading':''}">${loading?'<div class="empty compact-loading occupancy-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando ocupação...</div>':occupancyCells()}</div>
      </section>`;
    }

    function renderShell(content){
      releaseStaleScrollLock();
      app.innerHTML=`<div class="admin-shell-r62">${sidebarHtml()}<div class="admin-content-r62">${header()}<main class="page">${content}</main></div></div>`;
      navRoot.innerHTML=managerNav();
      if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
      releaseStaleScrollLock();
    }
    function renderPlanningShell(){renderShell(planningPageHtml());enhancePlanningDetail()}
    function renderOccupancyShell(){renderShell(occupancyPageHtml())}
    function syncRenderedShell(){
      const old=app.querySelector('.admin-sidebar-r62');if(old)old.outerHTML=sidebarHtml();
      app.querySelectorAll('.manager-home-r62-count,.manager-home-count').forEach(node=>node.remove());releaseStaleScrollLock();
    }

    managerNav=function(){
      const item=(icon,label,action,active=false)=>`<button class="nav-btn ${active?'active':''}" onclick="${action}"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;
      return `<nav class="bottom-nav">${item('fa-house','Início',"navigateManager('home')",state.managerPage==='home')}${item('fa-users','Voluntariado',"navigateManager('volunteer')",state.managerPage==='volunteer')}${item('fa-calendar-check','Planejamento',"navigateManager('planning')",state.managerPage==='planning')}${item('fa-calendar-days','Agenda',"navigateManager('agenda')",state.managerPage==='agenda')}${item('fa-bed','Ocupação','openManagerOccupancy()',state.managerPage==='occupancy')}${item('fa-bars','Menu',"navigateManager('menu')",['menu','groups'].includes(state.managerPage))}</nav>`;
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
      state.managerPage='occupancy';state.occupancyScreenMonth=occupancyMonth();state.occupancyScreenError='';state.occupancyScreenLoading=true;
      render();if(typeof afterNavigation==='function')afterNavigation();
      try{
        if(!window.OleiroServices?.applications?.listOccupancyMonth)throw new Error('Serviço de ocupação indisponível.');
        state.occupancyCandidates=await window.OleiroServices.applications.listOccupancyMonth(state.occupancyScreenMonth,{unitId:'all'})||[];
      }catch(error){console.error('Falha ao abrir ocupação:',error);state.occupancyCandidates=[];state.occupancyScreenError=error?.message||'Não foi possível carregar a ocupação.'}
      finally{state.occupancyScreenLoading=false;if(state.managerPage==='occupancy')render()}
    };
    window.shiftOccupancyMonth=function(delta){
      const {year,monthIndex}=occupancyMonthParts(),date=new Date(year,monthIndex+Number(delta||0),1,12);
      state.occupancyScreenMonth=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;state.occupancyCandidates=[];return window.openManagerOccupancy();
    };

    renderManager=function(){
      if(state.managerPage==='planning')return renderPlanningShell();
      if(state.managerPage==='occupancy')return renderOccupancyShell();
      const result=baseRenderManager();syncRenderedShell();navRoot.innerHTML=managerNav();if(typeof applyI18n==='function')applyI18n(navRoot);return result;
    };
    window.renderManager=renderManager;render=function(){return renderManager()};window.render=render;

    if(!document.getElementById('r65AdminNavStyles')){
      const style=document.createElement('style');style.id='r65AdminNavStyles';style.textContent='@media(max-width:1023px){#navRoot .bottom-nav{grid-template-columns:repeat(6,minmax(0,1fr))}#navRoot .nav-btn span{font-size:.56rem}}@media(min-width:1024px){body:not(.modal-open){overflow-y:auto!important;height:auto!important;max-height:none!important}body:not(.modal-open) #app,body:not(.modal-open) .admin-shell-r62,body:not(.modal-open) .admin-content-r62{overflow:visible!important;height:auto!important;max-height:none!important}.occupancy-page-screen{max-width:1180px;margin:0 auto}.occupancy-calendar{min-height:520px}.occupancy-loading{grid-column:1/-1;min-height:420px;display:grid;place-items:center}}';document.head.appendChild(style);
    }

    if(state.role==='manager')render();
  }

  const planningScript=document.querySelector('script[data-planning-page-r53]');
  if(typeof window.closePlanningDetail==='function')return install();
  if(planningScript){planningScript.addEventListener('load',install,{once:true});setTimeout(()=>{if(typeof window.closePlanningDetail==='function')install()},300);return;}
  const script=document.createElement('script');script.dataset.planningPageR53='1';script.src='../js/admin/planning-page-r53.js?v=20260903-r65';script.onload=install;document.body.appendChild(script);
})();
