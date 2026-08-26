function renderManager(){
  const pages={home:managerHome,volunteer:managerVolunteers,agenda:managerAgenda,groups:managerGroups,menu:managerMenu};
  app.innerHTML=header('Gestão de voluntariado',true)+`<main class="page">${pages[state.managerPage]()}</main>`;
  navRoot.innerHTML=managerNav();
  if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
}

function render(){renderManager()}
async function hydrateManagerSchedule(from=_oleiroToday,to=_oleiroToday){
  if(!window.OleiroServices?.planning?.listManagerSchedule)return;
  const rows=await window.OleiroServices.planning.listManagerSchedule({from,to,unitId:'all'});
  const names=new Map((state.candidates||[]).map(p=>[String(p.id),p.name]));
  state.sessions=(rows||[]).map(row=>({...row,activity:{...(row.activity||{}),owner:row.activity?.owner&&row.activity.owner!=='Voluntário'?row.activity.owner:(names.get(String(row.applicationId))||'Voluntário')}}));
  state.activities=[];
}
async function hydrateManagerData(){
  const [unitsResult,applicationsResult,attentionResult]=await Promise.all([
    window.OleiroServices?.units?.list?window.OleiroServices.units.list({includeInactive:true}):[],
    window.OleiroServices?.applications?.list?window.OleiroServices.applications.list({status:'all',unit:'all',limit:30}):{items:[]},
    window.OleiroServices?.attention?.listForAdmin?window.OleiroServices.attention.listForAdmin({unit:'all',limit:5}):[]
  ]);
  state.units=unitsResult||[];
  state.candidates=applicationsResult?.items||[];
  state.notifications=attentionResult||[];
  if(window.OleiroServices?.groups?.ensureDefaults)state.groups=await window.OleiroServices.groups.ensureDefaults('rodeio');
  await hydrateManagerSchedule(_oleiroToday,_oleiroToday);
  if(typeof processExpiredCandidatesOnStartup==='function')await processExpiredCandidatesOnStartup();
}
async function bootManager(){
  const session=await window.OleiroAuthGuard?.requireRole('manager');
  if(!session)return;
  state.role='manager';state.currentSession=session;state.managerPage='home';
  try{await hydrateManagerData()}catch(error){console.error('Falha ao carregar dados da gestão:',error)}
  render();
}
bootManager();
