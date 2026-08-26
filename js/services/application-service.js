(function initApplicationService(){
  const services=window.OleiroServices=window.OleiroServices||{};

  function normalize(value){return String(value||'').trim().toLocaleLowerCase('pt-BR')}
  function isoDate(value){if(!value)return null;if(typeof value==='string')return value.slice(0,10);if(typeof value.toDate==='function')return value.toDate().toISOString().slice(0,10);return null}
  function isoDateTime(value){if(!value)return null;if(typeof value==='string')return value;if(typeof value.toDate==='function')return value.toDate().toISOString();return null}
  function unitLabel(id){const value=String(id||'');return value?value.charAt(0).toUpperCase()+value.slice(1):'—'}
  function stayMonths(start,end){if(!start||!end)return [];const from=new Date(`${start}T12:00:00`),to=new Date(`${end}T12:00:00`);const out=[];let y=from.getFullYear(),m=from.getMonth();const ey=to.getFullYear(),em=to.getMonth();while(y<ey||(y===ey&&m<=em)){out.push(`${y}-${String(m+1).padStart(2,'0')}`);m+=1;if(m===12){m=0;y+=1}}return out}
  function mapApplication(doc){
    const data=doc.data();
    const names=Array.isArray(data.participantNames)?data.participantNames.filter(Boolean):[];
    const countries=Array.isArray(data.participantCountries)?data.participantCountries.filter(Boolean):[];
    const emails=Array.isArray(data.participantEmails)?data.participantEmails.filter(Boolean):[];
    const phones=Array.isArray(data.participantPhones)?data.participantPhones.filter(Boolean):[];
    const participantUids=Array.isArray(data.participantUids)?data.participantUids.filter(Boolean):[];
    return {
      id:doc.id,applicationId:doc.id,...data,
      name:names.join(' + ')||data.name||'Voluntário',country:countries.join(' / ')||data.country||'—',email:emails.join(', ')||data.email||'',phone:phones.join(' / ')||data.phone||'',
      unitId:data.unitId||'',unit:data.unitName||unitLabel(data.unitId),from:isoDate(data.stayStart)||'',to:isoDate(data.stayEnd)||'',
      pendingUntil:isoDateTime(data.planningDeadlineAt),submitted:isoDateTime(data.planningSubmittedAt)||'—',
      sessions:Number(data.sessionCount||0),activities:Number(data.activityCount||0),inactive:data.active===false,
      participantUids,participantPhones:phones,profileHydrated:phones.length>0||participantUids.length===0,
      dayAdjustments:data.dayAdjustments&&typeof data.dayAdjustments==='object'?data.dayAdjustments:{}
    };
  }
  async function enrichApplicationProfiles(context,item){
    if(!item||item.profileHydrated)return item;
    const {firestore}=context.modules;const uids=(item.participantUids||[]).map(String).filter(Boolean);
    if(!uids.length)return {...item,profileHydrated:true};
    const snapshots=await Promise.all(uids.map(uid=>firestore.getDoc(firestore.doc(context.db,'volunteer_profiles',uid))));
    const profiles=snapshots.filter(snapshot=>snapshot.exists()).map(snapshot=>snapshot.data());
    const phones=profiles.map(profile=>profile.phone||profile.whatsapp||'').filter(Boolean);
    return {...item,phone:item.phone||phones.join(' / '),participantPhones:item.participantPhones?.length?item.participantPhones:phones,profileHydrated:true};
  }
  async function applicationSessions(context,id){
    const {firestore}=context.modules;
    const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('applicationId','==',String(id))));
    return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
  }

  services.applications={
    async list({status='approved',unit='all',search='',cursor=null,limit=services.config?.candidatePageSize||10}={}){
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const constraints=[];
        if(status&&status!=='all')constraints.push(firestore.where('status','==',status));
        if(unit&&unit!=='all')constraints.push(firestore.where('unitId','==',normalize(unit)));
        if(cursor)constraints.push(firestore.startAfter(cursor));
        constraints.push(firestore.limit(Math.max(1,Number(limit)||10)));
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications'),...constraints));
        const term=normalize(search);let items=snapshot.docs.map(mapApplication);if(term)items=items.filter(item=>normalize(item.name).includes(term));
        const last=snapshot.docs.at(-1)||null;return {items,nextCursor:snapshot.size===Number(limit||10)?last:null,hasMore:snapshot.size===Number(limit||10)};
      },{loading:false});
    },
    async getById(id,{enrichProfiles=true}={}){
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        const snapshot=await firestore.getDoc(firestore.doc(context.db,'applications',String(id)));
        if(!snapshot.exists())return null;
        const item=mapApplication(snapshot);return enrichProfiles?enrichApplicationProfiles(context,item):item;
      },{loading:false});
    },
    async update(id,patch){
      return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;await firestore.updateDoc(firestore.doc(context.db,'applications',String(id)),{...patch,updatedAt:firestore.serverTimestamp()});return true;},{loading:false});
    },
    async updateLifecycle(id,{applicationPatch={},participantUids=[],participantActive=null}={}){
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const batch=firestore.writeBatch(context.db);const now=firestore.serverTimestamp();
        batch.update(firestore.doc(context.db,'applications',String(id)),{...applicationPatch,updatedAt:now});
        if(participantActive!==null){[...new Set((participantUids||[]).filter(Boolean).map(String))].forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:participantActive===true,updatedAt:now}));}
        await batch.commit();return true;
      },{loading:false});
    },
    async approvePlanning(id,{participantUids=[]}={}){
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const sessions=await applicationSessions(context,id);const batch=firestore.writeBatch(context.db);const now=firestore.serverTimestamp();
        batch.update(firestore.doc(context.db,'applications',String(id)),{status:'approved',active:true,planningDeadlineAt:null,approvedAt:now,needsAdminAttention:false,dayAdjustments:{},updatedAt:now});
        sessions.forEach(session=>batch.update(firestore.doc(context.db,'activity_sessions',String(session.id)),{status:'confirmed',confirmedAt:now,changeNote:'',updatedAt:now}));
        [...new Set((participantUids||[]).filter(Boolean).map(String))].forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:true,updatedAt:now}));
        await batch.commit();return {confirmedSessions:sessions.length};
      },{loading:false});
    },
    async previewStayDateChange(id,{stayStart,stayEnd}={}){
      if(!stayStart||!stayEnd||stayEnd<stayStart)throw new Error('Período inválido.');
      return services.run(async()=>{const context=await services.firebase();const sessions=await applicationSessions(context,id);const outside=sessions.filter(s=>!s.date||s.date<stayStart||s.date>stayEnd);return {outsideCount:outside.length,outsideDates:[...new Set(outside.map(s=>s.date).filter(Boolean))].sort(),sessionCount:sessions.length};},{loading:false});
    },
    async changeStayDates(id,{stayStart,stayEnd,removeOutside=true}={}){
      if(!stayStart||!stayEnd||stayEnd<stayStart)throw new Error('Período inválido.');
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        const [sessions,activitySnapshot]=await Promise.all([
          applicationSessions(context,id),
          firestore.getDocs(firestore.query(firestore.collection(context.db,'activities'),firestore.where('applicationId','==',String(id))))
        ]);
        const outside=sessions.filter(s=>!s.date||s.date<stayStart||s.date>stayEnd);if(outside.length&&!removeOutside)throw new Error('Existem sessões fora do novo período.');
        const remaining=sessions.filter(s=>!outside.some(x=>String(x.id)===String(s.id)));const remainingActivityIds=new Set(remaining.map(s=>String(s.activityId||'')).filter(Boolean));
        const batch=firestore.writeBatch(context.db);const now=firestore.serverTimestamp();
        outside.forEach(s=>batch.delete(firestore.doc(context.db,'activity_sessions',String(s.id))));
        activitySnapshot.docs.forEach(doc=>{if(!remainingActivityIds.has(String(doc.id)))batch.delete(doc.ref)});
        batch.update(firestore.doc(context.db,'applications',String(id)),{stayStart,stayEnd,stayMonths:stayMonths(stayStart,stayEnd),sessionCount:remaining.length,activityCount:remainingActivityIds.size,updatedAt:now});
        await batch.commit();return {removedSessions:outside.length,sessionCount:remaining.length,activityCount:remainingActivityIds.size};
      },{loading:false});
    },
    async requestDayAdjustment(id,date,note){
      if(!date)throw new Error('Data inválida.');const text=String(note||'').trim();if(!text)throw new Error('Informe o ajuste solicitado.');
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const now=firestore.serverTimestamp();const deadline=new Date();deadline.setDate(deadline.getDate()+7);
        await firestore.updateDoc(firestore.doc(context.db,'applications',String(id)),{
          [`dayAdjustments.${date}`]:{note:text,status:'requested',requestedAt:now},status:'adjustments',active:true,planningDeadlineAt:firestore.Timestamp.fromDate(deadline),needsAdminAttention:false,updatedAt:now
        });return true;
      },{loading:false});
    },
    async submitPlanning(id,{wasAdjustment=false}={}){
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const now=firestore.serverTimestamp();
        await firestore.updateDoc(firestore.doc(context.db,'applications',String(id)),{
          status:'analysis',planningSubmittedAt:now,needsAdminAttention:true,
          adminAttentionTitle:wasAdjustment?'Planejamento reenviado':'Planejamento enviado',
          adminAttentionText:wasAdjustment?'O voluntário reenviou o planejamento após os ajustes solicitados.':'O voluntário enviou o planejamento para análise.',
          adminAttentionUpdatedAt:now,updatedAt:now
        });
        return true;
      },{loading:false});
    },
    async setParticipantsActive(uids,active){
      const ids=[...new Set((uids||[]).filter(Boolean).map(String))];if(!ids.length)return true;
      return services.run(async()=>{const context=await services.firebase();const {firestore}=context.modules;const batch=firestore.writeBatch(context.db);ids.forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:active===true,updatedAt:firestore.serverTimestamp()}));await batch.commit();return true;},{loading:false});
    }
  };
})();
