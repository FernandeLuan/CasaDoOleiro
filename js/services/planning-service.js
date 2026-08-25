(function initPlanningService(){
  const services=window.OleiroServices=window.OleiroServices||{};

  services.planning={
    async listSessions({applicationId,from,to}={}){
      return services.run(()=>{
        const dev=new URLSearchParams(location.search).get('dev')==='1';
        if(dev){
          const activities=window.state?.activities||[];
          const rows=[];
          activities.forEach(activity=>activity.dates.forEach(date=>{
            if(from&&date<from)return;
            if(to&&date>to)return;
            rows.push({activityId:activity.id,date,time:activity.time,status:window.state?.sessionStatus?.[`${activity.id}-${date}`]||'proposed',groupId:window.state?.sessionGroups?.[`${activity.id}-${date}`]||null,activity});
          }));
          return rows.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
        }
        return services.backendUnavailable();
      });
    }
  };
})();
