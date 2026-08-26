/* Comportamento atual compartilhado: operações por ID evitam ambiguidade de datas. */
(function productCurrentShared(){
  function sessionById(id){return (state.sessions||[]).find(row=>String(row.id||row.sessionId)===String(id))||null}
  function sessionFromLegacy(activityId,date){return (state.sessions||[]).find(row=>String(row.activityId)===String(activityId)&&String(row.date)===String(date))||null}
  function moveDatesForSession(session){
    if(state.role==='volunteer'&&typeof volunteerStayDates==='function')return volunteerStayDates();
    const applicationId=session?.applicationId||state.currentPlanningApplicationId;
    const p=(state.candidates||[]).find(row=>String(row.id)===String(applicationId));
    if(!p?.from||!p?.to)return [];
    const dates=[];for(let d=p.from,i=0;i<370&&d<=p.to;i++,d=addDays(d,1))dates.push(d);return dates;
  }
  function sessionDefinition(session){return session?.activity||(state.activities||[]).find(row=>String(row.id)===String(session?.activityId))||{id:session?.activityId,name:session?.activityName||'Atividade',time:session?.time||''}}
  window.moveSessionById=function(sessionId,byVolunteer=false){
    const session=sessionById(sessionId);if(!session)return showToast('Sessão não encontrada.');
    const activity=sessionDefinition(session),currentDate=String(session.date||''),options=moveDatesForSession(session).filter(date=>date!==currentDate);
    if(!options.length)return showToast('Não há outra data disponível no período da estadia.');
    openModal('Mover sessão',`${escapeHtml(activity.name||'Atividade')} • ${fmtDate(currentDate)}`,`<div class="field"><label>Nova data</label><select id="moveDate" class="select">${options.map(date=>`<option value="${date}">${dayName(date)} • ${fmtDate(date,true)}</option>`).join('')}</select></div><div class="field" style="margin-top:10px"><label>Novo horário sugerido</label><input id="moveTime" class="input" type="time" value="${escapeHtml(session.time||activity.time||'')}"></div>`,`<button id="moveSessionSave" class="btn btn-primary btn-block" type="button" onclick="saveMoveBySessionId('${encodeURIComponent(String(sessionId))}',${byVolunteer})">${byVolunteer&&session.status==='confirmed'?'Solicitar mudança':'Mover'}</button>`);
  };
  window.saveMoveBySessionId=async function(encodedId,byVolunteer=false){
    const id=decodeURIComponent(encodedId),session=sessionById(id);if(!session)return showToast('Sessão não encontrada.');
    const activity=sessionDefinition(session),oldDate=String(session.date||''),newDate=document.getElementById('moveDate')?.value||'',newTime=document.getElementById('moveTime')?.value||session.time||activity.time||'';
    if(!newDate)return showToast('Escolha a nova data.');const wasConfirmed=session.status==='confirmed',patch={date:newDate,time:newTime};
    if(byVolunteer&&wasConfirmed){patch.status='change_requested';patch.changeRequestedAt=new Date();patch.changeNote='Mudança solicitada pelo voluntário.'}
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
