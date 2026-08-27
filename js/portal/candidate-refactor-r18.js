/* Round 18 — planejamento do candidato direto ao conteúdo operacional. */
(function candidateRefactorR18(){
  const baseVolunteerPlan=volunteerPlan;

  function statusMetaCandidate(){
    const status=state.volunteerPlanStatus||'draft',application=state.currentApplication||{};
    if(status==='submitted')return {label:'Em análise',tone:'info'};
    if(status==='adjustments'){
      let label='Reajuste solicitado';
      const deadline=application.planningDeadlineAt||application.pendingUntil;
      if(deadline){try{const date=typeof deadline?.toDate==='function'?deadline.toDate():new Date(deadline),days=Math.max(0,Math.ceil((date.getTime()-Date.now())/86400000));label=`${days===0?'Vence hoje':days===1?'1 dia restante':`${days} dias restantes`} · Reajuste solicitado`}catch{}}
      return {label,tone:'warning'};
    }
    const deadline=application.planningDeadlineAt||application.pendingUntil;
    if(deadline){try{const date=typeof deadline?.toDate==='function'?deadline.toDate():new Date(deadline),days=Math.max(0,Math.ceil((date.getTime()-Date.now())/86400000));return {label:days===0?'Vence hoje':days===1?'1 dia restante':`${days} dias restantes`,tone:''}}catch{}}
    return {label:'Em preparação',tone:''};
  }
  function compactHeader(){
    const app=state.currentApplication||{},start=portalIsoDate(app.stayStart),end=portalIsoDate(app.stayEnd),meta=statusMetaCandidate(),period=start&&end?`${fmtDate(start,true)}–${fmtDate(end,true)}`:'Período a confirmar';
    return `<div class="candidate-plan-compact-head ${meta.tone}"><strong>${escapeHtml(period)}</strong><span>${escapeHtml(meta.label)}</span></div>`;
  }
  function submitControl(){
    const status=state.volunteerPlanStatus||'draft';
    if(status==='submitted')return `<button class="btn btn-soft btn-block candidate-plan-submit" type="button" disabled><i class="fa-solid fa-paper-plane"></i>Enviado</button>`;
    if(status==='rejected')return '';
    return `<button class="btn btn-primary btn-block candidate-plan-submit" type="button" onclick="submitPlan()"><i class="fa-solid fa-paper-plane"></i>${status==='adjustments'?'Reenviar planejamento':'Enviar planejamento'}</button>`;
  }

  volunteerPlan=function(){
    if(state.volunteerMode==='approved')return baseVolunteerPlan();
    const editable=['draft','adjustments'].includes(state.volunteerPlanStatus||'draft');
    return `<section class="section candidate-plan-refactor compact-page-top">${compactHeader()}<div class="candidate-plan-content">${volunteerAgendaContent(editable)}</div>${submitControl()}</section>`;
  };

  window.volunteerPlan=volunteerPlan;
  if(state.role==='volunteer'&&state.volunteerMode!=='approved'&&state.volunteerPage==='plan'&&typeof render==='function')render();
})();
