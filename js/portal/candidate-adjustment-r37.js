/* Round 37 — session-scoped candidate adjustments may include new draft activities before resubmission. */
(function candidateAdjustmentR37(){
  const baseSessionCard=window.sessionCardVolunteer||sessionCardVolunteer;
  const baseOpenActivityModal=window.openActivityModal||openActivityModal;
  const baseRequestDelete=window.requestDeletePlanningSession||requestDeletePlanningSession;
  const planning=window.OleiroServices?.planning;
  const basePlanningSave=planning?.saveActivity?.bind(planning);
  const basePlanningSeries=planning?.createActivitySeries?.bind(planning);
  const text=key=>typeof t==='function'?t(key):key;

  function rawSession(value){return value?.raw||value||{}}
  function timeMs(value){
    if(!value)return 0;
    try{
      if(typeof value.toMillis==='function')return Number(value.toMillis())||0;
      if(typeof value.toDate==='function')return Number(value.toDate().getTime())||0;
    }catch{}
    const parsed=Date.parse(String(value));
    return Number.isFinite(parsed)?parsed:0;
  }
  function candidateIsAdjusting(){
    return state.volunteerMode!=='approved'&&state.volunteerPlanStatus==='adjustments';
  }
  function requestedSessions(){
    return (state.sessions||[]).filter(row=>rawSession(row).adminAdjustmentStatus==='requested');
  }
  function scopedAdjustment(){
    return candidateIsAdjusting()&&requestedSessions().length>0;
  }
  function adjustmentOpenedAt(){
    const values=requestedSessions().map(row=>timeMs(rawSession(row).adminAdjustmentRequestedAt)).filter(Boolean);
    return values.length?Math.min(...values):0;
  }
  function isCurrentAdjustmentDraft(row){
    const raw=rawSession(row);
    if(raw._r37AdjustmentDraft===true)return true;
    const opened=adjustmentOpenedAt(),created=timeMs(raw.createdAt);
    return opened>0&&created>=opened&&raw.adminAdjustmentStatus!=='requested';
  }
  function isDraftActivity(activityId){
    const id=String(activityId||'');
    return !!id&&(state.sessions||[]).some(row=>String(rawSession(row).activityId||'')===id&&isCurrentAdjustmentDraft(row));
  }
  function markDraftResult(result){
    if(!result)return result;
    (result.sessions||[]).forEach(row=>{row._r37AdjustmentDraft=true});
    (result.activities||[]).forEach(row=>{row._r37AdjustmentDraft=true});
    if(result.activity)result.activity._r37AdjustmentDraft=true;
    return result;
  }

  if(basePlanningSave){
    planning.saveActivity=async function(args={}){
      const draft=scopedAdjustment()&&(!args.activityId||isDraftActivity(args.activityId));
      const result=await basePlanningSave(args);
      return draft?markDraftResult(result):result;
    };
  }
  if(basePlanningSeries){
    planning.createActivitySeries=async function(args={}){
      const draft=scopedAdjustment();
      const result=await basePlanningSeries(args);
      return draft?markDraftResult(result):result;
    };
  }

  sessionCardVolunteer=function(s,editable){
    const html=baseSessionCard(s,editable);
    if(!scopedAdjustment())return html;
    const raw=rawSession(s),root=document.createElement('div');root.innerHTML=html;const card=root.firstElementChild;if(!card)return html;
    const requested=raw.adminAdjustmentStatus==='requested',draft=isCurrentAdjustmentDraft(raw);

    if(!requested&&!draft){
      card.querySelectorAll(':scope > .activity-actions').forEach(node=>node.remove());
      return root.innerHTML;
    }

    if(draft){
      const row=card.querySelector('.activity-row');
      const badges=row?[...row.children].filter(node=>node.classList?.contains('badge')):[];
      badges.forEach(node=>node.remove());
      if(row)row.insertAdjacentHTML('beforeend',badge(text('review.newActivity'),'info'));
      card.classList.add('r37-adjustment-draft');
    }
    return root.innerHTML;
  };

  openActivityModal=function(date=null,id=null){
    if(id&&scopedAdjustment()&&!isDraftActivity(id))return showToast(text('portal.activity.locked'));
    return baseOpenActivityModal(date,id);
  };

  requestDeletePlanningSession=function(activityId,date){
    if(scopedAdjustment()&&!isDraftActivity(activityId))return showToast(text('portal.activity.locked'));
    return baseRequestDelete(activityId,date);
  };

  window.sessionCardVolunteer=sessionCardVolunteer;
  window.openActivityModal=openActivityModal;
  window.requestDeletePlanningSession=requestDeletePlanningSession;
  window.isR37CandidateAdjustmentDraft=isCurrentAdjustmentDraft;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
