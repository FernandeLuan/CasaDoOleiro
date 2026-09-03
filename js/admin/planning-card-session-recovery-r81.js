/* R81 — recupera o vínculo card ↔ sessão perdido pelas camadas visuais e permite à R79 finalizar o layout. */
(function planningCardSessionRecoveryR81(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_CARD_SESSION_RECOVERY_R81__)return;
  window.__OLEIRO_PLANNING_CARD_SESSION_RECOVERY_R81__=true;

  let timer=0;
  let running=false;
  const iso=value=>String(value||'').slice(0,10);
  const normalized=value=>String(value||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const sessionName=session=>session?.activityName||session?.activity?.name||'Atividade';
  const cardName=card=>card.querySelector('.admin-portal-activity-title h4, .planning-session-title strong, h4')?.textContent?.trim()||'';

  function visiblePlanning(){
    return typeof state!=='undefined'&&state.managerPage==='planning'&&String(state.managerPlanningTab||'plan')==='plan';
  }

  function triggerR79(){
    const root=document.querySelector('.planning-person-agenda');
    if(!root)return;
    const marker=document.createElement('span');
    marker.hidden=true;
    marker.dataset.r81PlanningRefresh='1';
    root.appendChild(marker);
    queueMicrotask(()=>marker.remove());
  }

  async function recoverDay(day,p){
    const date=day?.dataset?.planDate;
    if(!date||!window.OleiroServices?.planning?.listSessions)return false;

    const cards=[...day.querySelectorAll('.admin-portal-activity-card')];
    const missing=cards.filter(card=>!String(card.dataset.sessionId||'').trim());
    if(!missing.length)return false;

    let sessions=[];
    try{
      sessions=await window.OleiroServices.planning.listSessions({applicationId:p.id,from:date,to:date});
    }catch(error){
      console.warn('R81: não foi possível recuperar as sessões do dia:',error);
      return false;
    }

    sessions=(sessions||[])
      .filter(row=>iso(row.date)===date&&row.status!=='rejected'&&row.reviewStatus!=='rejected')
      .sort(typeof activityScheduleCompare==='function'?activityScheduleCompare:undefined);

    const used=new Set(cards.map(card=>String(card.dataset.sessionId||'')).filter(Boolean));
    let changed=false;

    missing.forEach(card=>{
      const name=normalized(cardName(card));
      let session=sessions.find(row=>!used.has(String(row.id||''))&&normalized(sessionName(row))===name);
      if(!session)session=sessions.find(row=>!used.has(String(row.id||'')));
      if(!session?.id)return;
      card.dataset.sessionId=String(session.id);
      used.add(String(session.id));
      changed=true;
    });

    return changed;
  }

  async function recover(){
    if(running||!visiblePlanning())return;
    const p=typeof candidateById==='function'?candidateById(state.managerPlanningPersonId):null;
    if(!p)return;
    running=true;
    try{
      let changed=false;
      const days=[...document.querySelectorAll('.planning-person-agenda .planning-person-day')];
      for(const day of days){if(await recoverDay(day,p))changed=true}
      if(changed)triggerR79();
    }finally{
      running=false;
    }
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>recover().catch(error=>console.error('R81: falha ao recuperar cards do planejamento:',error)),45);
  }

  const observer=new MutationObserver(records=>{
    if(!visiblePlanning())return;
    if(records.every(record=>record.target?.closest?.('[data-r81-planning-refresh]')))return;
    schedule();
  });
  observer.observe(document.body,{childList:true,subtree:true});

  requestAnimationFrame(schedule);
  setTimeout(schedule,180);
  setTimeout(schedule,650);
})();
