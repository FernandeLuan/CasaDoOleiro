/* Projeto/Legado — sandbox de homologação.
   Persistência local proposital para validar o produto sem tocar no Firestore de produção.
   A API foi mantida pequena para ser substituída depois por um adapter Firestore. */
(function initLegacyProjectService(){
  const STORE='oleiro.legacy-projects.preview.v1';
  const ONBOARD='oleiro.legacy-project-onboarding.preview.v1';

  function readStore(){
    try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{return {}}
  }
  function writeStore(rows){
    localStorage.setItem(STORE,JSON.stringify(rows||{}));
  }
  function now(){return new Date().toISOString()}
  function uid(){return String(window.state?.currentSession?.uid||'')}
  function applicationId(){return String(window.state?.currentApplication?.id||'')}
  function ownId(){return [applicationId(),uid()].filter(Boolean).join('__')}

  function getOwn(){
    const id=ownId();if(!id)return null;
    const row=readStore()[id];return row?{...row,id}:null;
  }
  function list(){
    return Object.entries(readStore()).map(([id,row])=>({...row,id}))
      .sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  }
  function saveOwn(patch={}){
    const id=ownId();if(!id)throw new Error('Sessão do voluntário indisponível.');
    const rows=readStore(),existing=rows[id]||{};
    const session=window.state?.currentSession||{},application=window.state?.currentApplication||{},profile=session.profile||{};
    const ownerName=profile.name||profile.fullName||(Array.isArray(application.participantNames)?application.participantNames[0]:'')||session.email||'Voluntário';
    const next={
      id,
      applicationId:applicationId(),
      ownerUid:uid(),
      ownerName,
      unitId:String(application.unitId||''),
      unitName:application.unitName||String(application.unitId||'').replace(/^./,c=>c.toUpperCase()),
      createdAt:existing.createdAt||now(),
      updatedAt:now(),
      status:existing.status||'draft',
      ...existing,
      ...patch
    };
    rows[id]=next;writeStore(rows);return {...next};
  }
  function update(id,patch={}){
    const rows=readStore(),existing=rows[String(id)];
    if(!existing)throw new Error('Projeto não encontrado.');
    rows[String(id)]={...existing,...patch,updatedAt:now()};
    writeStore(rows);return {...rows[String(id)],id:String(id)};
  }
  function removeOwn(){
    const id=ownId(),rows=readStore();if(id&&rows[id]){delete rows[id];writeStore(rows)}
  }
  function onboardingKey(){return `${ONBOARD}:${uid()||'anon'}`}
  function onboardingDone(){try{return localStorage.getItem(onboardingKey())==='1'}catch{return false}}
  function completeOnboarding(){try{localStorage.setItem(onboardingKey(),'1')}catch{}}
  function resetOnboarding(){try{localStorage.removeItem(onboardingKey())}catch{}}

  window.OleiroProjects={getOwn,list,saveOwn,update,removeOwn,onboardingDone,completeOnboarding,resetOnboarding,isPreview:true};
})();