const _oleiroVolunteerHomeBase=volunteerHome;
volunteerHome=function(){
  let html=_oleiroVolunteerHomeBase();
  html=html.replace(/onclick="state\.volunteerPage='info';render\(\)"/g,`onclick="navigateVolunteer('info')"`);
  if(state.volunteerMode==='approved'){
    const marker='<section class="section"><div class="section-head"><div><h2>Informações importantes</h2>';
    const idx=html.indexOf(marker);
    if(idx>=0)html=html.slice(0,idx);
  }
  return html;
};

volunteerMenu=function(){
  return `<section class="section"><div class="section-head"><div><span class="eyebrow">Portal</span><h2>Menu</h2><p>Conta e preferências</p></div></div><div class="menu-list">
    ${menuLink('fa-language','Idioma','Português, English ou Español',"openLanguageModal()")}
    ${menuLink('fa-user','Perfil do voluntário','Dados pessoais e do acesso',"openVolunteerProfile()")}
    ${menuLink('fa-arrows-rotate','Trocar modo do protótipo','Alternar em processo / aprovado',"state.volunteerMode=state.volunteerMode==='candidate'?'approved':'candidate';localStorage.setItem('oleiro-volunteer-mode',state.volunteerMode);render();scrollPageTop()")}
    ${menuLink('fa-right-from-bracket','Sair','Encerrar sessão','logout()')}
  </div></section>`;
};
