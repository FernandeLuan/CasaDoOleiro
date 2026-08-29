/* Round 33 — final portal standard: day = general state; activity = reason/actions. */
(function reviewFlowR33Portal(){
  const baseCard=window.sessionCardVolunteer||sessionCardVolunteer;
  const baseAgenda=window.volunteerAgendaContent||volunteerAgendaContent;
  const text=key=>typeof t==='function'?t(key):key;

  function raw(value){return value?.raw||value||{}}
  function rowFor(session){
    const id=String(session?.sessionId||session?.id||session?.raw?.id||'');
    return raw(session?.raw)||((state.sessions||[]).find(item=>String(item.id||item.sessionId)===id)||{});
  }
  function ready(row){return typeof window.isR32AdjustmentReady==='function'?window.isR32AdjustmentReady(row):row?._r32AdjustmentReady===true}
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
  function ensureReason(card,row){
    if(row.adminAdjustmentStatus!=='requested'||!row.adminAdjustmentNote)return;
    const details=card.querySelector('.r31-review-details');
    if(details&&/Motivo do ajuste|Reason for adjustment|Motivo del ajuste/i.test(details.textContent||''))return;
    const divider=document.createElement('div');divider.className='admin-portal-detail-divider r31-review-divider';divider.setAttribute('aria-hidden','true');
    const block=document.createElement('div');block.className='r31-review-details';block.innerHTML=`<div class="r31-review-block warning"><strong>${escapeHtml(text('review.adjustReason'))}</strong><p data-no-i18n>${escapeHtml(row.adminAdjustmentNote)}</p></div>`;
    const actions=card.querySelector(':scope > .activity-actions');card.insertBefore(divider,actions||null);card.insertBefore(block,actions||null);
  }

  sessionCardVolunteer=function(session,editable){
    const html=baseCard(session,editable),box=document.createElement('div');box.innerHTML=html;const card=box.firstElementChild;if(!card)return html;const row=rowFor(session);
    card.querySelectorAll('.r32-session-signal-wrap,.r31-day-signal-wrap').forEach(node=>node.remove());
    ensureReason(card,row);
    const meta=marker(row);if(meta&&!card.querySelector('.r33-session-marker')){
      const status=card.querySelector('.activity-row');if(status)status.insertAdjacentHTML('beforeend',markerHtml(meta));
    }
    const candidateActions=card.querySelector(':scope > .candidate-session-actions');
    if(candidateActions){
      const correction=row.adminAdjustmentStatus==='requested';candidateActions.classList.toggle('r33-single-adjust-action',correction);
    }
    if(row.postApprovalProposal===true&&(row.reviewStatus||'analysis')==='analysis')card.classList.add('r33-new-proposal');
    return box.innerHTML;
  };

  function dayState(sessions){
    const rows=(sessions||[]).map(raw),requested=rows.filter(r=>r.adminAdjustmentStatus==='requested');
    if(requested.some(r=>!ready(r)))return {tone:'warning',label:'Reajustar'};
    if(requested.length&&requested.every(ready))return {tone:'success',label:'Ajustado'};
    if(rows.some(r=>r.status==='change_requested'&&r.changeReviewStatus==='adjustments'))return {tone:'warning',label:'Reajustar'};
    if(rows.some(r=>r.postApprovalProposal===true&&r.reviewStatus==='adjustments'))return {tone:'warning',label:'Reajustar'};
    if(rows.some(r=>r.status==='change_requested'&&(r.changeReviewStatus||'analysis')==='analysis'))return {tone:'info',label:'Alteração'};
    if(rows.some(r=>r.postApprovalProposal===true&&(r.reviewStatus||'analysis')==='analysis'))return {tone:'info',label:'Nova atividade'};
    if(rows.some(r=>r.adminAdjustmentStatus==='analysis'))return {tone:'success',label:'Enviado'};
    return null;
  }
  volunteerAgendaContent=function(editable=false){
    const html=baseAgenda(editable),tpl=document.createElement('template');tpl.innerHTML=html;
    tpl.content.querySelectorAll('.day-info-button,.r31-day-signal-wrap,.r32-day-state,.r32-day-state-badge').forEach(node=>node.remove());
    [...tpl.content.querySelectorAll('.day-block[id^="vday-"]')].forEach(day=>{
      const date=day.id.slice(5),sessions=typeof getSessions==='function'?getSessions(date,true):[];
      const heading=day.querySelector('.day-title>div:first-child');if(!heading)return;
      [...heading.querySelectorAll('.badge.warning,.badge.success,.badge.info,.r33-day-state')].forEach(node=>node.remove());
      const stateMeta=dayState(sessions);if(stateMeta)heading.insertAdjacentHTML('beforeend',`<span class="r33-day-state ${stateMeta.tone}">${escapeHtml(stateMeta.label)}</span>`);
    });
    return tpl.innerHTML;
  };

  window.sessionCardVolunteer=sessionCardVolunteer;
  window.volunteerAgendaContent=volunteerAgendaContent;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
