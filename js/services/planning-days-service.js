/* Round 17 — primeira carga do voluntário aprovado alinhada às páginas de 10 dias úteis. */
(function planningDaysR17Service(){
  const services=window.OleiroServices=window.OleiroServices||{};
  const baseList=services.planning?.listSessions?.bind(services.planning);
  if(!baseList)return;

  services.planning.listSessions=async function(args={}){
    const applicationId=args?.applicationId;
    if(applicationId&&!args.from&&!args.to&&window.state?.role==='volunteer'&&window.state?.volunteerMode==='approved'&&typeof planningEligibleDatesFor==='function'){
      const dates=planningEligibleDatesFor(window.state.currentApplication||{});
      if(!dates.length)return [];
      const today=typeof _oleiroToday==='string'?_oleiroToday:new Date().toISOString().slice(0,10);
      let targetIndex=dates.findIndex(date=>date>=today);if(targetIndex<0)targetIndex=dates.length-1;
      const page=Math.floor(targetIndex/10),pageDates=dates.slice(page*10,page*10+10);
      window.state.volunteerAgendaPageIndex=page;
      return baseList({...args,from:pageDates[0],to:pageDates[pageDates.length-1]});
    }
    return baseList(args);
  };
})();
