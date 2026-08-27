/* Round 13 — Agenda sem paginação visual e estado offline mobile. */
(function round13Portal(){
  /* Paginação visual não reduz leituras: o planejamento já chega carregado. Mantemos a agenda inteira. */
  volunteerAgenda=function(){
    return `<section class="section"><div class="section-head"><div><span class="eyebrow">Estadia confirmada</span><h2>Minha agenda</h2><p>Cronograma operacional atualizado</p></div></div><div>${volunteerAgendaContent(true)}</div></section>`;
  };
  window.volunteerAgenda=volunteerAgenda;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
