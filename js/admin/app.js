function renderManager(){
  const pages={home:managerHome,volunteer:managerVolunteers,agenda:managerAgenda,groups:managerGroups,menu:managerMenu};
  app.innerHTML=header('Gestão de voluntariado • Rodeio',true)+`<main class="page">${pages[state.managerPage]()}</main>`;
  navRoot.innerHTML=managerNav();
  if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
}

function render(){renderManager()}
async function bootManager(){
  const session=window.OleiroAuthGuard?await window.OleiroAuthGuard.requireRole('manager'):{role:'manager',dev:true};
  if(!session)return;
  state.role='manager';
  state.managerPage='home';
  render();
}
bootManager();