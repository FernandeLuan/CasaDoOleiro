/* Prazo de planejamento: manutenção fora do caminho crítico do boot. */
const EXPIRED_MAINTENANCE_SESSION_KEY='oleiro.expired-maintenance.last.v1';
const EXPIRED_MAINTENANCE_TTL=30*60*1000;
let _expiredMaintenancePromise=null;

processExpiredCandidatesOnStartup=async function({force=false}={}){
  if(!window.OleiroServices?.applications?.processExpiredPending)return 0;
  if(_expiredMaintenancePromise)return _expiredMaintenancePromise;
  if(!force){
    try{
      const last=Number(sessionStorage.getItem(EXPIRED_MAINTENANCE_SESSION_KEY)||0);
      if(last&&Date.now()-last<EXPIRED_MAINTENANCE_TTL)return 0;
    }catch{}
  }
  _expiredMaintenancePromise=window.OleiroServices.applications.processExpiredPending({pageSize:50}).then(async total=>{
    try{sessionStorage.setItem(EXPIRED_MAINTENANCE_SESSION_KEY,String(Date.now()))}catch{}
    if(total>0&&state.managerPage==='volunteer'&&state.candidateFilter==='pending'&&typeof loadManagerCandidates==='function')await loadManagerCandidates({force:true});
    return total;
  }).finally(()=>{_expiredMaintenancePromise=null});
  return _expiredMaintenancePromise;
};