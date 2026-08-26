function realSessionFor(activityId,date){return (state.sessions||[]).find(s=>String(s.activityId)===String(activityId)&&String(s.date)===String(date))||null}
function sessionMoveDates(session=null){
  if(state.role==='volunteer'&&typeof volunteerStayDates==='function')return volunteerStayDates();
  const applicationId=session?.applicationId||state.currentPlanningApplicationId;
  const p=(state.candidates||[]).find(x=>String(x.id)===String(applicationId));
  if(p?.from&&p?.to){const dates=[];for(let d=p.from,i=0;i<370&&d<=p.to;i++,d=addDays(d,1))dates.push(d);return dates}
  return [];
}
function sessionActivity(session,activityId){return session?.activity||state.activities.find(x=>String(x.id)===String(activityId))||{id:activityId,name:session?.activityName||'Atividade',time:session?.time||''}}
function moveSession(id,date,byVolunteer=false){
  const session=realSessionFor(id,date);const a=sessionActivity(session,id);if(!session)return showToast('Sessão não encontrada.');
  const options=sessionMoveDates(session).filter(d=>d!==date);if(!options.length)return showToast('Não há outra data disponível no período da estadia.');
  openModal('Mover sessão',`${a.name} • ${fmtDate(date)}`,`<div class="field"><label>Nova data</label><select id="moveDate" class="select">${options.map(d=>`<option value="${d}">${dayName(d)} • ${fmtDate(d)}</option>`).join('')}</select></div><div class="field" style="margin-top:10px"><label>Novo horário sugerido</label><input id="moveTime" class="input" type="time" value="${session.time||a.time||''}"></div>`,`<button class="btn btn-primary btn-block" type="button" onclick='saveMove(${JSON.stringify(id)},${JSON.stringify(date)},${byVolunteer})'>Mover</button>`)
}
async function saveMove(id,oldDate,byVolunteer){
  const session=realSessionFor(id,oldDate);const a=sessionActivity(session,id);if(!session)return showToast('Sessão não encontrada.');
  const newDate=document.getElementById('moveDate')?.value;const newTime=document.getElementById('moveTime')?.value||session.time||a.time||'';if(!newDate)return showToast('Escolha a nova data.');
  const patch={date:newDate,time:newTime};
  if(byVolunteer&&session.status==='confirmed'){patch.status='change_requested';patch.changeRequestedAt=new Date();patch.changeNote='Alteração solicitada pelo voluntário.'}
  try{
    await window.OleiroServices.planning.updateSession(session.id,patch);closeModal();
    if(state.role==='volunteer'&&typeof hydrateVolunteerPlanning==='function')await hydrateVolunteerPlanning(state.currentApplication);
    else if(state.role==='manager'&&state.managerPage==='agenda'&&typeof hydrateManagerSchedule==='function')await hydrateManagerSchedule(state.agendaFrom||_oleiroToday,state.agendaTo||_oleiroToday);
    else if(state.role==='manager'&&typeof hydrateCandidatePlanning==='function'&&state.currentPlanningApplicationId)await hydrateCandidatePlanning(state.currentPlanningApplicationId);
    render();showToast(byVolunteer&&session.status==='confirmed'?'Alteração enviada para confirmação.':'Cronograma atualizado.');
  }catch(error){console.error(error);showToast(error?.message||'Não foi possível mover a sessão.')}
}
