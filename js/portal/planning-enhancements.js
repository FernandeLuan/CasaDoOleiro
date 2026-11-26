/* Round 20/28 — acabamento do Portal sem mecanismo paralelo de tradução. */
(function refinementsR20Portal(){
  window.confirmVolunteerLogout=function(){openModal(t('portal.logout.title'),t('portal.logout.question'),`<div class="notice"><i class="fa-solid fa-right-from-bracket"></i><div>${escapeHtml(t('portal.logout.body'))}</div></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">${escapeHtml(t('common.cancel'))}</button><button class="btn btn-danger" type="button" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i>${escapeHtml(t('action.signOut'))}</button></div>`)};

  /* O estado de envio pertence ao renderizador canônico de planejamento.js.
     Este módulo só mantém refinamentos de suporte e atividades criadas pela gestão. */
  if(state.role==='volunteer'&&typeof render==='function')render();
})();