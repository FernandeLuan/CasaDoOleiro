/* Round 5 — Admin: fila enxuta, planejamento fechado por padrão e fluxo de revisão íntegro. */
(function round5Admin(){
  function safe(value){return encodeURIComponent(String(value??''))}
  function shortDate(date){try{return new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date(`${date}T12:00:00`))}catch{return fmtDate(date)}}
  function shortDay(date){try{return new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{weekday:'short'}).format(new Date(`${date}T12:00:00`)).replace('.','').toLowerCase()}catch{return String(dayName(date)||'').slice(0,3).toLowerCase()}}
  function totalHours(day){const min=(day.sessions||[]).reduce((sum,row)=>sum+(Number(row.duration||row.activity?.duration)||0),0),h=Math.floor(min/60),m=min%60;return h?(m?`${h}h${String(m).padStart(2,'0')}`:`${h}h`):`${m}min`}
  function applyCacheCount(p){const cache=typeof candidatePlanningCache==='function'?candidatePlanningCache(p.id):null;if(cache){p.activities=(cache.activities||[]).length;p.sessions=(cache.sessions||[]).length}return p}

  /* Home: somente as duas filas que exigem decisão administrativa. */
  managerHome=function(){
    const todaySessions=getSessions(_oleiroToday),arrivals=nextMovements('from'),departures=nextMovements('to');
    return `<section class="hero"><div class="eyebrow" style="color:#d9eadf">Gestão</div><h1>${managerGreeting()}</h1><p class="muted">Veja o que precisa da sua atenção e o que acontece hoje na Casa.</p><div class="hero-actions"><button class="btn btn-light" onclick="navigateManager('volunteer')"><i class="fa-solid fa-users"></i>Voluntariado</button><button class="btn btn-outline" style="border-color:rgba(255,255,255,.28);color:white" onclick="openTodayAgenda()"><i class="fa-regular fa-calendar"></i>Ver agenda</button></div></section>
    <section class="section"><div class="section-head"><div><h2>Pendências</h2><p>Ações que merecem atenção</p></div></div><div class="grid-2 pending-grid pending-grid-two">${metric(dashboardCount('analysis'),'fa-clipboard-check','Em análise',"state.candidateFilter='analysis';navigateManager('volunteer')")}${metric(dashboardCount('adjustments'),'fa-rotate','Ajustes',"state.candidateFilter='adjustments';navigateManager('volunteer')")}</div></section>
    <section class="section"><div class="section-head"><div><h2>Hoje na Casa</h2><p>${longDate(_oleiroToday)}</p></div><button class="btn btn-soft" onclick="openTodayAgenda()">Agenda</button></div><div class="list">${todaySessions.length?todaySessions.map(s=>agendaItem(s.activity.time,s.activity.name,s.activity.owner,s.group,s.status)).join(''):'<div class="empty">Nenhuma atividade prevista para hoje.</div>'}</div></section>
    <section class="section"><div class="section-head"><div><h2>Próximas movimentações</h2><p>Chegadas e saídas confirmadas</p></div></div><div class="grid-2"><div class="card"><span class="eyebrow">Chegadas</span><div style="margin-top:10px" class="list">${movementList(arrivals,'from')}</div></div><div class="card"><span class="eyebrow">Saídas</span><div style="margin-top:10px" class="list">${movementList(departures,'to')}</div></div></div></section>`;
  };

  /* Abrir candidato nunca bloqueia a UI, mas sempre atualiza status/ajustes em segundo plano. */
  openPerson=async function(id,tab='overview'){
    let p=candidateById(id);if(!p)return;
    applyCacheCount(p);renderPersonModal(p,tab);
    const refresh=()=>{const current=candidateById(id);if(current&&modalRoot.dataset.personId===String(id))renderPersonModal(applyCacheCount(current),modalRoot.dataset.personTab||tab)};
    const tasks=[];
    if(window.OleiroServices?.applications?.getById){
      tasks.push(window.OleiroServices.applications.getById(id).then(fresh=>{
        if(!fresh)return;
        const cached=candidatePlanningCache(id);if(cached){fresh.activities=(cached.activities||[]).length;fresh.sessions=(cached.sessions||[]).length}
        const index=state.candidates.findIndex(row=>String(row.id)===String(id));if(index>=0)state.candidates[index]=fresh;p=fresh;refresh();
      }).catch(error=>console.error('Não foi possível atualizar a candidatura:',error)));
    }
    if(tab==='plan'||['analysis','adjustments','approved'].includes(p.status)){
      tasks.push(hydrateCandidatePlanning(id).then(cache=>{const current=candidateById(id);if(current&&cache){current.activities=(cache.activities||[]).length;current.sessions=(cache.sessions||[]).length}refresh()}).catch(error=>{console.error(error);if(tab==='plan')showToast('Não foi possível carregar o planejamento.')}));
    }
    await Promise.allSettled(tasks);
  };

  openAdminActivityInfo=function(name,description,notes){
    const n=decodeURIComponent(name||''),d=decodeURIComponent(description||''),o=decodeURIComponent(notes||'');
    const sections=[];if(d)sections.push(`<div class="activity-info-block"><strong>Descrição</strong><p>${escapeHtml(d)}</p></div>`);if(o)sections.push(`<div class="activity-info-block"><strong>Observações</strong><p>${escapeHtml(o)}</p></div>`);
    openModal(n||'Informações da atividade','',sections.join('')||'<div class="empty">Sem informações adicionais.</div>');
  };

  adminPlanningDayCard=function(p,day){
    const adjustment=candidateDayAdjustment(p,day.date),canAdjust=['analysis','adjustments'].includes(p.status),id=safe(p.id),dateArg=safe(day.date);
    return `<details class="card planning-day-card"><summary class="planning-day-head"><div class="planning-day-date"><strong>${shortDate(day.date)} ${shortDay(day.date)}</strong>${adjustment?'<span class="badge warning">Reajustar</span>':''}</div><div class="planning-day-total"><strong>${totalHours(day)}</strong><i class="fa-solid fa-chevron-down"></i></div></summary><div class="planning-day-content">${adjustment?`<div class="day-adjustment-note"><i class="fa-solid fa-circle-info"></i><span>${escapeHtml(adjustment.note||'Ajuste solicitado pela equipe.')}</span></div>`:''}<div class="planning-day-sessions">${day.sessions.map(session=>{const a=session.activity||{},description=session.activityDescription||a.description||'',notes=session.notes||a.notes||'',hasInfo=!!(description||notes),group=session.groupId&&session.groupId!=='A definir'?` • Grupo ${escapeHtml(session.groupId)}`:'';return `<div class="planning-session-row"><div class="planning-session-title"><strong>${escapeHtml(a.name||session.activityName||'Atividade')}</strong>${hasInfo?`<button class="planning-note-button" type="button" aria-label="Ver informações da atividade" onclick="openAdminActivityInfo('${safe(a.name||session.activityName||'Atividade')}','${safe(description)}','${safe(notes)}')"><i class="fa-solid fa-circle-info"></i></button>`:''}</div><span>${escapeHtml(session.time||a.time||'—')} • ${Number(session.duration||a.duration)||0} min${group}</span></div>`}).join('')}</div>${canAdjust?`<div class="planning-day-adjust-action"><button class="btn btn-soft" type="button" onclick="requestDayAdjust(decodeURIComponent('${id}'),decodeURIComponent('${dateArg}'))"><i class="fa-solid fa-pen"></i>Solicitar ajuste neste dia</button></div>`:''}</div></details>`;
  };

  candidatePlanContent=function(p){
    const cache=candidatePlanningCache(p.id);if(!cache)return `<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando planejamento...</div>`;
    p.activities=(cache.activities||[]).length;p.sessions=(cache.sessions||[]).length;
    const days=candidatePlanningDays(p);if(!days.length)return `<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>Nenhuma atividade cadastrada ainda.</div>`;
    const visible=Math.max(CANDIDATE_PLAN_PAGE_SIZE,state.candidatePlanVisible[String(p.id)]||CANDIDATE_PLAN_PAGE_SIZE),shown=days.slice(0,visible),remaining=days.length-shown.length,arg=candidateActionArg(p.id),reviewing=['analysis','adjustments'].includes(p.status);
    return `<div class="planning-by-day">${shown.map(day=>adminPlanningDayCard(p,day)).join('')}</div>${remaining>0?`<button class="btn btn-soft btn-block" type="button" style="margin-top:10px" onclick="loadMoreCandidatePlan(decodeURIComponent('${arg}'))"><i class="fa-solid fa-chevron-down"></i>Ver mais ${Math.min(CANDIDATE_PLAN_PAGE_SIZE,remaining)}</button>`:''}<div class="planning-admin-footer planning-review-footer"><button class="btn btn-outline planning-whatsapp" type="button" onclick="exportCandidatePlanning(decodeURIComponent('${arg}'))"><i class="fa-brands fa-whatsapp"></i>Compartilhar no WhatsApp</button>${reviewing?`<button class="btn btn-primary" type="button" onclick="approveCandidate(decodeURIComponent('${arg}'))"><i class="fa-solid fa-check"></i>Aprovar</button><button class="btn btn-danger-soft" type="button" onclick="rejectCandidate(decodeURIComponent('${arg}'))"><i class="fa-solid fa-xmark"></i>Recusar</button>`:''}</div>`;
  };
})();
