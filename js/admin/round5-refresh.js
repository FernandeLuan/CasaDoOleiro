/* Round 5 — invalidar somente o cache de planejamento que pode ter ficado anterior ao reenvio. */
(function round5PlanningRefresh(){
  const baseOpenPerson=openPerson;
  openPerson=async function(id,tab='overview'){
    const p=candidateById(id);
    if(p&&(tab==='plan'||['analysis','adjustments'].includes(p.status)))delete state.candidatePlanningCache?.[String(id)];
    return baseOpenPerson(id,tab);
  };
})();
