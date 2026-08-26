(function initPlanningService(){
  const services=window.OleiroServices=window.OleiroServices||{};

  services.planning={
    async listSessions({applicationId,from,to}={}){
      if(!applicationId)return [];
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const constraints=[firestore.where('applicationId','==',String(applicationId))];
        if(from)constraints.push(firestore.where('date','>=',from));
        if(to)constraints.push(firestore.where('date','<=',to));
        constraints.push(firestore.orderBy('date','asc'));
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),...constraints));
        return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
      });
    },
    async listActivities(applicationId){
      if(!applicationId)return [];
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'activities'),firestore.where('applicationId','==',String(applicationId))));
        return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
      });
    },
    async saveActivity({activityId=null,applicationId,unitId,createdByUid,data,dates,existingSessions=[]}){
      if(!applicationId||!createdByUid)throw new Error('Sessão de voluntariado inválida.');
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const activityRef=activityId
          ?firestore.doc(context.db,'activities',String(activityId))
          :firestore.doc(firestore.collection(context.db,'activities'));
        const batch=firestore.writeBatch(context.db);
        const definition={
          applicationId:String(applicationId),createdByUid:String(createdByUid),
          name:data.name,description:data.description||'',duration:Number(data.duration)||60,
          participation:data.participation||'Livre',materials:data.materials||'',notes:data.notes||'',
          period:data.period||'Sem preferência',time:data.time||'',updatedAt:firestore.serverTimestamp()
        };
        if(activityId)batch.update(activityRef,definition);
        else batch.set(activityRef,{...definition,createdAt:firestore.serverTimestamp()});

        const wanted=new Set((dates||[]).map(String));
        const byDate=new Map((existingSessions||[]).filter(s=>String(s.activityId)===activityRef.id).map(s=>[String(s.date),s]));
        for(const [date,session] of byDate){
          const ref=firestore.doc(context.db,'activity_sessions',String(session.id));
          if(!wanted.has(date))batch.delete(ref);
          else batch.update(ref,{time:data.time||'',period:data.period||'Sem preferência',duration:Number(data.duration)||60,updatedAt:firestore.serverTimestamp()});
        }
        for(const date of wanted){
          if(byDate.has(date))continue;
          const sessionRef=firestore.doc(firestore.collection(context.db,'activity_sessions'));
          batch.set(sessionRef,{
            applicationId:String(applicationId),activityId:activityRef.id,unitId:String(unitId||''),
            date,time:data.time||'',period:data.period||'Sem preferência',duration:Number(data.duration)||60,
            status:'proposed',groupId:null,createdByUid:String(createdByUid),
            createdAt:firestore.serverTimestamp(),updatedAt:firestore.serverTimestamp()
          });
        }
        await batch.commit();
        return activityRef.id;
      });
    },
    async updateSession(sessionId,patch){
      if(!sessionId)throw new Error('Sessão não encontrada.');
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        await firestore.updateDoc(firestore.doc(context.db,'activity_sessions',String(sessionId)),{...patch,updatedAt:firestore.serverTimestamp()});
        return true;
      });
    }
  };
})();
