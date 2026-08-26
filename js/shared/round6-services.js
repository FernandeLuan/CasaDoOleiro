/* Round 6 — camada final do planejamento do candidato com groupPreference. */
(function round6Services(){
  const services=window.OleiroServices=window.OleiroServices||{};
  if(!services.planning)return;

  services.planning.saveActivity=async function({activityId=null,applicationId,unitId,createdByUid,ownerName='',data,dates,existingSessions=[]}){
    if(!applicationId||!createdByUid)throw new Error('Sessão de voluntariado inválida.');
    return services.run(async()=>{
      const context=await services.firebase();const {firestore}=context.modules;
      const activityRef=activityId?firestore.doc(context.db,'activities',String(activityId)):firestore.doc(firestore.collection(context.db,'activities'));
      const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
      const editableDefinition={applicationId:String(applicationId),ownerName:String(ownerName||''),name:data.name,description:data.description||'',duration:Number(data.duration)||60,participation:data.participation||'Livre',groupPreference:data.groupPreference||'A definir',materials:data.materials||'',notes:data.notes||'',period:data.period||'Sem preferência',time:data.time||'',updatedAt:now};
      if(activityId)batch.update(activityRef,editableDefinition);else batch.set(activityRef,{...editableDefinition,createdByUid:String(createdByUid),createdAt:now});

      const wanted=new Set((dates||[]).map(String));
      const byDate=new Map((existingSessions||[]).filter(s=>String(s.activityId)===String(activityRef.id)).map(s=>[String(s.date),s]));
      const sessionDefinition={activityName:data.name,activityDescription:data.description||'',participation:data.participation||'Livre',groupPreference:data.groupPreference||'A definir',materials:data.materials||'',notes:data.notes||'',ownerName:String(ownerName||''),time:data.time||'',period:data.period||'Sem preferência',duration:Number(data.duration)||60};
      const resultSessions=[],deletedSessionIds=[];

      for(const [date,session] of byDate){
        const ref=firestore.doc(context.db,'activity_sessions',String(session.id));
        if(!wanted.has(date)){batch.delete(ref);deletedSessionIds.push(String(session.id));}
        else{batch.update(ref,{...sessionDefinition,updatedAt:now});resultSessions.push({...session,...sessionDefinition,date});}
      }
      for(const date of wanted){
        if(byDate.has(date))continue;
        const sessionRef=firestore.doc(firestore.collection(context.db,'activity_sessions'));
        const row={id:sessionRef.id,applicationId:String(applicationId),activityId:activityRef.id,unitId:String(unitId||''),date,...sessionDefinition,status:'proposed',groupId:null,createdByUid:String(createdByUid)};
        batch.set(sessionRef,{...row,createdAt:now,updatedAt:now});resultSessions.push(row);
      }
      await batch.commit();
      const activity={id:activityRef.id,...editableDefinition,createdByUid:String(createdByUid)};
      return {activityId:activityRef.id,activity,sessions:resultSessions,deletedSessionIds};
    },{loading:false});
  };
})();
