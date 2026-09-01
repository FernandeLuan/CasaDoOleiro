/* Propostas novas durante uma estadia já aprovada. */
(function postApprovalPortal(){
  const baseSessionCardVolunteer=sessionCardVolunteer;

  function blockedReason(date){
    const dates=volunteerStayDates(),first=dates[0],last=dates[dates.length-1];
    if(date===first)return t('portal.blocked.arrival');
    if(date===last)return t('portal.blocked.departure');
    const day=new Date(`${date}T12:00:00`).getDay();
    if(day===0||day===6)return t('portal.blocked.weekend');
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
    const info=hasInfo&&typeof openVolunteerActivityInfo==='function'?`<button class="planning-note-button volunteer-info-button" type="button" aria-label="${escapeHtml(t('portal.activity.infoAria'))}" onclick="openVolunteerActivityInfo('${encodeURIComponent(a.name||raw.activityName||'Atividade')}','${encodeURIComponent(notes)}','${encodeURIComponent(materials)}')"><i class="fa-solid fa-circle-info"></i></button>`:'';
    const labels={analysis:[t('portal.session.reviewing'),'info'],adjustments:[t('portal.session.adjust'),'warning'],rejected:[t('portal.session.rejected'),'danger']},meta=labels[proposal.status]||[t('portal.session.reviewing'),'info'];
    let actions='';
    if(proposal.status==='analysis')actions=`<div class="activity-actions"><button class="btn btn-soft" type="button" disabled><i class="fa-solid fa-clock"></i>${escapeHtml(t('portal.session.awaitingReview'))}</button></div>`;
    if(proposal.status==='adjustments')actions=`<div class="activity-actions candidate-session-actions"><button class="btn btn-outline" type="button" onclick='openActivityModal(${JSON.stringify(s.date)},${JSON.stringify(String(activityId))})'><i class="fa-solid fa-pen"></i>${escapeHtml(t('action.adjust'))}</button><button class="btn btn-danger-soft" type="button" onclick='requestDeletePlanningSession(${JSON.stringify(String(activityId))},${JSON.stringify(s.date)})'>${escapeHtml(t('action.delete'))}</button></div>`;
    const note=proposal.status==='adjustments'&&proposal.note?`<div class="notice warning proposal-review-note"><i class="fa-solid fa-rotate"></i><div data-no-i18n>${escapeHtml(proposal.note)}</div></div>`:'';
    return `<div class="activity-card volunteer-session-card post-approval-proposal"><div class="activity-row"><div class="volunteer-session-main"><div class="volunteer-session-title"><h4 data-no-i18n>${escapeHtml(a.name||raw.activityName||'Atividade')}</h4>${info}</div><p>${Number(a.duration||raw.duration)||0} min • ${escapeHtml(tValue(activityPeriodValue(raw,a)))}</p>${description?`<p class="volunteer-session-description"><strong>${escapeHtml(t('portal.activity.descriptionLabel'))}</strong> <span data-no-i18n>${escapeHtml(description)}</span></p>`:''}</div>${badge(meta[0],meta[1])}</div>${note}${actions}</div>`;
  };

  volunteerAgendaContent=function(editable=false){
    const dates=volunteerStayDates();if(!dates.length)return `<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>${escapeHtml(t('portal.plan.noPeriod'))}</div>`;
    const approved=state.volunteerMode==='approved';
    return `<div class="calendar-strip">${dates.map(d=>`<button class="date-chip" onclick="scrollToVolunteerDay('${d}')"><span>${dayName(d)}</span><strong>${new Date(d+'T12:00:00').getDate()}</strong><span>${calendarMonthLabel(d)}</span></button>`).join('')}</div><div class="volunteer-plan-days">${dates.map(d=>{const ss=getSessions(d,true),adjustment=volunteerDayAdjustment(d),blocked=blockedReason(d);return `<div class="day-block" id="vday-${d}"><div class="day-title volunteer-day-title"><div><h3>${dayName(d)}, ${fmtDate(d)}</h3>${adjustment?`<span class="badge warning">${escapeHtml(t('portal.plan.adjust'))}</span>`:''}</div><div class="day-title-actions">${adjustment?`<button class="day-info-button" type="button" onclick="openVolunteerDayAdjustment('${d}')" aria-label="${escapeHtml(t('portal.plan.viewGuidance'))}"><i class="fa-solid fa-circle-info"></i></button>`:''}<span>${ss.length?`${(ss.reduce((x,s)=>x+(Number(s.activity.duration)||0),0)/60).toFixed(1).replace('.0','')}h`:''}</span></div></div>${ss.map(s=>sessionCardVolunteer(s,editable)).join('')}${blocked?`<div class="no-activity-day"><i class="fa-regular fa-calendar-xmark"></i><span>${escapeHtml(blocked)}</span></div>`:(!ss.length?`<div class="empty">${escapeHtml(t('portal.plan.noActivity'))}</div>`:'')}${editable&&!blocked?`<button class="btn btn-soft btn-block" style="margin-top:6px" onclick="openActivityModal('${d}')"><i class="fa-solid fa-plus"></i>${escapeHtml(t('action.addActivity'))}</button>`:''}</div>`}).join('')}</div>`;
  };

  volunteerAgenda=function(){return `<section class="section"><div class="section-head"><div><span class="eyebrow">${escapeHtml(t('portal.agenda.eyebrow'))}</span><h2>${escapeHtml(t('portal.agenda.title'))}</h2><p>${escapeHtml(t('portal.agenda.subtitle'))}</p></div></div><div class="notice"><i class="fa-solid fa-lightbulb"></i><div>${escapeHtml(t('portal.agenda.newIdea'))}</div></div><div style="margin-top:14px">${volunteerAgendaContent(true)}</div></section>`};

  window.sessionCardVolunteer=sessionCardVolunteer;window.volunteerAgendaContent=volunteerAgendaContent;window.volunteerAgenda=volunteerAgenda;
  if(state.role==='volunteer'&&state.volunteerMode==='approved'&&typeof render==='function')render();
})();
