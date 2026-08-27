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

    const template=document.createElement('template');
    template.innerHTML=html;
    const card=template.content.querySelector('.home-unit-support');
    if(card){
      const label=card.querySelector('.home-unit-label')?.textContent?.trim()||`${t.unit}: Rodeio`;
      const support=card.querySelector('.home-unit-copy span:last-child')?.textContent?.trim()||`${t.support}: +55 47 99950-4753`;
      const link=document.createElement('a');
      link.className='card home-unit-support home-unit-support-link';
      link.href='https://wa.me/5547999504753';
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.setAttribute('aria-label',`${t.support} WhatsApp`);
      link.innerHTML=`<span class="home-unit-icon"><i class="fa-brands fa-whatsapp"></i></span><span class="home-unit-link-copy"><strong class="home-unit-label">${escapeHtml(label)}</strong><span>${escapeHtml(support)}</span></span><i class="fa-solid fa-chevron-right home-unit-chevron" aria-hidden="true"></i>`;
      card.replaceWith(link);
      html=template.innerHTML;
    }
    return html;
  };

  window.volunteerHome=volunteerHome;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();