function renderVolunteer(){
  const pages={home:typeof volunteerHome==='function'?volunteerHome:null,plan:typeof volunteerPlan==='function'?volunteerPlan:null,agenda:typeof volunteerAgenda==='function'?volunteerAgenda:null,stay:typeof volunteerStay==='function'?volunteerStay:null,info:typeof volunteerInfo==='function'?volunteerInfo:null,menu:typeof volunteerMenu==='function'?volunteerMenu:null};
  const pageFn=pages[state.volunteerPage]||pages.home;let content='';
  try{if(typeof pageFn!=='function')throw new Error('Módulo do portal indisponível.');content=pageFn()}catch(error){console.error('Erro ao renderizar portal:',error);content=`<section class="section"><div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Não foi possível abrir esta tela.</strong><br>Atualize a página. Se o problema continuar, volte ao início.</div></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="navigateVolunteer('home')">Voltar ao início</button></section>`}
  app.innerHTML=header('',true)+`<main class="page">${content}</main>`+volunteerNav();if(typeof applyI18n==='function')applyI18n(app);
}
function render(){renderVolunteer()}
state.role='volunteer';
state.volunteerMode=sessionStorage.getItem('oleiro-volunteer-mode')||'candidate';
state.volunteerPlanStatus=sessionStorage.getItem('oleiro-volunteer-plan-status')||state.volunteerPlanStatus||'draft';
state.volunteerPage='home';
render();
