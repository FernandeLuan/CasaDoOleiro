/* Shell da homologação: navegação desktop, Planejamento e Ocupação como páginas reais. */
(function homologationShell(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;

  function installShellStyles(){
    if(document.getElementById('homologationShellStyles'))return;
    const style=document.createElement('style');
    style.id='homologationShellStyles';
    style.textContent=`
      .admin-sidebar-r62{display:none}
      @media(min-width:1024px){
        body{padding-bottom:0!important}
        #app{width:100%!important;max-width:none!important;margin:0!important;min-height:100vh!important}
        .admin-shell-r62{min-height:100vh;width:100%;background:var(--bg)}
        .admin-shell-r62>.admin-content-r62>.app-header{display:none!important}
        #navRoot .bottom-nav{display:none!important}
        .admin-sidebar-r62{position:fixed;z-index:55;inset:0 auto 0 0;width:216px;display:flex;flex-direction:column;padding:18px 14px 16px;background:var(--surface);border-right:1px solid var(--border);box-shadow:10px 0 30px rgba(20,43,31,.035)}
        .admin-sidebar-brand-r62{width:100%;border:0;background:transparent;color:var(--text);display:grid;grid-template-columns:42px minmax(0,1fr);gap:10px;align-items:center;text-align:left;padding:6px 7px 18px;margin-bottom:8px;border-bottom:1px solid var(--border)}
        .admin-sidebar-brand-mark-r62{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,var(--primary),#234936);color:#fff;box-shadow:var(--shadow)}
        .admin-sidebar-brand-copy-r62{min-width:0}
        .admin-sidebar-brand-copy-r62 strong{display:block;font-size:.84rem;line-height:1.15}
        .admin-sidebar-brand-copy-r62 small{display:block;margin-top:3px;font-size:.6rem;color:var(--muted);font-family:var(--font-body)}
        .admin-sidebar-nav-r62,.admin-sidebar-tools-r62,.admin-sidebar-account-r62{display:grid;gap:5px}
        .admin-sidebar-item-r62{width:100%;min-height:44px;border:0;background:transparent;color:var(--muted);border-radius:13px;padding:0 12px;display:grid;grid-template-columns:24px minmax(0,1fr);gap:9px;align-items:center;text-align:left;font-size:.71rem;font-weight:600}
        .admin-sidebar-item-r62 i{width:24px;text-align:center;font-size:.84rem}
        .admin-sidebar-item-r62:hover{background:var(--surface-2);color:var(--text)}
        .admin-sidebar-item-r62.active{background:var(--primary);color:#fff}
        .admin-sidebar-spacer-r62{flex:1;min-height:28px}
        .admin-sidebar-tools-r62{padding:10px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
        .admin-sidebar-account-r62{padding-top:10px}
        .admin-sidebar-account-r62 .admin-sidebar-item-r62:last-child{color:var(--danger)}
        .admin-content-r62{margin-left:216px;width:calc(100% - 216px);min-height:100vh}
        .admin-content-r62>.page{width:100%;max-width:none!important;padding:18px clamp(18px,1.35vw,28px) 44px!important}
        body:not(.modal-open){overflow-y:auto!important;height:auto!important;max-height:none!important}
        body:not(.modal-open) #app,body:not(.modal-open) .admin-shell-r62,body:not(.modal-open) .admin-content-r62{overflow:visible!important;height:auto!important;max-height:none!important}

        .occupancy-page-screen{max-width:1320px;margin:0 auto;display:grid;gap:16px}
        .occupancy-page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}
        .occupancy-page-head h1{margin:4px 0 4px;font-size:clamp(1.65rem,2.2vw,2.25rem);letter-spacing:-.03em}
        .occupancy-page-head p{margin:0;color:var(--muted);font-size:.76rem}
        .occupancy-month-nav{display:flex;align-items:center;justify-content:center;gap:14px;background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:8px 10px;box-shadow:var(--shadow)}
        .occupancy-month-nav strong{min-width:160px;text-align:center;font-size:.78rem;color:var(--text);text-transform:capitalize}
        .occupancy-month-nav .icon-btn{width:38px;height:38px;border-radius:12px}

        .occupancy-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .occupancy-metric{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:16px 18px;display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:12px;box-shadow:var(--shadow)}
        .occupancy-metric-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary)}
        .occupancy-metric strong{display:block;font-size:1.12rem;line-height:1.05}
        .occupancy-metric span{display:block;margin-top:4px;color:var(--muted);font-size:.66rem}

        .occupancy-calendar-card{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:18px;box-shadow:var(--shadow)}
        .occupancy-calendar-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:14px}
        .occupancy-calendar-toolbar strong{font-size:.76rem}
        .occupancy-legend{display:flex;align-items:center;flex-wrap:wrap;gap:12px;color:var(--muted);font-size:.62rem}
        .occupancy-legend span{display:inline-flex;align-items:center;gap:6px}
        .occupancy-person-dot{display:inline-block;width:8px;height:8px;border-radius:999px;background:var(--primary)}
        .occupancy-person-dot.female{background:#9a6f7f}
        .occupancy-person-dot.couple{width:15px;border-radius:5px;background:#9b7c4e}
        .occupancy-calendar-wrap{overflow-x:auto;padding-bottom:2px}
        .occupancy-weekdays,.occupancy-calendar{min-width:860px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
        .occupancy-weekdays{margin-bottom:8px}
        .occupancy-weekdays span{padding:0 8px;color:var(--muted);font-size:.59rem;font-weight:700;letter-spacing:.08em;text-align:center}
        .occupancy-calendar{min-height:520px}
        .occupancy-day{min-height:112px;border:1px solid var(--border);border-radius:16px;background:var(--surface);color:var(--text);padding:11px;display:flex;flex-direction:column;align-items:stretch;text-align:left;transition:border-color .16s ease,transform .16s ease,box-shadow .16s ease}
        button.occupancy-day{cursor:pointer}
        button.occupancy-day:hover{border-color:color-mix(in srgb,var(--primary) 45%,var(--border));transform:translateY(-1px);box-shadow:0 8px 22px rgba(20,43,31,.07)}
        .occupancy-day.weekend{background:color-mix(in srgb,var(--surface-2) 72%,var(--surface))}
        .occupancy-day.today{border-color:var(--primary);box-shadow:inset 0 0 0 1px var(--primary)}
        .occupancy-day.selected{background:var(--primary-soft);border-color:var(--primary)}
        .occupancy-day.has-people .occupancy-day-count{color:var(--primary)}
        .occupancy-day-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .occupancy-day-top>strong{font-size:.78rem}
        .occupancy-today-label{font-size:.5rem;font-weight:700;letter-spacing:.06em;color:var(--primary);text-transform:uppercase}
        .occupancy-day-count{margin-top:14px;font-family:var(--font-heading);font-size:.84rem;font-weight:700;color:var(--muted)}
        .occupancy-day-count small{font-family:var(--font-body);font-weight:500;font-size:.56rem;color:var(--muted);margin-left:3px}
        .occupancy-day-dots{min-height:14px;margin-top:8px;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
        .occupancy-day-empty{margin-top:8px;font-size:.58rem;color:var(--muted)}
        .occupancy-day-flows{margin-top:auto;padding-top:8px;display:flex;gap:5px;flex-wrap:wrap}
        .occupancy-flow{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:4px 7px;font-size:.5rem;font-weight:700;background:var(--surface-2);color:var(--muted)}
        .occupancy-flow.arrival{color:var(--primary);background:var(--primary-soft)}
        .occupancy-flow.departure{color:var(--text)}
        .occupancy-blank{border:1px dashed transparent;background:transparent;min-height:112px}
        .occupancy-loading{grid-column:1/-1;min-height:420px;display:grid;place-items:center}

        .occupancy-day-panel{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:20px;box-shadow:var(--shadow)}
        .occupancy-day-panel-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:14px}
        .occupancy-day-panel-head h2{margin:4px 0 0;font-size:1.05rem}
        .occupancy-day-panel-head p{margin:0;color:var(--muted);font-size:.66rem}
        .occupancy-day-guests{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .occupancy-guest{border:1px solid var(--border);border-radius:16px;padding:14px 15px;display:flex;align-items:center;justify-content:space-between;gap:14px;background:var(--surface)}
        .occupancy-guest-main{min-width:0}
        .occupancy-guest-main strong{display:block;font-size:.72rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .occupancy-guest-main span{display:block;margin-top:4px;color:var(--muted);font-size:.59rem}
        .occupancy-guest-badges{display:flex;justify-content:flex-end;gap:5px;flex-wrap:wrap}
        .occupancy-guest-badge{border-radius:999px;padding:5px 8px;font-size:.5rem;font-weight:700;background:var(--surface-2);color:var(--muted);white-space:nowrap}
        .occupancy-guest-badge.arrival{background:var(--primary-soft);color:var(--primary)}
        .occupancy-guest-badge.departure{background:var(--surface-2);color:var(--text)}
      }
      @media(max-width:1023px){
        .admin-sidebar-r62{display:none!important}
        .admin-content-r62{margin-left:0;width:100%}
        #navRoot .bottom-nav{grid-template-columns:repeat(5,minmax(0,1fr))}
        #navRoot .nav-btn span{font-size:.56rem}
        .occupancy-page-head{align-items:flex-start;flex-direction:column}
        .occupancy-month-nav{width:100%}
        .occupancy-month-nav strong{flex:1}
        .occupancy-metrics{grid-template-columns:1fr}
        .occupancy-day-guests{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  }

  function install(){
    if(window.__OLEIRO_HOMOLOGATION_SHELL__)return;
    window.__OLEIRO_HOMOLOGATION_SHELL__=true;
    installShellStyles();

    function sidebarItem(active,icon,label,action){
      return `<button class="admin-sidebar-item-r62 ${active?'active':''}" type="button" onclick="${action}"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;
    }
    function sidebarHtml(){
      const menuActive=['menu','groups'].includes(state.managerPage);
      return `<aside class="admin-sidebar-r62" aria-label="Navegação da gestão">
        <button class="admin-sidebar-brand-r62" type="button" onclick="goHome()" aria-label="Ir para o início"><span class="admin-sidebar-brand-mark-r62"><i class="fa-solid fa-seedling"></i></span><span class="admin-sidebar-brand-copy-r62"><strong>Casa do Oleiro</strong><small>Gestão</small></span></button>
        <nav class="admin-sidebar-nav-r62">
          ${sidebarItem(state.managerPage==='home','fa-house','Início',"navigateManager('home')")}
          ${sidebarItem(state.managerPage==='volunteer','fa-users','Voluntariado',"navigateManager('volunteer')")}
          ${sidebarItem(state.managerPage==='planning','fa-calendar-check','Planejamento',"navigateManager('planning')")}
          ${sidebarItem(state.managerPage==='occupancy','fa-bed','Ocupação','openManagerOccupancy()')}
          ${sidebarItem(menuActive,'fa-bars','Menu',"navigateManager('menu')")}
        </nav>
        <div class="admin-sidebar-spacer-r62"></div>
        <div class="admin-sidebar-tools-r62">${sidebarItem(false,'fa-language',typeof currentLanguageCode==='function'?`Idioma · ${currentLanguageCode()}`:'Idioma · PT','openLanguageModal()')}${sidebarItem(false,state.theme==='dark'?'fa-sun':'fa-moon',state.theme==='dark'?'Tema claro':'Tema escuro','toggleTheme()')}</div>
        <div class="admin-sidebar-account-r62">${sidebarItem(false,'fa-user','Minha conta','openMyAccount()')}${sidebarItem(false,'fa-right-from-bracket','Sair','logout()')}</div>
      </aside>`;
    }

    function releaseStaleScrollLock(){
      if(typeof modalRoot!=='undefined'&&modalRoot?.querySelector?.('.modal-backdrop'))return;
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('height');
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('height');
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
      return `<section class="section planning-index-page compact-page-top"><div class="planning-index-head"><div><span class="eyebrow">Planejamento</span><h1>Planejamentos dos voluntários</h1><p>Consulte, revise e acompanhe os planejamentos em uma tela dedicada.</p></div></div><div class="candidate-tools candidate-tools-compact planning-index-tools"><div class="filter-search candidate-search"><i class="fa-solid fa-magnifying-glass"></i><input id="planningCandidateSearch" class="input" type="search" value="${escapeHtml(state.candidateSearch||'')}" placeholder="Buscar voluntário por nome" oninput="updatePlanningCandidateSearch(this.value)"></div></div><div class="planning-index-count"><span>${rows.length} ${rows.length===1?'perfil':'perfis'} nesta página</span></div><div id="planningCandidateList" class="list planning-candidate-list">${body||'<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>Nenhum planejamento encontrado.</div>'}</div></section>`;
    }
    function planningDetailHtml(){
      const p=planningPerson();
      if(!p)return planningListHtml();
      const loading=state.managerPlanningLoading&&!state.managerPlanningBody;
      return `<section class="section planning-detail-page compact-page-top" data-person-id="${escapeHtml(String(p.id))}"><header class="planning-profile-head"><div class="planning-profile-heading"><div class="planning-profile-copy"><span class="eyebrow">Perfil do candidato</span><div class="planning-profile-title-line"><h1>${escapeHtml(p.name||'Voluntário')}</h1></div><div class="planning-profile-meta"><span>${escapeHtml(p.country||'—')}</span><b>•</b><span>${escapeHtml(p.unit||p.unitName||'—')}</span><b>•</b><span>${escapeHtml(planningDates(p))}</span>${planningBadge(p)}</div></div></div><button class="planning-close-button" type="button" onclick="closePlanningDetail()" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button></header><div class="planning-page-content">${loading?'<div class="empty compact-loading planning-page-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando planejamento...</div>':state.managerPlanningBody||'<div class="empty compact-loading planning-page-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando dados...</div>'}</div></section>`;
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
      const root=app.querySelector('.planning-detail-page');
      if(!root)return;
      const p=planningPerson();
      if(!p)return;
      const tabs=root.querySelector('.person-refactor-tabs'),head=root.querySelector('.planning-profile-head');
      if(tabs&&head&&!tabs.classList.contains('planning-profile-tabs')){tabs.classList.add('planning-profile-tabs');head.appendChild(tabs)}
      root.querySelectorAll('details.planning-day-card[data-plan-date]').forEach(card=>{
        const summary=card.querySelector(':scope > summary');
        if(!summary||summary.classList.contains('planning-day-reference-head'))return;
        const parts=dateParts(card.dataset.planDate||''),rows=card.querySelectorAll('.planning-session-row').length;
        const oldTotal=summary.querySelector('.planning-day-total strong')?.textContent?.trim()||'0h',adjustment=summary.querySelector('.badge')?.outerHTML||'';
        const confirmed=['meeting','approved'].includes(String(p.status||''));
        const label=rows===0?'Dia livre no cronograma':`${rows} ${rows===1?'atividade':'atividades'} ${confirmed?(rows===1?'confirmada':'confirmadas'):(rows===1?'planejada':'planejadas')}`;
        summary.className='planning-day-head planning-day-reference-head';
        summary.innerHTML=`<div class="planning-day-datebox"><strong>${escapeHtml(parts.day)}</strong><span>${escapeHtml(parts.weekdayShort)}</span></div><div class="planning-day-summarycopy"><strong>${escapeHtml(parts.weekday)} · ${escapeHtml(parts.short)}</strong><span>${escapeHtml(label)}</span>${adjustment}</div><div class="planning-day-total"><strong>${escapeHtml(oldTotal)}</strong><span>Total</span></div>`;
      });
    }

    function occupancyMonth(){return String(state.occupancyScreenMonth||_oleiroToday.slice(0,7))}
    function occupancyMonthParts(){
      const [year,month]=occupancyMonth().split('-').map(Number);
      return {year,monthIndex:Math.max(0,(month||1)-1)};
    }
    function occupancyMonthTitle(){
      const {year,monthIndex}=occupancyMonthParts(),locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
      const text=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(new Date(year,monthIndex,1,12));
      return text.charAt(0).toUpperCase()+text.slice(1);
    }
    function occupancyWeekdays(){
      const locale=typeof currentLocale==='function'?currentLocale():'pt-BR',sunday=new Date(2021,7,1,12);
      return Array.from({length:7},(_,i)=>{
        const d=new Date(sunday);d.setDate(sunday.getDate()+i);
        return new Intl.DateTimeFormat(locale,{weekday:'short'}).format(d).replace('.','').slice(0,3).toUpperCase();
      });
    }
    function occupancySource(){
      return Array.isArray(state.occupancyCandidates)?state.occupancyCandidates:[];
    }
    function occupancyGuestCount(rows){
      return (rows||[]).reduce((sum,p)=>sum+Math.max(1,Number(p.participantCount)||p.participantNames?.length||1),0);
    }
    function occupancyFlowCount(rows,field,iso){
      return occupancyGuestCount((rows||[]).filter(p=>String(p?.[field]||'').slice(0,10)===iso));
    }
    function occupancyMarkers(rows){
      const markers=[];
      (rows||[]).forEach(person=>{
        const genders=Array.isArray(person.participantGenders)&&person.participantGenders.length?person.participantGenders:['male'];
        const isCouple=person.type==='couple'||Math.max(1,Number(person.participantCount)||person.participantNames?.length||1)>1;
        if(isCouple){markers.push('<span class="occupancy-person-dot couple" title="Casal"></span>');return}
        genders.forEach(gender=>markers.push(`<span class="occupancy-person-dot ${String(gender)==='female'?'female':'male'}" title="${String(gender)==='female'?'Mulher':'Homem'}"></span>`));
      });
      const visible=markers.slice(0,7),extra=Math.max(0,markers.length-visible.length);
      return visible.join('')+(extra?`<small>+${extra}</small>`:'');
    }
    function occupancyPeopleForDate(iso,source=occupancySource()){
      return (source||[]).filter(p=>p.status==='approved'&&!p.inactive&&p.from&&p.to&&p.from<=iso&&p.to>=iso);
    }
    function occupancySelectedDate(){
      const month=occupancyMonth(),selected=String(state.occupancySelectedDate||'').slice(0,10);
      if(selected.startsWith(month))return selected;
      if(String(_oleiroToday).startsWith(month))return _oleiroToday;
      return `${month}-01`;
    }
    function occupancyCells(){
      const {year,monthIndex}=occupancyMonthParts(),first=new Date(year,monthIndex,1,12),last=new Date(year,monthIndex+1,0,12),cells=[];
      const selected=occupancySelectedDate(),source=occupancySource();
      for(let i=0;i<first.getDay();i++)cells.push('<span class="occupancy-day occupancy-blank" aria-hidden="true"></span>');
      for(let day=1;day<=last.getDate();day++){
        const iso=`${year}-${String(monthIndex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const people=occupancyPeopleForDate(iso,source),guestCount=occupancyGuestCount(people);
        const arrivals=occupancyFlowCount(source,'from',iso),departures=occupancyFlowCount(source,'to',iso);
        const weekday=new Date(`${iso}T12:00:00`).getDay(),weekend=weekday===0||weekday===6;
        cells.push(`<button class="occupancy-day ${weekend?'weekend':''} ${iso===_oleiroToday?'today':''} ${iso===selected?'selected':''} ${guestCount?'has-people':''}" type="button" onclick="selectOccupancyDay('${iso}')" aria-label="${guestCount} ${guestCount===1?'pessoa':'pessoas'} em ${iso}">
          <div class="occupancy-day-top"><strong>${day}</strong>${iso===_oleiroToday?'<span class="occupancy-today-label">Hoje</span>':''}</div>
          <div class="occupancy-day-count">${guestCount||'—'}${guestCount?`<small>${guestCount===1?'pessoa':'pessoas'}</small>`:''}</div>
          <div class="occupancy-day-dots">${guestCount?occupancyMarkers(people):'<span class="occupancy-day-empty">Sem hospedagem</span>'}</div>
          <div class="occupancy-day-flows">${arrivals?`<span class="occupancy-flow arrival"><i class="fa-solid fa-arrow-right-to-bracket"></i>${arrivals} ${arrivals===1?'chega':'chegam'}</span>`:''}${departures?`<span class="occupancy-flow departure"><i class="fa-solid fa-arrow-right-from-bracket"></i>${departures} ${departures===1?'sai':'saem'}</span>`:''}</div>
        </button>`);
      }
      return cells.join('');
    }
    function occupancyMetric(icon,value,label){
      return `<div class="occupancy-metric"><span class="occupancy-metric-icon"><i class="fa-solid ${icon}"></i></span><div><strong>${value}</strong><span>${label}</span></div></div>`;
    }
    function occupancyMonthMetrics(){
      const source=occupancySource(),month=occupancyMonth();
      const currentSource=(state.candidates||[]).filter(p=>p.status==='approved'&&!p.inactive);
      const today=occupancyGuestCount(occupancyPeopleForDate(_oleiroToday,currentSource));
      const arrivals=occupancyGuestCount(source.filter(p=>String(p.from||'').slice(0,7)===month));
      const departures=occupancyGuestCount(source.filter(p=>String(p.to||'').slice(0,7)===month));
      return {today,arrivals,departures};
    }
    function occupancyLongDate(iso){
      const date=new Date(`${iso}T12:00:00`),locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
      const text=new Intl.DateTimeFormat(locale,{weekday:'long',day:'2-digit',month:'long'}).format(date);
      return text.charAt(0).toUpperCase()+text.slice(1);
    }
    function occupancyGuestHtml(person,iso){
      const names=(person.participantNames||[]).filter(Boolean);
      const name=names.join(' + ')||person.name||'Voluntário';
      const count=Math.max(1,Number(person.participantCount)||names.length||1);
      const meta=[person.unitName||person.unit||'Unidade não informada',`${fmtDate(person.from,true)} → ${fmtDate(person.to,true)}`];
      if(count>1)meta.push(`${count} pessoas`);
      const arrival=String(person.from||'').slice(0,10)===iso,departure=String(person.to||'').slice(0,10)===iso;
      return `<div class="occupancy-guest"><div class="occupancy-guest-main"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(meta.join(' · '))}</span></div><div class="occupancy-guest-badges">${arrival?'<span class="occupancy-guest-badge arrival"><i class="fa-solid fa-arrow-right-to-bracket"></i> Chegada</span>':''}${departure?'<span class="occupancy-guest-badge departure"><i class="fa-solid fa-arrow-right-from-bracket"></i> Saída</span>':''}</div></div>`;
    }
    function occupancyDayPanelHtml(){
      const iso=occupancySelectedDate(),rows=occupancyPeopleForDate(iso),guestCount=occupancyGuestCount(rows);
      return `<section class="occupancy-day-panel"><div class="occupancy-day-panel-head"><div><span class="eyebrow">Detalhes do dia</span><h2>${escapeHtml(occupancyLongDate(iso))}</h2></div><p>${guestCount} ${guestCount===1?'pessoa hospedada':'pessoas hospedadas'}</p></div><div class="occupancy-day-guests">${rows.length?rows.map(row=>occupancyGuestHtml(row,iso)).join(''):'<div class="empty" style="grid-column:1/-1;min-height:96px">Nenhum voluntário hospedado neste dia.</div>'}</div></section>`;
    }
    function occupancyPageHtml(){
      const loading=state.occupancyScreenLoading===true,metrics=occupancyMonthMetrics();
      return `<section class="occupancy-page-screen compact-page-top">
        <header class="occupancy-page-head"><div><span class="eyebrow">Ocupação</span><h1>Ocupação da Casa</h1><p>Veja rapidamente quantas pessoas estarão hospedadas, quem chega e quem sai.</p></div><div class="occupancy-month-nav"><button class="icon-btn" type="button" onclick="shiftOccupancyMonth(-1)" aria-label="Mês anterior"><i class="fa-solid fa-chevron-left"></i></button><strong>${escapeHtml(occupancyMonthTitle())}</strong><button class="icon-btn" type="button" onclick="shiftOccupancyMonth(1)" aria-label="Próximo mês"><i class="fa-solid fa-chevron-right"></i></button></div></header>
        ${state.occupancyScreenError?`<div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div>${escapeHtml(state.occupancyScreenError)}</div></div>`:''}
        <div class="occupancy-metrics">${occupancyMetric('fa-house-user',metrics.today,'Hospedados hoje')}${occupancyMetric('fa-arrow-right-to-bracket',metrics.arrivals,'Chegadas no mês')}${occupancyMetric('fa-arrow-right-from-bracket',metrics.departures,'Saídas no mês')}</div>
        <section class="occupancy-calendar-card"><div class="occupancy-calendar-toolbar"><strong>${escapeHtml(occupancyMonthTitle())}</strong><div class="occupancy-legend"><span><i class="occupancy-person-dot male"></i>Homem</span><span><i class="occupancy-person-dot female"></i>Mulher</span><span><i class="occupancy-person-dot couple"></i>Casal</span></div></div><div class="occupancy-calendar-wrap"><div class="occupancy-weekdays">${occupancyWeekdays().map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div><div class="occupancy-calendar ${loading?'is-loading':''}">${loading?'<div class="empty compact-loading occupancy-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando ocupação...</div>':occupancyCells()}</div></div></section>
        ${loading?'':occupancyDayPanelHtml()}
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

    managerNav=function(){
      const item=(icon,label,action,active=false)=>`<button class="nav-btn ${active?'active':''}" onclick="${action}"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;
      return `<nav class="bottom-nav">${item('fa-house','Início',"navigateManager('home')",state.managerPage==='home')}${item('fa-users','Voluntariado',"navigateManager('volunteer')",state.managerPage==='volunteer')}${item('fa-calendar-check','Planejamento',"navigateManager('planning')",state.managerPage==='planning')}${item('fa-bed','Ocupação','openManagerOccupancy()',state.managerPage==='occupancy')}${item('fa-bars','Menu',"navigateManager('menu')",['menu','groups'].includes(state.managerPage))}</nav>`;
    };
    window.managerNav=managerNav;

    occupancyPeopleOnDate=function(iso){return occupancyPeopleForDate(iso)};
    window.occupancyPeopleOnDate=occupancyPeopleOnDate;
    window.selectOccupancyDay=function(iso){
      state.occupancySelectedDate=String(iso||'').slice(0,10);
      if(state.managerPage==='occupancy')renderOccupancyShell();
    };
    window.openManagerOccupancy=async function(){
      state.managerPage='occupancy';
      state.occupancyScreenMonth=occupancyMonth();
      state.occupancySelectedDate=occupancySelectedDate();
      state.occupancyScreenError='';
      state.occupancyScreenLoading=true;
      render();
      if(typeof afterNavigation==='function')afterNavigation();
      try{
        if(!window.OleiroServices?.applications?.listOccupancyMonth)throw new Error('Serviço de ocupação indisponível.');
        state.occupancyCandidates=await window.OleiroServices.applications.listOccupancyMonth(state.occupancyScreenMonth,{unitId:'all'})||[];
      }catch(error){
        console.error('Falha ao abrir ocupação:',error);
        state.occupancyCandidates=[];
        state.occupancyScreenError=error?.message||'Não foi possível carregar a ocupação.';
      }finally{
        state.occupancyScreenLoading=false;
        if(state.managerPage==='occupancy')render();
      }
    };
    window.shiftOccupancyMonth=function(delta){
      const {year,monthIndex}=occupancyMonthParts(),date=new Date(year,monthIndex+Number(delta||0),1,12);
      state.occupancyScreenMonth=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
      state.occupancySelectedDate=String(_oleiroToday).startsWith(state.occupancyScreenMonth)?_oleiroToday:`${state.occupancyScreenMonth}-01`;
      state.occupancyCandidates=[];
      return window.openManagerOccupancy();
    };

    function standardPageHtml(){
      const pages={
        home:()=>typeof window.managerHomeDashboard==='function'?window.managerHomeDashboard():managerHome(),
        volunteer:()=>managerVolunteers(),
        agenda:()=>managerAgenda(),
        groups:()=>managerGroups(),
        menu:()=>managerMenu()
      };
      const page=pages[state.managerPage]||pages.home;
      return page();
    }

    renderManager=function(){
      if(state.managerPage==='planning')return renderPlanningShell();
      if(state.managerPage==='occupancy')return renderOccupancyShell();
      return renderShell(standardPageHtml());
    };
    window.renderManager=renderManager;
    render=function(){return renderManager()};
    window.render=render;
    if(state.role==='manager')render();
  }

  const planningScript=document.querySelector('script[data-planning-page]');
  if(typeof window.closePlanningDetail==='function')return install();
  if(planningScript){
    planningScript.addEventListener('load',install,{once:true});
    setTimeout(()=>{if(typeof window.closePlanningDetail==='function')install()},300);
    return;
  }
  const script=document.createElement('script');
  script.dataset.planningPage='1';
  script.src='../js/admin/planning-page.js?v=20260903-clean';
  script.onload=install;
  document.body.appendChild(script);
})();
