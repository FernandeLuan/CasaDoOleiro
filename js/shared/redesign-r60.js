/* R60 — nova composição visual sobre os fluxos reais da aplicação.
   Este arquivo altera somente renderização e navegação visual. Serviços, regras e ações existentes permanecem intactos. */
(function redesignR60(){
  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt=value=>typeof translateText==='function'?translateText(value):value;
  const safeStatus=(status)=>{try{return statusMeta(status)}catch{return [status||'—','']}};
  const dateText=(iso,short=false)=>{try{return fmtDate(iso,short)}catch{return iso||'—'}};
  const todayLabel=()=>{try{return longDate(_oleiroToday)}catch{return _oleiroToday||''}};

  function roleLabel(){
    if(state?.role==='manager')return 'Gestão do voluntariado';
    if(state?.volunteerMode==='approved')return 'Portal do voluntário';
    return 'Portal do candidato';
  }

  window.header=header=function(){
    return `<header class="app-header simplified-header"><div class="brand-row"><div class="brand" role="button" tabindex="0" aria-label="Ir para a tela inicial" onclick="goHome()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goHome()}"><div class="brand-mark"><i class="fa-solid fa-seedling"></i></div><div class="brand-copy"><strong>Casa do Oleiro</strong><span class="r60-brand-sub">${esc(roleLabel())}</span></div></div><div class="header-actions"><button class="icon-btn language-button" onclick="openLanguageModal()" aria-label="Idioma"><span class="current-language-code">${typeof currentLanguageCode==='function'?currentLanguageCode():'PT'}</span></button><button class="icon-btn" onclick="toggleTheme()" aria-label="Tema"><i class="fa-solid ${state?.theme==='dark'?'fa-sun':'fa-moon'}"></i></button></div></div></header>`;
  };

  function navMarkup(items,current,navigate,context){
    return `<nav class="r60-nav-shell" aria-label="Navegação principal"><div class="r60-nav">${items.map(([id,icon,label])=>`<button class="nav-btn ${current===id?'active':''}" type="button" onclick="${navigate}('${id}')"><i class="fa-solid ${icon}"></i><span>${esc(label)}</span></button>`).join('')}<div class="r60-nav-context"><i class="r60-live-dot"></i><span>${esc(context)}</span></div></div></nav>`;
  }

  window.managerNav=managerNav=function(){
    const items=[['home','fa-grid-2','Visão geral'],['volunteer','fa-users','Voluntariado'],['agenda','fa-calendar-days','Agenda'],['groups','fa-people-group','Grupos'],['menu','fa-ellipsis','Mais']];
    return navMarkup(items,state.managerPage,'navigateManager','Ambiente de gestão');
  };

  window.volunteerNav=volunteerNav=function(){
    const approved=state.volunteerMode==='approved';
    const items=approved?[['home','fa-house','Início'],['agenda','fa-calendar-check','Agenda'],['stay','fa-location-dot','Estadia'],['info','fa-circle-info','Informações'],['profile','fa-user','Perfil']]:[['home','fa-house','Início'],['plan','fa-calendar-plus','Planejamento'],['stay','fa-location-dot','Estadia'],['info','fa-circle-info','Informações'],['profile','fa-user','Perfil']];
    if(approved&&state.volunteerPage==='plan')state.volunteerPage='agenda';
    return navMarkup(items,state.volunteerPage,'navigateVolunteer',approved?'Estadia confirmada':'Processo de candidatura');
  };

  /* ---------- Admin: dashboard ---------- */
  function todayRows(sessions){
    if(!sessions.length)return `<div class="empty">Nenhuma atividade prevista para hoje.</div>`;
    return sessions.slice(0,4).map(s=>{
      const a=s.activity||{};const period=typeof activityPeriodValue==='function'?activityPeriodValue(s.raw||{},a):a.period||'Sem preferência';
      return `<div class="r60-today-item"><i class="r60-today-marker"></i><div><strong>${esc(a.name||'Atividade')}</strong><span>${esc(a.owner||'Voluntário')} • ${Number(a.duration)||0} min</span></div><span class="r60-today-time">${esc(period)}</span></div>`;
    }).join('');
  }
  function moveRows(rows,field){
    if(!rows.length)return `<div class="empty">Nenhuma movimentação prevista.</div>`;
    return rows.slice(0,3).map(p=>`<div class="r60-move-row"><b>${esc(p.name||'Voluntário')}</b><span>${dateText(p[field],true)} • ${typeof movementDaysLabel==='function'?esc(movementDaysLabel(p[field])):''}</span></div>`).join('');
  }
  window.managerHome=managerHome=function(){
    const sessions=typeof getSessions==='function'?getSessions(_oleiroToday):[];
    const arrivals=typeof nextMovements==='function'?nextMovements('from'):[];
    const departures=typeof nextMovements==='function'?nextMovements('to'):[];
    const analysis=typeof dashboardCount==='function'?dashboardCount('analysis'):0;
    const adjustments=typeof dashboardCount==='function'?dashboardCount('adjustments'):0;
    return `<div class="r60-page r60-dashboard">
      <div class="r60-dashboard-hero">
        <section class="r60-welcome-panel"><span class="r60-kicker">Casa do Oleiro • Gestão</span><h1>${esc(typeof managerGreeting==='function'?managerGreeting():'Olá')}. O que precisa da sua atenção?</h1><p>Uma visão operacional do voluntariado, das pendências e do que acontece na Casa hoje.</p><div class="r60-welcome-actions"><button class="btn" type="button" onclick="navigateManager('volunteer')"><i class="fa-solid fa-users"></i>Ver voluntariado</button><button class="btn r60-ghost" type="button" onclick="openTodayAgenda()"><i class="fa-regular fa-calendar"></i>Abrir agenda de hoje</button></div></section>
        <aside class="r60-today-panel"><div class="r60-today-head"><div><span class="r60-kicker">Hoje na Casa</span><div class="r60-today-date">${esc(todayLabel())}</div></div><div class="r60-today-count">${sessions.length}</div></div><div class="r60-today-list">${todayRows(sessions)}</div></aside>
      </div>
      <div class="r60-dashboard-grid">
        <section class="r60-panel"><div class="r60-panel-head"><div><h2>Pendências operacionais</h2><p>Itens que dependem de decisão ou revisão.</p></div></div><div class="r60-kpis"><button class="r60-kpi" type="button" onclick="state.candidateFilter='analysis';navigateManager('volunteer')"><span class="r60-kpi-icon"><i class="fa-solid fa-clipboard-check"></i></span><div><strong>${analysis}</strong><span>Em análise</span></div><i class="fa-solid fa-arrow-right"></i></button><button class="r60-kpi" type="button" onclick="openManagerAdjustments()"><span class="r60-kpi-icon"><i class="fa-solid fa-rotate"></i></span><div><strong>${adjustments}</strong><span>Ajustes pendentes</span></div><i class="fa-solid fa-arrow-right"></i></button></div></section>
        <section class="r60-panel"><div class="r60-panel-head"><div><h2>Próximas movimentações</h2><p>Chegadas e saídas confirmadas.</p></div></div><div class="r60-movement-columns"><div class="r60-movement-card"><strong><i class="fa-solid fa-arrow-right-to-bracket"></i> Chegadas</strong>${moveRows(arrivals,'from')}</div><div class="r60-movement-card"><strong><i class="fa-solid fa-arrow-right-from-bracket"></i> Saídas</strong>${moveRows(departures,'to')}</div></div></section>
      </div>
    </div>`;
  };

  /* ---------- Admin: candidates ---------- */
  window.personCompact=personCompact=function(p){
    const [label,tone]=safeStatus(p.status);const meta=p.status==='pending'&&typeof candidateDeadlineMeta==='function'?candidateDeadlineMeta(p):null;
    const inactive=p.inactive&&p.status!=='rejected'&&typeof badge==='function'?badge('Inativo','danger'):'';
    const statusBadge=typeof badge==='function'?badge(label,tone):`<span class="badge">${esc(label)}</span>`;
    const period=p.from&&p.to?`${dateText(p.from,true)} – ${dateText(p.to,true)}`:'Período não informado';
    const id=typeof candidateActionArg==='function'?candidateActionArg(p.id):encodeURIComponent(String(p.id));
    const initials=String(p.name||'V').split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase();
    return `<article class="r60-candidate-row" role="button" tabindex="0" onclick="openPerson(decodeURIComponent('${id}'))" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openPerson(decodeURIComponent('${id}'))}"><div class="r60-person"><div class="avatar">${esc(initials)}</div><div class="r60-person-copy"><strong>${esc(p.name||'Voluntário')}</strong><span>${esc(p.country||'—')}${p.type==='couple'?' • Dupla':''}</span></div></div><div class="r60-cell r60-unit"><strong>${esc(p.unit||p.unitName||p.unitId||'—')}</strong><small>Unidade</small></div><div class="r60-cell r60-stay"><strong>${esc(period)}</strong><small>${meta?esc(meta.label):'Estadia'}</small></div><div class="r60-status-cell"><div class="item-meta">${statusBadge}${inactive}</div></div><i class="fa-solid fa-chevron-right r60-row-chevron"></i></article>`;
  };
  window.candidateListHtml=candidateListHtml=function(list){
    if(state.candidateLoading&&!list.length)return `<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando voluntários...</div>`;
    if(!list.length)return `<div class="empty"><i class="fa-regular fa-folder-open"></i>Nenhum perfil encontrado com esses filtros.</div>`;
    const more=state.candidateHasMore?`<button class="btn btn-soft btn-block candidate-load-more" type="button" onclick="loadMoreCandidates()" ${state.candidateLoading?'disabled':''}><i class="fa-solid ${state.candidateLoading?'fa-circle-notch fa-spin':'fa-chevron-down'}"></i>${state.candidateLoading?'Carregando...':'Ver mais 10'}</button>`:'';
    return `<div class="r60-candidate-table"><div class="r60-candidate-table-head"><span>Voluntário</span><span>Unidade</span><span>Estadia</span><span>Status</span><span></span></div>${list.map(personCompact).join('')}</div>${more}`;
  };
  window.managerVolunteers=managerVolunteers=function(){
    state.candidateFilter=typeof normalizeCandidateFilter==='function'?normalizeCandidateFilter(state.candidateFilter):state.candidateFilter;
    const search=state.candidateSearch||'';const activeFilters=state.candidateFilter!=='approved'||(state.candidateUnit||'all')!=='all';
    return `<div class="r60-page r60-volunteer-page"><div class="r60-page-heading"><div><span class="r60-kicker">Pessoas e processos</span><h1>Voluntariado</h1><p>Acompanhe candidatos, planejamentos, reuniões, aprovações e voluntários em estadia.</p></div><div class="r60-heading-actions"><button class="btn btn-outline" type="button" onclick="openOccupancyCalendar()"><i class="fa-solid fa-bed"></i>Ocupação</button><button class="btn btn-primary" type="button" onclick="openNewCandidate()"><i class="fa-solid fa-user-plus"></i>Novo candidato</button></div></div><div class="r60-volunteer-toolbar"><div class="filter-search candidate-search"><i class="fa-solid fa-magnifying-glass"></i><input id="candidateSearch" class="input" type="search" value="${esc(search)}" placeholder="Buscar por nome" oninput="updateCandidateSearch(this.value)"></div><button class="candidate-filter-button ${activeFilters?'active':''}" type="button" onclick="openCandidateFilters()" aria-label="Filtros"><i class="fa-solid fa-sliders"></i>${activeFilters?'<span class="filter-dot"></span>':''}</button><button class="candidate-add-button" type="button" onclick="openNewCandidate()" aria-label="Novo candidato"><i class="fa-solid fa-plus"></i></button></div><div class="candidate-filter-summary">${typeof candidateFilterSummary==='function'?candidateFilterSummary():''}</div><div id="candidateList">${candidateListHtml(state.candidates||[])}</div></div>`;
  };

  /* ---------- Admin: agenda ---------- */
  window.managerAgenda=managerAgenda=function(){
    if(typeof ensureAgendaRange==='function')ensureAgendaRange();
    const dates=typeof agendaRangeDates==='function'?agendaRangeDates():[];
    return `<div class="r60-page r60-agenda-page"><div class="r60-page-heading"><div><span class="r60-kicker">Operação da Casa</span><h1>Agenda</h1><p>Atividades planejadas, pessoas responsáveis, grupos e confirmações por período.</p></div><div class="r60-heading-actions"><button class="btn btn-outline" type="button" onclick="goAgendaToday()"><i class="fa-solid fa-location-crosshairs"></i>Hoje</button></div></div><div class="r60-agenda-toolbar"><button class="icon-btn agenda-arrow" type="button" onclick="shiftAgendaRange(-1)" aria-label="Período anterior"><i class="fa-solid fa-chevron-left"></i></button><div class="agenda-date-center"><button class="agenda-date-label" type="button" onclick="openAgendaRangeModal()"><strong>${typeof agendaHeaderLabel==='function'?esc(agendaHeaderLabel()):''}</strong></button></div><button class="icon-btn agenda-arrow" type="button" onclick="shiftAgendaRange(1)" aria-label="Próximo período"><i class="fa-solid fa-chevron-right"></i></button></div><div class="agenda-days">${typeof renderDays==='function'?renderDays(true,dates):''}</div></div>`;
  };

  /* ---------- Admin: groups ---------- */
  window.managerGroups=managerGroups=function(){
    const selector=typeof groupUnitSelector==='function'?groupUnitSelector():'';const selected=String(state.groupUnitId||'rodeio');
    const unit=(state.units||[]).find(row=>String(row.id)===selected);const unitLabel=unit?.name||selected.replace(/^./,c=>c.toUpperCase());
    if(!state.groupsLoaded||String(state.groupsUnitId||'')!==selected)return `<div class="r60-page"><div class="r60-page-heading"><div><span class="r60-kicker">Organização da Casa</span><h1>Grupos</h1><p>Distribuição de integrantes por unidade.</p></div></div><div class="r60-panel">${selector}<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando grupos de ${esc(unitLabel)}...</div></div></div>`;
    const rows=state.groups||[];
    const cards=rows.map(g=>{const members=g.members||[];const code=g.code||g.id;return `<article class="r60-group-card"><div class="r60-group-card-head"><span class="r60-group-code">${esc(code)}</span><span class="r60-group-count">${members.length} / ${Number(g.capacity||5)}<br>integrantes</span></div><h3>Grupo ${esc(code)}</h3><p>${esc(g.note||'Sem observações adicionais.')}</p><div class="r60-member-list">${members.length?members.map(m=>`<span class="r60-member-chip">${esc(m)}</span>`).join(''):'<span class="r60-member-chip">Nenhum integrante</span>'}</div><button class="btn btn-outline" type="button" onclick='editGroup(${JSON.stringify(String(g.id))})'><i class="fa-solid fa-pen"></i>Editar grupo</button></article>`}).join('');
    return `<div class="r60-page"><div class="r60-page-heading"><div><span class="r60-kicker">Organização da Casa</span><h1>Grupos</h1><p>Visualize capacidade, integrantes e organização de cada grupo da unidade.</p></div></div><section class="r60-panel" style="margin-bottom:14px">${selector}</section>${cards?`<div class="r60-groups-grid">${cards}</div>`:'<div class="empty">Nenhum grupo cadastrado.</div>'}</div>`;
  };

  /* ---------- Admin: menu/settings ---------- */
  function menuItem(icon,title,desc,action,danger=false){return `<button class="r60-menu-item ${danger?'danger':''}" type="button" onclick="${action}"><span class="r60-menu-icon"><i class="fa-solid ${icon}"></i></span><span class="r60-menu-copy"><strong>${esc(title)}</strong><span>${esc(desc)}</span></span><i class="fa-solid fa-chevron-right"></i></button>`}
  window.managerMenu=managerMenu=function(){
    return `<div class="r60-page"><div class="r60-page-heading"><div><span class="r60-kicker">Configurações e referências</span><h1>Mais</h1><p>Conteúdos de apoio, estrutura da Casa e dados da sua sessão.</p></div></div><div class="r60-menu-layout"><section class="r60-menu-section"><h3>Operação</h3><p>Ferramentas para organização cotidiana.</p><div class="r60-menu-items">${menuItem('fa-people-group','Grupos','Integrantes e capacidade por unidade',"navigateManager('groups')")}${menuItem('fa-bed','Ocupação','Voluntários hospedados por período','openOccupancyCalendar()')}${menuItem('fa-clock','Rotina','Horários de referência da comunidade','openRoutine()')}</div></section><section class="r60-menu-section"><h3>Portal e estrutura</h3><p>Configurações e informações compartilhadas.</p><div class="r60-menu-items">${menuItem('fa-circle-info','Informações do portal','Conteúdo consultado pelos voluntários','openPortalInfo()')}${menuItem('fa-building','Unidades','Situação das unidades da Casa','openUnits()')}${menuItem('fa-user-shield','Minha conta','Dados da sessão autenticada','openMyAccount()')}${menuItem('fa-right-from-bracket','Sair','Encerrar sessão neste dispositivo','logout()',true)}</div></section></div></div>`;
  };

  /* ---------- Portal: home ---------- */
  function portalProgress(status,approved){if(approved)return 100;return {draft:24,submitted:56,adjustments:68,approved:100}[status]||24}
  function planLabel(status){return {draft:'Planejamento a preparar',submitted:'Planejamento enviado',adjustments:'Ajustes solicitados',approved:'Planejamento aprovado'}[status]||'Planejamento em preparação'}
  function stayUnit(application){return application.unitName||String(application.unitId||'').replace(/^./,c=>c.toUpperCase())||'Unidade a confirmar'}
  function portalDate(application,field){return typeof portalIsoDate==='function'?portalIsoDate(application[field]):null}
  function nextActivityRows(nextDay){
    if(!nextDay)return `<div class="empty">Nenhuma atividade futura confirmada.</div>`;
    return nextDay.sessions.slice(0,4).map(s=>`<button class="r60-next-card" type="button" onclick="navigateVolunteer('agenda')"><span class="r60-next-icon"><i class="fa-regular fa-calendar-check"></i></span><span><strong>${esc(s.activity?.name||'Atividade')}</strong><span>${Number(s.activity?.duration)||0} min • ${esc(typeof activityPeriodValue==='function'?activityPeriodValue(s,s.activity):'')}</span></span><i class="fa-solid fa-chevron-right"></i></button>`).join('');
  }
  window.volunteerHome=volunteerHome=function(){
    const application=state.currentApplication||{};const approved=state.volunteerMode==='approved';const status=state.volunteerPlanStatus||'draft';
    const from=portalDate(application,'stayStart'),to=portalDate(application,'stayEnd'),unit=stayUnit(application);const progress=portalProgress(status,approved);const nextDay=approved&&typeof getNextVolunteerDay==='function'?getNextVolunteerDay():null;
    const primary=approved?`<button class="btn btn-primary" type="button" onclick="navigateVolunteer('agenda')"><i class="fa-regular fa-calendar-check"></i>Ver minha agenda</button>`:`<button class="btn btn-primary" type="button" onclick="navigateVolunteer('plan')"><i class="fa-solid ${status==='adjustments'?'fa-pen-to-square':status==='submitted'?'fa-eye':'fa-calendar-plus'}"></i>${status==='adjustments'?'Fazer ajustes':status==='submitted'?'Ver planejamento':'Montar planejamento'}</button>`;
    const secondary=`<button class="btn btn-outline" type="button" onclick="navigateVolunteer('info')"><i class="fa-solid fa-circle-info"></i>Informações da Casa</button>`;
    const sideTitle=approved?'Sua estadia está confirmada':planLabel(status);const sideBody=approved?'Agenda e informações da sua passagem pela Casa estão disponíveis aqui.':status==='submitted'?'A equipe já pode analisar. Você continua podendo editar enquanto aguarda a aprovação.':status==='adjustments'?'Existem orientações da equipe para revisar antes de reenviar.':'Organize as atividades que você pretende oferecer durante a estadia.';
    return `<div class="r60-page r60-portal-home"><section class="r60-portal-hero"><div><span class="r60-kicker">${approved?'Bem-vindo à Casa':'Sua jornada de voluntariado'}</span><h1>${approved?'Tudo o que você precisa para a sua estadia.':'Prepare sua participação com clareza.'}</h1><p>${esc(unit)}${from&&to?` • ${dateText(from)}–${dateText(to)}`:''}. Consulte seu próximo passo, planejamento e informações importantes em um só lugar.</p><div class="r60-portal-primary">${primary}${secondary}</div></div><aside class="r60-portal-status"><div><span class="r60-kicker">${approved?'Status':'Próximo passo'}</span><strong>${esc(sideTitle)}</strong><p>${esc(sideBody)}</p></div><div><div class="r60-status-progress"><span style="width:${progress}%"></span></div><p>${progress}% da jornada atual</p></div></aside></section><div class="r60-portal-grid"><section class="r60-portal-panel"><div class="r60-portal-panel-head"><div><h2>${approved?'Próximas atividades':'Sua estadia'}</h2><p>${approved?(nextDay?`${typeof dayName==='function'?dayName(nextDay.date):''} • ${dateText(nextDay.date)}`:'Agenda atualizada'):'Datas e unidade informadas no processo.'}</p></div>${approved?`<button class="btn btn-soft" onclick="navigateVolunteer('agenda')">Agenda</button>`:''}</div>${approved?nextActivityRows(nextDay):`<div class="r60-stay-cards"><div class="r60-stay-card"><span>Chegada</span><strong>${from?dateText(from,true):'A confirmar'}</strong><small>${esc(unit)}</small></div><div class="r60-stay-card"><span>Saída</span><strong>${to?dateText(to,true):'A confirmar'}</strong><small>Dia sem atividade</small></div></div>`}</section><section class="r60-portal-panel"><div class="r60-portal-panel-head"><div><h2>Atalhos úteis</h2><p>Informações que você pode precisar rapidamente.</p></div></div><button class="r60-next-card" type="button" onclick="navigateVolunteer('stay')"><span class="r60-next-icon"><i class="fa-solid fa-location-dot"></i></span><span><strong>Estadia</strong><span>Datas, unidade e orientações</span></span><i class="fa-solid fa-chevron-right"></i></button><button class="r60-next-card" type="button" onclick="navigateVolunteer('info')"><span class="r60-next-icon"><i class="fa-solid fa-route"></i></span><span><strong>Como chegar e rotina</strong><span>Transporte, endereço e informações práticas</span></span><i class="fa-solid fa-chevron-right"></i></button><button class="r60-next-card" type="button" onclick="navigateVolunteer('profile')"><span class="r60-next-icon"><i class="fa-regular fa-user"></i></span><span><strong>Meu perfil</strong><span>Dados pessoais e contato</span></span><i class="fa-solid fa-chevron-right"></i></button></section></div></div>`;
  };

  /* ---------- Portal: planning and approved agenda ---------- */
  window.volunteerPlan=volunteerPlan=function(){
    const acts=typeof volunteerActivities==='function'?volunteerActivities():[];const status=state.volunteerPlanStatus||'draft';const approved=state.volunteerMode==='approved';const editable=!approved&&['draft','submitted','adjustments'].includes(status);const dates=typeof volunteerStayDates==='function'?volunteerStayDates():[];
    const period=dates.length?`${dateText(dates[0],true)}–${dateText(dates[dates.length-1],true)}`:'Período a confirmar';const hours=((state.sessions||[]).reduce((s,row)=>s+(Number(row.duration)||60),0)/60).toFixed(1).replace('.',',');
    const notice=approved?'Planejamento aprovado. Alterações posteriores podem precisar de nova confirmação.':status==='submitted'?'Planejamento enviado. A equipe já pode analisar e você ainda pode editar até a aprovação.':status==='adjustments'?'A equipe solicitou ajustes. Revise as orientações e reenvie.':'Adicione as atividades que você pretende oferecer durante a estadia.';
    const submit=approved?`<button class="btn btn-soft btn-block" disabled><i class="fa-solid fa-circle-check"></i>Planejamento aprovado</button>`:status==='submitted'?`<button class="btn btn-soft btn-block" disabled><i class="fa-solid fa-paper-plane"></i>Planejamento enviado</button>`:`<button class="btn btn-primary btn-block" onclick="submitPlan()"><i class="fa-solid fa-paper-plane"></i>${status==='adjustments'?'Reenviar planejamento':'Enviar planejamento'}</button>`;
    return `<div class="r60-page"><div class="r60-page-heading"><div><span class="r60-kicker">Organização da estadia</span><h1>Planejamento</h1><p>Distribua suas atividades pelos dias e acompanhe o que ainda precisa ser ajustado.</p></div><div class="r60-heading-actions"><span class="stat-pill">${esc(period)}</span></div></div><section class="section volunteer-plan-page"><div class="notice ${status==='adjustments'?'warning':''}"><i class="fa-solid fa-circle-info"></i><div>${esc(notice)}</div></div><div>${typeof volunteerAgendaContent==='function'?volunteerAgendaContent(editable):''}</div><div class="card plan-summary"><span class="eyebrow">Resumo do planejamento</span><div class="stat-row" style="margin:10px 0 12px"><span class="stat-pill">${acts.length} atividades</span><span class="stat-pill">${(state.sessions||[]).length} sessões</span><span class="stat-pill">${hours}h planejadas</span></div>${submit}</div></section></div>`;
  };
  window.volunteerAgenda=volunteerAgenda=function(){
    return `<div class="r60-page"><div class="r60-page-heading"><div><span class="r60-kicker">Estadia confirmada</span><h1>Minha agenda</h1><p>Seu cronograma atualizado, organizado por dia e atividade.</p></div></div><section class="section"><div class="notice warning"><i class="fa-solid fa-rotate"></i><div>Uma alteração solicitada por você pode precisar de nova confirmação da equipe.</div></div><div style="margin-top:14px">${typeof volunteerAgendaContent==='function'?volunteerAgendaContent(true):''}</div></section></div>`;
  };

  /* ---------- Wrap remaining portal pages without altering their functions ---------- */
  function wrapPortalPage(name,kicker,title,description){
    const current=window[name];if(typeof current!=='function'||current.__r60wrapped)return;
    const wrapped=function(){const body=current();return `<div class="r60-page"><div class="r60-page-heading"><div><span class="r60-kicker">${esc(kicker)}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div></div>${body}</div>`};wrapped.__r60wrapped=true;window[name]=wrapped;
    try{eval(`${name}=window[name]`)}catch{}
  }

  document.documentElement.classList.add('redesign-r60');
  setTimeout(()=>{
    wrapPortalPage('volunteerStay','Sua passagem pela Casa','Estadia','Datas, unidade, chegada e orientações práticas para sua permanência.');
    wrapPortalPage('volunteerInfo','Antes e durante a estadia','Informações','Tudo o que você precisa saber sobre a Casa, rotina e deslocamento.');
    wrapPortalPage('volunteerProfile','Seus dados','Perfil','Consulte seus dados pessoais e informações de contato.');
  },0);
})();
