/* Round 32 — coherent activity/day state after volunteer edits and activity-scoped review information. */
(function reviewFlowR32Portal(){
  const baseSessionCard=window.sessionCardVolunteer||sessionCardVolunteer;
  const baseAgendaContent=window.volunteerAgendaContent||volunteerAgendaContent;
  const baseSaveAdjustment=window.saveR31VolunteerSessionEditor;
  const baseSubmitPlan=window.submitPlan||submitPlan;
  const text=key=>typeof t==='function'?t(key):key;

  function rawSession(value){return value?.raw||value||{}}
  function timeMs(value){
    if(!value)return 0;
    try{if(typeof value.toMillis==='function')return Number(value.toMillis())||0;if(typeof value.toDate==='function')return Number(value.toDate().getTime())||0}catch{}
    const parsed=Date.parse(String(value));return Number.isFinite(parsed)?parsed:0;
  }
  function adjustmentReady(value){
    const row=rawSession(value);if(row.adminAdjustmentStatus!=='requested')return false;if(row._r32AdjustmentReady===true)return true;const requested=timeMs(row.adminAdjustmentRequestedAt),updated=timeMs(row.updatedAt);return requested>0&&updated>requested;
  }
  window.isR32AdjustmentReady=adjustmentReady;

  function signalMeta(row){
    if(row.adminAdjustmentStatus==='requested')return {tone:adjustmentReady(row)?'success':'warning',label:text('review.adjustReason'),message:`${text('review.adjustReason')} ${row.adminAdjustmentNote||text('review.sessionAdjustment')}`};
    if(row.adminAdjustmentStatus==='analysis'&&row.adminAdjustmentNote)return {tone:'info',label:text('review.adjustSent'),message:`${text('review.adjustSent')}. ${text('review.adjustReason')} ${row.adminAdjustmentNote}`};
    if(row.status==='change_requested')return {tone:row.changeReviewStatus==='adjustments'?'warning':'info',label:row.changeReviewStatus==='adjustments'?text('review.readjustReason'):text('review.changeReason'),message:`${row.changeReviewStatus==='adjustments'?text('review.readjustReason'):text('review.changeReason')} ${row.changeReviewStatus==='adjustments'?(row.changeReviewNote||row.changeReviewRequestNote||''):(row.changeNote||'')}`.trim()};
    if(row.postApprovalProposal===true&&row.reviewStatus==='analysis')return {tone:'info',label:text('review.newActivity'),message:row.reviewBaseline?`${text('review.adjustSent')}. ${row.reviewRequestNote||''}`.trim():text('review.newActivityInfo')};
    if(row.postApprovalProposal===true&&row.reviewStatus==='adjustments')return {tone:'warning',label:text('review.readjustReason'),message:`${text('review.readjustReason')} ${row.reviewNote||''}`.trim()};
    return null;
  }
  function signalHtml(row){const meta=signalMeta(row);if(!meta)return '';return `<span class="r32-session-signal-wrap"><button class="r32-session-signal ${meta.tone}" type="button" aria-label="${escapeHtml(meta.label)}" data-r32-message="${escapeHtml(meta.message)}" onclick="toggleR32SessionSignal(this,event)"><i class="fa-solid fa-circle-info" aria-hidden="true"></i></button></span>`}
  function closeSignal(){document.getElementById('r32SessionSignalPopover')?.remove()}
  window.toggleR32SessionSignal=function(button,event){
    event?.preventDefault?.();event?.stopPropagation?.();const current=document.getElementById('r32SessionSignalPopover');if(current&&current.dataset.owner===String(button?.dataset.r32SignalId||'')){current.remove();return}closeSignal();if(!button)return;if(!button.dataset.r32SignalId)button.dataset.r32SignalId=`r32-${Date.now()}-${Math.random().toString(36).slice(2)}`;const popover=document.createElement('div');popover.id='r32SessionSignalPopover';popover.className='r32-session-signal-popover';popover.setAttribute('role','status');popover.dataset.owner=button.dataset.r32SignalId;popover.textContent=button.dataset.r32Message||'';document.body.appendChild(popover);const rect=button.getBoundingClientRect(),box=popover.getBoundingClientRect(),pad=12;let left=rect.left+rect.width/2-box.width/2;left=Math.max(pad,Math.min(left,window.innerWidth-box.width-pad));let top=rect.bottom+7;if(top+box.height>window.innerHeight-pad)top=Math.max(pad,rect.top-box.height-7);popover.style.left=`${Math.round(left)}px`;popover.style.top=`${Math.round(top)}px`;
  };
  document.addEventListener('click',event=>{if(!event.target.closest?.('.r32-session-signal'))closeSignal()});window.addEventListener('scroll',closeSignal,true);window.addEventListener('resize',closeSignal);

  sessionCardVolunteer=function(s,editable){
    const html=baseSessionCard(s,editable),root=document.createElement('div');root.innerHTML=html;const card=root.firstElementChild;if(!card)return html;const row=rawSession(s?.raw||s);
    if(row.adminAdjustmentStatus==='requested'&&adjustmentReady(row)){
      card.classList.remove('r31-card-warning');card.classList.add('r32-card-ready');const statusBadge=[...card.querySelectorAll('.activity-row>.badge')].at(-1);if(statusBadge){statusBadge.className='badge success';statusBadge.textContent=text('review.adjusted')}
      const button=card.querySelector('.candidate-session-actions .btn');if(button){button.classList.remove('review-action-warning');button.innerHTML=`<i class="fa-solid fa-pen"></i>${escapeHtml(text('review.adjustAgain'))}`}
    }
    const signal=signalHtml(row);if(signal){const title=card.querySelector('.volunteer-session-title')||card.querySelector('.activity-row h4')?.parentElement;if(title&&!title.querySelector('.r32-session-signal-wrap'))title.insertAdjacentHTML('beforeend',signal)}
    return root.innerHTML;
  };

  volunteerAgendaContent=function(editable=false){
    const html=baseAgendaContent(editable),template=document.createElement('template');template.innerHTML=html;
    [...template.content.querySelectorAll('.day-block[id^="vday-"]')].forEach(day=>{
      const date=day.id.slice(5),sessions=(typeof getSessions==='function'?getSessions(date,true):[]).map(rawSession),sessionAdjustments=sessions.filter(row=>row.adminAdjustmentStatus==='requested'||row.adminAdjustmentStatus==='analysis');
      day.querySelectorAll('.day-info-button').forEach(button=>button.remove());if(!sessionAdjustments.length)return;
      const heading=day.querySelector('.day-title>div:first-child');if(!heading)return;heading.querySelectorAll('.r32-day-state-badge').forEach(node=>node.remove());heading.querySelectorAll('.badge.warning').forEach(node=>node.remove());
      const pending=sessions.filter(row=>row.adminAdjustmentStatus==='requested'&&!adjustmentReady(row)),ready=sessions.filter(row=>row.adminAdjustmentStatus==='requested'&&adjustmentReady(row)),sent=sessions.filter(row=>row.adminAdjustmentStatus==='analysis');let label='',tone='';
      if(pending.length){label=text('portal.plan.adjust');tone='warning'}else if(ready.length){label=text('review.adjusted');tone='success'}else if(sent.length){label=text('review.sent');tone='success'}
      if(label)heading.insertAdjacentHTML('beforeend',`<span class="badge ${tone} r32-day-state-badge">${escapeHtml(label)}</span>`);
    });
    return template.innerHTML;
  };

  if(typeof baseSaveAdjustment==='function')window.saveR31VolunteerSessionEditor=async function(encodedId){
    const id=decodeURIComponent(String(encodedId||'')),row=(state.sessions||[]).find(item=>String(item.id||item.sessionId)===id),candidateAdjustment=state.volunteerMode!=='approved'&&row?.adminAdjustmentStatus==='requested';await baseSaveAdjustment(encodedId);if(candidateAdjustment&&!document.getElementById('r31VolunteerAdjustSave')){row._r32AdjustmentReady=true;row._r32AdjustedAt=Date.now();render()}
  };

  submitPlan=async function(){
    const pending=(state.sessions||[]).filter(row=>row.adminAdjustmentStatus==='requested');if(pending.some(row=>!adjustmentReady(row)))return showToast(text('review.adjustBeforeResend'));return baseSubmitPlan();
  };

  window.sessionCardVolunteer=sessionCardVolunteer;window.volunteerAgendaContent=volunteerAgendaContent;window.submitPlan=submitPlan;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
