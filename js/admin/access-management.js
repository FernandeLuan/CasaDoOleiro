/* Administração do acesso no plano Spark: leitura no app; mutações privilegiadas via Cloud Shell/Admin SDK. */
(function accessManagement(){
  state.participantAccessCache=state.participantAccessCache||{};
  const basePersonTabContent=personTabContent;
  const baseOpenPerson=openPerson;

  function accessCache(id){return state.participantAccessCache[String(id)]||null}
  async function hydrateParticipantAccess(p,{force=false}={}){
    if(!p?.id||!window.OleiroServices?.users?.getByIds)return null;
    const key=String(p.id);if(!force&&accessCache(key))return accessCache(key);
    const rows=await window.OleiroServices.users.getByIds(p.participantUids||[]),map={};
    rows.forEach(row=>map[String(row.id)]=row);state.participantAccessCache[key]=map;return map;
  }
  function participantRows(p){
    const uids=Array.isArray(p.participantUids)?p.participantUids:[],names=Array.isArray(p.participantNames)?p.participantNames:[],emails=Array.isArray(p.participantEmails)?p.participantEmails:[],cache=accessCache(p.id);
    if(!uids.length)return '<div class="empty">Nenhum acesso vinculado.</div>';
    if(!cache)return '<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando acessos...</div>';
    return uids.map((uid,index)=>{const access=cache[String(uid)]||{},email=emails[index]||access.email||'',name=names[index]||p.name||'Voluntário',first=access.firstPortalAccessAt;return `<div class="access-admin-row"><div class="access-admin-main"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(email||'—')}</span><small>${first?'Primeiro acesso já realizado':'Ainda não acessou o portal'}</small></div></div>`}).join('');
  }
  function accessPanel(p){
    return `<div class="card access-admin-card" style="margin-top:10px"><div class="access-admin-head"><div><span class="eyebrow">Acesso</span><h3>Conta do voluntário</h3></div></div><div class="access-admin-list">${participantRows(p)}</div><div class="notice" style="margin-top:12px"><i class="fa-solid fa-shield-halved"></i><div>Alteração de e-mail e exclusão definitiva são operações administrativas protegidas e executadas pelo Cloud Shell.</div></div></div>`;
  }

  personTabContent=function(p,tab){let html=basePersonTabContent(p,tab);if(tab==='overview')html+=accessPanel(p);return html};
  openPerson=async function(id,tab='overview'){
    const result=baseOpenPerson(id,tab),p=candidateById(id);
    if(p&&!accessCache(p.id)){hydrateParticipantAccess(p).then(()=>refreshOpenPersonModal?.(p.id)).catch(error=>console.error('Não foi possível carregar os acessos:',error))}
    return result;
  };

  window.personTabContent=personTabContent;window.openPerson=openPerson;
})();
