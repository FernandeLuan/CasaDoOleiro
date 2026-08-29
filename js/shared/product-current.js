/* Comportamento atual compartilhado: operações por ID evitam ambiguidade de datas. */
(function productCurrentShared(){
  function sessionById(id){return (state.sessions||[]).find(row=>String(row.id||row.sessionId)===String(id))||null}
  function sessionFromLegacy(activityId,date){return (state.sessions||[]).find(row=>String(row.activityId)===String(activityId)&&String(row.date)===String(date))||null}
  function volunteerMoveDates(session){
    if(typeof volunteerStayDates!=='function')return [];
    const all=volunteerStayDates(),current=String(session?.date||'');
    const valid=all.filter((date,index)=>index>0&&index<all.length-1).filter(date=>{const day=new Date(`${date}T12:00:00`).getDay();return day!==0&&day!==6});
    return valid.sort((a,b)=>{if(a===current)return -1;if(b===current)return 1;const af=a>current?0:1,bf=b>current?0:1;return af-bf||a.localeCompare(b)});
  }
  function moveDatesForSession(session){
    if(state.role==='volunteer')return volunteerMoveDates(session);
    const applicationId=session?.applicationId||state.currentPlanningApplicationId;
    const p=(state.candidates||[]).find(row=>String(row.id)===String(applicationId));
    if(!p)return [];
    if(typeof planningEligibleDatesFor==='function')return planningEligibleDatesFor(p);
    if(!p.from||!p.to)return [];
    const dates=[];for(let d=addDays(p.from,1),i=0;i<370&&d<p.to;i++,d=addDays(d,1)){const day=new Date(`${d}T12:00:00`).getDay();if(day!==0&&day!==6)dates.push(d)}return dates;
  }
  function sessionDefinition(session){return session?.activity||(state.activities||[]).find(row=>String(row.id)===String(session?.activityId))||{id:session?.activityId,name:session?.activityName||'Atividade',time:session?.time||''}}
  window.moveSessionById=function(sessionId,byVolunteer=false){
    const session=sessionById(sessionId);if(!session)return showToast('Sessão não encontrada.');
    const activity=sessionDefinition(session),currentDate=String(session.date||''),options=moveDatesForSession(session);
    if(!options.length)return showToast('Não há data de atividade disponível no período da estadia.');
    openModal('Mover sessão',`${escapeHtml(activity.name||'Atividade')} • atual: ${fmtDate(currentDate,true)}`,`<div class="field"><label>Nova data</label><select id="moveDate" class="select move-date-select">${options.map(date=>`<option value="${date}" ${date===currentDate?'selected':''}>${dayName(date)} • ${fmtDate(date,true)}${date===currentDate?' — atual':''}</option>`).join('')}</select></div><div class="field" style="margin-top:10px"><label>Novo horário sugerido</label><input id="moveTime" class="input" type="time" value="${escapeHtml(session.time||activity.time||'')}"></div>`,`<button id="moveSessionSave" class="btn btn-primary btn-block" type="button" onclick="saveMoveBySessionId('${encodeURIComponent(String(sessionId))}',${byVolunteer})">${byVolunteer&&session.status==='confirmed'?'Solicitar mudança':'Mover'}</button>`);
  };
  window.saveMoveBySessionId=async function(encodedId,byVolunteer=false){
    const id=decodeURIComponent(encodedId),session=sessionById(id);if(!session)return showToast('Sessão não encontrada.');
    const activity=sessionDefinition(session),oldDate=String(session.date||''),oldTime=String(session.time||activity.time||''),newDate=document.getElementById('moveDate')?.value||'',newTime=document.getElementById('moveTime')?.value||oldTime;
    if(!newDate)return showToast('Escolha a nova data.');
    if(byVolunteer&&session.status==='confirmed'&&newDate===oldDate&&newTime===oldTime)return showToast('Altere a data ou o horário antes de solicitar a mudança.');
    const wasConfirmed=session.status==='confirmed',patch={date:newDate,time:newTime};
    if(byVolunteer&&wasConfirmed){patch.status='change_requested';patch.changeRequestedAt=new Date();patch.changeNote=newDate===oldDate?'Alteração de horário solicitada pelo voluntário.':'Mudança solicitada pelo voluntário.'}
    const button=document.getElementById('moveSessionSave');if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...'}
    try{
      await window.OleiroServices.planning.updateSession(session.id,patch);Object.assign(session,patch);
      if(activity?.id){const dates=(activity.dates||[]).filter(date=>date!==oldDate);if(!dates.includes(newDate))dates.push(newDate);activity.dates=dates.sort();activity.time=newTime}
      if(state.role==='manager'){invalidateManagerScheduleCache?.();const cache=typeof candidatePlanningCache==='function'?candidatePlanningCache(session.applicationId):null;if(cache){const cached=cache.sessions.find(row=>String(row.id)===String(session.id));if(cached)Object.assign(cached,patch)}}
      closeModal();render();showToast(byVolunteer&&wasConfirmed?'Mudança enviada para confirmação.':'Cronograma atualizado.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível mover a sessão.');if(button?.isConnected){button.disabled=false;button.textContent=byVolunteer&&wasConfirmed?'Solicitar mudança':'Mover'}}
  };
  moveSession=function(activityId,date,byVolunteer=false){const session=sessionFromLegacy(activityId,date);if(!session)return showToast('Sessão não encontrada.');return window.moveSessionById(session.id,byVolunteer)};
})();
