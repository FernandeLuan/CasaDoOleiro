(function initOleiroServiceCore(){
  const config=Object.freeze({
    candidatePageSize:10,
    notificationLimit:5,
    loadingDelayMs:600
  });

  async function run(task,{loading=true,delay=config.loadingDelayMs}={}){
    const execute=()=>Promise.resolve().then(()=>typeof task==='function'?task():task);
    if(loading&&window.OleiroLoading?.run)return window.OleiroLoading.run(execute,delay);
    return execute();
  }

  async function firebase(){
    if(!window.OleiroFirebase)throw new Error('Backend indisponível.');
    const context=await window.OleiroFirebase.ready;
    if(!context?.configured)throw new Error('Firebase não configurado.');
    return context;
  }

  window.OleiroServices=window.OleiroServices||{};
  Object.assign(window.OleiroServices,{config,run,firebase});
})();
