/* Round 54 — planejamento aprovado, aguardando reunião: novas propostas sem reabrir o aprovado. */
(function meetingActivityR54(){
  function meetingMode(){return state.volunteerMode!=='approved'&&state.currentApplication?.status==='meeting'}
  function proposalEditable(activity){return activity?.postApprovalProposal===true&&activity?.reviewStatus==='adjustments'}
  function localeLabel(pt,en,es){const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';return locale.startsWith('en')?en:locale.startsWith('es')?es:pt}
  function sourceSession(activityId,date){return (state.sessions||[]).find(row=>String(row.activityId)===String(activityId)&&String(row.date)===String(date))||null}

  function meetingActions(session,html){
    const activity=session?.activity||{};if(activity.postApprovalProposal===true)return html;
    const activityId=String(activity.id||session?.activityId||''),date=String(session?.date||'');if(!activityId||!date)return html;
    const template=document.createElement('template');template.innerHTML=html;const card=template.content.querySelector('.activity-card');if(!card||card.querySelector('.meeting-activity-actions'))return template.innerHTML;
    card.insertAdjacentHTML('beforeend',`<div class="activity-actions candidate-session-actions meeting-activity-actions"><button class="btn btn-outline" type="button" onclick="replicateMeetingActivity('${encodeURIComponent(activityId)}','${encodeURIComponent(date)}')"><i class="fa-solid fa-copy"></i>${escapeHtml(localeLabel('Replicar atividade','Duplicate activity','Replicar actividad'))}</button><button class="btn btn-soft" type="button" onclick="openActivityModal('${date}')"><i class="fa-solid fa-plus"></i>${escapeHtml(t('action.addActivity'))}</button></div>`);
    return template.innerHTML;
  }

  function removeRedundantDayButtons(html){
    const template=document.createElement('template');template.innerHTML=html;
    template.content.querySelectorAll('.day-block').forEach(day=>{
      if(!day.querySelector('.activity-card'))return;
      [...day.children].forEach(child=>{if(child.matches?.('button[onclick^="openActivityModal"]'))child.remove()});
    });
    return template.innerHTML;
  }

  /* O planejamento já aprovado continua somente leitura. Em meeting, apenas novas atividades
     (ou uma proposta devolvida para reajuste) recebem edição; atividades aprovadas ganham
     somente as ações contextuais Replicar / Adicionar. */
  if(typeof volunteerAgendaContent==='function'&&typeof sessionCardVolunteer==='function'){
    const baseAgenda=volunteerAgendaContent;
    volunteerAgendaContent=function(editable=false){
      if(!meetingMode())return baseAgenda(editable);
      const baseSessionCard=sessionCardVolunteer;
      sessionCardVolunteer=function(session){
        const activity=session?.activity||{};
        const html=baseSessionCard(session,proposalEditable(activity));
        return meetingActions(session,html);
      };
      try{return removeRedundantDayButtons(baseAgenda(true))}finally{sessionCardVolunteer=baseSessionCard}
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

  window.replicateMeetingActivity=function(encodedActivityId,encodedDate){
    const activityId=decodeURIComponent(encodedActivityId),date=decodeURIComponent(encodedDate);if(!meetingMode())return showToast(t('portal.activity.adjustLocked'));
    const activity=(state.activities||[]).find(row=>String(row.id)===String(activityId));if(!activity||activity.postApprovalProposal===true)return showToast(t('portal.activity.adjustLocked'));
    const session=sourceSession(activityId,date)||{};
    openActivityModal(date);
    const values={actName:session.activityName||activity.name||'',actDesc:session.activityDescription||activity.description||'',actDuration:Number(session.duration||activity.duration)||60,actParticipation:session.participation||activity.participation||'Livre',actMaterials:session.materials||activity.materials||'',actNotes:session.notes||activity.notes||'',actPeriod:typeof activityPeriodValue==='function'?activityPeriodValue(session,activity):(session.period||activity.period||'Sem preferência')};
    Object.entries(values).forEach(([field,value])=>{const input=document.getElementById(field);if(input)input.value=String(value)});
  };

  /* O save existente já conhece o fluxo seguro de proposta pós-aprovação. */
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

  /* O Perfil mantém o atalho de Adicionar atividade durante a etapa de reunião. */
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