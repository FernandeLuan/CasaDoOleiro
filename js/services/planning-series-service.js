/* Atomic creation of repeated sessions on the same day. Each session remains an independent activity/session. */
(function initPlanningSeriesService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  if(!services.planning)return;

  function cleanManagerGroup(value){
    const parts=String(value||'').split('+').map(item=>item.trim()).filter(Boolean);
    if(parts.includes('Livre'))return 'Livre';
    const valid=[...new Set(parts.filter(item=>['A','B','C','D'].includes(item)))];
    return valid.length?valid.join(' + '):null;
  }

  services.planning.createActivitySeries=async function(args={}){
    const {applicationId,unitId,createdByUid,ownerName='',data,date,occurrences=[],postApprovalProposal=false,sessionStatus='proposed',updateApplicationCounts=false,managerCreated=false}=args;
    if(!applicationId||!createdByUid||!date||!data?.name)throw new Error('Dados da atividade incompletos.');
    const rows=(occurrences||[]).map(item=>{const time=String(item?.time||'').trim(),period=typeof activityPeriodValue==='function'?activityPeriodValue(item,data):String(item?.period||data.period||'Sem preferência');return {time,period,groupId:item?.groupId??null,participation:item?.participation||data.participation||'Livre'}});
    if(!rows.length)throw new Error('Informe pelo menos uma sessão.');
    const signatures=rows.map(item=>item.time?`legacy:${item.time}`:`period:${item.period}|group:${cleanManagerGroup(item.groupId)||''}|participation:${item.participation}`);
    if(new Set(signatures).size!==rows.length)throw new Error('Use períodos ou grupos diferentes para cada sessão.');

    return services.run(async()=>{
      const context=await services.firebase();
      const {firestore}=context.modules;
      const normalizedStatus=['proposed','confirmed'].includes(String(sessionStatus))?String(sessionStatus):'proposed';
      const finalStatus=managerCreated?'manager_confirmed':postApprovalProposal?'proposed':normalizedStatus;
      const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp(),activities=[],sessions=[];
      const reviewFields=postApprovalProposal?{postApprovalProposal:true,reviewStatus:'analysis',reviewNote:'',reviewSubmittedAt:now}:{};
      const managerFields=managerCreated?{managerCreated:true,status:'manager_confirmed'}:{};

      rows.forEach(item=>{
        const activityRef=firestore.doc(firestore.collection(context.db,'activities'));
        const sessionRef=firestore.doc(firestore.collection(context.db,'activity_sessions'));
        const groupId=managerCreated?cleanManagerGroup(item.groupId):null;
        if(managerCreated&&!groupId)throw new Error('Selecione pelo menos um grupo ou participação livre.');
        const definition={
          applicationId:String(applicationId),ownerName:String(ownerName||''),name:String(data.name||''),description:String(data.description||''),duration:Number(data.duration)||60,
          participation:item.participation||data.participation||'Livre',materials:String(data.materials||''),notes:String(data.notes||''),period:item.period,...(item.time?{time:item.time}:{}),
          ...reviewFields,...managerFields,updatedAt:now
        };
        const activity={id:activityRef.id,...definition,createdByUid:String(createdByUid)};
        batch.set(activityRef,{...definition,createdByUid:String(createdByUid),createdAt:now});
        const session={
          id:sessionRef.id,applicationId:String(applicationId),activityId:activityRef.id,unitId:String(unitId||''),date:String(date),activityName:String(data.name||''),activityDescription:String(data.description||''),
          participation:item.participation||data.participation||'Livre',materials:String(data.materials||''),notes:String(data.notes||''),ownerName:String(ownerName||''),period:item.period,...(item.time?{time:item.time}:{}),duration:Number(data.duration)||60,
          ...reviewFields,...(managerCreated?{managerCreated:true}:{}),status:finalStatus,groupId,createdByUid:String(createdByUid)
        };
        batch.set(sessionRef,{...session,...(finalStatus==='confirmed'?{confirmedAt:now}:{}),createdAt:now,updatedAt:now});
        activities.push(activity);sessions.push(session);
      });

      if(updateApplicationCounts){
        batch.update(firestore.doc(context.db,'applications',String(applicationId)),{
          sessionCount:firestore.increment(rows.length),activityCount:firestore.increment(rows.length),planningCountVersion:1,updatedAt:now
        });
      }
      await batch.commit();
      services.history?.append?.(String(applicationId),'activity_created',{unitId:String(unitId||''),metadata:{activityName:String(data.name||''),occurrences:rows.length}}).catch(error=>console.warn('Histórico não pôde ser registrado: activity_created',error));
      return {activityIds:activities.map(item=>item.id),activities,sessions};
    },{loading:false});
  };
})();
