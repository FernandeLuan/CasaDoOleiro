(function initOleiroServiceCore(){
  const config=Object.freeze({
    candidatePageSize:10,
    notificationLimit:5,
    loadingDelayMs:600
  });

  async function run(task,{loading=true,delay=config.loadingDelayMs,monitor=null}={}){
    const execute=()=>Promise.resolve().then(()=>typeof task==='function'?task():task).catch(error=>{
      window.OleiroMonitoring?.captureServiceError?.(error,monitor||{area:'service',action:'firebase_operation'});
      throw error;
    });
    if(loading&&window.OleiroLoading?.run)return window.OleiroLoading.run(execute,delay);
    return execute();
  }

  async function firebase(){
    if(!window.OleiroFirebase)throw new Error('Backend indisponível.');
    const context=await window.OleiroFirebase.ready;
    if(!context?.configured)throw new Error('Firebase não configurado.');
    return context;
  }

  function recordQuery(name,started,count,meta={}){
    const row={name:String(name||'firestore/query'),ms:Math.max(0,Date.now()-Number(started||Date.now())),count:Number(count)||0,...meta,coldStart:typeof performance!=='undefined'&&performance.now()<10000,at:new Date().toISOString()};
    window.OleiroQueryMetrics=window.OleiroQueryMetrics||[];
    window.OleiroQueryMetrics.push(row);
    if(window.OleiroQueryMetrics.length>80)window.OleiroQueryMetrics.splice(0,window.OleiroQueryMetrics.length-80);
    if(row.ms>1200){console.warn(`[Firestore lento] ${row.name}: ${row.ms}ms • ${row.count} docs`,meta);window.OleiroMonitoring?.captureSlowQuery?.(row)}
    return row;
  }

  window.OleiroServices=window.OleiroServices||{};
  Object.assign(window.OleiroServices,{config,run,firebase,recordQuery});
})();
