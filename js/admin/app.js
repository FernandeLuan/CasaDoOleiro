function renderManager(){
  const pages={home:managerHome,volunteer:managerVolunteers,agenda:managerAgenda,groups:managerGroups,menu:managerMenu};
  app.innerHTML=header()+`<main class="page">${pages[state.managerPage]()}</main>`;navRoot.innerHTML=managerNav();if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
}
function render(){renderManager()}
async function bootManager(){
  const session=await window.OleiroAuthGuard?.requireRole('manager');if(!session)return;
  state.role='manager';state.currentSession=session;state.managerPage='home';state.groupsLoaded=false;state.groupsLoading=false;state.groupsUnitId=null;state.groupUnitId=state.groupUnitId||'';state.sessions=[];state.managerTodaySessions=[];state.managerTodayLoaded=false;state.managerDashboardLoaded=false;state.pendingChangeRequests=[];state.candidates=[];state.scheduleFrom=null;state.scheduleTo=null;state.dashboardCounts={analysis:0,adjustments:0};state.dashboardArrivals=[];state.dashboardDepartures=[];state.candidateHasMore=false;state.candidateCursor=null;state.candidateLoading=false;
  const restored=restoreManagerBrowserCache();state.managerTodayLoading=!restored.schedule;state.managerDashboardLoading=!restored.dashboard;render();
  try{
    await hydrateManagerBaseData({includeCandidates:false});
  }catch(error){
    console.error('Falha ao carregar a lista principal da gestão:',error);showToast('Não foi possível carregar a lista de voluntários. Tente novamente.');
  }
  if(state.managerPage==='home')render();
  const initial=await Promise.allSettled([
    restored.schedule?Promise.resolve(state.managerTodaySessions):hydrateManagerSchedule(_oleiroToday,_oleiroToday,{force:false}),
    restored.dashboard?Promise.resolve({counts:state.dashboardCounts,arrivals:state.dashboardArrivals,departures:state.dashboardDepartures}):hydrateManagerDashboardData({force:false})
  ]);
  if(initial[0].status==='rejected')console.warn('Agenda de hoje indisponível no carregamento inicial:',initial[0].reason);
  if(initial[1].status==='rejected')console.warn('Resumo do painel indisponível no carregamento inicial:',initial[1].reason);
  state.managerTodayLoading=false;state.managerDashboardLoading=false;
  if(state.managerPage==='home')render();
  scheduleManagerBackgroundWarmup();
}

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible'||state.role!=='manager')return;
  if(state.managerPage==='volunteer')refreshManagerApplications().catch(console.error);
  if(state.managerPage==='home'){hydrateManagerDashboardData({force:false}).catch(console.error);hydrateManagerSchedule(_oleiroToday,_oleiroToday,{force:false}).then(()=>render()).catch(console.error);if(typeof window.hydrateManagerHomeOccupancy==='function')window.hydrateManagerHomeOccupancy({force:false}).catch(console.error)}
  hydrateManagerPendingChanges({force:false}).catch(console.error);
  if(state.managerPage==='agenda')hydrateManagerSchedule(state.agendaFrom||_oleiroToday,state.agendaTo||_oleiroToday,{force:false}).then(()=>render()).catch(console.error);
});

function startManagerBoot(){void bootManager()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startManagerBoot,{once:true});else startManagerBoot();
