(function initUnitService(){
  const services=window.OleiroServices=window.OleiroServices||{};

  services.units={
    async list({includeInactive=false}={}){
      return services.run(()=>{
        const dev=new URLSearchParams(location.search).get('dev')==='1';
        if(dev){const units=window.state?.units||[];return includeInactive?units:units.filter(unit=>unit.active)}
        return services.backendUnavailable();
      });
    },
    async get(id){
      return services.run(()=>{
        const dev=new URLSearchParams(location.search).get('dev')==='1';
        if(dev)return (window.state?.units||[]).find(unit=>unit.id===id)||null;
        return services.backendUnavailable();
      });
    }
  };
})();
