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

  /* O save existente já conhece o fluxo seguro de proposta pós-aprovação. Alteramos o modo
     apenas durante a entrada síncrona da função, suficiente para ela capturar proposal=true;
     antes de qualquer resposta assíncrona/render o modo original já foi restaurado. */
  if(typeof saveActivity==='function'){
    const baseSaveActivity=saveActivity;
    saveActivity=function(...args){
      if(!meetingMode())return baseSaveActivity(...args);
      const previousMode=state.volunteerMode;
      state.volunteerMode='approved';
      try{return baseSaveActivity(...args)}finally{state.volunteerMode=previousMode}
    };
    window.saveActivity=saveActivity;
  }

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
