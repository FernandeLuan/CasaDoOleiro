/* Round 25/28 — etapa de reunião no Portal, exclusão segura e i18n dinâmico por chave. */
(function selectionFlowR25Portal(){
  const tx=(key,fallback)=>typeof t==='function'?t(key):fallback;
  function validUrl(value){try{const url=new URL(String(value||''));return ['http:','https:'].includes(url.protocol)?url.toString():''}catch{return ''}}

  const basePlanStatusFromApplication=planStatusFromApplication;
  planStatusFromApplication=function(status){return status==='meeting'?'plan_approved':basePlanStatusFromApplication(status)};
  if(state.currentApplication?.status==='meeting'&&state.volunteerMode!=='approved')state.volunteerPlanStatus='plan_approved';

  const baseVolunteerPlan=volunteerPlan;
  volunteerPlan=function(){
    if(state.volunteerMode==='approved'||state.currentApplication?.status!=='meeting')return baseVolunteerPlan();
    const application=state.currentApplication||{},dates=typeof planningEligibleDatesFor==='function'?planningEligibleDatesFor(application):(typeof volunteerStayDates==='function'?volunteerStayDates():[]),period=dates.length?`${fmtDate(dates[0],true)}–${fmtDate(dates[dates.length-1],true)}`:t('portal.home.periodConfirm');
    return `<section class="section candidate-plan-refactor compact-page-top"><div class="candidate-plan-compact-head info"><strong>${escapeHtml(period)}</strong><span>${escapeHtml(t('portal.meeting.planApproved'))}</span></div><div class="notice" style="margin-bottom:14px"><i class="fa-solid fa-circle-check"></i><div>${escapeHtml(t('portal.meeting.planApprovedBody'))}</div></div><div class="candidate-plan-content">${volunteerAgendaContent(false)}</div></section>`;
  };

  window.portalMeetingHomeCard=function(application){
    const status=String(application?.meetingStatus||'pending');if(!['scheduled','completed'].includes(status))return '';
    const date=application.meetingDate?fmtDate(String(application.meetingDate).slice(0,10)):null,time=String(application.meetingTime||''),duration=Number(application.meetingDuration)||30,link=validUrl(application.meetingLink||''),notes=String(application.meetingNotes||'').trim();
    const meetingTitle=t('portal.meeting.definition');
    return `<section class="section selection-portal-meeting"><div class="section-head"><div><h2>${escapeHtml(t('portal.meeting.next'))}</h2><p>${escapeHtml(meetingTitle)}</p></div></div><div class="card selection-meeting-card"><div class="selection-meeting-card-head"><div class="metric-icon"><i class="fa-solid fa-video"></i></div><div><strong>${escapeHtml(meetingTitle)}</strong><span>${escapeHtml([date,time].filter(Boolean).join(' • '))}</span></div><span class="badge ${status==='completed'?'success':'info'}">${escapeHtml(status==='completed'?tx('meeting.completed','Reunião realizada'):tx('meeting.scheduled','Reunião agendada'))}</span></div><div class="selection-meeting-card-meta"><span><i class="fa-regular fa-clock"></i>${duration} min</span></div>${notes?`<p><strong>${escapeHtml(tx('meeting.note','Observação:'))}</strong> <span data-no-i18n>${escapeHtml(notes)}</span></p>`:''}${link&&status!=='completed'?`<a class="btn btn-primary btn-block" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-video"></i>${escapeHtml(t('action.enterMeeting'))}</a>`:''}</div></section>`;
  };

  window.planStatusFromApplication=planStatusFromApplication;window.volunteerPlan=volunteerPlan;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();