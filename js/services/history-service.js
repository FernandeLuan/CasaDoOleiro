/* Round 27 — histórico operacional por candidatura. Só lê quando a aba Histórico é aberta. */
(function initHistoryService(){
  const services=window.OleiroServices=window.OleiroServices||{};
  function cleanMetadata(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return {};
    const out={};Object.entries(value).forEach(([key,item])=>{
      if(item===undefined||typeof item==='function')return;
      if(item===null||['string','number','boolean'].includes(typeof item))out[key]=typeof item==='string'?item.slice(0,500):item;
    });return out;
  }
  function actor(){
    const session=typeof state!=='undefined'?state.currentSession:null,user=session?.user||{};
    const role=String(user.role||session?.role||state?.role||'').toLowerCase();
    return {
      actorUid:String(session?.uid||''),
      actorRole:role==='manager'?String(user.role||'admin'):role||'volunteer',
      actorLabel:String(user.name||user.displayName||session?.email||'').slice(0,120)
    };
  }
  services.history={
    async append(applicationId,type,{unitId='',metadata={}}={}){
      if(!applicationId||!type)return false;
      return services.run(async()=>{
        const context=await services.firebase(),{firestore}=context.modules,a=actor();
        const ref=firestore.doc(firestore.collection(context.db,'applications',String(applicationId),'history'));
        await firestore.setDoc(ref,{
          applicationId:String(applicationId),type:String(type),unitId:String(unitId||'').toLowerCase(),
          ...a,metadata:cleanMetadata(metadata),createdAt:firestore.serverTimestamp()
        });
        return {id:ref.id,type:String(type)};
      },{loading:false});
    },
    async list(applicationId,{limit=20,cursor=null}={}){
      if(!applicationId)return {items:[],nextCursor:null,hasMore:false};
      return services.run(async()=>{
        const context=await services.firebase(),{firestore}=context.modules,max=Math.max(1,Math.min(Number(limit)||20,50));
        const constraints=[firestore.orderBy('createdAt','desc')];if(cursor)constraints.push(firestore.startAfter(cursor));constraints.push(firestore.limit(max));
        const started=Date.now(),snapshot=await firestore.getDocs(firestore.query(firestore.collection(context.db,'applications',String(applicationId),'history'),...constraints));
        services.recordQuery?.('applications/history',started,snapshot.size,{applicationId:String(applicationId),limit:max,append:!!cursor});
        const items=snapshot.docs.map(doc=>({id:doc.id,...doc.data()})),last=snapshot.docs.at(-1)||null;
        return {items,nextCursor:snapshot.size===max?last:null,hasMore:snapshot.size===max};
      },{loading:false});
    }
  };
})();
