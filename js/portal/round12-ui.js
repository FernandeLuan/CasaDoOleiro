/* Round 12/28 — estados de mudança claros sem depender do texto renderizado. */
(function round12Portal(){
  const baseVolunteerAgendaContent=volunteerAgendaContent;
  const baseSessionCardVolunteer=sessionCardVolunteer;

  volunteerAgenda=function(){
    return `<section class="section"><div class="section-head"><div><span class="eyebrow">${escapeHtml(t('portal.agenda.eyebrow'))}</span><h2>${escapeHtml(t('portal.agenda.title'))}</h2><p>${escapeHtml(t('portal.agenda.subtitle'))}</p></div></div><div>${baseVolunteerAgendaContent(true)}</div></section>`;
  };

  /* A pendência fica somente no botão. Seleção por estrutura/status, não por idioma. */
  sessionCardVolunteer=function(s,editable){
    const html=baseSessionCardVolunteer(s,editable);if(state.volunteerMode!=='approved'||s?.status!=='change_requested')return html;
    const root=document.createElement('div');root.innerHTML=html;const card=root.firstElementChild;if(!card)return html;
    card.querySelector('.activity-row > .badge.warning')?.remove();
    const pending=[...card.querySelectorAll('.activity-actions button[disabled]')].find(button=>button.querySelector('.fa-clock'));
    pending?.classList.add('volunteer-change-pending');
    return root.innerHTML;
  };

  window.volunteerAgenda=volunteerAgenda;
  window.sessionCardVolunteer=sessionCardVolunteer;

  if(state.role==='volunteer'&&typeof render==='function')render();
})();