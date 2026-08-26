/* Round 5 — estado transacional do planejamento. */
(function round5Services(){
  const services=window.OleiroServices=window.OleiroServices||{};
  if(!services.applications)return;

  /* Reenvio após ajuste encerra as marcações antigas no mesmo write que volta para análise. */
  services.applications.submitPlanning=async function(id,{wasAdjustment=false}={}){
    return services.run(async()=>{
      const context=await services.firebase();
      const {firestore}=context.modules;
      const now=firestore.serverTimestamp();
      await firestore.updateDoc(firestore.doc(context.db,'applications',String(id)),{
        status:'analysis',
        planningSubmittedAt:now,
        ...(wasAdjustment?{dayAdjustments:{}}:{}),
        updatedAt:now
      });
      return true;
    },{loading:false});
  };

  /* Ao aprovar, grava também os contadores reais para a visão geral não depender de valores antigos. */
  const baseApprove=services.applications.approvePlanning?.bind(services.applications);
  if(baseApprove){
    services.applications.approvePlanning=async function(id,options={}){
      const result=await baseApprove(id,options);
      try{
        const sessions=services.planning?.listSessions?await services.planning.listSessions({applicationId:String(id)}):[];
        const activityCount=new Set((sessions||[]).map(row=>String(row.activityId||'')).filter(Boolean)).size;
        await services.applications.update(id,{sessionCount:(sessions||[]).length,activityCount});
        return {...(result||{}),sessionCount:(sessions||[]).length,activityCount};
      }catch(error){
        console.error('Não foi possível persistir os contadores após aprovação:',error);
        return result;
      }
    };
  }
})();
