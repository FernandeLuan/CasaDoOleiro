/* Round 23/28 — atualização local após mover e feedback de envio do planejamento. */
(function refinementsR23Portal(){
  function sessionById(id){return (state.sessions||[]).find(row=>String(row.id||row.sessionId)===String(id))||null}
  function activityFor(session){return (state.activities||[]).find(row=>String(row.id)===String(session?.activityId))||{id:session?.activityId,name:session?.activityName||'Atividade',time:session?.time||''}}
  function moveDates(session){
    if(typeof planningEligibleDatesFor==='function')return planningEligibleDatesFor(state.currentApplication||{});
    if(typeof volunteerStayDates==='function')return volunteerStayDates().filter(date=>{const d=new Date(`${date}T12:00:00`).getDay();return d!==0&&d!==6});
    return [];
  }
  function rebuildVolunteerPlanning(){
    const application=state.currentApplication||{};
    if(typeof portalPlanActivities==='function'){
      state.activities=portalPlanActivities(application,state.sessions||[]);
      state.activities.forEach(activity=>{activity.managerCreated=(state.sessions||[]).some(session=>String(session.activityId)===String(activity.id)&&session.managerCreated===true)});
    }
    state.sessionStatus={};state.sessionGroups={};
    (state.sessions||[]).forEach(session=>{if(session.activityId&&session.date){state.sessionStatus[`${session.activityId}-${session.date}`]=session.status||'proposed';state.sessionGroups[`${session.activityId}-${session.date}`]=session.groupId||'A definir'}});
    if(state.volunteerMode!=='approved'&&application){application.sessionCount=(state.sessions||[]).length;application.activityCount=(state.activities||[]).length}
  }

  /* O write já confirma sucesso. Não há motivo para bloquear a UI aguardando um getDoc da mesma sessão. */
  window.saveMoveBySessionId=async function(encodedId,byVolunteer=false){
    const id=decodeURIComponent(encodedId),session=sessionById(id);if(!session)return showToast(t('portal.move.error'));
    const activity=activityFor(session),oldDate=String(session.date||''),oldTime=String(session.time||activity.time||''),newDate=document.getElementById('moveDate')?.value||'',newTime=document.getElementById('moveTime')?.value||oldTime;
    if(!newDate)return showToast(t('portal.move.chooseDate'));
    if(!moveDates(session).includes(newDate))return showToast(t('portal.move.unavailableDate'));
    if(byVolunteer&&session.status==='confirmed'&&newDate===oldDate&&newTime===oldTime)return showToast(t('portal.move.changeRequired'));
    const patch={date:newDate,time:newTime};
    if(byVolunteer&&session.status==='confirmed'){patch.status='change_requested';patch.changeRequestedAt=new Date();patch.changeNote=newDate===oldDate?'Alteração de horário solicitada pelo voluntário.':'Mudança solicitada pelo voluntário.'}
    const pendingConfirmation=byVolunteer&&session.status==='confirmed',button=document.getElementById('moveSessionSave');if(button){button.disabled=true;button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(t('action.saving'))}`}
    try{
      await window.OleiroServices.planning.updateSession(session.id,patch);
      const index=(state.sessions||[]).findIndex(row=>String(row.id)===String(session.id));
      if(index>=0)state.sessions[index]={...state.sessions[index],...patch};
      rebuildVolunteerPlanning();
      closeModal();render();
      showToast(pendingConfirmation?t('portal.move.sent'):t('portal.move.updated'));
    }catch(error){console.error(error);showToast(error?.message||t('portal.move.error'));if(button?.isConnected){button.disabled=false;button.textContent=pendingConfirmation?t('action.sendReview'):t('action.saveChange')}}
  };

  /* Enviar planejamento pode envolver uma leitura de existência + gravação. O botão mostra o estado imediatamente e bloqueia duplo envio. */
  const baseSubmitPlan=window.submitPlan;
  if(typeof baseSubmitPlan==='function'){
    window.submitPlan=async function(){
      const button=app?.querySelector?.('button[onclick="submitPlan()"]')||document.querySelector('button[onclick="submitPlan()"]');
      if(button?.disabled)return;
      const wasAdjustment=state.volunteerPlanStatus==='adjustments';
      const original=button?.innerHTML||'';
      if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i>${escapeHtml(wasAdjustment?t('action.resendReview'):t('action.sending'))}`}
      await baseSubmitPlan();
      if(button?.isConnected&&state.volunteerPlanStatus!=='submitted'){
        button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original;
      }
    };
  }
})();