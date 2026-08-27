/* Round 12 — estados de mudança mais claros no Portal. */
(function round12Portal(){
  const baseVolunteerAgendaContent=volunteerAgendaContent;
  const baseSessionCardVolunteer=sessionCardVolunteer;

  /* A paginação client-side foi removida: ela não reduzia leituras do Firestore,
     pois os dados já estavam carregados antes de paginar. */
  volunteerAgenda=function(){
    return `<section class="section"><div class="section-head"><div><span class="eyebrow">Estadia confirmada</span><h2>Minha agenda</h2><p>Cronograma operacional atualizado</p></div></div><div>${baseVolunteerAgendaContent(true)}</div></section>`;
  };

  /* No Portal, a pendência fica somente no botão em marca-d'água amarelo. */
  sessionCardVolunteer=function(s,editable){
    let html=baseSessionCardVolunteer(s,editable);
    if(state.volunteerMode==='approved'&&s?.status==='change_requested'){
      html=html.replace(/<span class="badge warning">Mudança solicitada<\/span>/g,'');
      html=html.replace('class="btn btn-soft" type="button" disabled><i class="fa-solid fa-clock"></i>Mudança solicitada','class="btn btn-soft volunteer-change-pending" type="button" disabled><i class="fa-solid fa-clock"></i>Mudança solicitada');
    }
    return html;
  };

  window.volunteerAgenda=volunteerAgenda;
  window.sessionCardVolunteer=sessionCardVolunteer;

  if(state.role==='volunteer'&&typeof render==='function')render();
})();
