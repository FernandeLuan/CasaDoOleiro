(function initApplicationService(){
  const services=window.OleiroServices=window.OleiroServices||{};

  function normalize(value){return String(value||'').trim().toLocaleLowerCase('pt-BR')}
  function isoDate(value){if(!value)return null;if(typeof value==='string')return value.slice(0,10);if(typeof value.toDate==='function')return value.toDate().toISOString().slice(0,10);return null}
  function isoDateTime(value){if(!value)return null;if(typeof value==='string')return value;if(typeof value.toDate==='function')return value.toDate().toISOString();return null}
  function unitLabel(id){const value=String(id||'');return value?value.charAt(0).toUpperCase()+value.slice(1):'—'}
  function mapApplication(doc){
    const data=doc.data();
    const names=Array.isArray(data.participantNames)?data.participantNames.filter(Boolean):[];
    const countries=Array.isArray(data.participantCountries)?data.participantCountries.filter(Boolean):[];
    const emails=Array.isArray(data.participantEmails)?data.participantEmails.filter(Boolean):[];
    return {
      id:doc.id,
      applicationId:doc.id,
      ...data,
      name:names.join(' + ')||data.name||'Voluntário',
      country:countries.join(' / ')||data.country||'—',
      email:emails.join(', ')||data.email||'',
      phone:data.phone||'',
      unitId:data.unitId||'',
      unit:data.unitName||unitLabel(data.unitId),
      from:isoDate(data.stayStart)||'',
      to:isoDate(data.stayEnd)||'',
      pendingUntil:isoDateTime(data.planningDeadlineAt),
      submitted:isoDateTime(data.planningSubmittedAt)||'—',
      sessions:Number(data.sessionCount||0),
      activities:Number(data.activityCount||0),
      inactive:data.active===false
    };
  }

  services.applications={
    async list({status='approved',unit='all',search='',cursor=null,limit=services.config?.candidatePageSize||10}={}){
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const constraints=[];
        if(status&&status!=='all')constraints.push(firestore.where('status','==',status));
        if(unit&&unit!=='all')constraints.push(firestore.where('unitId','==',normalize(unit)));
        if(cursor)constraints.push(firestore.startAfter(cursor));
        constraints.push(firestore.limit(Math.max(1,Number(limit)||10)));
        const q=firestore.query(firestore.collection(context.db,'applications'),...constraints);
        const snapshot=await firestore.getDocs(q);
        const term=normalize(search);
        let items=snapshot.docs.map(mapApplication);
        if(term)items=items.filter(item=>normalize(item.name).includes(term));
        const last=snapshot.docs.at(-1)||null;
        return {items,nextCursor:snapshot.size===Number(limit||10)?last:null,hasMore:snapshot.size===Number(limit||10)};
      });
    },
    async getById(id){
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const snapshot=await firestore.getDoc(firestore.doc(context.db,'applications',String(id)));
        return snapshot.exists()?mapApplication(snapshot):null;
      });
    },
    async update(id,patch){
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        await firestore.updateDoc(firestore.doc(context.db,'applications',String(id)),{...patch,updatedAt:firestore.serverTimestamp()});
        return true;
      });
    },
    async setParticipantsActive(uids,active){
      const ids=[...new Set((uids||[]).filter(Boolean).map(String))];
      if(!ids.length)return true;
      return services.run(async()=>{
        const context=await services.firebase();
        const {firestore}=context.modules;
        const batch=firestore.writeBatch(context.db);
        ids.forEach(uid=>batch.update(firestore.doc(context.db,'users',uid),{active:active===true,updatedAt:firestore.serverTimestamp()}));
        await batch.commit();
        return true;
      });
    }
  };
})();
