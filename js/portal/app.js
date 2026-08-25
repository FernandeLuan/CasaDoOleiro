function renderVolunteer(){
  const subtitle=state.volunteerMode==='candidate'?'Portal do candidato • Rodeio':'Portal do voluntário • Rodeio';
  const pages={home:volunteerHome,plan:volunteerPlan,agenda:volunteerAgenda,stay:volunteerStay,info:volunteerInfo,menu:volunteerMenu};
  app.innerHTML=header(subtitle,true)+`<main class="page">${pages[state.volunteerPage]()}</main>`+volunteerNav();
}

function render(){renderVolunteer()}
state.role='volunteer';
state.volunteerMode=localStorage.getItem('oleiro-volunteer-mode')||'candidate';
state.volunteerPage='home';
render();
