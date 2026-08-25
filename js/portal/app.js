function renderVolunteer(){
  const subtitle='Portal do voluntário • Rodeio';
  const pages={home:volunteerHome,plan:volunteerPlan,agenda:volunteerAgenda,stay:volunteerStay,info:volunteerInfo,menu:volunteerMenu};
  app.innerHTML=header(subtitle,true)+`<main class="page">${pages[state.volunteerPage]()}</main>`+volunteerNav();
}

function render(){renderVolunteer()}
state.role='volunteer';
state.volunteerMode=localStorage.getItem('oleiro-volunteer-mode')||'candidate';
state.volunteerPlanStatus=localStorage.getItem('oleiro-volunteer-plan-status')||state.volunteerPlanStatus||'draft';
state.volunteerPage='home';
render();
