function realSessionFor(activityId,date){return (state.sessions||[]).find(s=>String(s.activityId)===String(activityId)&&String(s.date)===String(date))||null}
function sessionMoveDates(session=null){
  if(state.role==='volunteer'){
    if(typeof planningEligibleDatesFor==='function')return planningEligibleDatesFor(state.currentApplication||{});
    if(typeof volunteerStayDates==='function')return volunteerStayDates();
  }
  const applicationId=session?.applicationId||state.currentPlanningApplicationId,p=(state.candidates||[]).find(x=>String(x.id)===String(applicationId));
  if(p?.from&&p?.to){
    if(typeof planningEligibleDatesFor==='function')return planningEligibleDatesFor(p);
    const dates=[];for(let d=p.from,i=0;i<370&&d<=p.to;i++,d=addDays(d,1))dates.push(d);return dates;
  }
  return [];
}
function sessionActivity(session,activityId){return session?.activity||(state.activities||[]).find(x=>String(x.id)===String(activityId))||{id:activityId,name:session?.activityName||'Atividade',time:session?.time||''}}
function moveSession(id,date,byVolunteer=false){const session=realSessionFor(id,date);const a=sessionActivity(session,id);if(!session)return showToast('Sessão não encontrada.');const options=sessionMoveDates(session).filter(d=>d!==date);if(!options.length)return showToast('Não há outra data disponível no período da estadia.');openModal('Mover sessão',`${escapeHtml(a.name)} • ${fmtDate(date)}`,`<div class="field"><label>Nova data</label><select id="moveDate" class="select">${options.map(d=>`<option value="${d}">${dayName(d)} • ${fmtDate(d)}</option>`).join('')}</select></div><div class="field" style="margin-top:10px"><label>Novo horário sugerido</label><input id="moveTime" class="input" type="time" value="${session.time||a.time||''}"></div>`,`<button class="btn btn-primary btn-block" type="button" onclick='saveMove(${JSON.stringify(id)},${JSON.stringify(date)},${byVolunteer})'>Mover</button>`)}
async function saveMove(id,oldDate,byVolunteer){
  const session=realSessionFor(id,oldDate);const a=sessionActivity(session,id);if(!session)return showToast('Sessão não encontrada.');const newDate=document.getElementById('moveDate')?.value;const newTime=document.getElementById('moveTime')?.value||session.time||a.time||'';if(!newDate)return showToast('Escolha a nova data.');const wasConfirmed=session.status==='confirmed';const patch={date:newDate,time:newTime};if(byVolunteer&&wasConfirmed){patch.status='change_requested';patch.changeRequestedAt=new Date();patch.changeNote='Mudança solicitada pelo voluntário.'}
  try{await window.OleiroServices.planning.updateSession(session.id,patch);Object.assign(session,patch);if(a&&a.id){const dates=(a.dates||[]).filter(d=>d!==oldDate);if(!dates.includes(newDate))dates.push(newDate);a.dates=dates.sort();a.time=newTime}if(state.role==='manager'){invalidateManagerScheduleCache?.();const cache=candidatePlanningCache?.(session.applicationId);if(cache){const cached=cache.sessions.find(s=>String(s.id)===String(session.id));if(cached)Object.assign(cached,patch)}}closeModal();render();showToast(byVolunteer&&wasConfirmed?'Mudança enviada para confirmação.':'Cronograma atualizado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível mover a sessão.')}
}
