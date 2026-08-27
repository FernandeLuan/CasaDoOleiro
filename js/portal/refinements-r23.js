/* Round 23/24 — sincronização pontual após mover e feedback de envio do planejamento. */
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

  window.saveMoveBySessionId=async function(encodedId,byVolunteer=false){
    const id=decodeURIComponent(encodedId),session=sessionById(id);if(!session)return showToast('Sessão não encontrada.');
    const activity=activityFor(session),oldDate=String(session.date||''),oldTime=String(session.time||activity.time||''),newDate=document.getElementById('moveDate')?.value||'',newTime=document.getElementById('moveTime')?.value||oldTime;
    if(!newDate)return showToast('Escolha a nova data.');
    if(!moveDates(session).includes(newDate))return showToast('Essa data não está disponível para atividade.');
    if(byVolunteer&&session.status==='confirmed'&&newDate===oldDate&&newTime===oldTime)return showToast('Altere a data ou o horário antes de solicitar a mudança.');
    const patch={date:newDate,time:newTime};
    if(byVolunteer&&session.status==='confirmed'){patch.status='change_requested';patch.changeRequestedAt=new Date();patch.changeNote=newDate===oldDate?'Alteração de horário solicitada pelo voluntário.':'Mudança solicitada pelo voluntário.'}
    const button=document.getElementById('moveSessionSave');if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...'}
    try{
      await window.OleiroServices.planning.updateSession(session.id,patch);
      let fresh=null;
      try{fresh=await window.OleiroServices.planning.getSessionById?.(session.id)}catch(error){console.warn('Mini refresh da sessão indisponível; mantendo atualização local.',error)}
      const index=(state.sessions||[]).findIndex(row=>String(row.id)===String(session.id));
      if(index>=0)state.sessions[index]={...state.sessions[index],...(fresh||patch)};
      rebuildVolunteerPlanning();
      closeModal();render();
      showToast(byVolunteer&&session.status==='confirmed'?'Mudança enviada para confirmação.':'Cronograma atualizado.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível mover a sessão.');if(button?.isConnected){button.disabled=false;button.textContent=byVolunteer&&session.status==='confirmed'?'Solicitar mudança':'Mover'}}
  };

  /* Enviar planejamento pode envolver uma leitura de existência + gravação. O botão mostra o estado imediatamente e bloqueia duplo envio. */
  const baseSubmitPlan=window.submitPlan;
  if(typeof baseSubmitPlan==='function'){
    window.submitPlan=async function(){
      const button=app?.querySelector?.('button[onclick="submitPlan()"]')||document.querySelector('button[onclick="submitPlan()"]');
      if(button?.disabled)return;
      const wasAdjustment=state.volunteerPlanStatus==='adjustments';
      const original=button?.innerHTML||'';
      if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i>${wasAdjustment?'Reenviando...':'Enviando...'}`}
      await baseSubmitPlan();
      if(button?.isConnected&&state.volunteerPlanStatus!=='submitted'){
        button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original;
      }
    };
  }
})();
