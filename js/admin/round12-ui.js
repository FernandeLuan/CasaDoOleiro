/* Round 12 — Ajustes administrativos focados no dia certo e descrições visíveis. */
(function round12Admin(){
  const basePersonCompact=personCompact;
  const basePersonTabContent=personTabContent;
  const baseManagerHome=managerHome;

  function safe(value){return encodeURIComponent(String(value??''))}
  function compactDay(date){try{return new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date(`${date}T12:00:00`))}catch{return fmtDate(date,true)}}
  function weekday(date){try{return new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{weekday:'short'}).format(new Date(`${date}T12:00:00`)).replace('.','').toLowerCase()}catch{return String(dayName(date)||'').slice(0,3).toLowerCase()}}
  function dayHours(day){const minutes=(day.sessions||[]).reduce((sum,row)=>sum+(Number(row.duration||row.activity?.duration)||0),0),hours=Math.floor(minutes/60),rest=minutes%60;return hours?(rest?`${hours}h${String(rest).padStart(2,'0')}`:`${hours}h`):`${rest}min`}
  function pendingSessionChange(p){return (state.pendingChangeRequests||[]).find(row=>String(row.applicationId)===String(p?.id))||null}
  function requestedDayAdjustment(p){return Object.entries(p?.dayAdjustments||{}).filter(([,value])=>!value?.status||value.status==='requested').map(([date])=>date).sort()[0]||null}
  function adjustmentTargetDate(p){return pendingSessionChange(p)?.date||requestedDayAdjustment(p)||null}

  /* Abrir a fila força uma atualização somente nesse momento, sem polling. */
  window.openManagerAdjustments=async function(){
    state.candidateFilter='adjustments';
    navigateManager('volunteer');
    try{await hydrateManagerPendingChanges({force:true});if(state.managerPage==='volunteer'&&state.candidateFilter==='adjustments')render()}catch(error){console.error(error)}
  };
  managerHome=function(){return baseManagerHome().replace("state.candidateFilter='adjustments';navigateManager('volunteer')","openManagerAdjustments()")};

  /* Na fila Ajustes, abrir já no planejamento e no dia que exige decisão. */
  window.openCandidateAdjustmentAt=async function(id,date=''){
    const p=candidateById(id);if(!p)return;
    renderPersonModal(p,'plan');
    try{
      await hydrateCandidatePlanning(p.id,{force:true});
      const days=candidatePlanningDays(p),targetDate=date||adjustmentTargetDate(p),index=days.findIndex(day=>String(day.date)===String(targetDate));
      if(index>=0){const pageSize=typeof CANDIDATE_PLAN_PAGE_SIZE==='number'?CANDIDATE_PLAN_PAGE_SIZE:5;state.candidatePlanVisible[String(p.id)]=Math.max(pageSize,index+1)}
      renderPersonModal(p,'plan');
      requestAnimationFrame(()=>{
        const target=[...modalRoot.querySelectorAll('details[data-plan-date]')].find(node=>String(node.dataset.planDate)===String(targetDate));
        if(target){target.open=true;target.scrollIntoView({block:'center',behavior:'smooth'})}
      });
    }catch(error){console.error(error);showToast('Não foi possível abrir o ajuste solicitado.')}
  };

  personCompact=function(p){
    let html=basePersonCompact(p);
    if(state.candidateFilter!=='adjustments')return html;
    const targetDate=adjustmentTargetDate(p),arg=candidateActionArg(p.id),pending=pendingSessionChange(p);
    if(targetDate)html=html.replace(`onclick="openPerson(decodeURIComponent('${arg}'))"`,`onclick="openCandidateAdjustmentAt(decodeURIComponent('${arg}'),'${escapeHtml(targetDate)}')"`);
    if(pending&&p.status==='approved')html=html.replace(/<span class="badge success">Aprovado<\/span>/,badge('Mudança solicitada','warning'));
    return html;
  };

  /* Visão geral: somente quantidade de atividades. Sessões/horas não justificam carregar o plano. */
  personTabContent=function(p,tab){
    let html=basePersonTabContent(p,tab);
    if(tab==='overview')html=html.replace(/<span class="stat-pill">[^<]*(?:planejadas|sessões)<\/span>/,'');
    return html;
  };

  /* Planejamento: descrição visível; mudança pendente fica indicada somente pelo botão de aprovação. */
  adminPlanningDayCard=function(p,day){
    const adjustment=candidateDayAdjustment(p,day.date),canAdjust=['analysis','adjustments'].includes(p.status),id=safe(p.id),dateArg=safe(day.date);
    const rows=day.sessions.map(session=>{
      const a=session.activity||{},description=session.activityDescription||a.description||'',notes=session.notes||a.notes||'',group=session.groupId&&session.groupId!=='A definir'?` • Grupo ${escapeHtml(session.groupId)}`:'',change=session.status==='change_requested';
      const info=notes?`<button class="planning-note-button" type="button" aria-label="Ver observações" onclick="openAdminActivityInfo('${safe(a.name||session.activityName||'Atividade')}','','${safe(notes)}','${dateArg}')"><i class="fa-solid fa-circle-info"></i></button>`:'';
      return `<div class="planning-session-row"><div><div class="planning-session-title"><strong>${escapeHtml(a.name||session.activityName||'Atividade')}</strong>${info}</div><span>${escapeHtml(session.time||a.time||'—')} • ${Number(session.duration||a.duration)||0} min${group}</span>${description?`<p class="admin-session-description"><strong>Descrição:</strong> ${escapeHtml(description)}</p>`:''}${change?`<button class="btn btn-soft approve-change-button" type="button" onclick="approveVolunteerChange('${safe(session.id)}','${safe(p.id)}')"><i class="fa-solid fa-check"></i>Aprovar mudança</button>`:''}</div></div>`;
    }).join('');
    return `<details class="card planning-day-card" data-plan-date="${escapeHtml(day.date)}"><summary class="planning-day-head"><div class="planning-day-date"><strong>${compactDay(day.date)} ${weekday(day.date)}</strong>${adjustment?'<span class="badge warning">Reajustar</span>':''}</div><div class="planning-day-total"><strong>${dayHours(day)}</strong><i class="fa-solid fa-chevron-down"></i></div></summary><div class="planning-day-content">${adjustment?`<div class="day-adjustment-note"><i class="fa-solid fa-circle-info"></i><span>${escapeHtml(adjustment.note||'Ajuste solicitado pela equipe.')}</span></div>`:''}<div class="planning-day-sessions">${rows}</div>${canAdjust?`<div class="planning-day-adjust-action"><button class="btn btn-soft" type="button" onclick="requestDayAdjust(decodeURIComponent('${id}'),decodeURIComponent('${dateArg}'))"><i class="fa-solid fa-pen"></i>Solicitar ajuste neste dia</button></div>`:''}</div></details>`;
  };

  /* Agenda Admin: mesma descrição visível que o voluntário enxerga. */
  sessionCard=function(s){
    const [label,type]=statusMeta(s.status),a=s.activity||{},description=a.description||s.activityDescription||'';
    return `<div class="activity-card clickable" onclick='openManagerSession(${JSON.stringify(s.sessionId)})'><div class="activity-row"><div><h4>${a.time||'—'} • ${escapeHtml(a.name||'Atividade')}</h4><p>${Number(a.duration)||0} min • ${escapeHtml(a.period||'Sem preferência')} • ${escapeHtml(a.participation||'Livre')}</p>${description?`<p class="admin-session-description"><strong>Descrição:</strong> ${escapeHtml(description)}</p>`:''}<div class="session-person"><i class="fa-regular fa-user"></i>${escapeHtml(a.owner||'Voluntário')}</div></div><div style="display:flex;align-items:flex-start;gap:7px">${badge(label,type)}<i class="fa-solid fa-chevron-right chevron"></i></div></div><div class="item-meta">${badge(s.group||'A definir','primary')}</div></div>`;
  };

  window.managerHome=managerHome;
  window.personCompact=personCompact;
  window.personTabContent=personTabContent;
  window.adminPlanningDayCard=adminPlanningDayCard;
  window.sessionCard=sessionCard;

  if(state.role==='manager'&&typeof render==='function')render();
})();
