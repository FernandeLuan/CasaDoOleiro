/* Round 33 — final admin standard: day = general state; activity = reason/actions. */
(function reviewFlowR33Admin(){
  const baseDay=window.adminPlanningDayCard||adminPlanningDayCard;
  const R=window.OleiroR31AdminReview||{};
  function ready(row){return typeof R.adjustmentReady==='function'?R.adjustmentReady(row):row?._r32AdjustmentReady===true}
  function marker(row){
    if(row.adminAdjustmentStatus==='requested')return {tone:ready(row)?'success':'warning',label:ready(row)?'Atividade ajustada':'Atividade com ajuste solicitado'};
    if(row.adminAdjustmentStatus==='analysis')return {tone:'info',label:'Ajuste reenviado'};
    if(row.status==='change_requested')return {tone:row.changeReviewStatus==='adjustments'?'warning':'info',label:row.changeReviewStatus==='adjustments'?'Reajuste solicitado':'Mudança solicitada'};
    if(row.postApprovalProposal===true){
      if(row.reviewStatus==='adjustments')return {tone:'warning',label:'Reajuste solicitado'};
      if(row.reviewStatus==='rejected')return {tone:'danger',label:'Atividade recusada'};
      if((row.reviewStatus||'analysis')==='analysis')return {tone:'info',label:'Nova atividade proposta'};
    }
    return null;
  }
  function markerHtml(meta){return meta?`<span class="r33-session-marker ${meta.tone}" role="img" aria-label="${escapeHtml(meta.label)}" title="${escapeHtml(meta.label)}"><i class="fa-solid fa-circle-info" aria-hidden="true"></i></span>`:''}
  function dayState(rows){
    const requested=(rows||[]).filter(r=>r.adminAdjustmentStatus==='requested');
    if(requested.some(r=>!ready(r)))return {tone:'warning',label:'Reajustar'};
    if(requested.length&&requested.every(ready))return {tone:'success',label:'Ajustado'};
    if((rows||[]).some(r=>r.status==='change_requested'&&r.changeReviewStatus==='adjustments'))return {tone:'warning',label:'Reajustar'};
    if((rows||[]).some(r=>r.postApprovalProposal===true&&r.reviewStatus==='adjustments'))return {tone:'warning',label:'Reajustar'};
    if((rows||[]).some(r=>r.status==='change_requested'&&(r.changeReviewStatus||'analysis')==='analysis'))return {tone:'info',label:'Alteração'};
    if((rows||[]).some(r=>r.postApprovalProposal===true&&(r.reviewStatus||'analysis')==='analysis'))return {tone:'info',label:'Nova atividade'};
    if((rows||[]).some(r=>r.adminAdjustmentStatus==='analysis'))return {tone:'info',label:'Reenviado'};
    if((rows||[]).some(r=>r.changeReviewStatus==='rejected'||(r.postApprovalProposal===true&&r.reviewStatus==='rejected')))return {tone:'danger',label:'Recusada'};
    return null;
  }
  function ensureInlineReason(card,row){
    if(row.adminAdjustmentStatus!=='requested'||!row.adminAdjustmentNote)return;
    if(card.querySelector('.r31-review-details'))return;
    const main=card.querySelector('.admin-portal-activity-main');if(!main)return;
    const actions=main.querySelector('.admin-portal-actions');const divider=document.createElement('div');divider.className='admin-portal-detail-divider r31-review-divider';divider.setAttribute('aria-hidden','true');
    const details=document.createElement('div');details.className='r31-review-details';details.innerHTML=`<div class="r31-review-block warning"><strong>Motivo do ajuste:</strong><p>${escapeHtml(row.adminAdjustmentNote)}</p></div>`;
    main.insertBefore(divider,actions||null);main.insertBefore(details,actions||null);
  }
  function ensureDecisionLayout(card,row){
    if(row.postApprovalProposal===true&&(row.reviewStatus||'analysis')==='analysis')card.classList.add('r33-new-proposal');
  }

  adminPlanningDayCard=function(p,day){
    const html=baseDay(p,day),tpl=document.createElement('template');tpl.innerHTML=html;
    const detail=tpl.content.querySelector('details.planning-day-card');if(!detail)return html;
    const dateArea=detail.querySelector('.planning-day-date');
    detail.querySelectorAll('.r31-day-signal-wrap,.r31-day-signal,.r32-day-state').forEach(node=>node.remove());
    const oldHolder=detail.querySelector('.r31-day-signals');if(oldHolder)oldHolder.innerHTML='';
    const general=dayState(day?.sessions||[]);if(general&&dateArea){let holder=dateArea.querySelector('.r31-day-signals');if(!holder){holder=document.createElement('span');holder.className='r31-day-signals';dateArea.appendChild(holder)}holder.innerHTML=`<span class="r33-day-state ${general.tone}">${escapeHtml(general.label)}</span>`}
    (day?.sessions||[]).forEach(row=>{
      const card=detail.querySelector(`.admin-portal-activity-card[data-session-id="${CSS.escape(String(row.id||''))}"]`);if(!card)return;
      card.querySelectorAll('.r32-session-signal-wrap').forEach(node=>node.remove());ensureInlineReason(card,row);ensureDecisionLayout(card,row);
      const meta=marker(row);if(meta&&!card.querySelector('.r33-session-marker')){let status=card.querySelector('.admin-portal-status');if(!status){status=document.createElement('div');status.className='admin-portal-status';card.querySelector('.admin-portal-activity-head')?.appendChild(status)}status?.insertAdjacentHTML('beforeend',markerHtml(meta))}
    });
    return tpl.innerHTML;
  };
  window.adminPlanningDayCard=adminPlanningDayCard;
})();
