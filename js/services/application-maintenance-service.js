(function initApplicationMaintenanceService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  services.applications=services.applications||{};
  services.applications.processExpiredPending=async function({pageSize=50,unit='all'}={}){
    return services.run(async()=>{
      const context=await services.firebase();const {firestore}=context.modules;let total=0;
      const max=Math.max(1,Math.min(Number(pageSize)||50,100));
      for(let page=0;page<20;page++){
        const started=Date.now();
        const normalizedUnit=unit&&unit!=='all'?String(unit).toLowerCase():'',constraints=[firestore.where('status','==','pending')];
        if(normalizedUnit)constraints.push(firestore.where('unitId','==',normalizedUnit));
        constraints.push(firestore.where('planningDeadlineAt','<=',firestore.Timestamp.fromDate(new Date())),firestore.orderBy('planningDeadlineAt','asc'),firestore.limit(max));
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications'),...constraints));
        services.recordQuery?.('applications/expired-pending',started,snapshot.size,{page:page+1,limit:max,unit:normalizedUnit||'all'});
        if(snapshot.empty)break;
        for(const applicationDoc of snapshot.docs){
          const data=applicationDoc.data()||{},uids=[...new Set((data.participantUids||[]).map(String).filter(Boolean))],batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
          batch.update(applicationDoc.ref,{status:'rejected',active:false,planningDeadlineAt:null,rejectedReason:'Prazo de 7 dias para envio do planejamento expirado.',rejectedAt:now,autoRejected:true,needsAdminAttention:false,updatedAt:now});
          uids.forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:false,updatedAt:now}));
          await batch.commit();total+=1;
        }
        if(snapshot.size<max)break;
      }
      return total;
    },{loading:false});
  };
})();
