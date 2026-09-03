/* Prazo de planejamento: processar somente registros realmente vencidos. */
processExpiredCandidatesOnStartup=async function(){
  if(!window.OleiroServices?.applications?.processExpiredPending)return 0;
  const total=await window.OleiroServices.applications.processExpiredPending({pageSize:50});
  if(total>0&&state.managerPage==='volunteer'&&state.candidateFilter==='pending'&&typeof loadManagerCandidates==='function')await loadManagerCandidates({force:true});
  return total;
};

/* Carrega a camada experimental da página de Planejamento apenas nesta branch de homologação. */
(function loadAdminPlanningPageR53(){
  if(document.querySelector('script[data-admin-planning-r53]'))return;
  const script=document.createElement('script');
  script.src='../js/admin/planning-page-r53.js?v=20260902-r53';
  script.dataset.adminPlanningR53='1';
  script.defer=true;
  document.body.appendChild(script);
})();
