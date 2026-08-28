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

  const baseVolunteerHome=volunteerHome;
  volunteerHome=function(){
    const application=state.currentApplication||{};if(state.volunteerMode==='approved'||application.status!=='meeting')return baseVolunteerHome();
    const previous=state.volunteerPlanStatus;state.volunteerPlanStatus='submitted';let html=baseVolunteerHome();state.volunteerPlanStatus=previous;
    html=html.replace(t('portal.home.planSubmitted'),t('portal.meeting.planApproved')).replace(t('portal.home.submittedBody'),t('portal.meeting.planApprovedBody'));
    const status=String(application.meetingStatus||'pending');if(!['scheduled','completed'].includes(status))return html;
    const date=application.meetingDate?fmtDate(String(application.meetingDate).slice(0,10)):null,time=String(application.meetingTime||''),duration=Number(application.meetingDuration)||30,link=validUrl(application.meetingLink||''),notes=String(application.meetingNotes||'').trim();
    const meetingTitle=t('portal.meeting.definition');
    const card=`<section class="section selection-portal-meeting"><div class="section-head"><div><h2>${escapeHtml(t('portal.meeting.next'))}</h2><p>${escapeHtml(meetingTitle)}</p></div></div><div class="card selection-meeting-card"><div class="selection-meeting-card-head"><div class="metric-icon"><i class="fa-solid fa-video"></i></div><div><strong>${escapeHtml(meetingTitle)}</strong><span>${escapeHtml([date,time].filter(Boolean).join(' • '))}</span></div><span class="badge ${status==='completed'?'success':'info'}">${escapeHtml(status==='completed'?tx('meeting.completed','Reunião realizada'):tx('meeting.scheduled','Reunião agendada'))}</span></div><div class="selection-meeting-card-meta"><span><i class="fa-regular fa-clock"></i>${duration} min</span></div>${notes?`<p><strong>${escapeHtml(tx('meeting.note','Observação:'))}</strong> <span data-no-i18n>${escapeHtml(notes)}</span></p>`:''}${link&&status!=='completed'?`<a class="btn btn-primary btn-block" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-video"></i>${escapeHtml(t('action.enterMeeting'))}</a>`:''}</div></section>`;
    const marker=`<section class="section"><div class="section-head"><div><h2>${escapeHtml(t('portal.home.myStay'))}</h2>`;const at=html.indexOf(marker);return at>=0?`${html.slice(0,at)}${card}${html.slice(at)}`:`${card}${html}`;
  };

  window.deletePlanningSession=async function(activityId,date){
    const session=typeof realSessionFor==='function'?realSessionFor(activityId,date):null,application=state.currentApplication;if(!session||!application?.id)return showToast(t('portal.activity.deleteError'));
    const approved=state.volunteerMode==='approved',activity=(state.activities||[]).find(row=>String(row.id)===String(activityId)),postAdjustment=approved&&activity?.postApprovalProposal===true&&activity?.reviewStatus==='adjustments';if(approved&&!postAdjustment)return showToast(t('portal.activity.adjustLocked'));
    const managerCreated=session.managerCreated===true||session.raw?.managerCreated===true||activity?.managerCreated===true;if(managerCreated)return showToast(t('portal.activity.managerProtected'));
    const uid=String(state.currentSession?.uid||''),createdBy=String(session.createdByUid||session.raw?.createdByUid||activity?.createdByUid||'');if(uid&&createdBy&&createdBy!==uid)return showToast(t('portal.activity.ownerProtected'));

    const active=(state.sessions||[]).filter(row=>row.status!=='rejected'&&row.reviewStatus!=='rejected'),remaining=active.filter(row=>String(row.id)!==String(session.id));
    const resetEmpty=!approved&&state.volunteerPlanStatus==='adjustments'&&remaining.length===0;
    const loaded=state.volunteerPlanningLoadedFor===String(application.id),occurrences=active.filter(row=>String(row.activityId)===String(activityId)).length;
    const knownActivityOccurrences=loaded&&occurrences>=1?occurrences:null;
    const button=modalRoot?.querySelector?.('button[onclick*="deletePlanningSession"]'),original=button?.innerHTML||'';
    if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(tx('action.deleting','Excluindo...'))}`}

    try{
      const result=await window.OleiroServices.planning.deleteSession(session.id,{applicationId:application.id,activityId,updateApplicationCounts:false,knownActivityOccurrences});
      state.sessions=(state.sessions||[]).filter(row=>String(row.id)!==String(session.id));
      if(result.deletedActivity)state.activities=(state.activities||[]).filter(row=>String(row.id)!==String(activityId));else{const current=(state.activities||[]).find(row=>String(row.id)===String(activityId));if(current)current.dates=(current.dates||[]).filter(value=>value!==date)}
      application.sessionCount=remaining.length;application.activityCount=(state.activities||[]).length;
      let statusWriteFailed=false;
      if(resetEmpty){
        try{await window.OleiroServices.applications.update(application.id,{status:'pending',planningSubmittedAt:null,dayAdjustments:{}})}catch(error){statusWriteFailed=true;console.warn('Sessão excluída, mas o status vazio será normalizado na próxima abertura:',error)}
        application.status='pending';application.planningSubmittedAt=null;application.dayAdjustments={};state.volunteerPlanStatus='draft';
      }
      closeModal();render();showToast(statusWriteFailed?t('portal.session.statusSync'):resetEmpty?t('portal.session.deletedReset'):t('portal.activity.deleted'));
    }catch(error){
      console.error(error);showToast(error?.message||t('portal.activity.deleteError'));
      if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original||escapeHtml(tx('action.delete','Excluir'))}
    }
  };

  if(typeof saveActivity==='function'){
    const baseSaveActivity=saveActivity;
    saveActivity=async function(...args){
      const button=modalRoot?.querySelector?.('button[onclick*="saveActivity"]');if(button?.disabled)return;
      const original=button?.innerHTML||'';
      if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(tx('action.saving','Salvando...'))}`}
      try{return await baseSaveActivity(...args)}finally{if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original||escapeHtml(tx('action.save','Salvar'))}}
    };window.saveActivity=saveActivity;
  }

  if(typeof saveMove==='function'){
    const baseSaveMove=saveMove;
    saveMove=async function(...args){
      const button=modalRoot?.querySelector?.('button[onclick*="saveMove("]');if(button?.disabled)return;
      const original=button?.innerHTML||'';
      if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(tx('action.saving','Salvando...'))}`}
      try{return await baseSaveMove(...args)}finally{if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original||escapeHtml(tx('action.move','Mover'))}}
    };window.saveMove=saveMove;
  }

  window.planStatusFromApplication=planStatusFromApplication;window.volunteerPlan=volunteerPlan;window.volunteerHome=volunteerHome;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();