const _managerScheduleCache=new Map();
const MANAGER_SCHEDULE_CACHE_MS=60000;
const MANAGER_APPLICATION_REFRESH_MS=30000;
const MANAGER_CHANGE_REFRESH_MS=120000;
const MANAGER_DASHBOARD_REFRESH_MS=120000;
let _managerApplicationsRefreshAt=0;
let _managerApplicationsRefreshPromise=null;
let _managerPendingChangesAt=0;
let _managerPendingChangesPromise=null;
let _managerDashboardAt=0;
let _managerDashboardPromise=null;
let _managerCandidateRequestKey='';
let _managerBackgroundWarmupScheduled=false;
function managerScheduleKey(from,to,unit='all'){return `${from}|${to}|${unit}`}
function mapManagerScheduleRows(rows){
  const names=new Map((state.candidates||[]).map(p=>[String(p.id),p.name]));
  return (rows||[]).map(row=>({...row,activity:{...(row.activity||{}),owner:row.activity?.owner&&row.activity.owner!=='Voluntário'?row.activity.owner:(names.get(String(row.applicationId))||row.ownerName||'Voluntário')}}));
}
function deriveAdminNotifications(){return []}
function invalidateManagerScheduleCache(){_managerScheduleCache.clear();state.scheduleFrom=null;state.scheduleTo=null}
async function hydrateManagerSchedule(from=_oleiroToday,to=_oleiroToday,{force=false,unitId='all'}={}){
  if(!window.OleiroServices?.planning?.listManagerSchedule)return [];
  const key=managerScheduleKey(from,to,unitId),cached=_managerScheduleCache.get(key);
  if(!force&&cached&&Date.now()-cached.at<MANAGER_SCHEDULE_CACHE_MS){state.sessions=cached.rows;state.activities=[];state.scheduleFrom=from;state.scheduleTo=to;return cached.rows;}
  const rows=mapManagerScheduleRows(await window.OleiroServices.planning.listManagerSchedule({from,to,unitId}));
  _managerScheduleCache.set(key,{at:Date.now(),rows});state.sessions=rows;state.activities=[];state.scheduleFrom=from;state.scheduleTo=to;return rows;
}

async function hydrateManagerPendingChanges({force=false}={}){
  if(!window.OleiroServices?.planning?.listPendingChanges)return state.pendingChangeRequests||[];
  if(_managerPendingChangesPromise)return _managerPendingChangesPromise;
  if(!force&&Date.now()-_managerPendingChangesAt<MANAGER_CHANGE_REFRESH_MS)return state.pendingChangeRequests||[];
  _managerPendingChangesPromise=window.OleiroServices.planning.listPendingChanges({limit:100}).then(rows=>{state.pendingChangeRequests=rows||[];_managerPendingChangesAt=Date.now();if(state.managerPage==='home'||(state.managerPage==='volunteer'&&state.candidateFilter==='adjustments'))render();return state.pendingChangeRequests}).catch(error=>{console.error('Falha ao carregar mudanças solicitadas:',error);return state.pendingChangeRequests||[]}).finally(()=>{_managerPendingChangesPromise=null});
  return _managerPendingChangesPromise;
}
function invalidateManagerPendingChanges(){_managerPendingChangesAt=0}

function managerCandidateQueryKey(){return JSON.stringify({status:state.candidateFilter||'all',unit:state.candidateUnit||'all',search:String(state.candidateSearch||'').trim().toLocaleLowerCase('pt-BR')})}
async function loadManagerCandidates({append=false,force=false}={}){
  if(!window.OleiroServices?.applications?.list)return state.candidates||[];
  const key=managerCandidateQueryKey();
  if(!append&&!force&&key===state.candidateQueryKey&&Date.now()-_managerApplicationsRefreshAt<MANAGER_APPLICATION_REFRESH_MS)return state.candidates||[];
  if(state.candidateLoading)return state.candidates||[];
  const requestKey=`${key}|${Date.now()}`;_managerCandidateRequestKey=requestKey;state.candidateLoading=true;
  if(!append){state.candidateCursor=null;state.candidateHasMore=false;state.candidateQueryKey=key;if(state.managerPage==='volunteer')render()}
  try{
    const result=await window.OleiroServices.applications.list({
      status:state.candidateFilter||'all',unit:state.candidateUnit||'all',search:state.candidateSearch||'',
      cursor:append?state.candidateCursor:null,limit:10
    });
    if(_managerCandidateRequestKey!==requestKey)return state.candidates||[];
    const rows=result?.items||[];
    if(append){const byId=new Map((state.candidates||[]).map(row=>[String(row.id),row]));rows.forEach(row=>byId.set(String(row.id),row));state.candidates=[...byId.values()]}
    else state.candidates=rows;
    state.candidateCursor=result?.nextCursor||null;state.candidateHasMore=!!result?.hasMore;state.candidateQueryKey=key;_managerApplicationsRefreshAt=Date.now();
    if(state.managerPage==='volunteer')render();
    return state.candidates;
  }finally{if(_managerCandidateRequestKey===requestKey){state.candidateLoading=false;if(state.managerPage==='volunteer')render()}}
}
async function loadMoreManagerCandidates(){if(state.candidateLoading||!state.candidateHasMore||!state.candidateCursor)return;return loadManagerCandidates({append:true,force:true})}
async function refreshManagerApplications({force=false}={}){return loadManagerCandidates({append:false,force})}

async function hydrateManagerDashboardData({force=true}={}){
  if(!window.OleiroServices?.applications)return;
  if(_managerDashboardPromise)return _managerDashboardPromise;
  if(!force&&Date.now()-_managerDashboardAt<MANAGER_DASHBOARD_REFRESH_MS)return {counts:state.dashboardCounts,arrivals:state.dashboardArrivals,departures:state.dashboardDepartures};
  const service=window.OleiroServices.applications;
  _managerDashboardPromise=Promise.allSettled([
    service.countStatus?.('analysis')??0,service.countStatus?.('adjustments')??0,
    service.listUpcoming?.({field:'stayStart',from:_oleiroToday,limit:3})??[],
    service.listUpcoming?.({field:'stayEnd',from:_oleiroToday,limit:3})??[]
  ]).then(results=>{
    const value=(index,fallback)=>results[index]?.status==='fulfilled'?results[index].value:fallback;
    results.forEach((result,index)=>{if(result.status==='rejected')console.warn(['Contagem em análise','Contagem de ajustes','Próximas chegadas','Próximas saídas'][index]+' indisponível:',result.reason)});
    state.dashboardCounts={analysis:Number(value(0,state.dashboardCounts?.analysis||0))||0,adjustments:Number(value(1,state.dashboardCounts?.adjustments||0))||0};
    state.dashboardArrivals=value(2,state.dashboardArrivals||[])||[];state.dashboardDepartures=value(3,state.dashboardDepartures||[])||[];_managerDashboardAt=Date.now();
    if(state.managerPage==='home')render();return {counts:state.dashboardCounts,arrivals:state.dashboardArrivals,departures:state.dashboardDepartures};
  }).finally(()=>{_managerDashboardPromise=null});
  return _managerDashboardPromise;
}

async function hydrateManagerBaseData(){
  state.candidateFilter=state.candidateFilter||'all';state.candidateUnit=state.candidateUnit||'all';state.candidateSearch=state.candidateSearch||'';
  const unitsPromise=window.OleiroServices?.units?.list?window.OleiroServices.units.list({includeInactive:true}):Promise.resolve([]);
  const candidatesPromise=loadManagerCandidates({force:true});
  const [unitsResult]=await Promise.all([unitsPromise,candidatesPromise]);
  state.units=unitsResult||[];
  const units=state.units||[];
  if(!units.some(unit=>String(unit.id)===String(state.groupUnitId||''))){
    state.groupUnitId=units.some(unit=>String(unit.id)==='rodeio')?'rodeio':String(units[0]?.id||'rodeio');
    state.groupsLoaded=false;state.groupsUnitId=null;
  }
}

function scheduleManagerBackgroundWarmup(){
  if(_managerBackgroundWarmupScheduled)return;_managerBackgroundWarmupScheduled=true;
  const run=()=>{
    _managerBackgroundWarmupScheduled=false;
    hydrateManagerDashboardData({force:false}).catch(error=>console.warn('Dados secundários do painel indisponíveis:',error));
    hydrateManagerSchedule(_oleiroToday,_oleiroToday,{force:false}).then(()=>{if(state.managerPage==='home')render()}).catch(error=>console.warn('Agenda de hoje indisponível:',error));
    hydrateManagerPendingChanges({force:false}).catch(error=>console.warn('Pendências indisponíveis:',error));
    setTimeout(()=>processExpiredCandidatesOnStartup?.().catch(error=>console.error('Falha ao processar prazos:',error)),1200);
  };
  if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:1200});else setTimeout(run,700);
}

async function hydrateManagerData(){await hydrateManagerBaseData();return state.candidates}
function managerGroupUnitId(){
  const units=state.units||[],current=String(state.groupUnitId||'');
  if(units.some(unit=>String(unit.id)===current))return current;
  if(units.some(unit=>String(unit.id)==='rodeio'))return 'rodeio';
  return String(units[0]?.id||'rodeio');
}
async function ensureManagerGroups({force=false}={}){
  const unitId=managerGroupUnitId();state.groupUnitId=unitId;
  if(!force&&state.groupsLoaded&&String(state.groupsUnitId||'')===unitId)return state.groups||[];
  state.groupsLoading=true;
  try{
    if(force)window.OleiroServices?.groups?.invalidate?.(unitId);
    state.groups=window.OleiroServices?.groups?.ensureDefaults?await window.OleiroServices.groups.ensureDefaults(unitId):[];
    state.groupsLoaded=true;state.groupsUnitId=unitId;return state.groups;
  }finally{state.groupsLoading=false}
}
async function changeManagerGroupUnit(unitId){
  const normalized=String(unitId||'').toLowerCase();if(!normalized||normalized===String(state.groupUnitId||''))return;
  const valid=(state.units||[]).some(unit=>String(unit.id)===normalized);if(!valid)return showToast('Unidade inválida.');
  const previous={unitId:state.groupUnitId,groups:state.groups,groupsLoaded:state.groupsLoaded,groupsUnitId:state.groupsUnitId};
  const select=document.getElementById('managerGroupUnit');if(select){select.disabled=true;select.setAttribute('aria-busy','true')}
  state.groupUnitId=normalized;state.groupsLoaded=false;state.groups=[];
  try{
    await new Promise(resolve=>setTimeout(resolve,0));
    await ensureManagerGroups();
  }catch(error){
    console.error(error);state.groupUnitId=previous.unitId;state.groups=previous.groups;state.groupsLoaded=previous.groupsLoaded;state.groupsUnitId=previous.groupsUnitId;showToast('Não foi possível carregar os grupos desta unidade.');
  }finally{
    if(state.managerPage==='groups')render();
  }
}
function renderManager(){
  const pages={home:managerHome,volunteer:managerVolunteers,agenda:managerAgenda,groups:managerGroups,menu:managerMenu};
  app.innerHTML=header()+`<main class="page">${pages[state.managerPage]()}</main>`;navRoot.innerHTML=managerNav();if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
}
function render(){renderManager()}
async function bootManager(){
  const session=await window.OleiroAuthGuard?.requireRole('manager');if(!session)return;
  state.role='manager';state.currentSession=session;state.managerPage='home';state.groupsLoaded=false;state.groupsLoading=false;state.groupsUnitId=null;state.groupUnitId=state.groupUnitId||'';state.sessions=[];state.pendingChangeRequests=[];state.scheduleFrom=null;state.scheduleTo=null;state.dashboardCounts={analysis:0,adjustments:0};state.dashboardArrivals=[];state.dashboardDepartures=[];state.candidateHasMore=false;state.candidateCursor=null;state.candidateLoading=false;render();
  try{
    await hydrateManagerBaseData();if(state.managerPage==='home')render();scheduleManagerBackgroundWarmup();
  }catch(error){console.error('Falha ao carregar a lista principal da gestão:',error);showToast('Não foi possível carregar a lista de voluntários. Tente novamente.')}
}

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible'||state.role!=='manager')return;
  if(state.managerPage==='volunteer')refreshManagerApplications().catch(console.error);
  if(state.managerPage==='home'){hydrateManagerDashboardData({force:false}).catch(console.error);hydrateManagerSchedule(_oleiroToday,_oleiroToday,{force:false}).then(()=>render()).catch(console.error)}
  hydrateManagerPendingChanges({force:false}).catch(console.error);
  if(state.managerPage==='agenda')hydrateManagerSchedule(state.agendaFrom||_oleiroToday,state.agendaTo||_oleiroToday,{force:false}).then(()=>render()).catch(console.error);
});

bootManager();
