/* Round 5 — invalidar cache anterior ao reenvio, ignorar ajustes encerrados e explicitar o fluxo de decisão. */
(function round5PlanningRefresh(){
  const baseDayAdjustment=candidateDayAdjustment;
  candidateDayAdjustment=function(p,date){
    if(p?.status!=='adjustments')return null;
    return baseDayAdjustment(p,date);
  };

  const basePersonTabContent=personTabContent;
  personTabContent=function(p,tab){
    const html=basePersonTabContent(p,tab);
    return tab==='overview'?html.replace('Revisar planejamento','Ajustar'):html;
  };

  const baseOpenPerson=openPerson;
  openPerson=async function(id,tab='overview'){
    const p=candidateById(id);
    if(p&&(tab==='plan'||['analysis','adjustments'].includes(p.status)))delete state.candidatePlanningCache?.[String(id)];
    return baseOpenPerson(id,tab);
  };
})();
