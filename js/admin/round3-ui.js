/* Round 3 — correções de UX do Admin, especialmente Safari/iPhone. */
(function round3AdminUi(){
  /* A renderização de Grupos fica em grupos.js. A sobrescrita antiga desta rodada
     removia o seletor de unidade e impedia alternar Rodeio/Indaial. */

  /* Tipo da candidatura: exatamente um flag 1/2, padrão 1. */
  candidateTypeSelector=function(){return `<div class="field candidate-type-field"><label>Tipo da candidatura</label><input id="ncType" type="hidden" value="individual"><div class="candidate-type-flag" role="group" aria-label="Tipo da candidatura"><button id="ncTypeIndividual" class="active" type="button" onclick="setCandidateType('individual')" aria-label="1 pessoa" title="Individual">1</button><button id="ncTypeCouple" type="button" onclick="setCandidateType('couple')" aria-label="2 pessoas" title="Dupla">2</button></div></div>`};
  setCandidateType=function(type){const next=type==='couple'?'couple':'individual';const input=document.getElementById('ncType');if(input)input.value=next;document.getElementById('ncTypeIndividual')?.classList.toggle('active',next==='individual');document.getElementById('ncTypeCouple')?.classList.toggle('active',next==='couple');toggleCandidateParticipant2();};

  /* O prazo permanece na aba Planejamento, não na Visão geral. */
  const lifecyclePersonTab=personTabContent;
  personTabContent=function(p,tab){
    if(p?.status==='pending'&&tab==='overview'){
      const originalPanel=candidatePendingPanel;candidatePendingPanel=function(){return ''};
      try{return lifecyclePersonTab(p,tab)}finally{candidatePendingPanel=originalPanel}
    }
    return lifecyclePersonTab(p,tab);
  };

  /* Ao hidratar o planejamento no Admin, os contadores são recalculados pelos dados reais. */
  const baseHydrateCandidatePlanning=hydrateCandidatePlanning;
  hydrateCandidatePlanning=async function(applicationId,opts={}){
    const cache=await baseHydrateCandidatePlanning(applicationId,opts);const p=candidateById(applicationId);
    if(p&&cache){p.activities=(cache.activities||[]).length;p.sessions=(cache.sessions||[]).length;}
    return cache;
  };

  function planningShareText(p){
    const days=candidatePlanningDays(p);const lines=[`*Planejamento - ${p.name}*`,`${p.unit} • ${fmtDate(p.from,true)} a ${fmtDate(p.to,true)}`,''];
    days.forEach(day=>{lines.push(`*${dayName(day.date)} • ${fmtDate(day.date,true)}*`);day.sessions.forEach(session=>{const a=session.activity||{};const time=session.time||a.time||'—',duration=Number(session.duration||a.duration)||0,note=session.notes||a.notes||'';lines.push(`• ${time} — ${a.name||session.activityName||'Atividade'} (${duration} min)${note?`\n  Obs.: ${note}`:''}`)});lines.push('')});
    return lines.join('\n').trim();
  }
  exportCandidatePlanning=function(id){
    const p=candidateById(id);if(!p)return;const text=planningShareText(p);if(!text)return showToast('Não há planejamento para compartilhar.');
    const url=`https://wa.me/?text=${encodeURIComponent(text)}`;const opened=window.open(url,'_blank','noopener,noreferrer');if(!opened)location.href=url;
  };

  candidatePlanContent=function(p){
    const cache=candidatePlanningCache(p.id);if(!cache)return `<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando planejamento...</div>`;
    const days=candidatePlanningDays(p);if(!days.length)return `<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>Nenhuma atividade cadastrada ainda.</div>`;
    const visible=Math.max(CANDIDATE_PLAN_PAGE_SIZE,state.candidatePlanVisible[String(p.id)]||CANDIDATE_PLAN_PAGE_SIZE),shown=days.slice(0,visible),remaining=days.length-shown.length,arg=candidateActionArg(p.id);
    return `<div class="planning-by-day">${shown.map(day=>adminPlanningDayCard(p,day)).join('')}</div>${remaining>0?`<button class="btn btn-soft btn-block" type="button" style="margin-top:10px" onclick="loadMoreCandidatePlan(decodeURIComponent('${arg}'))"><i class="fa-solid fa-chevron-down"></i>Ver mais ${Math.min(CANDIDATE_PLAN_PAGE_SIZE,remaining)}</button>`:''}<div class="planning-admin-footer"><button class="btn btn-outline planning-whatsapp" type="button" onclick="exportCandidatePlanning(decodeURIComponent('${arg}'))"><i class="fa-brands fa-whatsapp"></i>Compartilhar no WhatsApp</button>${['analysis','adjustments'].includes(p.status)?`<button class="btn btn-primary" type="button" onclick="approveCandidate(decodeURIComponent('${arg}'))">Aprovar planejamento</button>`:''}</div>`;
  };

  /* Editor nativo e simples de datas: evita a sobreposição do date-picker no iOS. */
  openStayDateEditor=function(id){
    const p=candidateById(id);if(!p)return;
    const body=`<div class="stay-date-editor"><div class="stay-date-grid"><div class="field"><label for="editStayFrom">Chegada</label><input id="editStayFrom" class="input" type="date" value="${escapeHtml(p.from||'')}"></div><div class="field"><label for="editStayTo">Saída</label><input id="editStayTo" class="input" type="date" value="${escapeHtml(p.to||'')}"></div></div></div>`;
    openModal('Editar datas','',body,`<button class="btn btn-primary btn-block" type="button" onclick='saveStayDates(${JSON.stringify(String(id))})'>Salvar período</button>`);
  };

  openMyAccount=function(){
    const session=state.currentSession||{},access=session.user||{},role=access.role==='coordinator'?'Coordenador':'Administrador';
    openModal('Minha conta','',`<div class="admin-account-card"><div class="admin-account-row"><span class="admin-account-icon"><i class="fa-regular fa-envelope"></i></span><div><span>E-mail</span><strong>${escapeHtml(session.email||'—')}</strong></div></div><div class="admin-account-row"><span class="admin-account-icon"><i class="fa-regular fa-id-badge"></i></span><div><span>Perfil</span><strong>${role}</strong></div></div><div class="admin-account-row"><span class="admin-account-icon"><i class="fa-solid fa-shield-halved"></i></span><div><span>Acesso</span><strong>Gestor</strong></div></div></div>`);
  };

  /* Aquecimento em segundo plano: quando o usuário tocar em Grupos, os dados normalmente já estarão em memória. */
  function warmGroups(attempt=0){
    if(state.role==='manager'&&typeof ensureManagerGroups==='function'){
      if(!state.groupsLoaded&&!state.groupsLoading)ensureManagerGroups().catch(error=>console.error('Falha ao pré-carregar grupos:',error));return;
    }
    if(attempt<24)setTimeout(()=>warmGroups(attempt+1),350);
  }
  setTimeout(()=>warmGroups(),250);
})();
