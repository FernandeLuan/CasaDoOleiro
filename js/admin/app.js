const _managerScheduleCache=new Map();
const MANAGER_SCHEDULE_CACHE_MS=60000;
const MANAGER_APPLICATION_PAGE_SIZE=50;
const MANAGER_APPLICATION_MAX_RECORDS=500;
const MANAGER_APPLICATION_REFRESH_MS=10000;
const MANAGER_CHANGE_REFRESH_MS=120000;
let _managerApplicationsRefreshAt=0;
let _managerApplicationsRefreshPromise=null;
let _managerPendingChangesAt=0;
let _managerPendingChangesPromise=null;
function managerScheduleKey(from,to,unit='all'){return `${from}|${to}|${unit}`}
function mapManagerScheduleRows(rows){
  const names=new Map((state.candidates||[]).map(p=>[String(p.id),p.name]));
  return (rows||[]).map(row=>({...row,activity:{...(row.activity||{}),owner:row.activity?.owner&&row.activity.owner!=='Voluntário'?row.activity.owner:(names.get(String(row.applicationId))||'Voluntário')}}));
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

function mergeManagerCandidates(rows){
  const byId=new Map((state.candidates||[]).map(row=>[String(row.id),row]));
  (rows||[]).forEach(row=>byId.set(String(row.id),row));
  state.candidates=[...byId.values()];
}

async function hydrateRemainingManagerCandidates(firstResult){
  if(!window.OleiroServices?.applications?.list||!firstResult?.hasMore||!firstResult.nextCursor)return;
  let cursor=firstResult.nextCursor,total=(state.candidates||[]).length;
  while(cursor&&total<MANAGER_APPLICATION_MAX_RECORDS){
    const result=await window.OleiroServices.applications.list({status:'all',unit:'all',cursor,limit:MANAGER_APPLICATION_PAGE_SIZE});
    const rows=result?.items||[];
    if(!rows.length)break;
    mergeManagerCandidates(rows);total=(state.candidates||[]).length;
    if(state.managerPage==='home'||state.managerPage==='volunteer')render();
    if(!result.hasMore||!result.nextCursor)break;
    cursor=result.nextCursor;
  }
}

async function hydrateManagerBaseData(){
  const [unitsResult,applicationsResult]=await Promise.all([
    window.OleiroServices?.units?.list?window.OleiroServices.units.list({includeInactive:true}):[],
    window.OleiroServices?.applications?.list?window.OleiroServices.applications.list({status:'all',unit:'all',limit:MANAGER_APPLICATION_PAGE_SIZE}):{items:[]}
  ]);
  state.units=unitsResult||[];state.candidates=applicationsResult?.items||[];
  _managerApplicationsRefreshAt=Date.now();
  return applicationsResult;
}

async function refreshManagerApplications({force=false}={}){
  if(!window.OleiroServices?.applications?.list)return state.candidates||[];
  if(_managerApplicationsRefreshPromise)return _managerApplicationsRefreshPromise;
  if(!force&&Date.now()-_managerApplicationsRefreshAt<MANAGER_APPLICATION_REFRESH_MS)return state.candidates||[];
  _managerApplicationsRefreshPromise=(async()=>{
    const first=await window.OleiroServices.applications.list({status:'all',unit:'all',limit:MANAGER_APPLICATION_PAGE_SIZE});
    state.candidates=first?.items||[];_managerApplicationsRefreshAt=Date.now();
    if(state.managerPage==='home'||state.managerPage==='volunteer')render();
    await hydrateRemainingManagerCandidates(first);
    return state.candidates;
  })().finally(()=>{_managerApplicationsRefreshPromise=null});
  return _managerApplicationsRefreshPromise;
}

async function hydrateManagerData(){const result=await hydrateManagerBaseData();await hydrateRemainingManagerCandidates(result);return state.candidates}
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
  state.role='manager';state.currentSession=session;state.managerPage='home';state.groupsLoaded=false;state.groupsLoading=false;state.sessions=[];state.pendingChangeRequests=[];state.scheduleFrom=null;state.scheduleTo=null;render();
  try{
    const firstApplicationsPage=await hydrateManagerBaseData();if(state.managerPage==='home')render();
    hydrateRemainingManagerCandidates(firstApplicationsPage).catch(error=>console.error('Falha ao carregar registros adicionais:',error));
    processExpiredCandidatesOnStartup?.().then(()=>{if(state.managerPage==='home'||state.managerPage==='volunteer')render()}).catch(error=>console.error('Falha ao processar prazos:',error));
    hydrateManagerSchedule(_oleiroToday,_oleiroToday).then(()=>{if(state.managerPage==='home')render()}).catch(error=>console.error('Falha ao carregar agenda de hoje:',error));
    hydrateManagerPendingChanges().catch(console.error);
  }catch(error){console.error('Falha ao carregar dados da gestão:',error);showToast('Não foi possível atualizar os dados da gestão.')}
}

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible'||state.role!=='manager')return;
  refreshManagerApplications().catch(console.error);
  hydrateManagerPendingChanges().catch(console.error);
  if(state.managerPage==='home')hydrateManagerSchedule(_oleiroToday,_oleiroToday,{force:true}).then(()=>render()).catch(console.error);
  if(state.managerPage==='agenda')hydrateManagerSchedule(state.agendaFrom||_oleiroToday,state.agendaTo||_oleiroToday,{force:true}).then(()=>render()).catch(console.error);
});

bootManager();
