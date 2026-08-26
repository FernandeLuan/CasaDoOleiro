/* Atualização do planejamento: cache instantâneo, uma única consulta e ciclos de ajuste limpos. */
(function planningRefresh(){
  const baseDayAdjustment=candidateDayAdjustment;
  candidateDayAdjustment=function(p,date){
    if(p?.status!=='adjustments')return null;
    return baseDayAdjustment(p,date);
  };

  function planFromSessions(p,sessions){
    const byActivity=new Map();
    (sessions||[]).forEach(session=>{
      const id=String(session.activityId||'');if(!id)return;
      let activity=byActivity.get(id);
      if(!activity){
        activity={
          id,
          applicationId:String(p.id),
          name:session.activityName||'Atividade',
          description:session.activityDescription||'',
          duration:Number(session.duration)||60,
          participation:session.participation||'Livre',
          materials:session.materials||'',
          notes:session.notes||'',
          period:session.period||'Sem preferência',
          time:session.time||'',
          ownerName:session.ownerName||p.name||'Voluntário',
          owner:p.name||session.ownerName||'Voluntário',
          createdByUid:session.createdByUid||'',
          dates:[]
        };
        byActivity.set(id,activity);
      }
      if(session.date&&!activity.dates.includes(session.date))activity.dates.push(session.date);
      if(!activity.time&&session.time)activity.time=session.time;
    });
    byActivity.forEach(activity=>activity.dates.sort());
    return {activities:[...byActivity.values()],sessions:sessions||[],at:Date.now()};
  }

  /* Uma candidatura já carrega definição da atividade dentro das sessões. Isso evita
     a antiga consulta duplicada activities + activity_sessions ao abrir Planejamento. */
  hydrateCandidatePlanning=async function(applicationId,{force=false}={}){
    const p=candidateById(applicationId);if(!p||!window.OleiroServices?.planning)return null;
    const key=String(p.id),cached=candidatePlanningCache(key);
    if(cached&&!force){applyCandidatePlanningCache(p.id,cached);return cached}
    const sessions=await window.OleiroServices.planning.listSessions({applicationId:p.id});
    const cache=planFromSessions(p,sessions);
    state.candidatePlanningCache[key]=cache;applyCandidatePlanningCache(p.id,cache);
    p.activities=cache.activities.length;p.sessions=cache.sessions.length;
    return cache;
  };

  /* Mantém a tela instantânea quando já existe cache e revalida em segundo plano.
     Não apagamos mais o cache toda vez que o Admin toca em Planejamento. */
  const baseOpenPerson=openPerson;
  const refreshing=new Set();
  openPerson=async function(id,tab='overview'){
    const p=candidateById(id),cached=p?candidatePlanningCache(p.id):null;
    const result=baseOpenPerson(id,tab);
    if(p&&tab==='plan'&&cached&&!refreshing.has(String(p.id))){
      refreshing.add(String(p.id));
      hydrateCandidatePlanning(p.id,{force:true}).then(()=>{
        if(modalRoot.dataset.personId===String(p.id)&&modalRoot.dataset.personTab==='plan')refreshOpenPersonModal(p.id);
      }).catch(error=>console.error('Não foi possível atualizar o planejamento:',error)).finally(()=>refreshing.delete(String(p.id)));
    }
    return result;
  };

  const basePersonTabContent=personTabContent;
  personTabContent=function(p,tab){
    let html=basePersonTabContent(p,tab);
    if(tab==='overview'){
      html=html.replace('Revisar planejamento','Ajustar');
      html=html.replace('<div class="activity-actions" style="margin-top:12px">','<div class="activity-actions candidate-decision-actions" style="margin-top:12px">');
    }
    return html;
  };

  /* Ao começar uma nova rodada de ajustes depois de um reenvio, elimina as marcas
     da rodada anterior. Se o Admin marcar vários dias na mesma rodada, elas acumulam. */
  saveDayAdjustment=async function(id,date){
    const p=candidateById(id),note=document.getElementById('dayAdjustNote')?.value.trim()||'',button=document.getElementById('r4DayAdjustSave');
    if(!p||!note)return showToast('Informe o ajuste solicitado.');
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>Salvando...'}
    const newCycle=p.status==='analysis';
    const nextAdjustments=newCycle?{}:{...(p.dayAdjustments||{})};
    nextAdjustments[date]={note,status:'requested',requestedAt:new Date()};
    const deadline=new Date();deadline.setDate(deadline.getDate()+7);
    try{
      await window.OleiroServices.applications.update(p.id,{dayAdjustments:nextAdjustments,status:'adjustments',active:true,planningDeadlineAt:deadline});
      p.status='adjustments';p.dayAdjustments=nextAdjustments;p.pendingUntil=deadline.toISOString();
      renderPersonModal(p,'plan');showToast('Ajuste solicitado para este dia.');
    }catch(error){
      console.error(error);showToast(error?.message||'Não foi possível solicitar o ajuste.');
      if(button?.isConnected){button.disabled=false;button.textContent='Solicitar ajuste'}
    }
  };
})();
