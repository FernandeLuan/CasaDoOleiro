(function initApplicationMaintenanceService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  services.applications=services.applications||{};
  services.applications.processExpiredPending=async function({pageSize=50}={}){
    const access=services.accessScope;
    if(!access||(!access.isAdmin?.()&&!access.isCoordinator?.()))return 0;
    return services.run(async()=>{
      const context=await services.firebase();const {firestore}=context.modules;let total=0;
      const max=Math.max(1,Math.min(Number(pageSize)||50,100));
      for(let page=0;page<20;page++){
        const started=Date.now();
        const constraints=[firestore.where('status','==','pending'),firestore.where('planningDeadlineAt','<=',firestore.Timestamp.fromDate(new Date()))];
        const applyScope=services.accessScope?.applyUnitFilter;
        if(applyScope&&!applyScope(firestore,constraints,'all'))return total;
        constraints.push(firestore.orderBy('planningDeadlineAt','asc'),firestore.limit(max));
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications'),...constraints));
        services.recordQuery?.('applications/expired-pending',started,snapshot.size,{page:page+1,limit:max});
        if(snapshot.empty)break;
        const mutations=[],now=firestore.serverTimestamp(),allowedUnitIds=access.unitIds?.();
        for(const applicationDoc of snapshot.docs){
          const data=applicationDoc.data()||{},uids=[...new Set((data.participantUids||[]).map(String).filter(Boolean))];
          mutations.push([applicationDoc.ref,{status:'rejected',active:false,planningDeadlineAt:null,rejectedReason:'Prazo de 7 dias para envio do planejamento expirado.',rejectedAt:now,autoRejected:true,needsAdminAttention:false,updatedAt:now}]);
          let deactivatableUids=uids;
          if(Array.isArray(allowedUnitIds)){
            const readUser=firestore.getDocFromServer||firestore.getDoc;
          const scopedResults=await Promise.all(uids.map(async uid=>{
              try{
                const userSnapshot=await readUser(firestore.doc(context.db,'users',uid));
                if(!userSnapshot.exists())return false;
                const assigned=userSnapshot.data()?.unitIds;
                return Array.isArray(assigned)&&assigned.length>0&&assigned.every(unitId=>allowedUnitIds.includes(String(unitId||'').trim().toLowerCase()));
              }catch{return false}
            }));
            deactivatableUids=uids.filter((uid,index)=>scopedResults[index]);
          }
          deactivatableUids.forEach(uid=>mutations.push([firestore.doc(context.db,'users',uid),{active:false,updatedAt:now}]));
        }
        for(let index=0;index<mutations.length;index+=400){
          const batch=firestore.writeBatch(context.db);
          mutations.slice(index,index+400).forEach(([ref,patch])=>batch.update(ref,patch));
          await batch.commit();
        }
        total+=snapshot.size;
        if(snapshot.size<max)break;
      }
      return total;
    },{loading:false});
  };
})();
