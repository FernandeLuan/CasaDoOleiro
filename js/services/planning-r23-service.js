/* Round 23 — leitura pontual de uma sessão após writes locais. */
(function planningR23Service(){
  const services=window.OleiroServices=window.OleiroServices||{};
  if(!services.planning)return;

  function metric(name,started,count,meta={}){
    const row={name,ms:Date.now()-started,count:Number(count)||0,...meta,at:new Date().toISOString()};
    window.OleiroQueryMetrics=window.OleiroQueryMetrics||[];
    window.OleiroQueryMetrics.push(row);
    if(window.OleiroQueryMetrics.length>40)window.OleiroQueryMetrics.splice(0,window.OleiroQueryMetrics.length-40);
    if(row.ms>1200)console.warn(`[Firestore lento] ${name}: ${row.ms}ms • ${row.count} docs`,meta);
  }

  services.planning.getSessionById=async function(sessionId){
    if(!sessionId)return null;
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,started=Date.now();
      const snapshot=await firestore.getDoc(firestore.doc(context.db,'activity_sessions',String(sessionId)));
      metric('activity_sessions/by-id',started,snapshot.exists()?1:0,{sessionId:String(sessionId)});
      return snapshot.exists()?{id:snapshot.id,...snapshot.data()}:null;
    },{loading:false});
  };
})();