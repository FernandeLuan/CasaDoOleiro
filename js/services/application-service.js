(function initApplicationService(){
  const services=window.OleiroServices=window.OleiroServices||{};

  function normalize(value){return String(value||'').trim().toLocaleLowerCase('pt-BR')}

  function devList({status='approved',unit='all',search='',cursor=0,limit=services.config?.candidatePageSize||10}={}){
    const source=Array.isArray(window.state?.candidates)?window.state.candidates:[];
    const term=normalize(search);
    const filtered=source.filter(item=>{
      const byStatus=status==='all'||item.status===status;
      const byUnit=unit==='all'||item.unit===unit||item.unitId===unit;
      const bySearch=!term||normalize(item.name).includes(term);
      return byStatus&&byUnit&&bySearch;
    });
    const start=Number(cursor)||0;
    const items=filtered.slice(start,start+limit);
    return {items,nextCursor:start+items.length<filtered.length?start+items.length:null,hasMore:start+items.length<filtered.length};
  }

  services.applications={
    async list(query={}){
      return services.run(()=>{
        const dev=new URLSearchParams(location.search).get('dev')==='1';
        if(dev)return devList(query);
        return services.backendUnavailable();
      });
    },
    async getById(id){
      return services.run(()=>{
        const dev=new URLSearchParams(location.search).get('dev')==='1';
        if(dev)return window.state?.candidates?.find(item=>String(item.id)===String(id))||null;
        return services.backendUnavailable();
      });
    }
  };
})();
