/* Round 31b — preserve the original session when the team requests an adjustment. */
(function reviewFlowR31bService(){
  const services=window.OleiroServices=window.OleiroServices||{};if(!services.planning)return;
  function clean(value={}){return {
    date:String(value.date||'').slice(0,10),time:String(value.time||''),duration:Number(value.duration)||60,period:String(value.period||'Sem preferência'),
    activityName:String(value.activityName||'Atividade'),activityDescription:String(value.activityDescription||''),participation:String(value.participation||'Livre'),materials:String(value.materials||''),notes:String(value.notes||'')
  }}
  services.planning.requestSessionAdjustment=async function({applicationId,sessionId,note,applicationStatus=''}={}){
    if(!applicationId||!sessionId)throw new Error('Atividade não encontrada.');const text=String(note||'').trim();if(!text)throw new Error('Informe o ajuste solicitado.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,ref=firestore.doc(context.db,'activity_sessions',String(sessionId)),snapshot=await firestore.getDoc(ref);if(!snapshot.exists())throw new Error('Atividade não encontrada.');
      const row=snapshot.data(),baseline=clean(row),batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
      batch.update(ref,{adminAdjustmentStatus:'requested',adminAdjustmentNote:text,adminAdjustmentBaseline:baseline,adminAdjustmentRequestedAt:now,adminAdjustmentSubmittedAt:null,updatedAt:now});
      if(String(applicationStatus)!=='approved'){
        const deadline=new Date();deadline.setDate(deadline.getDate()+7);
        batch.update(firestore.doc(context.db,'applications',String(applicationId)),{status:'adjustments',active:true,planningDeadlineAt:firestore.Timestamp.fromDate(deadline),updatedAt:now});
      }
      await batch.commit();return {baseline};
    },{loading:false});
  };
})();
