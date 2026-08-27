/* Propostas novas durante uma estadia já aprovada. */
(function postApprovalPortal(){
  const baseSessionCardVolunteer=sessionCardVolunteer;

  function blockedReason(date){
    const dates=volunteerStayDates(),first=dates[0],last=dates[dates.length-1];
    if(date===first)return 'Chegada — dia sem atividade';
    if(date===last)return 'Saída — dia sem atividade';
    const day=new Date(`${date}T12:00:00`).getDay();
    if(day===0||day===6)return 'Fim de semana — dia sem atividade';
    return '';
  }
  function proposalMeta(s){
    const raw=s?.raw||{},activity=s?.activity||{};
    if(raw.postApprovalProposal!==true&&activity.postApprovalProposal!==true)return null;
    return {status:raw.reviewStatus||activity.reviewStatus||'',note:raw.reviewNote||activity.reviewNote||''};
  }

  sessionCardVolunteer=function(s,editable){
    const proposal=proposalMeta(s);if(!proposal||proposal.status==='approved')return baseSessionCardVolunteer(s,editable);
    const a=s.activity||{},raw=s.raw||{},description=raw.activityDescription||a.description||'',notes=raw.notes||a.notes||'',materials=raw.materials||a.materials||'',hasInfo=!!(notes||(materials&&materials!=='Nenhum')),sessionId=s.sessionId||raw.id||'',activityId=a.id||raw.activityId||'';
    const info=hasInfo&&typeof openVolunteerActivityInfo==='function'?`<button class="planning-note-button volunteer-info-button" type="button" aria-label="Ver informações" onclick="openVolunteerActivityInfo('${encodeURIComponent(a.name||raw.activityName||'Atividade')}','${encodeURIComponent(notes)}','${encodeURIComponent(materials)}')"><i class="fa-solid fa-circle-info"></i></button>`:'';
    const labels={analysis:['Em análise','info'],adjustments:['Reajustar','warning'],rejected:['Recusada','danger']},meta=labels[proposal.status]||['Em análise','info'];
    let actions='';
    if(proposal.status==='analysis')actions=`<div class="activity-actions"><button class="btn btn-soft" type="button" disabled><i class="fa-solid fa-clock"></i>Aguardando análise</button></div>`;
    if(proposal.status==='adjustments')actions=`<div class="activity-actions candidate-session-actions"><button class="btn btn-outline" type="button" onclick='openActivityModal(${JSON.stringify(s.date)},${JSON.stringify(String(activityId))})'><i class="fa-solid fa-pen"></i>Reajustar</button><button class="btn btn-danger-soft" type="button" onclick='requestDeletePlanningSession(${JSON.stringify(String(activityId))},${JSON.stringify(s.date)})'>Excluir</button></div>`;
    const note=proposal.status==='adjustments'&&proposal.note?`<div class="notice warning proposal-review-note"><i class="fa-solid fa-rotate"></i><div>${escapeHtml(proposal.note)}</div></div>`:'';
    return `<div class="activity-card volunteer-session-card post-approval-proposal"><div class="activity-row"><div class="volunteer-session-main"><div class="volunteer-session-title"><h4>${escapeHtml(a.time||raw.time||'—')} • ${escapeHtml(a.name||raw.activityName||'Atividade')}</h4>${info}</div><p>${Number(a.duration||raw.duration)||0} min • ${escapeHtml(a.period||raw.period||'Sem preferência')}</p>${description?`<p class="volunteer-session-description"><strong>Descrição:</strong> ${escapeHtml(description)}</p>`:''}</div>${badge(meta[0],meta[1])}</div>${note}${actions}</div>`;
  };

  volunteerAgendaContent=function(editable=false){
    const dates=volunteerStayDates();if(!dates.length)return '<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>O período da estadia ainda não foi definido.</div>';
    const approved=state.volunteerMode==='approved';
    return `<div class="calendar-strip">${dates.map(d=>`<button class="date-chip" onclick="scrollToVolunteerDay('${d}')"><span>${dayName(d)}</span><strong>${new Date(d+'T12:00:00').getDate()}</strong><span>${calendarMonthLabel(d)}</span></button>`).join('')}</div><div class="volunteer-plan-days">${dates.map(d=>{const ss=getSessions(d,true),adjustment=volunteerDayAdjustment(d),blocked=blockedReason(d);return `<div class="day-block" id="vday-${d}"><div class="day-title volunteer-day-title"><div><h3>${dayName(d)}, ${fmtDate(d)}</h3>${adjustment?'<span class="badge warning">Reajustar</span>':''}</div><div class="day-title-actions">${adjustment?`<button class="day-info-button" type="button" onclick="openVolunteerDayAdjustment('${d}')" aria-label="Ver orientação"><i class="fa-solid fa-circle-info"></i></button>`:''}<span>${ss.length?`${(ss.reduce((x,s)=>x+(Number(s.activity.duration)||0),0)/60).toFixed(1).replace('.0','')}h`:''}</span></div></div>${ss.map(s=>sessionCardVolunteer(s,editable)).join('')}${blocked?`<div class="no-activity-day"><i class="fa-regular fa-calendar-xmark"></i><span>${blocked}</span></div>`:(!ss.length?'<div class="empty">Nenhuma atividade planejada.</div>':'')}${editable&&!blocked?`<button class="btn btn-soft btn-block" style="margin-top:6px" onclick="openActivityModal('${d}')"><i class="fa-solid fa-plus"></i>${approved?'Adicionar atividade':'Adicionar atividade'}</button>`:''}</div>`}).join('')}</div>`;
  };

  volunteerAgenda=function(){return `<section class="section"><div class="section-head"><div><span class="eyebrow">Estadia confirmada</span><h2>Minha agenda</h2><p>Cronograma operacional atualizado</p></div></div><div class="notice"><i class="fa-solid fa-lightbulb"></i><div>Teve uma nova ideia? Você pode propor outra atividade. Ela entra na agenda somente depois da análise da Casa.</div></div><div style="margin-top:14px">${volunteerAgendaContent(true)}</div></section>`};

  window.sessionCardVolunteer=sessionCardVolunteer;window.volunteerAgendaContent=volunteerAgendaContent;window.volunteerAgenda=volunteerAgenda;
  if(state.role==='volunteer'&&state.volunteerMode==='approved'&&typeof render==='function')render();
})();
