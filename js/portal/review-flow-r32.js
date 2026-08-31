/* Round 32/35 — coherent activity/day state after volunteer edits and activity-scoped review information. */
(function reviewFlowR32Portal(){
  const baseSessionCard=window.sessionCardVolunteer||sessionCardVolunteer;
  const baseAgendaContent=window.volunteerAgendaContent||volunteerAgendaContent;
  const baseSaveAdjustment=window.saveR31VolunteerSessionEditor;
  const baseSubmitPlan=window.submitPlan||submitPlan;
  const baseOpenActivityModal=window.openActivityModal||openActivityModal;
  const baseOpenR31VolunteerSessionEditor=window.openR31VolunteerSessionEditor;
  const planning=window.OleiroServices?.planning;
  const basePlanningSaveActivity=planning?.saveActivity?.bind(planning);
  const baseCreateActivitySeries=planning?.createActivitySeries?.bind(planning);
  const text=key=>typeof t==='function'?t(key):key;

  function rawSession(value){return value?.raw||value||{}}
  function timeMs(value){
    if(!value)return 0;
    try{if(typeof value.toMillis==='function')return Number(value.toMillis())||0;if(typeof value.toDate==='function')return Number(value.toDate().getTime())||0}catch{}
    const parsed=Date.parse(String(value));return Number.isFinite(parsed)?parsed:0;
  }
  function periodForTime(value,fallback='Sem preferência'){
    const raw=String(value||'').trim();if(!/^\d{2}:\d{2}$/.test(raw))return fallback||'Sem preferência';
    const hour=Number(raw.slice(0,2));if(hour<12)return 'Manhã';if(hour<18)return 'Tarde';return 'Noite';
  }
  function normalizeActivityArgs(args={}){
    const timeInput=document.getElementById('actTime'),periodInput=document.getElementById('actPeriod');if(!timeInput||!args?.data)return args;
    const time=String(timeInput.value||'').trim(),period=time?periodForTime(time,periodInput?.value||args.data.period):String(periodInput?.value||args.data.period||'Sem preferência');
    return {...args,data:{...args.data,time,period}};
  }
  function adjustmentReady(value){
    const row=rawSession(value);if(row.status==='plan_approved'||row.adminAdjustmentStatus!=='requested')return false;if(row._r32AdjustmentReady===true)return true;const requested=timeMs(row.adminAdjustmentRequestedAt),updated=timeMs(row.updatedAt);return requested>0&&updated>requested;
  }
  window.isR32AdjustmentReady=adjustmentReady;

  if(basePlanningSaveActivity)planning.saveActivity=function(args={}){return basePlanningSaveActivity(normalizeActivityArgs(args))};
  if(baseCreateActivitySeries)planning.createActivitySeries=function(args={}){return baseCreateActivitySeries(normalizeActivityArgs(args))};

  openActivityModal=function(date=null,id=null){
    const result=baseOpenActivityModal(date,id),time=document.getElementById('actTime'),period=document.getElementById('actPeriod');if(!time||!period)return result;
    if(!id&&time.value==='15:15')time.value='';
    if(!id&&!time.value)period.value='Sem preferência';
    const sync=()=>{if(time.value)period.value=periodForTime(time.value,period.value)};
    time.addEventListener('input',sync);time.addEventListener('change',sync);if(time.value)sync();return result;
  };

  if(typeof baseOpenR31VolunteerSessionEditor==='function')window.openR31VolunteerSessionEditor=function(encodedId){
    const id=decodeURIComponent(String(encodedId||'')),row=(state.sessions||[]).find(item=>String(item.id||item.sessionId)===id);
    if(row?.postApprovalProposal===true&&row?.reviewStatus==='adjustments'&&row?.activityId)return openActivityModal(row.date,String(row.activityId));
    return baseOpenR31VolunteerSessionEditor(encodedId);
  };

  function signalMeta(row){
    if(row.postApprovalProposal===true&&row.reviewStatus==='analysis'&&!row.reviewBaseline)return {tone:'info',label:text('review.newActivity'),message:text('review.newActivityInfo')};
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
    if(row.status==='plan_approved'){
      card.classList.remove('r31-card-warning','r31-card-info','r31-card-danger','r32-card-ready');card.querySelectorAll(':scope > .r31-review-divider,:scope > .r31-review-details,:scope > .activity-actions').forEach(node=>node.remove());
      const activityRow=card.querySelector('.activity-row'),statusBadge=activityRow?.querySelector(':scope > .badge');if(statusBadge){statusBadge.className='badge info';statusBadge.textContent=text('portal.meeting.planApproved')}else if(activityRow)activityRow.insertAdjacentHTML('beforeend',badge(text('portal.meeting.planApproved'),'info'));
      return root.innerHTML;
    }
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
      const date=day.id.slice(5),sessions=(typeof getSessions==='function'?getSessions(date,true):[]).map(rawSession),sessionAdjustments=sessions.filter(row=>row.status!=='plan_approved'&&(row.adminAdjustmentStatus==='requested'||row.adminAdjustmentStatus==='analysis'));
      day.querySelectorAll('.day-info-button').forEach(button=>button.remove());const heading=day.querySelector('.day-title>div:first-child');if(!heading)return;heading.querySelectorAll('.r32-day-state-badge').forEach(node=>node.remove());heading.querySelectorAll('.badge.warning').forEach(node=>node.remove());if(!sessionAdjustments.length)return;
      const pending=sessions.filter(row=>row.status!=='plan_approved'&&row.adminAdjustmentStatus==='requested'&&!adjustmentReady(row)),ready=sessions.filter(row=>row.status!=='plan_approved'&&row.adminAdjustmentStatus==='requested'&&adjustmentReady(row)),sent=sessions.filter(row=>row.status!=='plan_approved'&&row.adminAdjustmentStatus==='analysis');let label='',tone='';
      if(pending.length){label=text('portal.plan.adjust');tone='warning'}else if(ready.length){label=text('review.adjusted');tone='success'}else if(sent.length){label=text('review.sent');tone='success'}
      if(label)heading.insertAdjacentHTML('beforeend',`<span class="badge ${tone} r32-day-state-badge">${escapeHtml(label)}</span>`);
    });
    return template.innerHTML;
  };

  if(typeof baseSaveAdjustment==='function')window.saveR31VolunteerSessionEditor=async function(encodedId){
    const id=decodeURIComponent(String(encodedId||'')),row=(state.sessions||[]).find(item=>String(item.id||item.sessionId)===id);
    if(row?.postApprovalProposal===true&&row?.reviewStatus==='adjustments'&&row?.activityId){closeModal();return openActivityModal(row.date,String(row.activityId))}
    const candidateAdjustment=state.volunteerMode!=='approved'&&row?.adminAdjustmentStatus==='requested';await baseSaveAdjustment(encodedId);if(candidateAdjustment&&!document.getElementById('r31VolunteerAdjustSave')){row._r32AdjustmentReady=true;row._r32AdjustedAt=Date.now();render()}
  };

  submitPlan=async function(){
    const pending=(state.sessions||[]).filter(row=>row.adminAdjustmentStatus==='requested'&&row.status!=='plan_approved');if(pending.some(row=>!adjustmentReady(row)))return showToast(text('review.adjustBeforeResend'));return baseSubmitPlan();
  };

  /* Round 33 — one authoritative post-approval path, including legacy manager_confirmed sessions. */
  window.saveMoveBySessionId=async function(encodedId,byVolunteer=false){
    const id=decodeURIComponent(String(encodedId||'')),row=(state.sessions||[]).find(item=>String(item.id||item.sessionId)===id);
    if(!row)return showToast(text('portal.activity.deleteError'));
    if(!(state.volunteerMode==='approved'&&byVolunteer)){
      const newDate=document.getElementById('moveDate')?.value||'',newTime=document.getElementById('moveTime')?.value||row.time||'';
      if(!newDate)return showToast(text('portal.move.chooseDate'));
      const button=document.getElementById('moveSessionSave');if(button){button.disabled=true;button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(text('action.saving'))}`}
      try{await window.OleiroServices.planning.updateSession(id,{date:newDate,time:newTime});row.date=newDate;row.time=newTime;closeModal();render();showToast(text('portal.move.updated'))}catch(error){console.error(error);showToast(error?.message||text('portal.move.error'));if(button?.isConnected){button.disabled=false;button.textContent=text('action.saveChange')}}
      return;
    }
    const currentDate=String(row.date||''),currentTime=String(row.time||row.activity?.time||''),newDate=document.getElementById('moveDate')?.value||currentDate,newTime=document.getElementById('moveTime')?.value||currentTime,reason=document.getElementById('moveReason')?.value.trim()||'';
    if(newDate===currentDate&&newTime===currentTime)return showToast(text('portal.move.changeRequired'));
    if(!reason)return showToast(text('review.reasonRequired'));
    const button=document.getElementById('moveSessionSave');if(button){button.disabled=true;button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(text('action.saving'))}`}
    try{
      const proposal={date:newDate,time:newTime};
      const patch=await window.OleiroServices.planning.requestExistingChange({sessionId:id,proposal,reason});
      Object.assign(row,patch,{status:'change_requested',changeProposal:proposal,changeNote:reason,changeReviewStatus:'analysis'});
      closeModal();render();showToast(text('portal.session.changeSent'));
    }catch(error){console.error(error);showToast(error?.message||text('portal.move.error'));if(button?.isConnected){button.disabled=false;button.textContent=text('action.sendReview')}}
  };

  window.openActivityModal=openActivityModal;window.sessionCardVolunteer=sessionCardVolunteer;window.volunteerAgendaContent=volunteerAgendaContent;window.submitPlan=submitPlan;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
