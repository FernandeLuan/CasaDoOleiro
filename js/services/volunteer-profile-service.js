(function initVolunteerProfileService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  const PROFILE_CACHE_MS=10*60*1000;
  const cache=new Map();

  function clean(value,max=120){return String(value||'').trim().slice(0,max)}
  function normalizeEmergencyContact(value){
    const row=value&&typeof value==='object'?value:{};
    return {name:clean(row.name,120),relationship:clean(row.relationship,80),phone:clean(row.phone,40)};
  }

  function cached(uid){const row=cache.get(String(uid));if(!row||Date.now()-row.at>PROFILE_CACHE_MS){cache.delete(String(uid));return null}return row.data}
  function remember(uid,data){cache.set(String(uid),{at:Date.now(),data:{id:String(uid),...(data||{})}});return cache.get(String(uid)).data}

  services.profiles={
    normalizeEmergencyContact,
    async getByIds(uids,{force=false}={}){
      const ids=[...new Set((uids||[]).map(String).filter(Boolean))];if(!ids.length)return [];
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;const missing=[];const rows=new Map();
        ids.forEach(uid=>{const hit=!force?cached(uid):null;if(hit)rows.set(uid,hit);else missing.push(uid)});
        if(missing.length){
          const snapshots=await Promise.all(missing.map(uid=>services.readDocument(context,'volunteer_profiles',uid,'profiles/by-id')));
          snapshots.forEach((snapshot,index)=>{const uid=missing[index],data=snapshot.exists()?snapshot.data():{missing:true};rows.set(uid,remember(uid,data))});
        }
        return ids.map(uid=>rows.get(uid)||{id:uid,missing:true});
      },{loading:false});
    },
    async updateEmergencyContact(uid,value){
      const id=String(uid||'').trim();if(!id)throw new Error('Perfil do voluntário não encontrado.');const emergencyContact=normalizeEmergencyContact(value);
      if((emergencyContact.name||emergencyContact.relationship||emergencyContact.phone)&&(!emergencyContact.name||!emergencyContact.phone))throw new Error('Informe pelo menos o nome e o telefone do contato de emergência.');
      return services.run(async()=>{
        const context=await services.firebase();const {firestore}=context.modules;
        await firestore.updateDoc(firestore.doc(context.db,'volunteer_profiles',id),{emergencyContact,updatedAt:firestore.serverTimestamp()});
        const previous=cached(id);if(previous&&!previous.missing)remember(id,{...previous,emergencyContact});else cache.delete(id);return emergencyContact;
      },{loading:false});
    },
    invalidate(uid){if(uid)cache.delete(String(uid));else cache.clear()}
  };
})();
