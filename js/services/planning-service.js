(function initPlanningService(){
  const services=window.OleiroServices=window.OleiroServices||{};

  async function fetchActivitiesByIds(context,ids){
    const {firestore}=context.modules;
    const unique=[...new Set((ids||[]).filter(Boolean).map(String))];
    const rows=await Promise.all(unique.map(async id=>{
      const snap=await firestore.getDoc(firestore.doc(context.db,'activities',id));
      return snap.exists()?{id:snap.id,...snap.data()}:null;
    }));
    return new Map(rows.filter(Boolean).map(row=>[String(row.id),row]));
  }

  services.planning={
    async listSessions({applicationId,from,to}={}){
      if(!applicationId)return [];
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const snapshot=await firestore.getDocs(
          firestore.query(
            firestore.collection(context.db,'activity_sessions'),
            firestore.where('applicationId','==',String(applicationId))
          )
        );
        return snapshot.docs
          .map(doc=>({id:doc.id,...doc.data()}))
          .filter(row=>(!from||row.date>=from)&&(!to||row.date<=to))
          .sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
      });
    },
    async listManagerSchedule({from,to,unitId='all'}={}){
      if(!from||!to)return [];
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const snapshot=await firestore.getDocs(
          firestore.query(
            firestore.collection(context.db,'activity_sessions'),
            firestore.where('date','>=',from),
            firestore.where('date','<=',to),
            firestore.orderBy('date','asc')
          )
        );
        let sessions=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
        if(unitId&&unitId!=='all')sessions=sessions.filter(row=>String(row.unitId||'').toLowerCase()===String(unitId).toLowerCase());
        const missing=sessions.filter(s=>!s.activityName).map(s=>s.activityId);
        const activityMap=missing.length?await fetchActivitiesByIds(context,missing):new Map();
        return sessions.map(session=>{
          const definition=activityMap.get(String(session.activityId))||{};
          return {
            ...session,
            activity:{
              id:session.activityId,
              name:session.activityName||definition.name||'Atividade',
              description:session.activityDescription||definition.description||'',
              duration:Number(session.duration||definition.duration||60),
              participation:session.participation||definition.participation||'Livre',
              materials:session.materials||definition.materials||'',
              notes:session.notes||definition.notes||'',
              period:session.period||definition.period||'Sem preferência',
              time:session.time||definition.time||'',
              owner:session.ownerName||definition.ownerName||'Voluntário',
              applicationId:session.applicationId
            }
          };
        });
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
    async saveActivity({activityId=null,applicationId,unitId,createdByUid,ownerName='',data,dates,existingSessions=[]}){
      if(!applicationId||!createdByUid)throw new Error('Sessão de voluntariado inválida.');
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const activityRef=activityId?firestore.doc(context.db,'activities',String(activityId)):firestore.doc(firestore.collection(context.db,'activities'));
        const batch=firestore.writeBatch(context.db);
        const editableDefinition={
          applicationId:String(applicationId),ownerName:String(ownerName||''),
          name:data.name,description:data.description||'',duration:Number(data.duration)||60,
          participation:data.participation||'Livre',materials:data.materials||'',notes:data.notes||'',
          period:data.period||'Sem preferência',time:data.time||'',updatedAt:firestore.serverTimestamp()
        };
        if(activityId){
          batch.update(activityRef,editableDefinition);
        }else{
          batch.set(activityRef,{...editableDefinition,createdByUid:String(createdByUid),createdAt:firestore.serverTimestamp()});
        }

        const wanted=new Set((dates||[]).map(String));
        const byDate=new Map((existingSessions||[]).filter(s=>String(s.activityId)===activityRef.id).map(s=>[String(s.date),s]));
        const sessionDefinition={
          activityName:data.name,activityDescription:data.description||'',participation:data.participation||'Livre',materials:data.materials||'',notes:data.notes||'',ownerName:String(ownerName||''),
          time:data.time||'',period:data.period||'Sem preferência',duration:Number(data.duration)||60
        };
        for(const [date,session] of byDate){
          const ref=firestore.doc(context.db,'activity_sessions',String(session.id));
          if(!wanted.has(date))batch.delete(ref);else batch.update(ref,{...sessionDefinition,updatedAt:firestore.serverTimestamp()});
        }
        for(const date of wanted){
          if(byDate.has(date))continue;
          const sessionRef=firestore.doc(firestore.collection(context.db,'activity_sessions'));
          batch.set(sessionRef,{
            applicationId:String(applicationId),activityId:activityRef.id,unitId:String(unitId||''),date,
            ...sessionDefinition,status:'proposed',groupId:null,createdByUid:String(createdByUid),
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
