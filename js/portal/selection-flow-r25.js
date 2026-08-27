/* Round 25 — etapa de reunião no Portal e exclusão do candidato sem batch cruzado de permissões. */
(function selectionFlowR25Portal(){
  function validUrl(value){try{const url=new URL(String(value||''));return ['http:','https:'].includes(url.protocol)?url.toString():''}catch{return ''}}

  if(typeof OLEIRO_TRANSLATIONS!=='undefined'){
    Object.assign(OLEIRO_TRANSLATIONS.en,{
      'Observação:':'Note:','Excluindo...':'Deleting...','Esta atividade foi criada pela gestão e não pode ser excluída pelo candidato.':'This activity was created by management and cannot be deleted by the candidate.','Você só pode excluir atividades criadas por você.':'You can only delete activities created by you.','Não foi possível excluir a sessão.':'Could not delete the session.','Salvando...':'Saving...','Enviando...':'Sending...','Reenviando...':'Resending...'
    });
    Object.assign(OLEIRO_TRANSLATIONS.es,{
      'Observação:':'Observación:','Excluindo...':'Eliminando...','Esta atividade foi criada pela gestão e não pode ser excluída pelo candidato.':'Esta actividad fue creada por la gestión y no puede ser eliminada por el candidato.','Você só pode excluir atividades criadas por você.':'Solo puedes eliminar actividades creadas por ti.','Não foi possível excluir a sessão.':'No fue posible eliminar la sesión.','Salvando...':'Guardando...','Enviando...':'Enviando...','Reenviando...':'Reenviando...'
    });
  }

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
    const card=`<section class="section selection-portal-meeting"><div class="section-head"><div><h2>Próximos compromissos</h2><p>Reunião de definição</p></div></div><div class="card selection-meeting-card"><div class="selection-meeting-card-head"><div class="metric-icon"><i class="fa-solid fa-video"></i></div><div><strong>Reunião de definição</strong><span>${escapeHtml([date,time].filter(Boolean).join(' • '))}</span></div><span class="badge ${status==='completed'?'success':'info'}">${status==='completed'?'Realizada':'Agendada'}</span></div><div class="selection-meeting-card-meta"><span><i class="fa-regular fa-clock"></i>${duration} min</span></div>${notes?`<p><strong>Observação:</strong> <span data-no-i18n>${escapeHtml(notes)}</span></p>`:''}${link&&status!=='completed'?`<a class="btn btn-primary btn-block" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-video"></i>Entrar na reunião</a>`:''}</div></section>`;
    const marker='<section class="section"><div class="section-head"><div><h2>Minha estadia</h2>';const at=html.indexOf(marker);return at>=0?`${html.slice(0,at)}${card}${html.slice(at)}`:`${card}${html}`;
  };

  /* Primeiro exclui sessão/atividade. Só depois, se um ajuste ficou vazio, normaliza a candidatura em write separado. */
  window.deletePlanningSession=async function(activityId,date){
    const session=typeof realSessionFor==='function'?realSessionFor(activityId,date):null,application=state.currentApplication;if(!session||!application?.id)return showToast('Sessão não encontrada.');
    const approved=state.volunteerMode==='approved',activity=(state.activities||[]).find(row=>String(row.id)===String(activityId)),postAdjustment=approved&&activity?.postApprovalProposal===true&&activity?.reviewStatus==='adjustments';if(approved&&!postAdjustment)return showToast('Esta sessão não pode ser excluída neste status.');
    const managerCreated=session.managerCreated===true||session.raw?.managerCreated===true||activity?.managerCreated===true;if(managerCreated)return showToast('Esta atividade foi criada pela gestão e não pode ser excluída pelo candidato.');
    const uid=String(state.currentSession?.uid||''),createdBy=String(session.createdByUid||session.raw?.createdByUid||activity?.createdByUid||'');if(uid&&createdBy&&createdBy!==uid)return showToast('Você só pode excluir atividades criadas por você.');

    const active=(state.sessions||[]).filter(row=>row.status!=='rejected'&&row.reviewStatus!=='rejected'),remaining=active.filter(row=>String(row.id)!==String(session.id));
    const resetEmpty=!approved&&state.volunteerPlanStatus==='adjustments'&&remaining.length===0;
    const loaded=state.volunteerPlanningLoadedFor===String(application.id),occurrences=active.filter(row=>String(row.activityId)===String(activityId)).length;
    const knownActivityOccurrences=loaded&&occurrences>=1?occurrences:null;
    const button=modalRoot?.querySelector?.('button[onclick*="deletePlanningSession"]'),original=button?.innerHTML||'';
    if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Excluindo...'}

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
      closeModal();render();showToast(statusWriteFailed?'Atividade excluída. O status será sincronizado ao reabrir.':resetEmpty?'Atividade excluída. Monte seu planejamento novamente.':'Sessão excluída.');
    }catch(error){
      console.error(error);showToast(error?.message||'Não foi possível excluir a sessão.');
      if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original||'Excluir'}
    }
  };

  /* Conteúdo inserido/alterado depois do render também recebe i18n; conteúdo do usuário usa data-no-i18n. */
  if(typeof MutationObserver!=='undefined'&&typeof applyI18n==='function'&&typeof modalRoot!=='undefined'&&modalRoot){
    const observer=new MutationObserver(()=>applyI18n(modalRoot));
    observer.observe(modalRoot,{childList:true,subtree:true});
  }

  window.planStatusFromApplication=planStatusFromApplication;window.volunteerPlan=volunteerPlan;window.volunteerHome=volunteerHome;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();