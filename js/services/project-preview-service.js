/* Projetos/Legados — persistência real no Firestore. Preferências de onboarding são locais; dados do projeto nunca são gravados no navegador. */
(function initLegacyProjectService(){
  const ONBOARD='oleiro.legacy-project-onboarding.v1';
  const PREVIEW_ENABLED=window.OLEIRO_PREVIEW_ENABLED===true;

  /* Homologação permanece isolada em localStorage; somente produção usa Firestore. */
  if(PREVIEW_ENABLED){
    const STORE='oleiro.legacy-projects.preview.v1';
    const uid=()=>String(window.state?.currentSession?.uid||'');
    const applicationId=()=>String(window.state?.currentApplication?.id||'');
    const ownId=()=>[applicationId(),uid()].filter(Boolean).join('__');
    const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{return {}}};
    const write=rows=>localStorage.setItem(STORE,JSON.stringify(rows||{}));
    const now=()=>new Date().toISOString();
    const getOwn=()=>{const id=ownId(),row=read()[id];return row?{...row,id}:null};
    const list=()=>Object.entries(read()).map(([id,row])=>({...row,id})).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
    const saveOwn=async patch=>{
      const id=ownId();if(!id)throw new Error('Sessão do voluntário indisponível.');
      const rows=read(),existing=rows[id]||{};
      if(existing.status==='completed')return {...existing,id};
      const session=window.state?.currentSession||{},application=window.state?.currentApplication||{},profile=session.profile||{};
      const next={id,applicationId:applicationId(),ownerUid:uid(),ownerName:profile.name||profile.fullName||session.email||'Voluntário',unitId:String(application.unitId||''),unitName:application.unitName||String(application.unitId||''),createdAt:existing.createdAt||now(),...existing,...patch,updatedAt:now()};
      rows[id]=next;write(rows);return {...next};
    };
    const update=async(id,patch={})=>{
      const rows=read(),key=String(id),existing=rows[key];if(!existing)throw new Error('Projeto não encontrado.');
      rows[key]={...existing,...patch,updatedAt:now()};write(rows);return {...rows[key],id:key};
    };
    const onboardingKey=()=>ONBOARD+':'+(uid()||'anon');
    window.OleiroProjects={getOwn,loadOwn:async()=>getOwn(),list,loadAll:async()=>list(),saveOwn,update,removeOwn:()=>false,onboardingDone:()=>{try{return localStorage.getItem(onboardingKey())==='1'}catch{return false}},completeOnboarding:()=>{try{localStorage.setItem(onboardingKey(),'1')}catch{}},resetOnboarding:()=>{try{localStorage.removeItem(onboardingKey())}catch{}},isPreview:true};
    return;
  }

  const cache=new Map();
  const services=window.OleiroServices=window.OleiroServices||{};

  function session(){return window.state?.currentSession||{}}
  function uid(){return String(session().uid||'')}
  function applicationId(){return String(window.state?.currentApplication?.id||'')}
  function ownId(){return [applicationId(),uid()].filter(Boolean).join('__')}
  function now(){return new Date().toISOString()}
  function timestampValue(value){
    if(value?.toDate)return value.toDate().getTime();
    const parsed=Date.parse(value||'');return Number.isFinite(parsed)?parsed:0;
  }
  function mapProject(snapshot){
    return {id:snapshot.id,...snapshot.data()};
  }
  function cacheProject(project){
    if(project?.id)cache.set(String(project.id),project);
    return project;
  }
  function managerRole(){return String(session().user?.role||'')}
  function assertVolunteer(){
    if(window.state?.role!=='volunteer'||!uid()||!applicationId())throw new Error('Sessão do voluntário indisponível.');
  }
  async function context(){return services.firebase()}
  async function loadOwn({force=false}={}){
    assertVolunteer();
    const id=ownId();
    if(!force&&cache.has(id))return cache.get(id)||null;
    return services.run(async()=>{
      const ctx=await context(),{firestore}=ctx.modules,ref=firestore.doc(ctx.db,'legacy_projects',id);
      const snapshot=await firestore.getDoc(ref);
      if(!snapshot.exists()){cache.set(id,null);return null}
      const row=cacheProject(mapProject(snapshot));
      return row;
    },{loading:false,monitor:{area:'legacy_projects',action:'load_own'}});
  }
  function getOwn(){
    const id=ownId();return id?(cache.get(id)||null):null;
  }
  function list(){
    return [...cache.values()].filter(Boolean).sort((a,b)=>timestampValue(b.updatedAt)-timestampValue(a.updatedAt));
  }
  async function loadAll({force=false}={}){
    if(window.state?.role!=='manager')return [];
    return services.run(async()=>{
      const ctx=await context(),{firestore}=ctx.modules,role=managerRole(),started=Date.now();
      let snapshots=[];
      if(role==='admin'){
        const snapshot=await firestore.getDocs(firestore.collection(ctx.db,'legacy_projects'));
        snapshots=snapshot.docs;
      }else if(role==='coordinator'){
        const unitIds=[...new Set((session().user?.unitIds||[]).map(String).filter(Boolean))];
        const batches=await Promise.all(unitIds.map(unitId=>firestore.getDocs(firestore.query(
          firestore.collection(ctx.db,'legacy_projects'),firestore.where('unitId','==',unitId)
        ))));
        snapshots=batches.flatMap(snapshot=>snapshot.docs);
      }else{
        cache.clear();return [];
      }
      cache.clear();
      snapshots.forEach(snapshot=>cacheProject(mapProject(snapshot)));
      services.recordQuery?.('legacy_projects/list',started,snapshots.length,{role,unitQueries:role==='coordinator'});
      return list();
    },{loading:false,monitor:{area:'legacy_projects',action:'list'}});
  }
  async function saveOwn(patch={}){
    assertVolunteer();
    const id=ownId(),existing=await loadOwn();
    if(existing?.status==='completed')return existing;
    const current=session(),application=window.state?.currentApplication||{},profile=current.profile||{};
    const ownerName=profile.name||profile.fullName||(Array.isArray(application.participantNames)?application.participantNames[0]:'')||current.email||'Voluntário';
    return services.run(async()=>{
      const ctx=await context(),{firestore}=ctx.modules,stamp=firestore.serverTimestamp();
      const next={
        ...(existing||{}),
        ...patch,
        applicationId:applicationId(),
        ownerUid:uid(),
        ownerName,
        unitId:String(application.unitId||''),
        unitName:application.unitName||String(application.unitId||'').replace(/^./,c=>c.toUpperCase()),
        createdAt:existing?.createdAt||stamp,
        updatedAt:stamp
      };
      await firestore.setDoc(firestore.doc(ctx.db,'legacy_projects',id),next,{merge:true});
      const saved={...next,id,updatedAt:now()};
      cacheProject(saved);return saved;
    },{loading:false,monitor:{area:'legacy_projects',action:existing?'update_own':'create_own'}});
  }
  async function update(id,patch={}){
    if(window.state?.role!=='manager')throw new Error('Apenas a equipe administrativa pode revisar projetos.');
    const key=String(id||'');if(!key)throw new Error('Projeto não identificado.');
    return services.run(async()=>{
      const ctx=await context(),{firestore}=ctx.modules;
      await firestore.updateDoc(firestore.doc(ctx.db,'legacy_projects',key),{...patch,updatedAt:firestore.serverTimestamp()});
      const snapshot=await firestore.getDoc(firestore.doc(ctx.db,'legacy_projects',key));
      if(!snapshot.exists())throw new Error('Projeto não encontrado após a atualização.');
      return cacheProject(mapProject(snapshot));
    },{loading:false,monitor:{area:'legacy_projects',action:'review_update'}});
  }
  function onboardingKey(){return ONBOARD+':'+(uid()||'anon')}
  function onboardingDone(){try{return localStorage.getItem(onboardingKey())==='1'}catch{return false}}
  function completeOnboarding(){try{localStorage.setItem(onboardingKey(),'1')}catch{}}
  function resetOnboarding(){try{localStorage.removeItem(onboardingKey())}catch{}}
  window.OleiroProjects={getOwn,loadOwn,list,loadAll,saveOwn,update,onboardingDone,completeOnboarding,resetOnboarding,isPreview:false};
})();