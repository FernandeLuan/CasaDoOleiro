/* Round 12/28 — estado visual de mudança pendente, sem depender do idioma. */
(function round12Portal(){
  const baseSessionCardVolunteer=sessionCardVolunteer;

  /* A pendência fica somente no botão. Seleção por estrutura/status, não por texto. */
  sessionCardVolunteer=function(s,editable){
    const html=baseSessionCardVolunteer(s,editable);if(state.volunteerMode!=='approved'||s?.status!=='change_requested')return html;
    const root=document.createElement('div');root.innerHTML=html;const card=root.firstElementChild;if(!card)return html;
    card.querySelector('.activity-row > .badge.warning')?.remove();
    const pending=[...card.querySelectorAll('.activity-actions button[disabled]')].find(button=>button.querySelector('.fa-clock'));
    pending?.classList.add('volunteer-change-pending');
    return root.innerHTML;
  };

  window.sessionCardVolunteer=sessionCardVolunteer;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();