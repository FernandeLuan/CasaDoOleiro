(function initApplicationService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  const STAY_PREVIEW_TTL=2*60*1000;
  const stayPreviewCache=new Map();

  function normalize(value){return String(value||'').trim().toLocaleLowerCase('pt-BR')}
  function isoDate(value){if(!value)return null;if(typeof value==='string')return value.slice(0,10);if(typeof value.toDate==='function')return value.toDate().toISOString().slice(0,10);return null}
  function isoDateTime(value){if(!value)return null;if(typeof value==='string')return value;if(typeof value.toDate==='function')return value.toDate().toISOString();return null}
  function unitLabel(id){const value=String(id||'');return value?value.charAt(0).toUpperCase()+value.slice(1):'—'}
  function stayMonths(start,end){if(!start||!end)return [];const from=new Date(`${start}T12:00:00`),to=new Date(`${end}T12:00:00`);const out=[];let y=from.getFullYear(),m=from.getMonth();const ey=to.getFullYear(),em=to.getMonth();while(y<ey||(y===ey&&m<=em)){out.push(`${y}-${String(m+1).padStart(2,'0')}`);m+=1;if(m===12){m=0;y+=1}}return out}
  function stayPreviewKey(id,start,end){return `${String(id)}|${String(start)}|${String(end)}`}
  function cachedStayPreview(id,start,end){const key=stayPreviewKey(id,start,end),cached=stayPreviewCache.get(key);if(!cached||Date.now()-cached.at>STAY_PREVIEW_TTL){stayPreviewCache.delete(key);return null}return cached}
  function clearStayPreview(id){const prefix=`${String(id)}|`;for(const key of stayPreviewCache.keys())if(key.startsWith(prefix))stayPreviewCache.delete(key)}

  function mapApplication(doc){
    const data=doc.data();
    const names=Array.isArray(data.participantNames)?data.participantNames.filter(Boolean):[];
    const countries=Array.isArray(data.participantCountries)?data.participantCountries.filter(Boolean):[];
    const emails=Array.isArray(data.participantEmails)?data.participantEmails.filter(Boolean):[];
    const phones=Array.isArray(data.participantPhones)?data.participantPhones.filter(Boolean):[];
    const participantUids=Array.isArray(data.participantUids)?data.participantUids.filter(Boolean):[];
    return {
      id:doc.id,applicationId:doc.id,...data,
      name:names.join(' + ')||data.name||'Voluntário',
      country:countries.join(' / ')||data.country||'—',
      email:emails.join(', ')||data.email||'',
      phone:phones.join(' / ')||data.phone||'',
      unitId:data.unitId||'',unit:data.unitName||unitLabel(data.unitId),
      from:isoDate(data.stayStart)||'',to:isoDate(data.stayEnd)||'',
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
    const started=Date.now();
    const snapshots=await Promise.all(uids.map(uid=>firestore.getDoc(firestore.doc(context.db,'volunteer_profiles',uid))));
    services.recordQuery?.('applications/profile-enrichment',started,snapshots.filter(snapshot=>snapshot.exists()).length,{pointReads:uids.length});
    const profiles=snapshots.filter(snapshot=>snapshot.exists()).map(snapshot=>snapshot.data());
    const phones=profiles.map(profile=>profile.phone||profile.whatsapp||'').filter(Boolean);
    return {...item,phone:item.phone||phones.join(' / '),participantPhones:item.participantPhones?.length?item.participantPhones:phones,profileHydrated:true};
  }

  async function applicationSessions(context,id){
    const {firestore}=context.modules,applicationId=String(id),started=Date.now();
    const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'activity_sessions'),firestore.where('applicationId','==',applicationId)));
    services.recordQuery?.('applications/all-sessions',started,snapshot.size,{applicationId});
    return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
  }

  async function applicationActivities(context,id){
    const {firestore}=context.modules,applicationId=String(id),started=Date.now();
    const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'activities'),firestore.where('applicationId','==',applicationId)));
    services.recordQuery?.('applications/all-activities',started,snapshot.size,{applicationId});
    return snapshot.docs.map(doc=>({id:doc.id,ref:doc.ref,...doc.data()}));
  }

  services.applications={
    async list({status='approved',unit='all',search='',cursor=null,limit=services.config?.candidatePageSize||10}={}){
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const constraints=[];const term=normalize(search);
        if(status&&status!=='all')constraints.push(firestore.where('status','==',status));
        if(unit&&unit!=='all')constraints.push(firestore.where('unitId','==',normalize(unit)));
        if(term)constraints.push(firestore.where('searchTokens','array-contains',term.slice(0,24)));
        if(cursor)constraints.push(firestore.startAfter(cursor));
        const pageSize=Math.max(1,Math.min(Number(limit)||10,50));constraints.push(firestore.limit(pageSize));
        const started=Date.now(),snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications'),...constraints));
        services.recordQuery?.('applications/list-page',started,snapshot.size,{status:status||'all',unit:unit||'all',search:!!term,pageSize,append:!!cursor});
        const items=snapshot.docs.map(mapApplication),last=snapshot.docs.at(-1)||null;
        return {items,nextCursor:snapshot.size===pageSize?last:null,hasMore:snapshot.size===pageSize};
      },{loading:false});
    },

    async countStatus(status){
      if(!status||status==='all')return 0;
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        if(typeof firestore.getCountFromServer!=='function')throw new Error('Contagem agregada do Firestore indisponível. A leitura ampla foi bloqueada.');
        const q=firestore.query(firestore.collection(context.db,'applications'),firestore.where('status','==',String(status))),started=Date.now();
        const snapshot=await firestore.getCountFromServer(q),count=Number(snapshot.data().count)||0;services.recordQuery?.('applications/count-status',started,count,{status:String(status),aggregation:true});return count;
      },{loading:false});
    },

    async listUpcoming({field='stayStart',from,limit=3}={}){
      if(!from||!['stayStart','stayEnd'].includes(field))return [];
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules,max=Math.max(1,Math.min(Number(limit)||3,10)),started=Date.now();
        const snapshot=await firestore.getDocs(firestore.query(
          firestore.collection(context.db,'applications'),
          firestore.where('status','==','approved'),
          firestore.where(field,'>=',String(from)),
          firestore.orderBy(field,'asc'),
          firestore.limit(max)
        ));
        services.recordQuery?.('applications/upcoming',started,snapshot.size,{field,from:String(from),limit:max});
        return snapshot.docs.map(mapApplication).filter(row=>!row.inactive);
      },{loading:false});
    },

    async listOccupancyMonth(month,{unitId='all'}={}){
      if(!month)return [];
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules,started=Date.now(),constraints=[firestore.where('status','==','approved'),firestore.where('stayMonths','array-contains',String(month))],normalizedUnit=unitId&&unitId!=='all'?normalize(unitId):'';
        if(normalizedUnit)constraints.push(firestore.where('unitId','==',normalizedUnit));
        const snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications'),...constraints));
        services.recordQuery?.('applications/occupancy-month',started,snapshot.size,{month:String(month),unitId:normalizedUnit||'all'});
        return snapshot.docs.map(mapApplication).filter(row=>!row.inactive);
      },{loading:false,monitor:{area:'applications',action:'occupancy_month'}});
    },

    async getById(id,{enrichProfiles=true}={}){
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules,applicationId=String(id),started=Date.now();
        const snapshot=await firestore.getDoc(firestore.doc(context.db,'applications',applicationId));
        services.recordQuery?.('applications/by-id',started,snapshot.exists()?1:0,{applicationId});
        if(!snapshot.exists())return null;
        const item=mapApplication(snapshot);return enrichProfiles?enrichApplicationProfiles(context,item):item;
      },{loading:false});
    },

    async update(id,patch){
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        await firestore.updateDoc(firestore.doc(context.db,'applications',String(id)),{...patch,updatedAt:firestore.serverTimestamp()});return true;
      },{loading:false});
    },

    async updateLifecycle(id,{applicationPatch={},participantUids=[],participantActive=null}={}){
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const batch=firestore.writeBatch(context.db);const now=firestore.serverTimestamp();
        batch.update(firestore.doc(context.db,'applications',String(id)),{...applicationPatch,updatedAt:now});
        if(participantActive!==null){
          [...new Set((participantUids||[]).filter(Boolean).map(String))].forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:participantActive===true,updatedAt:now}));
        }
        await batch.commit();return true;
      },{loading:false});
    },

    async previewStayDateChange(id,{stayStart,stayEnd}={}){
      if(!stayStart||!stayEnd||stayEnd<stayStart)throw new Error('Período inválido.');
      return services.run(async()=>{
        const context=await services.firebase();const sessions=await applicationSessions(context,id);
        const outside=sessions.filter(s=>!s.date||s.date<stayStart||s.date>stayEnd),key=stayPreviewKey(id,stayStart,stayEnd);
        clearStayPreview(id);stayPreviewCache.set(key,{at:Date.now(),sessions});
        return {outsideCount:outside.length,outsideDates:[...new Set(outside.map(s=>s.date).filter(Boolean))].sort(),sessionCount:sessions.length};
      },{loading:false});
    },

    async changeStayDates(id,{stayStart,stayEnd,removeOutside=true}={}){
      if(!stayStart||!stayEnd||stayEnd<stayStart)throw new Error('Período inválido.');
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules,cached=cachedStayPreview(id,stayStart,stayEnd);
        const sessions=cached?.sessions||await applicationSessions(context,id);
        const outside=sessions.filter(s=>!s.date||s.date<stayStart||s.date>stayEnd);
        if(outside.length&&!removeOutside)throw new Error('Existem sessões fora do novo período.');
        const outsideIds=new Set(outside.map(s=>String(s.id))),remaining=sessions.filter(s=>!outsideIds.has(String(s.id)));
        const allActivityIds=new Set(sessions.map(s=>String(s.activityId||'')).filter(Boolean)),remainingActivityIds=new Set(remaining.map(s=>String(s.activityId||'')).filter(Boolean));
        const orphanActivityIds=[...allActivityIds].filter(activityId=>!remainingActivityIds.has(activityId));
        const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
        outside.forEach(s=>batch.delete(firestore.doc(context.db,'activity_sessions',String(s.id))));
        orphanActivityIds.forEach(activityId=>batch.delete(firestore.doc(context.db,'activities',activityId)));
        batch.update(firestore.doc(context.db,'applications',String(id)),{
          stayStart,stayEnd,stayMonths:stayMonths(stayStart,stayEnd),sessionCount:remaining.length,activityCount:remainingActivityIds.size,updatedAt:now
        });
        await batch.commit();clearStayPreview(id);return {removedSessions:outside.length,sessionCount:remaining.length,activityCount:remainingActivityIds.size};
      },{loading:false});
    },

    async requestDayAdjustment(id,date,note){
      if(!date)throw new Error('Data inválida.');const text=String(note||'').trim();if(!text)throw new Error('Informe o ajuste solicitado.');
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const now=firestore.serverTimestamp();const deadline=new Date();deadline.setDate(deadline.getDate()+7);
        await firestore.updateDoc(firestore.doc(context.db,'applications',String(id)),{
          [`dayAdjustments.${date}`]:{note:text,status:'requested',requestedAt:now},status:'adjustments',active:true,planningDeadlineAt:firestore.Timestamp.fromDate(deadline),updatedAt:now
        });return true;
      },{loading:false});
    },

    async submitPlanning(id){
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const now=firestore.serverTimestamp();
        await firestore.updateDoc(firestore.doc(context.db,'applications',String(id)),{status:'analysis',planningSubmittedAt:now,updatedAt:now});
        return true;
      },{loading:false});
    },

    async resetPlanning(id,{deadlineDays=7,participantUids=[]}={}){
      if(!id)throw new Error('Candidatura não encontrada.');
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const applicationId=String(id);clearStayPreview(applicationId);
        const [sessions,activities]=await Promise.all([applicationSessions(context,applicationId),applicationActivities(context,applicationId)]);
        const refs=[...sessions.map(row=>firestore.doc(context.db,'activity_sessions',String(row.id))),...activities.map(row=>row.ref)];
        for(let i=0;i<refs.length;i+=400){const batch=firestore.writeBatch(context.db);refs.slice(i,i+400).forEach(ref=>batch.delete(ref));await batch.commit()}
        const deadline=new Date();deadline.setDate(deadline.getDate()+Math.max(1,Number(deadlineDays)||7));
        const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp();
        batch.update(firestore.doc(context.db,'applications',applicationId),{
          status:'pending',active:true,planningDeadlineAt:firestore.Timestamp.fromDate(deadline),planningSubmittedAt:null,
          approvedAt:null,dayAdjustments:{},sessionCount:0,activityCount:0,updatedAt:now
        });
        [...new Set((participantUids||[]).filter(Boolean).map(String))].forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:true,updatedAt:now}));
        await batch.commit();
        return {deletedSessions:sessions.length,deletedActivities:activities.length,planningDeadlineAt:deadline.toISOString()};
      },{loading:false});
    },

    async setParticipantsActive(uids,active){
      const ids=[...new Set((uids||[]).filter(Boolean).map(String))];if(!ids.length)return true;
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const batch=firestore.writeBatch(context.db);const now=firestore.serverTimestamp();
        ids.forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:active===true,updatedAt:now}));await batch.commit();return true;
      },{loading:false});
    }
  };
})();