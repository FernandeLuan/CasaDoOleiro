/* Admin: Home enxuta, detalhe com retorno e planejamento por dia. */
(function round6Admin(){
  function safe(value){return encodeURIComponent(String(value??''))}
  function shortDate(date){try{return new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date(`${date}T12:00:00`))}catch{return fmtDate(date)}}
  function shortDay(date){try{return new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{weekday:'short'}).format(new Date(`${date}T12:00:00`)).replace('.','').toLowerCase()}catch{return String(dayName(date)||'').slice(0,3).toLowerCase()}}
  function totalHours(day){const min=(day.sessions||[]).reduce((sum,row)=>sum+(Number(row.duration||row.activity?.duration)||0),0),h=Math.floor(min/60),m=min%60;return h?(m?`${h}h${String(m).padStart(2,'0')}`:`${h}h`):`${m}min`}

  managerHome=function(){
    const todaySessions=getSessions(_oleiroToday),arrivals=nextMovements('from'),departures=nextMovements('to');
    return `<section class="hero"><div class="eyebrow" style="color:#d9eadf">Gestão</div><h1>${managerGreeting()}</h1><p class="muted">Veja o que precisa da sua atenção e o que acontece hoje na Casa.</p><div class="hero-actions"><button class="btn btn-light" onclick="navigateManager('volunteer')"><i class="fa-solid fa-users"></i>Voluntariado</button><button class="btn btn-outline" style="border-color:rgba(255,255,255,.28);color:white" onclick="openTodayAgenda()"><i class="fa-regular fa-calendar"></i>Ver agenda</button></div></section>
    <section class="section"><div class="section-head"><div><h2>Pendências</h2><p>Ações que merecem atenção</p></div></div><div class="grid-2 pending-grid pending-grid-two">${metric(dashboardCount('analysis'),'fa-clipboard-check','Em análise',"state.candidateFilter='analysis';navigateManager('volunteer')")}${metric(dashboardCount('adjustments'),'fa-rotate','Ajustes',"state.candidateFilter='adjustments';navigateManager('volunteer')")}</div></section>
    <section class="section"><div class="section-head"><div><h2>Hoje na Casa</h2><p>${longDate(_oleiroToday)}</p></div></div><div class="list">${todaySessions.length?todaySessions.map(s=>agendaItem(s.activity.time,s.activity.name,s.activity.owner,s.group,s.status)).join(''):'<div class="empty">Nenhuma atividade prevista para hoje.</div>'}</div></section>
    <section class="section"><div class="section-head"><div><h2>Próximas movimentações</h2><p>Chegadas e saídas confirmadas</p></div></div><div class="grid-2"><div class="card"><span class="eyebrow">Chegadas</span><div style="margin-top:10px" class="list">${movementList(arrivals,'from')}</div></div><div class="card"><span class="eyebrow">Saídas</span><div style="margin-top:10px" class="list">${movementList(departures,'to')}</div></div></div></section>`;
  };

  function restorePlanning(personId){
    const p=candidateById(personId);
    if(p)renderPersonModal(p,'plan');else closeModal();
  }

  openAdminActivityInfo=function(name,description,notes){
    const personId=String(modalRoot.dataset.personId||state.currentPlanningApplicationId||'');
    const n=decodeURIComponent(name||''),d=decodeURIComponent(description||''),o=decodeURIComponent(notes||'');
    const sections=[];
    if(d)sections.push(`<div class="activity-info-block"><strong>Descrição</strong><p>${escapeHtml(d)}</p></div>`);
    if(o)sections.push(`<div class="activity-info-block"><strong>Observações</strong><p>${escapeHtml(o)}</p></div>`);
    openModal(n||'Informações da atividade','',sections.join('')||'<div class="empty">Sem informações adicionais.</div>');
    if(!personId)return;
    const head=modalRoot.querySelector('.modal-head'),close=modalRoot.querySelector('.modal-close');
    if(head&&close){
      const actions=document.createElement('div');actions.className='modal-head-actions';
      const back=document.createElement('button');back.type='button';back.className='modal-back-button';back.innerHTML='<i class="fa-solid fa-arrow-left"></i><span>Voltar</span>';back.onclick=()=>restorePlanning(personId);
      head.insertBefore(actions,close);actions.append(back,close);close.onclick=()=>restorePlanning(personId);
    }
    const backdrop=modalRoot.querySelector('.modal-backdrop');if(backdrop)backdrop.onclick=e=>{if(e.target===backdrop)restorePlanning(personId)};
  };

  window.approveVolunteerChange=async function(sessionId,applicationId){
    const p=candidateById(applicationId),cache=candidatePlanningCache(applicationId),session=cache?.sessions?.find(row=>String(row.id)===String(sessionId));
    if(!p||!session)return showToast('Sessão não encontrada.');
    try{
      await window.OleiroServices.planning.updateSession(sessionId,{status:'confirmed',confirmedAt:new Date(),changeNote:''});
      session.status='confirmed';session.changeNote='';
      if(typeof invalidateManagerScheduleCache==='function')invalidateManagerScheduleCache();
      renderPersonModal(p,'plan');showToast('Mudança aprovada.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível aprovar a mudança.')}
  };

  adminPlanningDayCard=function(p,day){
    const adjustment=candidateDayAdjustment(p,day.date),canAdjust=['analysis','adjustments'].includes(p.status),id=safe(p.id),dateArg=safe(day.date);
    return `<details class="card planning-day-card"><summary class="planning-day-head"><div class="planning-day-date"><strong>${shortDate(day.date)} ${shortDay(day.date)}</strong>${adjustment?'<span class="badge warning">Reajustar</span>':''}</div><div class="planning-day-total"><strong>${totalHours(day)}</strong><i class="fa-solid fa-chevron-down"></i></div></summary><div class="planning-day-content">${adjustment?`<div class="day-adjustment-note"><i class="fa-solid fa-circle-info"></i><span>${escapeHtml(adjustment.note||'Ajuste solicitado pela equipe.')}</span></div>`:''}<div class="planning-day-sessions">${day.sessions.map(session=>{const a=session.activity||{},description=session.activityDescription||a.description||'',notes=session.notes||a.notes||'',hasInfo=!!(description||notes),finalGroup=session.groupId&&session.groupId!=='A definir'?` • Grupo ${escapeHtml(session.groupId)}`:'',changeRequested=session.status==='change_requested';return `<div class="planning-session-row ${changeRequested?'has-change-request':''}"><div><div class="planning-session-title"><strong>${escapeHtml(a.name||session.activityName||'Atividade')}</strong>${hasInfo?`<button class="planning-note-button" type="button" aria-label="Ver informações da atividade" onclick="openAdminActivityInfo('${safe(a.name||session.activityName||'Atividade')}','${safe(description)}','${safe(notes)}')"><i class="fa-solid fa-circle-info"></i></button>`:''}${changeRequested?'<span class="badge warning">Mudança solicitada</span>':''}</div><span>${escapeHtml(session.time||a.time||'—')} • ${Number(session.duration||a.duration)||0} min${finalGroup}</span>${changeRequested?`<button class="btn btn-soft approve-change-button" type="button" onclick="approveVolunteerChange('${safe(session.id)}','${safe(p.id)}')"><i class="fa-solid fa-check"></i>Aprovar mudança</button>`:''}</div></div>`}).join('')}</div>${canAdjust?`<div class="planning-day-adjust-action"><button class="btn btn-soft" type="button" onclick="requestDayAdjust(decodeURIComponent('${id}'),decodeURIComponent('${dateArg}'))"><i class="fa-solid fa-pen"></i>Solicitar ajuste neste dia</button></div>`:''}</div></details>`;
  };
})();
