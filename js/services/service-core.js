(function initOleiroServiceCore(){
  const config=Object.freeze({
    candidatePageSize:10,
    notificationLimit:5,
    loadingDelayMs:600
  });
  const pendingDocuments=new WeakMap();

  // Share only outstanding reads. Completed results are never retained here.
  function readDocument(context,collection,id,name){
    const user=context.auth?.currentUser||null;
    let scope=pendingDocuments.get(context.db);
    if(!scope||scope.user!==user){scope={user,reads:new Map()};pendingDocuments.set(context.db,scope)}
    const key=JSON.stringify([collection,String(id)]);
    if(scope.reads.has(key))return scope.reads.get(key);
    const {firestore}=context.modules,started=Date.now();
    const task=Promise.resolve().then(()=>firestore.getDoc(firestore.doc(context.db,collection,String(id)))).then(snapshot=>{
      recordQuery(name,started,snapshot.exists()?1:0,{pointReads:1,fromCache:snapshot.metadata?.fromCache===true});
      return snapshot;
    }).finally(()=>{if(scope.reads.get(key)===task)scope.reads.delete(key)});
    scope.reads.set(key,task);
    return task;
  }

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
  Object.assign(window.OleiroServices,{config,run,firebase,recordQuery,readDocument});
})();
