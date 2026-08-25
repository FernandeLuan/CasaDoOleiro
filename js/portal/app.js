function renderVolunteer(){
  const subtitle='Portal do voluntário • Rodeio';
  const pages={
    home:window.volunteerHome,
    plan:window.volunteerPlan,
    agenda:window.volunteerAgenda,
    stay:window.volunteerStay,
    info:window.volunteerInfo,
    menu:window.volunteerMenu
  };
  const pageFn=pages[state.volunteerPage]||pages.home;
  let content='';
  try{
    if(typeof pageFn!=='function')throw new Error('Módulo do portal indisponível.');
    content=pageFn();
  }catch(error){
    console.error('Erro ao renderizar portal:',error);
    content=`<section class="section"><div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Não foi possível abrir esta tela.</strong><br>Atualize a página. Se o problema continuar, volte ao início.</div></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="state.volunteerPage='home';render()">Voltar ao início</button></section>`;
  }
  app.innerHTML=header(subtitle,true)+`<main class="page">${content}</main>`+volunteerNav();
  if(typeof applyI18n==='function')applyI18n(app);
}

function render(){renderVolunteer()}
state.role='volunteer';
state.volunteerMode=localStorage.getItem('oleiro-volunteer-mode')||'candidate';
state.volunteerPlanStatus=localStorage.getItem('oleiro-volunteer-plan-status')||state.volunteerPlanStatus||'draft';
state.volunteerPage='home';
render();