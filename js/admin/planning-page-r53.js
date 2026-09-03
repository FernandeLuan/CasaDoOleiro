/* Round 53 — Planejamento vira página de primeiro nível e substitui o modal de perfil. */
(function adminPlanningPageR53(){
  if(typeof renderManager!=='function'||typeof openPerson!=='function'||typeof renderPersonModal!=='function')return;
  if(!document.querySelector('link[data-round53-planning]')){const link=document.createElement('link');link.rel='stylesheet';link.href='../css/round53.css?v=20260902-r53';link.dataset.round53Planning='1';document.head.appendChild(link)}

  const baseRenderManager=renderManager;
  const baseNavigateManager=navigateManager;
  const baseOpenPerson=openPerson;
  const baseRenderPersonModal=renderPersonModal;

  state.managerPlanningPersonId=state.managerPlanningPersonId||'';
  state.managerPlanningTab=state.managerPlanningTab||'plan';
  state.managerPlanningBody=state.managerPlanningBody||'';
  state.managerPlanningOrigin=state.managerPlanningOrigin||'planning';
  state.managerPlanningLoading=false;

  function planningPerson(){return candidateById(state.managerPlanningPersonId)}
  function personDates(p){const from=String(p?.stayStart||p?.from||'').slice(0,10),to=String(p?.stayEnd||p?.to||'').slice(0,10);return from&&to?`${fmtDate(from,true)} → ${fmtDate(to,true)}`:'Período não informado'}
  function personBadge(p){const [label,type]=typeof statusMeta==='function'?statusMeta(p?.status):[p?.status||'Status',''];return `<span class="badge ${escapeHtml(type||'')}">${escapeHtml(label)}</span>`}

  function planningList(){
    const rows=(state.candidates||[]).filter(p=>p.status!=='rejected');
    const body=typeof candidateListHtml==='function'?candidateListHtml(rows):rows.map(personCompact).join('');
    return `<section class="section planning-index-page compact-page-top">
      <div class="planning-index-head">
        <div><span class="eyebrow">Planejamento</span><h1>Planejamentos dos voluntários</h1><p>Consulte, revise e acompanhe os planejamentos em uma tela dedicada.</p></div>
      </div>
      <div class="candidate-tools candidate-tools-compact planning-index-tools">
        <div class="filter-search candidate-search"><i class="fa-solid fa-magnifying-glass"></i><input id="planningCandidateSearch" class="input" type="search" value="${escapeHtml(state.candidateSearch||'')}" placeholder="Buscar voluntário por nome" oninput="updatePlanningCandidateSearch(this.value)"></div>
      </div>
      <div class="planning-index-count"><span>${rows.length} ${rows.length===1?'perfil':'perfis'} nesta página</span></div>
      <div id="planningCandidateList" class="list planning-candidate-list">${body||'<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>Nenhum planejamento encontrado.</div>'}</div>
    </section>`;
  }

  function planningDetail(){
    const p=planningPerson();
    if(!p)return planningList();
    const loading=state.managerPlanningLoading&&!state.managerPlanningBody;
    return `<section class="section planning-detail-page compact-page-top" data-person-id="${escapeHtml(String(p.id))}">
      <header class="planning-profile-head">
        <div class="planning-profile-heading">
          <button class="planning-back-button" type="button" onclick="closePlanningDetail()" aria-label="Voltar"><i class="fa-solid fa-arrow-left"></i></button>
          <div class="planning-profile-copy">
            <span class="eyebrow">Perfil do candidato</span>
            <div class="planning-profile-title-line"><h1>${escapeHtml(p.name||'Voluntário')}</h1>${personBadge(p)}</div>
            <p>${escapeHtml(p.country||'—')} <b>•</b> ${escapeHtml(p.unit||p.unitName||'—')} <b>•</b> ${escapeHtml(personDates(p))}</p>
          </div>
        </div>
        <button class="planning-close-button" type="button" onclick="closePlanningDetail()" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <div class="planning-page-content">${loading?'<div class="empty compact-loading planning-page-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando planejamento...</div>':state.managerPlanningBody||'<div class="empty compact-loading planning-page-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando dados...</div>'}</div>
    </section>`;
  }

  function managerPlanning(){return state.managerPlanningPersonId?planningDetail():planningList()}

  function capturePersonBody(p,tab='plan'){
    baseRenderPersonModal(p,tab);
    const body=modalRoot.querySelector('.modal-body');
    state.managerPlanningBody=body?.innerHTML||'';
    state.managerPlanningTab=tab;
    state.managerPlanningPersonId=String(p.id);
    closeModal();
    if(state.managerPage==='planning')render();
  }

  renderPersonModal=function(p,tab='plan'){
    if(!p)return;
    if(state.managerPage!=='planning'||String(state.managerPlanningPersonId||'')!==String(p.id))return baseRenderPersonModal(p,tab);
    return capturePersonBody(p,tab);
  };

  openPerson=async function(id,tab='plan'){
    const p=candidateById(id);if(!p)return;
    if(state.managerPage!=='planning')state.managerPlanningOrigin=state.managerPage||'volunteer';
    else if(!state.managerPlanningPersonId)state.managerPlanningOrigin='planning';
    state.managerPage='planning';state.managerPlanningPersonId=String(id);state.managerPlanningTab=tab;state.managerPlanningBody='';state.managerPlanningLoading=true;
    render();if(typeof afterNavigation==='function')afterNavigation();
    try{return await baseOpenPerson(id,tab)}finally{state.managerPlanningLoading=false;if(state.managerPage==='planning'&&String(state.managerPlanningPersonId)===String(id))render()}
  };

  window.closePlanningDetail=function(){
    const origin=state.managerPlanningOrigin==='volunteer'?'volunteer':'planning';
    state.managerPlanningPersonId='';state.managerPlanningBody='';state.managerPlanningTab='plan';
    if(origin==='volunteer')return navigateManager('volunteer');
    state.managerPage='planning';render();if(typeof afterNavigation==='function')afterNavigation();
  };

  window.updatePlanningCandidateSearch=function(value){
    state.candidateSearch=value;
    clearTimeout(state._planningSearchTimer);
    state._planningSearchTimer=setTimeout(()=>{if(typeof loadManagerCandidates==='function')loadManagerCandidates({force:true}).then(()=>{if(state.managerPage==='planning'&&!state.managerPlanningPersonId)render()}).catch(error=>{console.error(error);showToast('Não foi possível buscar os voluntários.')})},300);
  };

  managerNav=function(){
    const item=(id,icon,label)=>`<button class="nav-btn ${state.managerPage===id?'active':''}" onclick="navigateManager('${id}')"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;
    return `<nav class="bottom-nav">${item('home','fa-house','Início')}${item('volunteer','fa-users','Voluntariado')}${item('planning','fa-calendar-check','Planejamento')}${item('agenda','fa-calendar-days','Agenda')}${item('occupancy','fa-bed','Ocupação')}${item('menu','fa-bars','Menu')}</nav>`;
  };

  renderManager=function(){
    if(state.managerPage!=='planning')return baseRenderManager();
    app.innerHTML=header()+`<main class="page">${managerPlanning()}</main>`;
    navRoot.innerHTML=managerNav();
    if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
  };
  render=function(){renderManager()};

  navigateManager=function(page){
    if(page!=='planning')return baseNavigateManager(page);
    state.managerPage='planning';state.managerPlanningPersonId='';state.managerPlanningBody='';state.managerPlanningTab='plan';state.managerPlanningOrigin='planning';
    state.candidateFilter='all';render();if(typeof afterNavigation==='function')afterNavigation();
    if(typeof loadManagerCandidates==='function')loadManagerCandidates({force:true}).then(()=>{if(state.managerPage==='planning'&&!state.managerPlanningPersonId)render()}).catch(error=>{console.error(error);showToast('Não foi possível carregar os planejamentos.')});
  };

  window.renderPersonModal=renderPersonModal;
  window.openPerson=openPerson;
  window.managerNav=managerNav;
  window.renderManager=renderManager;
  window.navigateManager=navigateManager;

  if(state.role==='manager'&&typeof render==='function')render();
})();