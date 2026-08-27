/* Round 20 — logout traduzido e card de unidade compacto na Home. */
(function refinementsR20Portal(){
  function lang(){return typeof currentLanguage==='function'?currentLanguage():'pt'}
  function copy(){
    const l=lang();
    if(l==='en')return {title:'Sign out',question:'Do you really want to end your session?',body:'You will need to sign in again with your email and password.',cancel:'Cancel',exit:'Sign out',unit:'Unit',support:'Support'};
    if(l==='es')return {title:'Cerrar sesión',question:'¿Deseas cerrar tu sesión?',body:'Deberás iniciar sesión nuevamente con tu correo electrónico y contraseña.',cancel:'Cancelar',exit:'Cerrar sesión',unit:'Unidad',support:'Soporte'};
    return {title:'Sair do portal',question:'Deseja realmente encerrar sua sessão?',body:'Você precisará entrar novamente com seu email e senha.',cancel:'Cancelar',exit:'Sair',unit:'Unidade',support:'Suporte'};
  }

  window.confirmVolunteerLogout=function(){
    const t=copy();
    openModal(t.title,t.question,`<div class="notice"><i class="fa-solid fa-right-from-bracket"></i><div>${t.body}</div></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">${t.cancel}</button><button class="btn btn-danger" type="button" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i>${t.exit}</button></div>`);
  };

  const baseVolunteerHome=volunteerHome;
  volunteerHome=function(){
    let html=baseVolunteerHome();
    const t=copy();
    html=html.replace(/<small>Unidade<\/small><strong>(.*?)<\/strong><span>Suporte:/,`<strong class="home-unit-label">${t.unit}: $1</strong><span>${t.support}:`);
    return html;
  };

  window.volunteerHome=volunteerHome;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();