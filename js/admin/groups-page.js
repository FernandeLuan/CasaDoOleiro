/* Página de Grupos da homologação: unidades lado a lado e edição inline de integrantes. */
(function groupsPage(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_GROUPS_PAGE__)return;
  window.__OLEIRO_GROUPS_PAGE__=true;

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const enc=value=>encodeURIComponent(String(value??''));
  let loadPromise=null;
  state.adminGroupsByUnit=state.adminGroupsByUnit||{};
  state.adminGroupsLoading=!!state.adminGroupsLoading;
  state.adminGroupsLoaded=!!state.adminGroupsLoaded;
  state.adminGroupsError=state.adminGroupsError||'';
  state.adminGroupEditing=state.adminGroupEditing||{};
  state.adminGroupOpen=state.adminGroupOpen||{};
  state.adminGroupSaving=state.adminGroupSaving||{};

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
      .groups-unit-body{padding:0 2px 12px 50px;display:grid;gap:9px}
      .groups-members-view{display:grid;grid-template-columns:minmax(0,1fr) 32px;gap:8px;align-items:start}
      .groups-unit-members{display:flex;flex-wrap:wrap;gap:5px;min-height:32px;align-items:center}
      .groups-unit-member{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);border-radius:999px;padding:5px 8px;background:var(--surface-2);font-size:.58rem;color:var(--text)}
      .groups-unit-member::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--primary)}
      .groups-unit-empty{font-size:.58rem;color:var(--muted);padding:7px 0}
      .groups-inline-edit-toggle{width:32px;height:32px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--primary);display:grid;place-items:center;cursor:pointer;font-size:.66rem;transition:.15s ease}
      .groups-inline-edit-toggle:hover{background:var(--primary-soft);border-color:color-mix(in srgb,var(--primary) 28%,var(--border))}
      .groups-inline-edit-toggle.active{background:var(--primary);border-color:var(--primary);color:#fff}
      .groups-inline-editor{display:grid;gap:8px}
      .groups-inline-member-list{display:grid;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface)}
      .groups-inline-member-row{display:grid;grid-template-columns:minmax(0,1fr) 32px;gap:8px;align-items:center;min-height:42px;padding:5px 6px 5px 10px;border-bottom:1px solid var(--border)}
      .groups-inline-member-row:last-child{border-bottom:0}
      .groups-inline-member-row span{min-width:0;font-size:.66rem;color:var(--text);overflow-wrap:anywhere}
      .groups-inline-trash{width:30px;height:30px;border:1px solid color-mix(in srgb,var(--danger) 28%,var(--border));border-radius:9px;background:color-mix(in srgb,var(--danger) 12%,var(--surface));color:var(--danger);display:grid;place-items:center;cursor:pointer;font-size:.64rem}
      .groups-inline-trash:hover{background:color-mix(in srgb,var(--danger) 20%,var(--surface));border-color:color-mix(in srgb,var(--danger) 42%,var(--border))}
      .groups-inline-add{display:grid;grid-template-columns:minmax(0,1fr) 36px;gap:7px;align-items:center}
      .groups-inline-add input{width:100%;height:36px;min-width:0;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);padding:0 10px;font:inherit;font-size:.64rem;outline:none}
      .groups-inline-add input:focus{border-color:var(--primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--primary) 10%,transparent)}
      .groups-inline-add button{width:36px;height:36px;border:0;border-radius:10px;background:var(--primary);color:#fff;display:grid;place-items:center;cursor:pointer}
      .groups-inline-add button:disabled,.groups-inline-trash:disabled,.groups-inline-edit-toggle:disabled{opacity:.5;cursor:wait}
      .groups-inline-saving{display:inline-flex;align-items:center;gap:6px;font-size:.56rem;color:var(--muted)}
      .groups-page-loading,.groups-page-error{grid-column:1/-1;min-height:180px;display:grid;place-items:center;text-align:center}
      @media(max-width:1023px){.groups-page-grid{grid-template-columns:1fr}}
      @media(max-width:520px){.groups-unit-column{padding:12px}.groups-unit-body{padding-left:48px}.groups-inline-add{grid-template-columns:minmax(0,1fr) 36px}}
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

  function groupKey(unitId,groupId){return `${String(unitId)}::${String(groupId)}`}
  function findGroup(unitId,groupId){return (state.adminGroupsByUnit?.[String(unitId)]||[]).find(group=>String(group.id)===String(groupId))||null}

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

  async function persistMembers(unitId,groupId,members){
    const key=groupKey(unitId,groupId),group=findGroup(unitId,groupId);
    if(!group||state.adminGroupSaving[key])return false;
    if(!window.OleiroServices?.groups?.update){showToast?.('Serviço de grupos indisponível.');return false}
    state.adminGroupSaving[key]=true;
    if(state.managerPage==='groups')window.render?.();
    try{
      const clean=members.map(value=>String(value||'').trim()).filter(Boolean);
      await window.OleiroServices.groups.update(group.id,{members:clean});
      state.adminGroupsByUnit[String(unitId)]=(state.adminGroupsByUnit[String(unitId)]||[]).map(row=>String(row.id)===String(groupId)?{...row,members:clean}:row);
      return true;
    }catch(error){
      console.error('Falha ao atualizar integrantes do grupo:',error);
      showToast?.(error?.message||'Não foi possível atualizar o grupo.');
      return false;
    }finally{
      delete state.adminGroupSaving[key];
      if(state.managerPage==='groups')window.render?.();
    }
  }

  window.setAdminGroupOpen=function(encodedUnitId,encodedGroupId,open){
    state.adminGroupOpen[groupKey(decodeURIComponent(encodedUnitId),decodeURIComponent(encodedGroupId))]=!!open;
  };

  window.toggleInlineGroupEditor=function(encodedUnitId,encodedGroupId,event){
    event?.preventDefault?.();event?.stopPropagation?.();
    const unitId=decodeURIComponent(encodedUnitId),groupId=decodeURIComponent(encodedGroupId),key=groupKey(unitId,groupId);
    state.adminGroupOpen[key]=true;
    state.adminGroupEditing[key]=!state.adminGroupEditing[key];
    window.render?.();
    if(state.adminGroupEditing[key])requestAnimationFrame(()=>document.getElementById(`groupAdd-${CSS.escape(key)}`)?.focus());
  };

  window.addInlineGroupMember=async function(encodedUnitId,encodedGroupId){
    const unitId=decodeURIComponent(encodedUnitId),groupId=decodeURIComponent(encodedGroupId),key=groupKey(unitId,groupId),group=findGroup(unitId,groupId);
    if(!group||state.adminGroupSaving[key])return;
    const input=document.getElementById(`groupAdd-${key}`),name=String(input?.value||'').trim();
    if(!name)return showToast?.('Informe o nome do integrante.');
    const members=Array.isArray(group.members)?[...group.members]:[];
    if(members.some(member=>String(member).trim().localeCompare(name,'pt-BR',{sensitivity:'base'})===0))return showToast?.('Este integrante já está no grupo.');
    const capacity=Math.max(1,Number(group.capacity||5));
    if(members.length>=capacity)return showToast?.(`O grupo já atingiu a capacidade de ${capacity} integrantes.`);
    state.adminGroupOpen[key]=true;state.adminGroupEditing[key]=true;
    const saved=await persistMembers(unitId,groupId,[...members,name]);
    if(saved)showToast?.('Integrante adicionado.');
  };

  window.removeInlineGroupMember=async function(encodedUnitId,encodedGroupId,index){
    const unitId=decodeURIComponent(encodedUnitId),groupId=decodeURIComponent(encodedGroupId),key=groupKey(unitId,groupId),group=findGroup(unitId,groupId);
    if(!group||state.adminGroupSaving[key])return;
    const members=Array.isArray(group.members)?[...group.members]:[];
    const position=Number(index);if(position<0||position>=members.length)return;
    const removed=members[position];members.splice(position,1);
    state.adminGroupOpen[key]=true;state.adminGroupEditing[key]=true;
    const saved=await persistMembers(unitId,groupId,members);
    if(saved)showToast?.(`${removed} removido do grupo.`);
  };

  function editorHtml(unitId,group,members,busy){
    const key=groupKey(unitId,group.id),unitArg=enc(unitId),groupArg=enc(group.id);
    return `<div class="groups-inline-editor">${members.length?`<div class="groups-inline-member-list">${members.map((name,index)=>`<div class="groups-inline-member-row"><span>${esc(name)}</span><button class="groups-inline-trash" type="button" title="Remover ${esc(name)}" aria-label="Remover ${esc(name)}" onclick="removeInlineGroupMember('${unitArg}','${groupArg}',${index})" ${busy?'disabled':''}><i class="fa-solid fa-trash"></i></button></div>`).join('')}</div>`:'<span class="groups-unit-empty">Nenhum integrante cadastrado.</span>'}<div class="groups-inline-add"><input id="groupAdd-${esc(key)}" type="text" maxlength="80" placeholder="Nome do integrante" aria-label="Nome do novo integrante" onkeydown="if(event.key==='Enter'){event.preventDefault();addInlineGroupMember('${unitArg}','${groupArg}')}" ${busy?'disabled':''}><button type="button" title="Adicionar integrante" aria-label="Adicionar integrante" onclick="addInlineGroupMember('${unitArg}','${groupArg}')" ${busy?'disabled':''}><i class="fa-solid fa-plus"></i></button></div>${busy?'<span class="groups-inline-saving"><i class="fa-solid fa-circle-notch fa-spin"></i>Salvando...</span>':''}</div>`;
  }

  function groupBody(unitId,group){
    const members=Array.isArray(group.members)?group.members:[],key=groupKey(unitId,group.id),editing=!!state.adminGroupEditing[key],busy=!!state.adminGroupSaving[key],unitArg=enc(unitId),groupArg=enc(group.id);
    const toggle=`<button class="groups-inline-edit-toggle ${editing?'active':''}" type="button" title="${editing?'Concluir edição':'Editar integrantes'}" aria-label="${editing?'Concluir edição':'Editar integrantes'}" onclick="toggleInlineGroupEditor('${unitArg}','${groupArg}',event)" ${busy?'disabled':''}><i class="fa-solid ${editing?'fa-check':'fa-pen'}"></i></button>`;
    if(editing)return `<div class="groups-unit-body"><div class="groups-members-view"><div>${editorHtml(unitId,group,members,busy)}</div>${toggle}</div></div>`;
    return `<div class="groups-unit-body"><div class="groups-members-view"><div class="groups-unit-members">${members.length?members.map(name=>`<span class="groups-unit-member">${esc(name)}</span>`).join(''):'<span class="groups-unit-empty">Nenhum integrante cadastrado.</span>'}</div>${toggle}</div></div>`;
  }

  function groupRow(unitId,group){
    const code=String(group.code||group.id||'').replace(/^.*_/,'').toUpperCase(),members=Array.isArray(group.members)?group.members:[],key=groupKey(unitId,group.id),open=!!state.adminGroupOpen[key]||!!state.adminGroupEditing[key];
    return `<details class="groups-unit-group" ${open?'open':''} ontoggle="setAdminGroupOpen('${enc(unitId)}','${enc(group.id)}',this.open)"><summary><span class="groups-unit-avatar">${esc(code)}</span><span class="groups-unit-summary"><strong>Grupo ${esc(code)}</strong><span>${members.length} ${members.length===1?'integrante':'integrantes'} · capacidade ${Number(group.capacity||5)}</span></span><i class="fa-solid fa-chevron-down groups-unit-chevron"></i></summary>${groupBody(unitId,group)}</details>`;
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

  window.reloadAllAdminGroups=function(){return loadAllGroups({force:true})};
  window.managerGroups=managerGroups=function(){return groupsHtml()};

  installStyles();
  if(state.role==='manager'&&state.managerPage==='groups')window.render?.();
})();
