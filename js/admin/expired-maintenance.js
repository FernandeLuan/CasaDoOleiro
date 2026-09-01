/* Prazo de planejamento: processar somente registros realmente vencidos. */
processExpiredCandidatesOnStartup=async function(){
  if(!window.OleiroServices?.applications?.processExpiredPending)return 0;
  const total=await window.OleiroServices.applications.processExpiredPending({pageSize:50,unit:typeof managerScopeUnitId==='function'?managerScopeUnitId(state.candidateUnit||'all'):'all'});
  if(total>0&&state.managerPage==='volunteer'&&state.candidateFilter==='pending'&&typeof loadManagerCandidates==='function')await loadManagerCandidates({force:true});
  return total;
};
