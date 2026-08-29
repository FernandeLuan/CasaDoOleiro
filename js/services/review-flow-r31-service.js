/* Round 31 — session-level reviews, unit-scoped occupancy and activity-assistant query guards. */
(function reviewFlowR31Service(){
  const services=window.OleiroServices=window.OleiroServices||{};
  if(!services.planning||!services.applications)return;

  function rawRole(){return String(window.state?.currentSession?.user?.role||'')}
  function assistantUnit(){
    if(rawRole()!=='activity_assistant')return '';
    const ids=window.state?.currentSession?.user?.unitIds;
    return Array.isArray(ids)&&ids.length?String(ids[0]).toLowerCase():'rodeio';
  }
  function normalizeUnit(value){return String(value||'').trim().toLowerCase()}
  function isoDate(value){if(!value)return null;if(typeof value==='string')return value.slice(0,10);if(typeof value.toDate==='function')return value.toDate().toISOString().slice(0,10);return null}
  function isoDateTime(value){if(!value)return null;if(typeof value==='string')return value;if(typeof value.toDate==='function')return value.toDate().toISOString();return null}
  function unitLabel(id){const value=String(id||'');return value?value.charAt(0).toUpperCase()+value.slice(1):'—'}
  function mapApplicationDoc(doc){
    const data=doc.data(),names=Array.isArray(data.participantNames)?data.participantNames.filter(Boolean):[],countries=Array.isArray(data.participantCountries)?data.participantCountries.filter(Boolean):[],emails=Array.isArray(data.participantEmails)?data.participantEmails.filter(Boolean):[],phones=Array.isArray(data.participantPhones)?data.participantPhones.filter(Boolean):[],participantUids=Array.isArray(data.participantUids)?data.participantUids.filter(Boolean):[];
    return {id:doc.id,applicationId:doc.id,...data,name:names.join(' + ')||data.name||'Voluntário',country:countries.join(' / ')||data.country||'—',email:emails.join(', ')||data.email||'',phone:phones.join(' / ')||data.phone||'',unitId:data.unitId||'',unit:data.unitName||unitLabel(data.unitId),from:isoDate(data.stayStart)||'',to:isoDate(data.stayEnd)||'',pendingUntil:isoDateTime(data.planningDeadlineAt),submitted:isoDateTime(data.planningSubmittedAt)||'—',sessions:Number(data.sessionCount||0),activities:Number(data.activityCount||0),inactive:data.active===false,participantUids,participantPhones:phones,profileHydrated:phones.length>0||participantUids.length===0,dayAdjustments:data.dayAdjustments&&typeof data.dayAdjustments==='object'?data.dayAdjustments:{}};
  }
  function cleanProposal(value={}){
    const out={};
    if(value.date)out.date=String(value.date).slice(0,10);
    if(value.time!==undefined)out.time=String(value.time||'');
    if(value.duration!==undefined)out.duration=Math.max(15,Math.min(Number(value.duration)||60,240));
    if(value.period!==undefined)out.period=String(value.period||'Sem preferência');
    if(value.activityName!==undefined)out.activityName=String(value.activityName||'').trim()||'Atividade';
    if(value.activityDescription!==undefined)out.activityDescription=String(value.activityDescription||'');
    if(value.participation!==undefined)out.participation=String(value.participation||'Livre');
    if(value.materials!==undefined)out.materials=String(value.materials||'');
    if(value.notes!==undefined)out.notes=String(value.notes||'');
    return out;
  }
  function sessionSnapshot(row={}){
    return cleanProposal({date:row.date,time:row.time,duration:row.duration,period:row.period,activityName:row.activityName,activityDescription:row.activityDescription,participation:row.participation,materials:row.materials,notes:row.notes});
  }

  services.accessScope={
    isActivityAssistant(){return rawRole()==='activity_assistant'},
    unitId(){return assistantUnit()||null},
    forceUnit(unitId='all'){return assistantUnit()||unitId}
  };

  const baseApplicationsList=services.applications.list?.bind(services.applications);
  if(baseApplicationsList){
    services.applications.list=async function(args={}){const unit=assistantUnit();return baseApplicationsList({...args,...(unit?{unit}: {})})};
  }

  const baseCountStatus=services.applications.countStatus?.bind(services.applications);
  services.applications.countStatus=async function(status,{unitId=null}={}){
    const forced=assistantUnit()||normalizeUnit(unitId);
    if(!forced&&baseCountStatus)return baseCountStatus(status);
    if(!status||status==='all')return 0;
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules;
      if(typeof firestore.getCountFromServer!=='function')throw new Error('Contagem agregada do Firestore indisponível.');
      const q=firestore.query(firestore.collection(context.db,'applications'),firestore.where('unitId','==',forced),firestore.where('status','==',String(status))),started=Date.now();
      const snapshot=await firestore.getCountFromServer(q),count=Number(snapshot.data().count)||0;services.recordQuery?.('applications/count-status-unit',started,count,{status:String(status),unitId:forced,aggregation:true});return count;
    },{loading:false});
  };

  const baseUpcoming=services.applications.listUpcoming?.bind(services.applications);
  services.applications.listUpcoming=async function({field='stayStart',from,limit=3,unitId=null}={}){
    const forced=assistantUnit()||normalizeUnit(unitId);
    if(!forced&&baseUpcoming)return baseUpcoming({field,from,limit});
    if(!from||!['stayStart','stayEnd'].includes(field))return [];
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,max=Math.max(1,Math.min(Number(limit)||3,10)),started=Date.now();
      const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications'),firestore.where('unitId','==',forced),firestore.where('status','==','approved'),firestore.where(field,'>=',String(from)),firestore.orderBy(field,'asc'),firestore.limit(max)));
      services.recordQuery?.('applications/upcoming-unit',started,snapshot.size,{field,from:String(from),unitId:forced,limit:max});return snapshot.docs.map(mapApplicationDoc).filter(row=>!row.inactive);
    },{loading:false});
  };

  services.applications.listOccupancyMonth=async function(month,{unitId=null}={}){
    if(!month)return [];
    const forced=assistantUnit()||normalizeUnit(unitId);
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,constraints=[firestore.where('status','==','approved'),firestore.where('stayMonths','array-contains',String(month))];
      if(forced)constraints.unshift(firestore.where('unitId','==',forced));
      const started=Date.now(),snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications'),...constraints));
      services.recordQuery?.('applications/occupancy-month-r31',started,snapshot.size,{month:String(month),unitId:forced||'all'});return snapshot.docs.map(mapApplicationDoc).filter(row=>!row.inactive);
    },{loading:false});
  };

  const basePendingChanges=services.planning.listPendingChanges?.bind(services.planning);
  services.planning.listPendingChanges=async function({limit=100,unitId=null}={}){
    const forced=assistantUnit()||normalizeUnit(unitId);
    if(!forced&&basePendingChanges)return basePendingChanges({limit});
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,max=Math.max(1,Math.min(Number(limit)||100,200)),started=Date.now();
      const [changesSnapshot,proposalSnapshot]=await Promise.all([
        firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('unitId','==',forced),firestore.where('status','==','change_requested'),firestore.limit(max))),
        firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('unitId','==',forced),firestore.where('reviewStatus','==','analysis'),firestore.limit(max)))
      ]);
      services.recordQuery?.('activity_sessions/pending-review-unit',started,changesSnapshot.size+proposalSnapshot.size,{unitId:forced,queries:2,limit:max});
      const unique=new Map();[...changesSnapshot.docs.map(doc=>({id:doc.id,...doc.data(),reviewKind:'change'})),...proposalSnapshot.docs.map(doc=>({id:doc.id,...doc.data(),reviewKind:'post_approval'}))].forEach(row=>unique.set(String(row.id),row));return [...unique.values()].slice(0,max);
    },{loading:false});
  };

  const baseManagerSchedule=services.planning.listManagerSchedule?.bind(services.planning);
  if(baseManagerSchedule){
    services.planning.listManagerSchedule=async function(args={}){const forced=assistantUnit();return baseManagerSchedule({...args,...(forced?{unitId:forced}: {})})};
  }

  services.planning.requestSessionAdjustment=async function({applicationId,sessionId,note,applicationStatus=''}={}){
    if(!applicationId||!sessionId)throw new Error('Atividade não encontrada.');const text=String(note||'').trim();if(!text)throw new Error('Informe o ajuste solicitado.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
      batch.update(firestore.doc(context.db,'activity_sessions',String(sessionId)),{adminAdjustmentStatus:'requested',adminAdjustmentNote:text,adminAdjustmentRequestedAt:now,adminAdjustmentSubmittedAt:null,updatedAt:now});
      if(String(applicationStatus)!=='approved'){
        const deadline=new Date();deadline.setDate(deadline.getDate()+7);
        batch.update(firestore.doc(context.db,'applications',String(applicationId)),{status:'adjustments',active:true,planningDeadlineAt:firestore.Timestamp.fromDate(deadline),updatedAt:now});
      }
      await batch.commit();return true;
    },{loading:false});
  };

  services.applications.submitPlanningWithSessionAdjustments=async function(id,{sessionIds=[]}={}){
    if(!id)throw new Error('Candidatura não encontrada.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
      batch.update(firestore.doc(context.db,'applications',String(id)),{status:'analysis',planningSubmittedAt:now,updatedAt:now});
      [...new Set((sessionIds||[]).map(String).filter(Boolean))].forEach(sessionId=>batch.update(firestore.doc(context.db,'activity_sessions',sessionId),{adminAdjustmentStatus:'analysis',adminAdjustmentSubmittedAt:now,updatedAt:now}));
      await batch.commit();return true;
    },{loading:false});
  };

  services.planning.requestExistingChange=async function({sessionId,proposal={},reason='',fromAdminAdjustment=false}={}){
    if(!sessionId)throw new Error('Sessão não encontrada.');const normalized=cleanProposal(proposal),text=String(reason||'').trim();
    if(!Object.keys(normalized).length)throw new Error('Informe a alteração proposta.');if(!text&&!fromAdminAdjustment)throw new Error('Informe o motivo da alteração.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,now=firestore.serverTimestamp(),patch={status:'change_requested',changeProposal:normalized,changeNote:text||'Ajuste solicitado pela equipe.',changeRequestedAt:now,changeReviewStatus:'analysis',changeReviewNote:'',updatedAt:now};
      if(fromAdminAdjustment)patch.adminAdjustmentStatus='analysis';
      await firestore.updateDoc(firestore.doc(context.db,'activity_sessions',String(sessionId)),patch);return {...patch,changeRequestedAt:null,updatedAt:null};
    },{loading:false});
  };

  services.planning.reviewExistingChange=async function({sessionId,decision,note=''}={}){
    if(!sessionId||!['approve','reject','adjustments'].includes(decision))throw new Error('Decisão inválida.');const reviewNote=String(note||'').trim();if(decision==='adjustments'&&!reviewNote)throw new Error('Informe o reajuste solicitado.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,ref=firestore.doc(context.db,'activity_sessions',String(sessionId)),snapshot=await firestore.getDoc(ref);if(!snapshot.exists())throw new Error('Sessão não encontrada.');
      const row={id:snapshot.id,...snapshot.data()},proposal=cleanProposal(row.changeProposal||{}),now=firestore.serverTimestamp();if(row.status!=='change_requested')throw new Error('Esta alteração não está aguardando análise.');
      let patch={updatedAt:now};
      if(decision==='approve'){
        patch={...patch,...proposal,status:'confirmed',changeReviewStatus:'approved',changeReviewNote:'',changeReviewedAt:now,...(row.adminAdjustmentStatus?{adminAdjustmentStatus:'approved'}:{})};
      }else if(decision==='reject'){
        patch={...patch,status:'confirmed',changeReviewStatus:'rejected',changeReviewNote:reviewNote,changeReviewedAt:now,...(row.adminAdjustmentStatus?{adminAdjustmentStatus:'rejected'}:{})};
      }else{
        patch={...patch,status:'change_requested',changeReviewStatus:'adjustments',changeReviewNote:reviewNote,changeReviewBaseline:proposal,changeReviewRequestNote:reviewNote,changeReviewedAt:now};
      }
      await firestore.updateDoc(ref,patch);return {...patch,updatedAt:null,changeReviewedAt:null};
    },{loading:false});
  };

  services.planning.resubmitExistingChange=async function({sessionId,proposal={},reason=''}={}){
    if(!sessionId)throw new Error('Sessão não encontrada.');const normalized=cleanProposal(proposal),text=String(reason||'').trim();
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,now=firestore.serverTimestamp(),patch={status:'change_requested',changeProposal:normalized,changeNote:text||'Alteração reenviada pelo voluntário.',changeRequestedAt:now,changeReviewStatus:'analysis',changeReviewNote:'',updatedAt:now};
      await firestore.updateDoc(firestore.doc(context.db,'activity_sessions',String(sessionId)),patch);return {...patch,changeRequestedAt:null,updatedAt:null};
    },{loading:false});
  };

  services.planning.reviewPostApprovalProposal=async function({applicationId,activityId,decision,note=''}){
    if(!applicationId||!activityId||!['approve','reject','adjustments'].includes(decision))throw new Error('Decisão inválida.');const reviewNote=String(note||'').trim();if(decision==='adjustments'&&!reviewNote)throw new Error('Informe o reajuste solicitado.');
    return services.run(async()=>{
      const context=await services.firebase(),{firestore}=context.modules,appId=String(applicationId),actId=String(activityId),started=Date.now();
      const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('applicationId','==',appId),firestore.where('activityId','==',actId)));
      services.recordQuery?.('activity_sessions/activity-review-r31',started,snapshot.size,{applicationId:appId,activityId:actId});const sessions=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
      if(!sessions.length||!sessions.some(row=>row.postApprovalProposal===true))throw new Error('Proposta não encontrada.');
      const activityRef=firestore.doc(context.db,'activities',actId),batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp(),reviewStatus=decision==='approve'?'approved':decision==='reject'?'rejected':'adjustments',sessionStatus=decision==='approve'?'confirmed':decision==='reject'?'rejected':'proposed';
      const reviewPatch={postApprovalProposal:true,reviewStatus,reviewNote:decision==='adjustments'?reviewNote:'',status:sessionStatus,reviewedAt:now,updatedAt:now};
      const activityExtra=decision==='adjustments'?{reviewBaseline:sessionSnapshot(sessions[0]),reviewRequestNote:reviewNote}:{};
      batch.update(activityRef,{...reviewPatch,...activityExtra});sessions.forEach(session=>{const sessionExtra=decision==='adjustments'?{reviewBaseline:sessionSnapshot(session),reviewRequestNote:reviewNote}:{};batch.update(firestore.doc(context.db,'activity_sessions',String(session.id)),{...reviewPatch,...sessionExtra,status:sessionStatus,...(decision==='approve'?{confirmedAt:now}:{} )})});
      let countDelta=null;if(decision==='approve'){const newSessions=sessions.filter(row=>row.status!=='confirmed').length,newActivity=sessions.some(row=>row.status==='confirmed')?0:1;countDelta={sessionCount:newSessions,activityCount:newActivity};batch.update(firestore.doc(context.db,'applications',appId),{sessionCount:firestore.increment(newSessions),activityCount:firestore.increment(newActivity),planningCountVersion:1,updatedAt:now})}
      await batch.commit();return {reviewStatus,status:sessionStatus,sessionIds:sessions.map(row=>String(row.id)),countDelta};
    },{loading:false});
  };
})();
