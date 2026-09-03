/* Página de Grupos da homologação: unidades lado a lado no desktop. */
(function groupsPage(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_GROUPS_PAGE__)return;
  window.__OLEIRO_GROUPS_PAGE__=true;

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let loadPromise=null;
  state.adminGroupsByUnit=state.adminGroupsByUnit||{};
  state.adminGroupsLoading=!!state.adminGroupsLoading;
  state.adminGroupsLoaded=!!state.adminGroupsLoaded;
  state.adminGroupsError=state.adminGroupsError||'';

  function installStyles(){
    if(document.getElementById('groupsPageStyles'))return;
    const style=document.createElement('style');
    style.id='groupsPageStyles';
    style.textContent=`
      .groups-page{width:100%;max-width:1320px;margin:0 auto;display:grid;gap:14px;padding-bottom:32px}
      .groups-page-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start}
      .groups-unit-column{min-width:0;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:15px;box-shadow:var(--shadow)}
      .groups-unit-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:1px 2px 12px;border-bottom:1px solid var(--border);margin-bottom:4px}
      .groups-unit-copy{min-width:0;display:grid;gap:2px}
      .groups-unit-copy strong{font-size:.82rem;color:var(--text)}
      .groups-unit-copy span{font-size:.57rem;color:var(--muted)}
      .groups-unit-status{flex:0 0 auto;border-radius:999px;padding:5px 8px;font-size:.5rem;font-weight:700;background:var(--surface-2);color:var(--muted)}
      .groups-unit-status.active{background:var(--primary-soft);color:var(--primary)}
      .groups-unit-list{display:grid;gap:0}
      .groups-unit-group{border-bottom:1px solid var(--border)}
      .groups-unit-group:last-child{border-bottom:0}
      .groups-unit-group summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:10px;padding:12px 2px;color:var(--text)}
      .groups-unit-group summary::-webkit-details-marker{display:none}
      .groups-unit-avatar{width:38px;height:38px;border-radius:13px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:.76rem;font-weight:800}
      .groups-unit-summary{min-width:0;display:grid;gap:3px}
      .groups-unit-summary strong{font-size:.7rem;color:var(--text)}
      .groups-unit-summary span{font-size:.56rem;color:var(--muted)}
      .groups-unit-chevron{font-size:.62rem;color:var(--muted);transition:transform .16s ease}
      .groups-unit-group[open] .groups-unit-chevron{transform:rotate(180deg)}
      .groups-unit-body{padding:0 2px 12px 50px;display:grid;gap:8px}
      .groups-unit-members{display:flex;flex-wrap:wrap;gap:5px}
      .groups-unit-member{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);border-radius:999px;padding:5px 8px;background:var(--surface-2);font-size:.54rem;color:var(--text)}
      .groups-unit-member::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--primary)}
      .groups-unit-empty{font-size:.56rem;color:var(--muted);padding:2px 0}
      .groups-unit-edit{justify-self:start;min-height:34px!important;padding:6px 10px!important;font-size:.57rem!important}
      .groups-page-loading,.groups-page-error{grid-column:1/-1;min-height:180px;display:grid;place-items:center;text-align:center}
      @media(max-width:1023px){.groups-page-grid{grid-template-columns:1fr}}
      @media(max-width:520px){.groups-unit-column{padding:12px}.groups-unit-body{padding-left:48px}}
    `;
    document.head.appendChild(style);
  }

  function pageTitle(){
    return `<header class="admin-page-title"><span class="eyebrow">Grupos</span><h1>Gestão de grupos</h1><p>Organize os grupos utilizados nos planejamentos de cada unidade.</p></header>`;
  }

  function units(){
    const rows=Array.isArray(state.units)?state.units:[];
    const preferred=['rodeio','indaial'];
    return [...rows].sort((a,b)=>{
      const ai=preferred.indexOf(String(a.id||'').toLowerCase()),bi=preferred.indexOf(String(b.id||'').toLowerCase());
      if(ai>=0||bi>=0)return (ai<0?99:ai)-(bi<0?99:bi);
      return String(a.name||a.id).localeCompare(String(b.name||b.id),'pt-BR');
    });
  }

  async function loadAllGroups({force=false}={}){
    if(loadPromise)return loadPromise;
    if(state.adminGroupsLoaded&&!force)return state.adminGroupsByUnit;
    const rows=units();
    if(!rows.length)return state.adminGroupsByUnit;
    state.adminGroupsLoading=true;state.adminGroupsError='';
    if(state.managerPage==='groups')window.render?.();
    loadPromise=Promise.all(rows.map(async unit=>{
      const unitId=String(unit.id);
      if(force)window.OleiroServices?.groups?.invalidate?.(unitId);
      const groups=window.OleiroServices?.groups?.ensureDefaults?await window.OleiroServices.groups.ensureDefaults(unitId):[];
      return [unitId,groups||[]];
    })).then(entries=>{
      state.adminGroupsByUnit=Object.fromEntries(entries);
      state.adminGroupsLoaded=true;
      return state.adminGroupsByUnit;
    }).catch(error=>{
      console.error('Falha ao carregar grupos por unidade:',error);
      state.adminGroupsError=error?.message||'Não foi possível carregar os grupos.';
      return state.adminGroupsByUnit;
    }).finally(()=>{
      state.adminGroupsLoading=false;loadPromise=null;
      if(state.managerPage==='groups')window.render?.();
    });
    return loadPromise;
  }

  function groupBody(unitId,group){
    const members=Array.isArray(group.members)?group.members:[];
    return `<div class="groups-unit-body"><div class="groups-unit-members">${members.length?members.map(name=>`<span class="groups-unit-member">${esc(name)}</span>`).join(''):'<span class="groups-unit-empty">Nenhum integrante cadastrado.</span>'}</div><button class="btn btn-soft groups-unit-edit" type="button" onclick="openGroupColumnEditor('${esc(unitId)}','${esc(String(group.id))}')"><i class="fa-solid fa-pen"></i>Editar grupo</button></div>`;
  }

  function groupRow(unitId,group){
    const code=String(group.code||group.id||'').replace(/^.*_/,'').toUpperCase(),members=Array.isArray(group.members)?group.members:[];
    return `<details class="groups-unit-group"><summary><span class="groups-unit-avatar">${esc(code)}</span><span class="groups-unit-summary"><strong>Grupo ${esc(code)}</strong><span>${members.length} ${members.length===1?'integrante':'integrantes'} · capacidade ${Number(group.capacity||5)}</span></span><i class="fa-solid fa-chevron-down groups-unit-chevron"></i></summary>${groupBody(unitId,group)}</details>`;
  }

  function unitColumn(unit){
    const unitId=String(unit.id),groups=Array.isArray(state.adminGroupsByUnit?.[unitId])?state.adminGroupsByUnit[unitId]:[],active=unit.active!==false;
    return `<section class="groups-unit-column"><header class="groups-unit-head"><div class="groups-unit-copy"><strong>${esc(unit.name||unitId)}</strong><span>Grupos A, B, C e D</span></div><span class="groups-unit-status ${active?'active':''}">${active?'Ativa':'Inativa'}</span></header><div class="groups-unit-list">${groups.length?groups.map(group=>groupRow(unitId,group)).join(''):'<div class="groups-unit-empty" style="padding:18px 2px">Nenhum grupo cadastrado.</div>'}</div></section>`;
  }

  function groupsHtml(){
    const rows=units();
    if(!state.adminGroupsLoaded&&!state.adminGroupsLoading)queueMicrotask(()=>loadAllGroups());
    let body='';
    if(state.adminGroupsError)body=`<div class="notice danger groups-page-error"><div>${esc(state.adminGroupsError)}</div></div>`;
    else if(state.adminGroupsLoading&&!state.adminGroupsLoaded)body='<div class="empty groups-page-loading"><div><i class="fa-solid fa-circle-notch fa-spin"></i><br>Carregando grupos das unidades...</div></div>';
    else if(!rows.length)body='<div class="empty groups-page-loading">Nenhuma unidade cadastrada.</div>';
    else body=rows.map(unitColumn).join('');
    return `<section class="admin-groups-page groups-page compact-page-top">${pageTitle()}<div class="groups-page-grid">${body}</div></section>`;
  }

  window.openGroupColumnEditor=function(unitId,groupId){
    const groups=state.adminGroupsByUnit?.[String(unitId)]||[];
    state.groupUnitId=String(unitId);
    state.groups=groups;
    state.groupsLoaded=true;
    state.groupsUnitId=String(unitId);
    if(typeof editGroup==='function')editGroup(groupId);
  };

  window.reloadAllAdminGroups=function(){return loadAllGroups({force:true})};
  window.managerGroups=managerGroups=function(){return groupsHtml()};

  installStyles();
  if(state.role==='manager'&&state.managerPage==='groups')window.render?.();
})();
