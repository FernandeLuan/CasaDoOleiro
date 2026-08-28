/* Round 27 — middleware de auditoria operacional. Cada evento adiciona somente 1 write e 0 reads.
   Falha do histórico nunca desfaz uma operação de negócio já concluída. */
(function historyHooksR27(){
  const services=window.OleiroServices;if(!services?.history)return;
  const wrapped=Symbol.for('oleiro.history.wrapped');
  function appFromState(id){
    const key=String(id||'');
    if(typeof state==='undefined')return null;
    if(String(state.currentApplication?.id||'')===key)return state.currentApplication;
    return (state.candidates||[]).find(row=>String(row.id)===key)||null;
  }
  function unitFor(id,fallback=''){const app=appFromState(id);return String(fallback||app?.unitId||app?.unit||'').toLowerCase()}
  function record(id,type,{unitId='',metadata={}}={}){
    if(!id||!type)return;
    services.history.append(id,type,{unitId:unitFor(id,unitId),metadata}).catch(error=>console.warn('Histórico não pôde ser registrado:',type,error));
  }
  function wrap(target,name,after){
    const original=target?.[name];if(typeof original!=='function'||original[wrapped])return;
    const decorated=async function(...args){const result=await original.apply(this,args);try{after(args,result)}catch(error){console.warn('Falha ao preparar evento de histórico:',name,error)}return result};
    decorated[wrapped]=true;target[name]=decorated;
  }

  wrap(services.onboarding,'createCandidate',([payload],result)=>record(result?.applicationId,'candidate_created',{unitId:payload?.unitId,metadata:{participantCount:(payload?.participants||[]).length}}));
  wrap(services.applications,'submitPlanning',([id,options])=>record(id,options?.wasAdjustment?'planning_resent':'planning_submitted'));
  wrap(services.applications,'requestDayAdjustment',([id,date])=>record(id,'adjustment_requested',{metadata:{date:String(date||'')}}));
  wrap(services.applications,'resetPlanning',([id])=>record(id,'planning_reset'));
  wrap(services.applications,'changeStayDates',([id,options],result)=>record(id,'stay_dates_changed',{metadata:{stayStart:String(options?.stayStart||''),stayEnd:String(options?.stayEnd||''),removedSessions:Number(result?.removedSessions)||0}}));
  wrap(services.applications,'approvePlanning',([id])=>record(id,'planning_approved'));
  wrap(services.applications,'scheduleSelectionMeeting',([id,meeting])=>record(id,'meeting_scheduled',{metadata:{date:String(meeting?.date||''),time:String(meeting?.time||'')}}));
  wrap(services.applications,'completeSelectionMeeting',([id])=>record(id,'meeting_completed'));
  wrap(services.applications,'finalizeSelection',([id,options])=>record(id,options?.decision==='approve'?'candidate_approved':'candidate_rejected'));
  wrap(services.applications,'reactivateCandidatePlanning',([id])=>record(id,'candidate_reactivated'));

  wrap(services.planning,'saveActivity',([args],result)=>record(args?.applicationId,args?.activityId?'activity_updated':'activity_created',{unitId:args?.unitId,metadata:{activityId:String(result?.activityId||args?.activityId||''),activityName:String(args?.data?.name||'')}}));
  wrap(services.planning,'deleteSession',([sessionId,options],result)=>record(options?.applicationId,'activity_deleted',{metadata:{activityId:String(options?.activityId||''),sessionId:String(sessionId||''),deletedActivity:result?.deletedActivity===true}}));
  wrap(services.planning,'updateSession',([sessionId,patch])=>{
    if(!patch?.date)return;const session=(typeof state!=='undefined'?(state.sessions||[]):[]).find(row=>String(row.id)===String(sessionId));record(session?.applicationId,'session_moved',{unitId:session?.unitId,metadata:{sessionId:String(sessionId),date:String(patch.date||''),time:String(patch.time||'')}});
  });
  wrap(services.planning,'reviewPostApprovalProposal',([options])=>record(options?.applicationId,'post_proposal_reviewed',{metadata:{activityId:String(options?.activityId||''),decision:String(options?.decision||'')}}));
})();
