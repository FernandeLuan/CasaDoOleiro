/* Página administrativa de Planejamento em primeiro nível, preservando os renderizadores funcionais existentes. */
(function adminPlanningPage(){
  if(typeof renderManager!=='function'||typeof openPerson!=='function'||typeof renderPersonModal!=='function')return;
  if(!document.querySelector('link[data-planning-page-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href='../css/planning-page.css?v=20260903-clean';link.dataset.planningPageStyle='1';document.head.appendChild(link)}

  const baseRenderManager=renderManager;
  const baseNavigateManager=navigateManager;
  const baseOpenPerson=openPerson;
  const baseRenderPersonModal=renderPersonModal;
  const baseLoadMoreCandidates=typeof loadMoreCandidates==='function'?loadMoreCandidates:null;

  state.managerPlanningPersonId=state.managerPlanningPersonId||'';
  state.managerPlanningTab=state.managerPlanningTab||'plan';
  state.managerPlanningBody=state.managerPlanningBody||'';
  state.managerPlanningOrigin=state.managerPlanningOrigin||'planning';
  state.managerPlanningLoading=false;

  function planningPerson(){return candidateById(state.managerPlanningPersonId)}
  function isActivityAssistant(){return String(state.currentSession?.user?.role||state.role||'')==='activity_assistant'}
  function personDates(p){const from=String(p?.stayStart||p?.from||'').slice(0,10),to=String(p?.stayEnd||p?.to||'').slice(0,10);return from&&to?`${fmtDate(from,true)} → ${fmtDate(to,true)}`:'Período não informado'}
  function personBadge(p){
    let label='',type='';
    if(p?.status==='meeting'){
      const meeting=String(p.meetingStatus||'pending');
      if(meeting==='scheduled'){label='Reunião agendada';type='info'}
      else if(meeting==='completed'){label='Reunião realizada';type='success'}
      else {label='Aguardando reunião';type='info'}
    }else{
      [label,type]=typeof statusMeta==='function'?statusMeta(p?.status):[p?.status||'Status',''];
    }
    return `<span class="badge ${escapeHtml(type||'')}">${escapeHtml(label)}</span>`;
  }
  function profileTabs(p){
    const id=encodeURIComponent(String(p?.id||'')),tab=String(state.managerPlanningTab||'plan');
    const item=(value,label)=>`<button class="${tab===value?'active':''}" type="button" aria-current="${tab===value?'page':'false'}" onclick="openPerson(decodeURIComponent('${id}'),'${value}')">${label}</button>`;
    return `<div class="person-refactor-tabs planning-profile-tabs" role="tablist" aria-label="Seções do voluntário">${item('plan','Planejamento')}${isActivityAssistant()?'':item('account','Conta')+item('history','Histórico')}</div>`;
  }
  function sanitizeCapturedBody(body,tab='plan'){
    const template=document.createElement('template');template.innerHTML=String(body||'');
    template.content.querySelectorAll('.person-refactor-tabs,.planning-profile-tabs,.person-history-tabs').forEach(node=>node.remove());
    if(tab==='plan')template.content.querySelectorAll('.admin-plan-review-footer,.planning-admin-footer').forEach(node=>node.remove());
    if(tab==='account')template.content.querySelectorAll('.account-status-line').forEach(node=>node.remove());
    return template.innerHTML;
  }

  function planningReviewToolbar(p){
    const tab=String(state.managerPlanningTab||'plan'),status=String(p?.status||'');
    if(isActivityAssistant()||tab!=='plan'||!['analysis','adjustments'].includes(status))return '';
    const id=encodeURIComponent(String(p.id||''));
    const title=status==='adjustments'?'Planejamento com ajustes':'Planejamento em análise';
    const description=status==='adjustments'
      ?'Revise os ajustes solicitados. Quando estiver tudo certo, aprove o planejamento.'
      :'Revise as atividades enviadas. Quando estiver tudo certo, aprove o planejamento.';
    return `<section class="planning-review-toolbar" aria-label="Ações de revisão do planejamento"><div class="planning-review-toolbar-copy"><span class="eyebrow">${escapeHtml(title)}</span><p>${escapeHtml(description)}</p></div><button class="btn btn-primary planning-approve-button" type="button" onclick="requestApprovePlanning('${id}')"><i class="fa-solid fa-check"></i>Aprovar planejamento</button></section>`;
  }

  function planningList(){
    const rows=(state.candidates||[]).filter(p=>p.status!=='rejected');
    const body=typeof candidateListHtml==='function'?candidateListHtml(rows):rows.map(personCompact).join('');
    return `<section class="section planning-index-page compact-page-top">
      <div class="planning-index-head"><div><span class="eyebrow">Planejamento</span><h1>Planejamentos dos voluntários</h1><p>Consulte, revise e acompanhe os planejamentos em uma tela dedicada.</p></div></div>
      <div class="candidate-tools candidate-tools-compact planning-index-tools"><div class="filter-search candidate-search"><i class="fa-solid fa-magnifying-glass"></i><input id="planningCandidateSearch" class="input" type="search" value="${escapeHtml(state.candidateSearch||'')}" placeholder="Buscar voluntário por nome" oninput="updatePlanningCandidateSearch(this.value)"></div></div>
      <div class="planning-index-count"><span>${rows.length} ${rows.length===1?'perfil':'perfis'} nesta página</span></div>
      <div id="planningCandidateList" class="list planning-candidate-list">${body||'<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>Nenhum planejamento encontrado.</div>'}</div>
    </section>`;
  }

  function planningDetail(){
    const p=planningPerson();if(!p)return planningList();
    const loading=state.managerPlanningLoading&&!state.managerPlanningBody;
    return `<section class="section planning-detail-page compact-page-top" data-person-id="${escapeHtml(String(p.id))}">
      <header class="planning-profile-head"><div class="planning-profile-heading"><div class="planning-profile-copy"><div class="planning-profile-title-line"><h1>${escapeHtml(p.name||'Voluntário')}</h1></div><div class="planning-profile-meta"><span>${escapeHtml(p.country||'—')}</span><b>•</b><span>${escapeHtml(p.unit||p.unitName||'—')}</span><b>•</b><span class="planning-profile-period-status"><span>${escapeHtml(personDates(p))}</span><b>•</b>${personBadge(p)}</span></div></div></div><button class="planning-close-button" type="button" onclick="closePlanningDetail()" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>${profileTabs(p)}</header>
      <div class="planning-page-content">${planningReviewToolbar(p)}${loading?'<div class="empty compact-loading planning-page-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando planejamento...</div>':state.managerPlanningBody||'<div class="empty compact-loading planning-page-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando dados...</div>'}</div>
    </section>`;
  }

  function managerPlanning(){return state.managerPlanningPersonId?planningDetail():planningList()}
  window.adminPlanningPageHtml=managerPlanning;
  let deferProfileRender=0;
  let capturedProfileChanged=false;

  function capturePersonMarkup(p,tab='plan'){
    let capturedBody='';
    const realOpenModal=window.openModal;
    const captureModal=(title,subtitle,body)=>{capturedBody=String(body||'')};
    try{
      window.openModal=captureModal;
      try{openModal=captureModal}catch{}
      baseRenderPersonModal(p,tab);
    }finally{
      window.openModal=realOpenModal;
      try{openModal=realOpenModal}catch{}
      /* O renderizador legado usa dataset do modal para saber qual perfil está ativo.
         Mantemos os metadados, mas nunca criamos o modal visual. */
      modalRoot.innerHTML='';
      document.body.classList.remove('modal-open');
    }
    return capturedBody;
  }
  function applyCapturedBody(p,tab,body,{renderNow=true}={}){
    if(!body)return false;
    state.managerPlanningBody=sanitizeCapturedBody(body,tab);
    state.managerPlanningTab=tab;
    state.managerPlanningPersonId=String(p.id);
    capturedProfileChanged=true;
    if(renderNow&&state.managerPage==='planning')render();
    return true;
  }
  function capturePersonBody(p,tab='plan',{renderNow=deferProfileRender===0}={}){
    return applyCapturedBody(p,tab,capturePersonMarkup(p,tab),{renderNow});
  }

  renderPersonModal=function(p,tab='plan'){
    if(!p)return;
    if(state.managerPage!=='planning'||String(state.managerPlanningPersonId||'')!==String(p.id))return baseRenderPersonModal(p,tab);
    const canPatchPlan=tab==='plan'&&!state.managerPlanningLoading&&app.querySelector('.planning-person-agenda-page')&&typeof window.refreshPlanningPersonAgenda==='function';
    if(canPatchPlan&&deferProfileRender===0){
      Promise.resolve(window.refreshPlanningPersonAgenda(p.id)).catch(error=>{console.error('Falha ao atualizar planejamento localmente:',error);showToast('A alteração foi salva, mas a tela não pôde ser atualizada.')});
      return;
    }
    return capturePersonBody(p,tab);
  };

  openPerson=async function(id,tab='plan'){
    const p=candidateById(id);if(!p)return;
    tab=isActivityAssistant()?'plan':(tab==='account'?'account':'plan');
    const samePerson=state.managerPage==='planning'&&String(state.managerPlanningPersonId||'')===String(id);
    const sameTab=samePerson&&String(state.managerPlanningTab||'plan')===tab;
    /* Tocar na aba que já está ativa não busca dados, não renderiza e não anima. */
    if(sameTab)return;
    if(state.managerPage!=='planning')state.managerPlanningOrigin=state.managerPage||'volunteer';else if(!state.managerPlanningPersonId)state.managerPlanningOrigin='planning';
    state.managerPage='planning';state.managerPlanningPersonId=String(id);state.managerPlanningLoading=true;
    capturedProfileChanged=false;
    if(!samePerson){
      state.managerPlanningTab=tab;
      state.managerPlanningBody='';
      render();
      if(typeof afterNavigation==='function')afterNavigation();
    }else{
      /* Enquanto o carregamento legado acontece, capturamos seus renders em memória
         e só pintamos a nova aba uma vez, no final. */
      deferProfileRender+=1;
    }
    try{
      return await baseOpenPerson(id,tab);
    }finally{
      if(samePerson)deferProfileRender=Math.max(0,deferProfileRender-1);
      state.managerPlanningLoading=false;
      if(state.managerPage==='planning'&&String(state.managerPlanningPersonId)===String(id)){
        if(samePerson&&capturedProfileChanged)render();
        else if(!state.managerPlanningBody)render();
      }
      capturedProfileChanged=false;
    }
  };

  window.requestApprovePlanning=function(encodedId){
    if(isActivityAssistant())return showToast('Seu perfil não possui permissão para aprovar planejamentos.');
    const id=decodeURIComponent(String(encodedId||'')),p=candidateById(id);
    if(!p)return showToast('Cadastro não encontrado.');
    if(!['analysis','adjustments'].includes(String(p.status||'')))return showToast('Este planejamento não está aguardando aprovação.');
    return approveCandidate(id);
  };
  window.closePlanningDetail=function(){
    const origin=state.managerPlanningOrigin==='volunteer'?'volunteer':'planning';state.managerPlanningPersonId='';state.managerPlanningBody='';state.managerPlanningTab='plan';
    if(origin==='volunteer')return navigateManager('volunteer');state.managerPage='planning';render();if(typeof afterNavigation==='function')afterNavigation();
  };
  window.updatePlanningCandidateSearch=function(value){
    state.candidateSearch=value;clearTimeout(state._planningSearchTimer);
    state._planningSearchTimer=setTimeout(()=>{if(typeof loadManagerCandidates==='function')loadManagerCandidates({force:true}).then(()=>{if(state.managerPage==='planning'&&!state.managerPlanningPersonId)render()}).catch(error=>{console.error(error);showToast('Não foi possível buscar os voluntários.')})},300);
  };
  if(baseLoadMoreCandidates){loadMoreCandidates=async function(){const result=await baseLoadMoreCandidates();if(state.managerPage==='planning'&&!state.managerPlanningPersonId)render();return result};window.loadMoreCandidates=loadMoreCandidates}

  managerNav=function(){const item=(id,icon,label)=>`<button class="nav-btn ${state.managerPage===id?'active':''}" onclick="navigateManager('${id}')"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;return `<nav class="bottom-nav">${item('home','fa-house','Início')}${item('volunteer','fa-users','Voluntariado')}${item('planning','fa-calendar-check','Planejamento')}${item('agenda','fa-calendar-days','Agenda')}${item('occupancy','fa-bed','Ocupação')}${item('menu','fa-bars','Menu')}</nav>`};
  renderManager=function(){if(state.managerPage!=='planning')return baseRenderManager();app.innerHTML=header()+`<main class="page">${managerPlanning()}</main>`;navRoot.innerHTML=managerNav();if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}};render=function(){renderManager()};
  navigateManager=function(page){
    if(String(state.managerPage||'')===String(page||''))return;
    if(page!=='planning')return baseNavigateManager(page);
    state.managerPage='planning';state.managerPlanningPersonId='';state.managerPlanningBody='';state.managerPlanningTab='plan';state.managerPlanningOrigin='planning';state.candidateFilter='all';render();if(typeof afterNavigation==='function')afterNavigation();
    if(typeof loadManagerCandidates==='function')loadManagerCandidates({force:true}).then(()=>{if(state.managerPage==='planning'&&!state.managerPlanningPersonId)render()}).catch(error=>{console.error(error);showToast('Não foi possível carregar os planejamentos.')});
  };

  window.renderPersonModal=renderPersonModal;window.openPerson=openPerson;window.managerNav=managerNav;window.renderManager=renderManager;window.navigateManager=navigateManager;
  if(state.role==='manager'&&typeof render==='function')render();
})();
