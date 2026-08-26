/* Round 5 — invalidar somente o cache que pode ter ficado anterior ao reenvio e ignorar ajustes já encerrados. */
(function round5PlanningRefresh(){
  const baseDayAdjustment=candidateDayAdjustment;
  candidateDayAdjustment=function(p,date){
    if(p?.status!=='adjustments')return null;
    return baseDayAdjustment(p,date);
  };

  const baseOpenPerson=openPerson;
  openPerson=async function(id,tab='overview'){
    const p=candidateById(id);
    if(p&&(tab==='plan'||['analysis','adjustments'].includes(p.status)))delete state.candidatePlanningCache?.[String(id)];
    return baseOpenPerson(id,tab);
  };
})();
