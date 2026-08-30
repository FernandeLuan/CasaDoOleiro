/* Round 36 — approved-state cleanup, coherent period/time and mobile-safe review cards. */
(function reviewFlowR36Portal(){
  const text=key=>typeof t==='function'?t(key):key;
  const baseSessionCard=window.sessionCardVolunteer||sessionCardVolunteer;
  const baseAgendaContent=window.volunteerAgendaContent||volunteerAgendaContent;
  const baseOpenActivityModal=window.openActivityModal||openActivityModal;
  const baseR31Editor=window.openR31VolunteerSessionEditor;

  function rawSession(value){return value?.raw||value||{}}
  function timeMs(value){
    if(!value)return 0;
    try{if(typeof value.toMillis==='function')return Number(value.toMillis())||0;if(typeof value.toDate==='function')return Number(value.toDate().getTime())||0}catch{}
    const parsed=Date.parse(String(value));return Number.isFinite(parsed)?parsed:0;
  }
  function periodFromTime(value){
    const match=String(value||'').match(/^(\d{1,2}):(\d{2})/);if(!match)return 'Sem preferência';
    const minutes=Number(match[1])*60+Number(match[2]);
    if(minutes>=5*60&&minutes<12*60)return 'Manhã';
    if(minutes>=12*60&&minutes<18*60)return 'Tarde';
    return 'Noite';
  }
  window.portalPeriodFromTime=periodFromTime;

  function syncPeriod(timeId='actTime',periodId='actPeriod'){
    const time=document.getElementById(timeId),period=document.getElementById(periodId);if(!time||!period)return;
    if(time.value){period.value=periodFromTime(time.value);period.disabled=true;period.dataset.autoPeriod='1'}
    else{period.disabled=false;delete period.dataset.autoPeriod;if(!period.value)period.value='Sem preferência'}
  }
  window.syncPortalPeriodFromTime=syncPeriod;
  document.addEventListener('input',event=>{if(event.target?.id==='actTime')syncPeriod('actTime','actPeriod');if(event.target?.id==='r31ActTime')syncPeriod('r31ActTime','r31ActPeriod')});
  document.addEventListener('change',event=>{if(event.target?.id==='actTime')syncPeriod('actTime','actPeriod');if(event.target?.id==='r31ActTime')syncPeriod('r31ActTime','r31ActPeriod')});

  openActivityModal=function(date=null,id=null){const result=baseOpenActivityModal(date,id);syncPeriod('actTime','actPeriod');return result};
  window.openActivityModal=openActivityModal;
  if(typeof baseR31Editor==='function')window.openR31VolunteerSessionEditor=function(...args){const result=baseR31Editor.apply(this,args);syncPeriod('r31ActTime','r31ActPeriod');return result};

  function normalizeDataFromModal(data={}){
    const time=document.getElementById('actTime')?.value;
    const actualTime=time!==undefined?String(time):String(data.time||'');
    return {...data,time:actualTime,period:actualTime?periodFromTime(actualTime):(data.period||'Sem preferência')};
  }
  function normalizeProposal(proposal={}){
    if(!Object.prototype.hasOwnProperty.call(proposal,'time'))return proposal;
    const value=String(proposal.time||'');return {...proposal,period:value?periodFromTime(value):(proposal.period||'Sem preferência')};
  }
  const planning=window.OleiroServices?.planning;
  if(planning){
    const baseSave=planning.saveActivity?.bind(planning);if(baseSave)planning.saveActivity=async function(args={}){return baseSave({...args,data:normalizeDataFromModal(args.data||{})})};
    const baseSeries=planning.createActivitySeries?.bind(planning);if(baseSeries)planning.createActivitySeries=async function(args={}){return baseSeries({...args,data:normalizeDataFromModal(args.data||{})})};
    const baseRequest=planning.requestExistingChange?.bind(planning);if(baseRequest)planning.requestExistingChange=async function(args={}){return baseRequest({...args,proposal:normalizeProposal(args.proposal||{})})};
    const baseResubmit=planning.resubmitExistingChange?.bind(planning);if(baseResubmit)planning.resubmitExistingChange=async function(args={}){return baseResubmit({...args,proposal:normalizeProposal(args.proposal||{})})};
  }

  function stalePreApprovalAdjustment(row){
    const app=state.currentApplication||{},appStatus=String(app.status||'');
    if(!['meeting','approved'].includes(appStatus))return false;
    if(String(row.status||'')==='plan_approved')return true;
    const resolvedAt=timeMs(app.finalDecisionAt||app.planningApprovedAt),requestedAt=timeMs(row.adminAdjustmentRequestedAt);
    return !!(resolvedAt&&requestedAt&&requestedAt<=resolvedAt);
  }
  function restoreWorkflowBadge(card,row){
    const activityRow=card.querySelector(':scope > .activity-row');if(!activityRow)return;
    activityRow.querySelectorAll(':scope > .badge').forEach(node=>node.remove());
    if(typeof statusMeta!=='function')return;const meta=statusMeta(row.status||'');if(!meta?.[0])return;
    const badgeEl=document.createElement('span');badgeEl.className=`badge ${meta[1]||''}`.trim();badgeEl.textContent=meta[0];activityRow.appendChild(badgeEl);
  }
  function compactBadge(card){
    const badgeEl=card.querySelector(':scope > .activity-row > .badge'),title=card.querySelector('.volunteer-session-title');
    if(badgeEl&&title)title.appendChild(badgeEl);
  }

  sessionCardVolunteer=function(s,editable){
    const html=baseSessionCard(s,editable),root=document.createElement('div');root.innerHTML=html;const card=root.firstElementChild;if(!card)return html;const row=rawSession(s?.raw||s);
    if(stalePreApprovalAdjustment(row)){
      card.classList.remove('r31-card-warning','r31-card-info','r32-card-ready');
      card.querySelectorAll(':scope > .r31-review-divider,:scope > .r31-review-details,:scope > .candidate-session-actions').forEach(node=>node.remove());
      restoreWorkflowBadge(card,row);
    }
    const proposalActions=card.querySelector(':scope > .candidate-session-actions');if(row.postApprovalProposal===true&&row.reviewStatus==='adjustments'&&proposalActions?.querySelectorAll('.btn').length===2)proposalActions.classList.add('post-approval-volunteer-actions');
    compactBadge(card);return root.innerHTML;
  };

  volunteerAgendaContent=function(editable=false){
    const html=baseAgendaContent(editable),template=document.createElement('template');template.innerHTML=html;const appStatus=String(state.currentApplication?.status||'');
    if(appStatus==='meeting')template.content.querySelectorAll('.r32-day-state-badge').forEach(node=>node.remove());
    return template.innerHTML;
  };

  window.sessionCardVolunteer=sessionCardVolunteer;window.volunteerAgendaContent=volunteerAgendaContent;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
