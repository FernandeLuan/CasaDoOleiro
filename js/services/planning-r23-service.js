/* Round 23/25 — sincronização pontual e exclusão segura sem consultas amplas. */
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

  /*
   * Exclusão Round 25:
   * - o Portal pode informar quantas ocorrências da atividade já estão carregadas, evitando qualquer read;
   * - sem essa informação, a verificação é limitada à candidatura + atividade e no máximo 2 documentos;
   * - nunca consulta todas as sessões nem filtra no cliente.
   */
  services.planning.deleteSession=async function(sessionId,{applicationId,activityId,knownCounts=null,updateApplicationCounts=false,planningStatePatch=null,resetPlanningWhenEmpty=false,knownActivityOccurrences=null}={}){
    if(!sessionId||!applicationId)throw new Error('Sessão não encontrada.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,appId=String(applicationId),actId=String(activityId||'');
      let deletedActivity=false;

      if(actId){
        const supplied=knownActivityOccurrences!==null&&knownActivityOccurrences!==undefined?Number(knownActivityOccurrences):NaN;
        if(Number.isFinite(supplied)&&supplied>=1){
          deletedActivity=supplied<=1;
        }else{
          const started=Date.now();
          const occurrenceSnapshot=await firestore.getDocs(firestore.query(
            firestore.collection(context.db,'activity_sessions'),
            firestore.where('applicationId','==',appId),
            firestore.where('activityId','==',actId),
            firestore.limit(2)
          ));
          metric('activity_sessions/activity-delete-check',started,occurrenceSnapshot.size,{applicationId:appId,activityId:actId,limit:2});
          deletedActivity=!occurrenceSnapshot.docs.some(doc=>String(doc.id)!==String(sessionId));
        }
      }

      let nextSessionCount=null,nextActivityCount=null;
      if(updateApplicationCounts){
        const knownSession=Number(knownCounts?.sessionCount),knownActivity=Number(knownCounts?.activityCount),authoritative=knownCounts?.authoritative===true;
        if(authoritative&&Number.isFinite(knownSession)&&Number.isFinite(knownActivity)){
          nextSessionCount=Math.max(0,knownSession-1);
          nextActivityCount=Math.max(0,knownActivity-(deletedActivity?1:0));
        }else{
          if(typeof firestore.getCountFromServer!=='function')throw new Error('Contagem segura do Firestore indisponível. Exclusão cancelada para evitar leitura ampla.');
          const started=Date.now();
          const [sessionCountSnapshot,activityCountSnapshot]=await Promise.all([
            firestore.getCountFromServer(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('applicationId','==',appId))),
            firestore.getCountFromServer(firestore.query(firestore.collection(context.db,'activities'),firestore.where('applicationId','==',appId)))
          ]);
          nextSessionCount=Math.max(0,(Number(sessionCountSnapshot.data().count)||0)-1);
          nextActivityCount=Math.max(0,(Number(activityCountSnapshot.data().count)||0)-(deletedActivity?1:0));
          metric('planning/delete-counts',started,2,{applicationId:appId,aggregations:2});
        }
      }

      const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
      batch.delete(firestore.doc(context.db,'activity_sessions',String(sessionId)));
      if(deletedActivity&&actId)batch.delete(firestore.doc(context.db,'activities',actId));

      let effectivePlanningPatch=planningStatePatch?{...planningStatePatch}:null,resetPlanning=false;
      if(resetPlanningWhenEmpty&&updateApplicationCounts&&nextSessionCount===0){
        effectivePlanningPatch={status:'pending',planningSubmittedAt:null,dayAdjustments:{}};
        resetPlanning=true;
      }
      const applicationPatch={...(effectivePlanningPatch||{}),updatedAt:now};
      if(updateApplicationCounts){
        applicationPatch.sessionCount=nextSessionCount;
        applicationPatch.activityCount=nextActivityCount;
        applicationPatch.planningCountVersion=1;
      }
      if(Object.keys(applicationPatch).length>1||updateApplicationCounts){
        batch.update(firestore.doc(context.db,'applications',appId),applicationPatch);
      }

      await batch.commit();
      return {deletedActivity,sessionCount:nextSessionCount,activityCount:nextActivityCount,planningStatePatch:effectivePlanningPatch,resetPlanning};
    },{loading:false});
  };
})();