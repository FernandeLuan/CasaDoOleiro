const _managerScheduleCache=new Map();
const MANAGER_SCHEDULE_CACHE_MS=60000;
function managerScheduleKey(from,to,unit='all'){return `${from}|${to}|${unit}`}
function mapManagerScheduleRows(rows){
  const names=new Map((state.candidates||[]).map(p=>[String(p.id),p.name]));
  return (rows||[]).map(row=>({...row,activity:{...(row.activity||{}),owner:row.activity?.owner&&row.activity.owner!=='Voluntário'?row.activity.owner:(names.get(String(row.applicationId))||'Voluntário')}}));
}
function deriveAdminNotifications(){
  state.notifications=(state.candidates||[]).filter(p=>p.needsAdminAttention===true).sort((a,b)=>String(b.adminAttentionUpdatedAt||b.submitted||'').localeCompare(String(a.adminAttentionUpdatedAt||a.submitted||''))).slice(0,5).map(p=>({id:p.id,applicationId:p.id,title:p.adminAttentionTitle||'Atualização de voluntariado',text:p.adminAttentionText||`${p.name||'Voluntário'} possui uma pendência para análise.`}));
}
function invalidateManagerScheduleCache(){_managerScheduleCache.clear()}
async function hydrateManagerSchedule(from=_oleiroToday,to=_oleiroToday,{force=false,unitId='all'}={}){
  if(!window.OleiroServices?.planning?.listManagerSchedule)return [];
  const key=managerScheduleKey(from,to,unitId),cached=_managerScheduleCache.get(key);
  if(!force&&cached&&Date.now()-cached.at<MANAGER_SCHEDULE_CACHE_MS){state.sessions=cached.rows;state.activities=[];return cached.rows;}
  const rows=mapManagerScheduleRows(await window.OleiroServices.planning.listManagerSchedule({from,to,unitId}));
  _managerScheduleCache.set(key,{at:Date.now(),rows});state.sessions=rows;state.activities=[];return rows;
}
async function hydrateManagerBaseData(){
  const [unitsResult,applicationsResult]=await Promise.all([
    window.OleiroServices?.units?.list?window.OleiroServices.units.list({includeInactive:true}):[],
    window.OleiroServices?.applications?.list?window.OleiroServices.applications.list({status:'all',unit:'all',limit:30}):{items:[]}
  ]);
  state.units=unitsResult||[];state.candidates=applicationsResult?.items||[];deriveAdminNotifications();
}
async function hydrateManagerData(){await hydrateManagerBaseData();return state.candidates}
async function ensureManagerGroups(){
  if(state.groupsLoaded)return state.groups||[];state.groupsLoading=true;
  try{state.groups=window.OleiroServices?.groups?.ensureDefaults?await window.OleiroServices.groups.ensureDefaults('rodeio'):[];state.groupsLoaded=true;return state.groups;}finally{state.groupsLoading=false}
}
function renderManager(){
  const pages={home:managerHome,volunteer:managerVolunteers,agenda:managerAgenda,groups:managerGroups,menu:managerMenu};
  app.innerHTML=header('Gestão de voluntariado',true)+`<main class="page">${pages[state.managerPage]()}</main>`;navRoot.innerHTML=managerNav();if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
}
function render(){renderManager()}
async function bootManager(){
  const session=await window.OleiroAuthGuard?.requireRole('manager');if(!session)return;
  state.role='manager';state.currentSession=session;state.managerPage='home';state.groupsLoaded=false;state.groupsLoading=false;state.sessions=[];render();
  try{
    await hydrateManagerBaseData();if(state.managerPage==='home')render();
    processExpiredCandidatesOnStartup?.().then(()=>{deriveAdminNotifications();if(state.managerPage==='home'||state.managerPage==='volunteer')render()}).catch(error=>console.error('Falha ao processar prazos:',error));
    hydrateManagerSchedule(_oleiroToday,_oleiroToday).then(()=>{if(state.managerPage==='home')render()}).catch(error=>console.error('Falha ao carregar agenda de hoje:',error));
  }catch(error){console.error('Falha ao carregar dados da gestão:',error);showToast('Não foi possível atualizar os dados da gestão.')}
}
bootManager();
