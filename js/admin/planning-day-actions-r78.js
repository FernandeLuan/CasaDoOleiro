/* R78 — decisões do Planejamento ficam concentradas no menu + e usam o fluxo correto de revisão. */
(function planningDayActionsR78(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_DAY_ACTIONS_R78__)return;
  window.__OLEIRO_PLANNING_DAY_ACTIONS_R78__=true;

  const safe=value=>encodeURIComponent(String(value??''));
  const iso=value=>String(value||'').slice(0,10);
  const inflight=new WeakMap();

  function installStyles(){
    if(document.getElementById('planningDayActionsR78Styles'))return;
    const style=document.createElement('style');
    style.id='planningDayActionsR78Styles';
    style.textContent=`
      /* As decisões ficam no +. O card continua mostrando contexto, status e de/para. */
      .planning-person-agenda .admin-portal-actions.r78-inline-decision-hidden{display:none!important}
      .planning-person-agenda .r31-awaiting-action{display:none!important}
      .planning-day-menu-r76-session.r78-review-pending .planning-day-menu-r76-actions{gap:6px}
    `;
    document.head.appendChild(style);
  }

  function hideDuplicatedInlineDecisions(){
    document.querySelectorAll('.planning-person-agenda .admin-portal-actions').forEach(actions=>{
      if(actions.querySelector('.post-approval-admin-actions'))actions.classList.add('r78-inline-decision-hidden');
    });
  }

  async function refreshPlanning(applicationId){
    if(typeof invalidateManagerScheduleCache==='function')invalidateManagerScheduleCache();
    if(typeof invalidateManagerPendingChanges==='function')invalidateManagerPendingChanges();
    if(typeof state!=='undefined'&&state.planningBoardLoadedRange!==undefined)state.planningBoardLoadedRange='';
    if(typeof window.refreshPlanningPersonAgenda==='function'&&String(state?.managerPlanningPersonId||'')===String(applicationId)){
      await window.refreshPlanningPersonAgenda(applicationId);
    }else if(typeof render==='function')render();
    requestAnimationFrame(hideDuplicatedInlineDecisions);
  }

  function actionButton(label,icon,handler,tone=''){
    return `<button class="planning-day-menu-r76-action ${tone}" type="button" onclick="${handler}"><i class="fa-solid ${icon}"></i>${escapeHtml(label)}</button>`;
  }

  function changeActionsHtml(applicationId,session){
    const app=safe(applicationId),sid=safe(session.id),review=String(session.changeReviewStatus||'analysis');
    if(review==='adjustments')return '<span class="planning-day-menu-r76-waiting">Aguardando reajuste do voluntário.</span>';
    if(review!=='analysis')return '<span class="planning-day-menu-r76-waiting">Alteração já revisada.</span>';
    return [
      actionButton('Aprovar','fa-check',`reviewPlanningExistingChangeR78('${app}','${sid}','approve')`,'primary'),
      actionButton('Reajustar','fa-rotate',`openPlanningExistingReajustR78('${app}','${sid}')`,'warning'),
      actionButton('Recusar','fa-xmark',`openPlanningExistingRejectR78('${app}','${sid}')`,'danger')
    ].join('');
  }

  async function patchMenu(menu){
    if(!menu?.isConnected||inflight.has(menu))return;
    const day=menu.closest('.planning-person-day'),date=day?.dataset.planDate,applicationId=String(state?.managerPlanningPersonId||'');
    if(!date||!applicationId||!window.OleiroServices?.planning?.listSessions)return;
    const task=(async()=>{
      const rows=await window.OleiroServices.planning.listSessions({applicationId,from:date,to:date});
      const sessions=(rows||[])
        .filter(row=>iso(row.date)===date&&row.status!=='rejected'&&row.reviewStatus!=='rejected')
        .sort(typeof activityScheduleCompare==='function'?activityScheduleCompare:undefined);
      const sections=[...menu.querySelectorAll('.planning-day-menu-r76-session')];
      sections.forEach((section,index)=>{
        const session=sessions[index];if(!session)return;
        section.dataset.sessionId=String(session.id||'');
        if(!['change_requested','change'].includes(String(session.status||'')))return;
        section.classList.add('r78-review-pending');
        const actions=section.querySelector('.planning-day-menu-r76-actions');
        if(actions)actions.innerHTML=changeActionsHtml(applicationId,session);
      });
    })().catch(error=>console.error('Falha ao alinhar ações de revisão no menu:',error)).finally(()=>inflight.delete(menu));
    inflight.set(menu,task);return task;
  }

  function patchVisibleMenus(){
    hideDuplicatedInlineDecisions();
    document.querySelectorAll('.planning-day-menu-r76').forEach(menu=>patchMenu(menu));
  }

  window.reviewPlanningExistingChangeR78=async function(encodedApplicationId,encodedSessionId,decision,note=''){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId);
    if(!['approve','reject','adjustments'].includes(decision))return;
    if(decision==='adjustments'&&!String(note||'').trim())return showToast('Informe o reajuste solicitado.');
    window.closePlanningDayMenuR76?.();
    try{
      await window.OleiroServices.planning.reviewExistingChange({sessionId,decision,note:String(note||'').trim()});
      if(typeof closeModal==='function')closeModal();
      await refreshPlanning(applicationId);
      showToast(decision==='approve'?'Mudança aprovada.':decision==='reject'?'Mudança recusada.':'Reajuste enviado ao voluntário.');
    }catch(error){
      console.error(error);showToast(error?.message||'Não foi possível revisar a alteração.');
    }
  };

  window.openPlanningExistingReajustR78=function(encodedApplicationId,encodedSessionId){
    window.closePlanningDayMenuR76?.();
    openModal('Solicitar reajuste','Explique o que o voluntário precisa alterar nesta proposta.',
      '<div class="field"><label for="planningExistingReajustR78">Orientação ao voluntário</label><textarea id="planningExistingReajustR78" class="textarea" placeholder="Ex.: manter a data e alterar apenas o período."></textarea></div>',
      `<button class="btn btn-primary btn-block" type="button" onclick="reviewPlanningExistingChangeR78('${encodedApplicationId}','${encodedSessionId}','adjustments',document.getElementById('planningExistingReajustR78').value.trim())">Enviar reajuste</button>`);
  };

  window.openPlanningExistingRejectR78=function(encodedApplicationId,encodedSessionId){
    window.closePlanningDayMenuR76?.();
    openModal('Recusar alteração','A atividade atual será mantida como estava antes da solicitação.',
      '<div class="field"><label for="planningExistingRejectR78">Motivo da recusa <small>(opcional)</small></label><textarea id="planningExistingRejectR78" class="textarea"></textarea></div>',
      `<button class="btn btn-danger btn-block" type="button" onclick="reviewPlanningExistingChangeR78('${encodedApplicationId}','${encodedSessionId}','reject',document.getElementById('planningExistingRejectR78').value.trim())">Recusar alteração</button>`);
  };

  const observer=new MutationObserver(()=>queueMicrotask(patchVisibleMenus));
  observer.observe(document.body,{childList:true,subtree:true});
  installStyles();
  requestAnimationFrame(patchVisibleMenus);
})();
