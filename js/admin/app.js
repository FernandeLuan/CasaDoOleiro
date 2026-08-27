const _managerScheduleCache=new Map();
const MANAGER_SCHEDULE_CACHE_MS=60000;
const MANAGER_APPLICATION_REFRESH_MS=10000;
const MANAGER_CHANGE_REFRESH_MS=120000;
let _managerApplicationsRefreshAt=0;
let _managerApplicationsRefreshPromise=null;
let _managerPendingChangesAt=0;
let _managerPendingChangesPromise=null;
let _managerCandidateRequestKey='';
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

function managerCandidateQueryKey(){return JSON.stringify({status:state.candidateFilter||'approved',unit:state.candidateUnit||'all',search:String(state.candidateSearch||'').trim().toLocaleLowerCase('pt-BR')})}
async function loadManagerCandidates({append=false,force=false}={}){
  if(!window.OleiroServices?.applications?.list)return state.candidates||[];
  const key=managerCandidateQueryKey();
  if(!append&&!force&&key===state.candidateQueryKey&&Date.now()-_managerApplicationsRefreshAt<MANAGER_APPLICATION_REFRESH_MS)return state.candidates||[];
  if(state.candidateLoading)return state.candidates||[];
  const requestKey=`${key}|${Date.now()}`;_managerCandidateRequestKey=requestKey;state.candidateLoading=true;
  if(!append){state.candidateCursor=null;state.candidateHasMore=false;state.candidateQueryKey=key;if(state.managerPage==='volunteer')render()}
  try{
    const result=await window.OleiroServices.applications.list({
      status:state.candidateFilter||'approved',unit:state.candidateUnit||'all',search:state.candidateSearch||'',
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

async function hydrateManagerDashboardData(){
  if(!window.OleiroServices?.applications)return;
  const service=window.OleiroServices.applications;
  const [analysis,adjustments,arrivals,departures]=await Promise.all([
    service.countStatus?.('analysis')??0,service.countStatus?.('adjustments')??0,
    service.listUpcoming?.({field:'stayStart',from:_oleiroToday,limit:3})??[],
    service.listUpcoming?.({field:'stayEnd',from:_oleiroToday,limit:3})??[]
  ]);
  state.dashboardCounts={analysis:Number(analysis)||0,adjustments:Number(adjustments)||0};
  state.dashboardArrivals=arrivals||[];state.dashboardDepartures=departures||[];
  if(state.managerPage==='home')render();
}

async function hydrateManagerBaseData(){
  const unitsResult=await (window.OleiroServices?.units?.list?window.OleiroServices.units.list({includeInactive:true}):[]);
  state.units=unitsResult||[];
  state.candidateFilter=state.candidateFilter||'approved';state.candidateUnit=state.candidateUnit||'all';state.candidateSearch=state.candidateSearch||'';
  await Promise.all([loadManagerCandidates({force:true}),hydrateManagerDashboardData()]);
}

async function hydrateManagerData(){await hydrateManagerBaseData();return state.candidates}
async function ensureManagerGroups(){
  if(state.groupsLoaded)return state.groups||[];state.groupsLoading=true;
  try{state.groups=window.OleiroServices?.groups?.ensureDefaults?await window.OleiroServices.groups.ensureDefaults('rodeio'):[];state.groupsLoaded=true;return state.groups;}finally{state.groupsLoading=false}
}
function renderManager(){
  const pages={home:managerHome,volunteer:managerVolunteers,agenda:managerAgenda,groups:managerGroups,menu:managerMenu};
  app.innerHTML=header()+`<main class="page">${pages[state.managerPage]()}</main>`;navRoot.innerHTML=managerNav();if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
}
function render(){renderManager()}
async function bootManager(){
  const session=await window.OleiroAuthGuard?.requireRole('manager');if(!session)return;
  state.role='manager';state.currentSession=session;state.managerPage='home';state.groupsLoaded=false;state.groupsLoading=false;state.sessions=[];state.pendingChangeRequests=[];state.scheduleFrom=null;state.scheduleTo=null;state.dashboardCounts={analysis:0,adjustments:0};state.dashboardArrivals=[];state.dashboardDepartures=[];state.candidateHasMore=false;state.candidateCursor=null;state.candidateLoading=false;render();
  try{
    await hydrateManagerBaseData();if(state.managerPage==='home')render();
    processExpiredCandidatesOnStartup?.().then(()=>hydrateManagerDashboardData()).catch(error=>console.error('Falha ao processar prazos:',error));
    hydrateManagerSchedule(_oleiroToday,_oleiroToday).then(()=>{if(state.managerPage==='home')render()}).catch(error=>console.error('Falha ao carregar agenda de hoje:',error));
    hydrateManagerPendingChanges().catch(console.error);
  }catch(error){console.error('Falha ao carregar dados da gestão:',error);showToast('Não foi possível atualizar os dados da gestão.')}
}

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible'||state.role!=='manager')return;
  if(state.managerPage==='volunteer')refreshManagerApplications().catch(console.error);
  if(state.managerPage==='home'){hydrateManagerDashboardData().catch(console.error);hydrateManagerSchedule(_oleiroToday,_oleiroToday,{force:true}).then(()=>render()).catch(console.error)}
  hydrateManagerPendingChanges().catch(console.error);
  if(state.managerPage==='agenda')hydrateManagerSchedule(state.agendaFrom||_oleiroToday,state.agendaTo||_oleiroToday,{force:true}).then(()=>render()).catch(console.error);
});

bootManager();
