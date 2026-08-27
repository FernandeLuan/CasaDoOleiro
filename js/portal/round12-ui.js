/* Round 12 — Agenda paginada e estados de mudança mais claros no Portal. */
(function round12Portal(){
  const AGENDA_PAGE_SIZE=5;
  const baseVolunteerAgendaContent=volunteerAgendaContent;
  const baseSessionCardVolunteer=sessionCardVolunteer;

  state.volunteerAgendaPage=Number.isInteger(state.volunteerAgendaPage)?state.volunteerAgendaPage:0;

  function paginatedVolunteerAgendaContent(){
    const source=baseVolunteerAgendaContent(true);
    const template=document.createElement('template');
    template.innerHTML=source;
    const strip=template.content.querySelector('.calendar-strip');
    const daysRoot=template.content.querySelector('.volunteer-plan-days');
    if(!daysRoot)return source;

    const days=[...daysRoot.children].filter(node=>node.classList?.contains('day-block'));
    const chips=strip?[...strip.children]:[];
    const total=days.length;
    const pages=Math.max(1,Math.ceil(total/AGENDA_PAGE_SIZE));
    state.volunteerAgendaPage=Math.max(0,Math.min(state.volunteerAgendaPage,pages-1));
    const start=state.volunteerAgendaPage*AGENDA_PAGE_SIZE;
    const end=Math.min(total,start+AGENDA_PAGE_SIZE);
    const visibleDays=days.slice(start,end).map(node=>node.outerHTML).join('');
    const visibleChips=chips.slice(start,end).map(node=>node.outerHTML).join('');
    const pagination=pages>1?`<div class="volunteer-agenda-pagination"><button class="icon-btn" type="button" ${state.volunteerAgendaPage===0?'disabled':''} onclick="changeVolunteerAgendaPage(-1)" aria-label="Página anterior"><i class="fa-solid fa-chevron-left"></i></button><span>${start+1}–${end} de ${total}</span><button class="icon-btn" type="button" ${state.volunteerAgendaPage>=pages-1?'disabled':''} onclick="changeVolunteerAgendaPage(1)" aria-label="Próxima página"><i class="fa-solid fa-chevron-right"></i></button></div>`:'';
    return `${strip?`<div class="calendar-strip">${visibleChips}</div>`:''}<div class="volunteer-plan-days">${visibleDays||'<div class="empty">Nenhum registro nesta página.</div>'}</div>${pagination}`;
  }

  window.changeVolunteerAgendaPage=function(delta){
    state.volunteerAgendaPage=Math.max(0,(state.volunteerAgendaPage||0)+Number(delta||0));
    render();
    if(typeof scrollPageTop==='function')scrollPageTop();
  };

  /* O aviso geral sobre nova confirmação foi removido; a própria tarefa informa quando há pendência. */
  volunteerAgenda=function(){
    return `<section class="section"><div class="section-head"><div><span class="eyebrow">Estadia confirmada</span><h2>Minha agenda</h2><p>Cronograma operacional atualizado</p></div></div><div>${paginatedVolunteerAgendaContent()}</div></section>`;
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
