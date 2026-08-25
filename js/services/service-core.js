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

  function backendUnavailable(){
    throw new Error('Backend ainda não configurado. Use ?dev=1 para a massa de regressão.');
  }

  window.OleiroServices=window.OleiroServices||{};
  Object.assign(window.OleiroServices,{config,run,backendUnavailable});
})();
