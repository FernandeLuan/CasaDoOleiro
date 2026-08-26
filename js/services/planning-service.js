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
    }
  };
})();
