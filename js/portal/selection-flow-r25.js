/* Round 25 — etapa de reunião no Portal e exclusão do candidato sem batch cruzado de permissões. */
(function selectionFlowR25Portal(){
  function validUrl(value){try{const url=new URL(String(value||''));return ['http:','https:'].includes(url.protocol)?url.toString():''}catch{return ''}}
  const basePlanStatusFromApplication=planStatusFromApplication;
  planStatusFromApplication=function(status){return status==='meeting'?'plan_approved':basePlanStatusFromApplication(status)};
  if(state.currentApplication?.status==='meeting'&&state.volunteerMode!=='approved')state.volunteerPlanStatus='plan_approved';

  const baseVolunteerPlan=volunteerPlan;
  volunteerPlan=function(){
    if(state.volunteerMode==='approved'||state.currentApplication?.status!=='meeting')return baseVolunteerPlan();
    const application=state.currentApplication||{},dates=typeof planningEligibleDatesFor==='function'?planningEligibleDatesFor(application):(typeof volunteerStayDates==='function'?volunteerStayDates():[]),period=dates.length?`${fmtDate(dates[0],true)}–${fmtDate(dates[dates.length-1],true)}`:'Período a confirmar';
    return `<section class="section candidate-plan-refactor compact-page-top"><div class="candidate-plan-compact-head info"><strong>${escapeHtml(period)}</strong><span>Planejamento aprovado</span></div><div class="notice" style="margin-bottom:14px"><i class="fa-solid fa-circle-check"></i><div>Seu planejamento foi aprovado. A próxima etapa é a reunião de definição com a equipe da Casa.</div></div><div class="candidate-plan-content">${volunteerAgendaContent(false)}</div></section>`;
  };

  const baseVolunteerHome=volunteerHome;
  volunteerHome=function(){
    const application=state.currentApplication||{};if(state.volunteerMode==='approved'||application.status!=='meeting')return baseVolunteerHome();
    const previous=state.volunteerPlanStatus;state.volunteerPlanStatus='submitted';let html=baseVolunteerHome();state.volunteerPlanStatus=previous;
    html=html.replace('Enviado para análise','Planejamento aprovado').replace('A equipe da Casa recebeu seu planejamento. Enquanto ele estiver em análise, a edição fica bloqueada.','Seu planejamento foi aprovado. A próxima etapa é a reunião de definição com a equipe da Casa.');
    const status=String(application.meetingStatus||'pending');if(!['scheduled','completed'].includes(status))return html;
    const date=application.meetingDate?fmtDate(String(application.meetingDate).slice(0,10)):null,time=String(application.meetingTime||''),duration=Number(application.meetingDuration)||30,link=validUrl(application.meetingLink||''),notes=String(application.meetingNotes||'').trim();
    const card=`<section class="section selection-portal-meeting"><div class="section-head"><div><h2>Próximos compromissos</h2><p>Reunião de definição</p></div></div><div class="card selection-meeting-card"><div class="selection-meeting-card-head"><div class="metric-icon"><i class="fa-solid fa-video"></i></div><div><strong>Reunião de definição</strong><span>${escapeHtml([date,time].filter(Boolean).join(' • '))}</span></div><span class="badge ${status==='completed'?'success':'info'}">${status==='completed'?'Realizada':'Agendada'}</span></div><div class="selection-meeting-card-meta"><span><i class="fa-regular fa-clock"></i>${duration} min</span></div>${notes?`<p>${escapeHtml(notes)}</p>`:''}${link&&status!=='completed'?`<a class="btn btn-primary btn-block" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-video"></i>Entrar na reunião</a>`:''}</div></section>`;
    const marker='<section class="section"><div class="section-head"><div><h2>Minha estadia</h2>';const at=html.indexOf(marker);return at>=0?`${html.slice(0,at)}${card}${html.slice(at)}`:`${card}${html}`;
  };

  /* Primeiro exclui a sessão/atividade. Só depois atualiza o estado da candidatura. Assim uma falha de regra no status nunca impede a exclusão válida. */
  window.deletePlanningSession=async function(activityId,date){
    const session=typeof realSessionFor==='function'?realSessionFor(activityId,date):null,application=state.currentApplication;if(!session||!application?.id)return showToast('Sessão não encontrada.');
    const approved=state.volunteerMode==='approved',activity=(state.activities||[]).find(row=>String(row.id)===String(activityId)),postAdjustment=approved&&activity?.postApprovalProposal===true&&activity?.reviewStatus==='adjustments';if(approved&&!postAdjustment)return showToast('Esta sessão não pode ser excluída neste status.');
    const active=(state.sessions||[]).filter(row=>row.status!=='rejected'&&row.reviewStatus!=='rejected'),remaining=active.filter(row=>String(row.id)!==String(session.id)),remainingOnDate=remaining.filter(row=>String(row.date)===String(date));
    const resetEmpty=!approved&&state.volunteerPlanStatus==='adjustments'&&remaining.length===0,nextAdjustments={...(application.dayAdjustments||{})},hadAdjustment=!!nextAdjustments[date];if(hadAdjustment&&!remainingOnDate.length)delete nextAdjustments[date];
    try{
      const result=await window.OleiroServices.planning.deleteSession(session.id,{applicationId:application.id,activityId,updateApplicationCounts:false});
      state.sessions=(state.sessions||[]).filter(row=>String(row.id)!==String(session.id));
      if(result.deletedActivity)state.activities=(state.activities||[]).filter(row=>String(row.id)!==String(activityId));else{const current=(state.activities||[]).find(row=>String(row.id)===String(activityId));if(current)current.dates=(current.dates||[]).filter(value=>value!==date)}
      application.sessionCount=remaining.length;application.activityCount=(state.activities||[]).length;
      let statusWriteFailed=false;
      if(!approved&&(resetEmpty||hadAdjustment&&!remainingOnDate.length)){
        const patch=resetEmpty?{status:'pending',planningSubmittedAt:null,dayAdjustments:{}}:{dayAdjustments:nextAdjustments};
        try{await window.OleiroServices.applications.update(application.id,patch)}catch(error){statusWriteFailed=true;console.warn('Sessão excluída, mas o estado complementar será normalizado na próxima abertura:',error)}
        if(resetEmpty){application.status='pending';application.planningSubmittedAt=null;application.dayAdjustments={};state.volunteerPlanStatus='draft'}else application.dayAdjustments=nextAdjustments;
      }
      closeModal();render();showToast(statusWriteFailed?'Atividade excluída. O status será sincronizado ao reabrir.':resetEmpty?'Atividade excluída. Monte seu planejamento novamente.':'Sessão excluída.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível excluir a sessão.')}
  };

  window.planStatusFromApplication=planStatusFromApplication;window.volunteerPlan=volunteerPlan;window.volunteerHome=volunteerHome;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
