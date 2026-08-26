function renderManager(){
  const pages={home:managerHome,volunteer:managerVolunteers,agenda:managerAgenda,groups:managerGroups,menu:managerMenu};
  app.innerHTML=header('Gestão de voluntariado • Rodeio',true)+`<main class="page">${pages[state.managerPage]()}</main>`;
  navRoot.innerHTML=managerNav();
  if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
}

function render(){renderManager()}
async function hydrateManagerData(){
  const tasks=[];
  if(window.OleiroServices?.units?.list)tasks.push(window.OleiroServices.units.list({includeInactive:true}).then(items=>{state.units=items}));
  if(window.OleiroServices?.applications?.list)tasks.push(window.OleiroServices.applications.list({status:'all',unit:'all',limit:30}).then(result=>{state.candidates=result.items||[]}));
  if(window.OleiroServices?.attention?.listForAdmin)tasks.push(window.OleiroServices.attention.listForAdmin({unit:'all',limit:5}).then(items=>{state.notifications=items||[]}));
  if(tasks.length)await Promise.all(tasks);
  if(typeof processExpiredCandidatesOnStartup==='function')await processExpiredCandidatesOnStartup();
}
async function bootManager(){
  const session=await window.OleiroAuthGuard?.requireRole('manager');
  if(!session)return;
  state.role='manager';
  state.currentSession=session;
  state.managerPage='home';
  try{await hydrateManagerData()}catch(error){console.error('Falha ao carregar dados da gestão:',error)}
  render();
}
bootManager();
