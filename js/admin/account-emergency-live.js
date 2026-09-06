/* Contato de emergência da Conta vem diretamente dos perfis, sem recarregar a tela a cada entrada. */
(function accountEmergencyLive(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_ACCOUNT_EMERGENCY_LIVE__)return;
  window.__OLEIRO_ACCOUNT_EMERGENCY_LIVE__=true;

  const inflight=new Map();
  const profileCache=new Map();
  const safe=value=>encodeURIComponent(String(value??''));
  const normalized=value=>window.OleiroServices?.profiles?.normalizeEmergencyContact?.(value)||{
    name:String(value?.name||'').trim(),relationship:String(value?.relationship||'').trim(),phone:String(value?.phone||'').trim()
  };
  const hasContact=value=>{const row=normalized(value);return !!(row.name||row.relationship||row.phone)};

  function currentPerson(){
    if(typeof state==='undefined'||state.managerPage!=='planning'||state.managerPlanningTab!=='account'||typeof candidateById!=='function')return null;
    return candidateById(state.managerPlanningPersonId);
  }

  function orderedProfiles(p,rows){
    const uids=(p?.participantUids||[]).map(String);
    const byId=new Map((rows||[]).map(row=>[String(row?.id||''),row]));
    return uids.map((uid,index)=>byId.get(uid)||rows?.[index]||{id:uid});
  }

  function cacheProfiles(rows){
    (rows||[]).forEach(row=>{const id=String(row?.id||'');if(id)profileCache.set(id,row)});
  }

  function cachedProfilesFor(p){
    const uids=(p?.participantUids||[]).map(String).filter(Boolean);
    if(!uids.length)return [];
    const rows=uids.map(uid=>profileCache.get(uid)).filter(Boolean);
    return rows.length===uids.length?orderedProfiles(p,rows):null;
  }

  async function ensureProfiles(p,{force=false}={}){
    if(!p?.id)return [];
    const uids=(p.participantUids||[]).map(String).filter(Boolean);
    if(!uids.length){p.participantProfiles=[];p.emergencyProfilesLoaded=true;return []}
    if(!force&&p.emergencyProfilesLoaded&&Array.isArray(p.participantProfiles)&&p.participantProfiles.length>=uids.length){
      cacheProfiles(p.participantProfiles);return p.participantProfiles;
    }
    if(!force){
      const cached=cachedProfilesFor(p);
      if(cached){p.participantProfiles=cached;p.emergencyProfilesLoaded=true;return cached}
    }
    const key=String(p.id);
    if(inflight.has(key))return inflight.get(key);
    if(!window.OleiroServices?.profiles?.getByIds)return p.participantProfiles||[];
    p.emergencyProfilesLoading=true;
    const task=window.OleiroServices.profiles.getByIds(uids).then(rows=>{
      p.participantProfiles=orderedProfiles(p,rows||[]);
      cacheProfiles(p.participantProfiles);
      p.emergencyProfilesLoaded=true;
      p.emergencyProfilesLoading=false;
      return p.participantProfiles;
    }).catch(error=>{
      p.emergencyProfilesLoading=false;
      throw error;
    }).finally(()=>inflight.delete(key));
    inflight.set(key,task);return task;
  }

  function emergencyFor(p,index){return normalized(p?.participantProfiles?.[index]?.emergencyContact)}
  function emergencyHtml(contact){
    if(!hasContact(contact))return '<span class="account-empty-value-r70">Não informado</span>';
    const row=normalized(contact),parts=[];
    if(row.name)parts.push(`<strong>${escapeHtml(row.name)}</strong>`);
    if(row.relationship)parts.push(`<span>${escapeHtml(row.relationship)}</span>`);
    if(row.phone)parts.push(`<span>${escapeHtml(row.phone)}</span>`);
    return parts.join('');
  }

  function emergencyBlock(row){
    return row.querySelector('.account-person-emergency-inline-r71')||row.querySelector('.account-person-emergency-r70')||row.querySelector('.account-person-sections-r70 .account-person-emergency-r70');
  }

  function patchAccount(){
    const p=currentPerson();if(!p)return;
    const root=document.querySelector('.planning-detail-page .account-contact-card-r70');if(!root)return;
    const rows=[...root.querySelectorAll(':scope > .account-person-row')];
    rows.forEach((row,index)=>{
      const block=emergencyBlock(row);if(!block)return;
      const body=block.querySelector('.account-person-emergency-body-r70');if(!body)return;
      const contact=emergencyFor(p,index),has=hasContact(contact),html=emergencyHtml(contact);
      if(body.innerHTML!==html)body.innerHTML=html;
      const head=block.querySelector('.account-person-section-head-r70');if(!head)return;
      let button=head.querySelector('button');
      if(!button){button=document.createElement('button');button.type='button';button.className='account-emergency-action-r72';head.appendChild(button)}
      button.style.removeProperty('display');
      const buttonHtml=`<i class="fa-solid ${has?'fa-pen':'fa-plus'}"></i>${has?'Editar':'Adicionar'}`;
      if(button.innerHTML!==buttonHtml)button.innerHTML=buttonHtml;
      button.onclick=event=>{event.preventDefault();event.stopPropagation();window.openVolunteerEmergencyEditor(safe(p.id),index)};
    });
  }

  async function hydrateVisibleAccount(){
    const p=currentPerson();if(!p)return;
    try{await ensureProfiles(p)}catch(error){console.error('Falha ao carregar contato de emergência na Conta:',error)}
    if(currentPerson()?.id===p.id)patchAccount();
  }

  function prepareEmergencyEditor(p,index){
    const modal=modalRoot?.querySelector?.('.modal'),name=document.getElementById('editEmergencyName'),phone=document.getElementById('editEmergencyPhone'),save=document.getElementById('saveEmergencyContactButton');
    if(!modal||!name||!phone||!save)return;
    modal.classList.add('emergency-contact-editor-live');
    name.setAttribute('aria-required','true');phone.setAttribute('aria-required','true');
    if(!modal.querySelector('.emergency-required-hint')){
      const hint=document.createElement('p');hint.className='compact-hint emergency-required-hint';hint.textContent='Nome e telefone são obrigatórios para salvar.';
      modal.querySelector('.modal-body')?.prepend(hint);
    }
    const sync=()=>{save.disabled=!String(name.value||'').trim()||!String(phone.value||'').trim()};
    name.addEventListener('input',sync);phone.addEventListener('input',sync);sync();
  }

  const baseOpenEditor=window.openVolunteerEmergencyEditor;
  if(typeof baseOpenEditor==='function'){
    window.openVolunteerEmergencyEditor=async function(encodedId,index){
      const id=decodeURIComponent(encodedId),p=typeof candidateById==='function'?candidateById(id):null;
      if(p)try{await ensureProfiles(p)}catch(error){console.error(error)}
      const result=baseOpenEditor(encodedId,index);
      if(p)prepareEmergencyEditor(p,Number(index));
      return result;
    };
    openVolunteerEmergencyEditor=window.openVolunteerEmergencyEditor;
  }

  const baseSave=window.saveVolunteerEmergencyContact;
  if(typeof baseSave==='function'){
    window.saveVolunteerEmergencyContact=async function(encodedId,index){
      const result=await baseSave(encodedId,index),id=decodeURIComponent(encodedId),p=typeof candidateById==='function'?candidateById(id):null;
      if(p&&Array.isArray(p.participantProfiles))cacheProfiles(p.participantProfiles);
      patchAccount();return result;
    };
    saveVolunteerEmergencyContact=window.saveVolunteerEmergencyContact;
  }

  const baseClear=window.clearVolunteerEmergencyContact;
  if(typeof baseClear==='function'){
    window.clearVolunteerEmergencyContact=async function(encodedId,index){
      const result=await baseClear(encodedId,index),id=decodeURIComponent(encodedId),p=typeof candidateById==='function'?candidateById(id):null;
      if(p&&Array.isArray(p.participantProfiles))cacheProfiles(p.participantProfiles);
      patchAccount();return result;
    };
    clearVolunteerEmergencyContact=window.clearVolunteerEmergencyContact;
  }

  const baseRenderManager=typeof window.renderManager==='function'?window.renderManager:null;
  if(baseRenderManager){
    renderManager=function(){
      const result=baseRenderManager();
      queueMicrotask(()=>{patchAccount();hydrateVisibleAccount()});
      return result;
    };
    window.renderManager=renderManager;render=function(){return renderManager()};window.render=render;
  }

  requestAnimationFrame(()=>{patchAccount();hydrateVisibleAccount()});
})();
