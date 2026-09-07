/* Round 17 — Admin remove fins de semana da agenda e dias não elegíveis do planejamento individual. */
(function planningDaysR17Admin(){
  const baseCandidatePlanningDays=candidatePlanningDays;
  const baseAgendaRangeDates=agendaRangeDates;
  const baseRenderDays=renderDays;
  const baseShiftAgendaRange=shiftAgendaRange;

  candidatePlanningDays=function(p){
    const start=p?.stayStart||p?.from||'',end=p?.stayEnd||p?.to||'';
    return baseCandidatePlanningDays(p).filter(day=>typeof isPlanningEligibleDate!=='function'||isPlanningEligibleDate(day.date,start,end));
  };

  agendaRangeDates=function(){
    const rows=baseAgendaRangeDates();return typeof isPlanningWeekday==='function'?rows.filter(isPlanningWeekday):rows;
  };

  renderDays=function(manager=false,dates=null){
    const source=dates||agendaRangeDates(),rows=typeof isPlanningWeekday==='function'?source.filter(isPlanningWeekday):source;
    if(!rows.length)return '<div class="empty"><i class="fa-regular fa-calendar-check"></i>Não há dias de atividade neste período.</div>';
    return baseRenderDays(manager,rows);
  };

  shiftAgendaRange=async function(direction){
    ensureAgendaRange();
    if(agendaRangeCount()===1&&typeof nextPlanningWeekday==='function'){
      const next=nextPlanningWeekday(state.agendaFrom,direction);state.agendaFrom=next;state.agendaTo=next;state.agendaAnchor=next;state.selectedDate=next;await reloadManagerAgenda();return;
    }
    return baseShiftAgendaRange(direction);
  };

  window.candidatePlanningDays=candidatePlanningDays;window.agendaRangeDates=agendaRangeDates;window.renderDays=renderDays;window.shiftAgendaRange=shiftAgendaRange;
  if(state.role==='manager'&&typeof render==='function')render();
})();
