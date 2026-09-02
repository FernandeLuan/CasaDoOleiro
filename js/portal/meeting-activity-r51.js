/* Round 51 — planejamento aprovado, aguardando reunião: permite somente novas propostas. */
(function meetingActivityR51(){
  function meetingMode(){return state.volunteerMode!=='approved'&&state.currentApplication?.status==='meeting'}
  function proposalEditable(activity){return activity?.postApprovalProposal===true&&activity?.reviewStatus==='adjustments'}

  /* O planejamento já aprovado continua somente leitura. Em meeting, apenas novas atividades
     (ou uma proposta devolvida para reajuste) recebem ações de edição. */
  if(typeof volunteerAgendaContent==='function'&&typeof sessionCardVolunteer==='function'){
    const baseAgenda=volunteerAgendaContent;
    volunteerAgendaContent=function(editable=false){
      if(!meetingMode())return baseAgenda(editable);
      const baseSessionCard=sessionCardVolunteer;
      sessionCardVolunteer=function(session){
        const activity=session?.activity||{};
        return baseSessionCard(session,proposalEditable(activity));
      };
      try{return baseAgenda(true)}finally{sessionCardVolunteer=baseSessionCard}
    };
    window.volunteerAgendaContent=volunteerAgendaContent;
  }

  /* Reaproveita o editor pós-aprovação para que a nova atividade seja tratada como proposta,
     sem destravar atividades que já foram aprovadas. */
  if(typeof openActivityModal==='function'){
    const baseOpenActivityModal=openActivityModal;
    openActivityModal=function(date=null,id=null){
      if(!meetingMode())return baseOpenActivityModal(date,id);
      const activity=id?(state.activities||[]).find(row=>String(row.id)===String(id)):null;
      if(id&&!proposalEditable(activity))return showToast(t('portal.activity.adjustLocked'));
      const previousMode=state.volunteerMode;
      state.volunteerMode='approved';
      try{return baseOpenActivityModal(date,id)}finally{state.volunteerMode=previousMode}
    };
    window.openActivityModal=openActivityModal;
  }

  /* Em meeting, uma atividade nova entra no mesmo fluxo de revisão das propostas criadas
     após a aprovação final: reviewStatus=analysis e sessões proposed. */
  saveActivity=async function(id){
    const button=modalRoot?.querySelector?.('button[onclick*="saveActivity"]');
    if(button?.disabled)return;
    const original=button?.innerHTML||'';
    if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(typeof t==='function'?t('action.saving'):'Salvando...')}`}

    const approved=state.volunteerMode==='approved',meeting=meetingMode(),proposalMode=approved||meeting;
    const existing=id?(state.activities||[]).find(a=>String(a.id)===String(id)):null;
    const postApprovalProposal=proposalMode&&(!id||proposalEditable(existing));
    if(proposalMode&&!postApprovalProposal){if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original}return showToast(t('portal.activity.adjustLocked'))}
    if(!proposalMode&&!['draft','submitted','adjustments'].includes(state.volunteerPlanStatus||'draft')){if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original}return showToast(t('portal.activity.locked'))}

    const dates=[...document.querySelectorAll('input[name="actDate"]:checked')].map(x=>x.value);
    const data={
      name:document.getElementById('actName')?.value.trim()||'',
      description:document.getElementById('actDesc')?.value.trim()||'',
      duration:+document.getElementById('actDuration')?.value||60,
      participation:document.getElementById('actParticipation')?.value||'Livre',
      materials:document.getElementById('actMaterials')?.value.trim()||'Nenhum',
      notes:document.getElementById('actNotes')?.value.trim()||'',
      period:document.getElementById('actPeriod')?.value||'Sem preferência'
    };
    if(!data.name){if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original}return showToast(t('portal.activity.nameRequired'))}
    if(!dates.length){if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original}return showToast(t('portal.activity.dateRequired'))}
    const application=state.currentApplication,session=state.currentSession;
    if(!application?.id||!session?.uid){if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original}return showToast(t('portal.plan.invalidSession'))}
    const ownerName=planningOwnerName(application,session);

    try{
      const result=await window.OleiroServices.planning.saveActivity({activityId:id,applicationId:application.id,unitId:application.unitId,createdByUid:session.uid,ownerName,data,dates,existingSessions:state.sessions||[],postApprovalProposal});
      applySavedActivityResult(result,dates);
      closeModal();render();
      showToast(proposalMode?(id?t('portal.activity.adjusted'):t('portal.activity.proposed')):(id?t('portal.activity.updated'):t('portal.activity.saved')));
    }catch(error){console.error(error);showToast(error?.message||t('portal.activity.saveError'))}
    finally{if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original||escapeHtml(typeof t==='function'?t('action.save'):'Salvar')}}
  };
  window.saveActivity=saveActivity;

  /* Atalho solicitado no Perfil. */
  if(typeof volunteerProfile==='function'){
    const baseVolunteerProfile=volunteerProfile;
    volunteerProfile=function(){
      let html=baseVolunteerProfile();
      if(!meetingMode())return html;
      const approvedLabel=typeof t==='function'?t('portal.meeting.planApproved'):'Planejamento aprovado';
      html=html.replace(/<strong class="profile-status [^"]+">[^<]*<\/strong>/,`<strong class="profile-status success">${escapeHtml(approvedLabel)}</strong>`);
      const action=`<div class="card" style="margin-top:12px"><button class="btn btn-primary btn-block" type="button" onclick="navigateVolunteer('plan')"><i class="fa-solid fa-plus"></i>${escapeHtml(t('action.addActivity'))}</button></div>`;
      const at=html.lastIndexOf('</section>');return at>=0?`${html.slice(0,at)}${action}${html.slice(at)}`:`${html}${action}`;
    };
    window.volunteerProfile=volunteerProfile;
  }

  if(state.role==='volunteer'&&typeof render==='function')render();
})();
