(function initAttentionService(){
  const services=window.OleiroServices=window.OleiroServices||{};

  services.attention={
    async listForAdmin({unit='Rodeio',limit=services.config?.notificationLimit||5}={}){
      return services.run(()=>{
        const dev=new URLSearchParams(location.search).get('dev')==='1';
        if(dev)return (window.state?.notifications||[]).slice(0,limit);
        return services.backendUnavailable();
      });
    },
    async markAdminAttentionRead(id){
      return services.run(()=>{
        const dev=new URLSearchParams(location.search).get('dev')==='1';
        if(dev){window.state.notifications=(window.state.notifications||[]).filter(item=>String(item.id)!==String(id));return true}
        return services.backendUnavailable();
      },{loading:false});
    }
  };
})();
