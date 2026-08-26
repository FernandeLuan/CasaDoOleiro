/* Round 6 — Portal: navegação limpa, grupos explicados e e-mails neutros no iOS. */
(function round6Portal(){
  const baseVolunteerHome=volunteerHome;
  volunteerHome=function(){
    let html=baseVolunteerHome();
    /* Chegada e saída são dias sem atividade no resumo da Home. */
    const marker='<h2>Minha estadia</h2>',markerIndex=html.indexOf(marker);
    if(markerIndex>=0){
      const token='<span style="font-size:.62rem;color:var(--muted)">',start=html.indexOf(token,markerIndex);
      if(start>=0){const contentStart=start+token.length,end=html.indexOf('</span>',contentStart);if(end>=0)html=html.slice(0,contentStart)+'Dia sem atividade'+html.slice(end)}
    }
    return html;
  };

  const baseVolunteerProfile=volunteerProfile;
  volunteerProfile=function(){return baseVolunteerProfile().replace(/E-mail/g,'Email')};

  /* Ajustes antigos só têm efeito enquanto a candidatura realmente está em ajuste. */
  const baseVolunteerDayAdjustment=volunteerDayAdjustment;
  volunteerDayAdjustment=function(date){
    if(state.volunteerPlanStatus!=='adjustments')return null;
    return baseVolunteerDayAdjustment(date);
  };

  /*
   * Os grupos A/B/C/D/Livre contêm a composição interna da Casa e permanecem sob
   * decisão do gestor. O candidato só precisa saber que a definição ocorre após a análise.
   */
  const baseOpenActivityModal=openActivityModal;
  openActivityModal=function(date=null,id=null){
    const result=baseOpenActivityModal(date,id);
    const form=modalRoot.querySelector('.activity-modal-form');
    if(!form||form.querySelector('.group-definition-note'))return result;
    const rows=form.querySelectorAll('.field-row');
    const anchor=rows[0]||form.children[1]||null;
    const note=document.createElement('div');
    note.className='notice group-definition-note';
    note.innerHTML='<i class="fa-solid fa-people-group"></i><div><strong>Grupo definido pela Casa</strong><br>Os grupos A, B, C, D ou Livre são definidos pela equipe após a análise do planejamento.</div>';
    if(anchor)anchor.insertAdjacentElement('afterend',note);else form.appendChild(note);
    return result;
  };

  if(state.role==='volunteer'&&typeof render==='function')render();
})();
