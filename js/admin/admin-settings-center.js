/* Central de configurações e gestão real de administradores. */
(function adminSettingsCenter(){
  if(!/\/admin\//.test(location.pathname)||window.__OLEIRO_ADMIN_SETTINGS_CENTER__)return;
  window.__OLEIRO_ADMIN_SETTINGS_CENTER__=true;
  const $=s=>document.querySelector(s);
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isAdmin=()=>String(state.currentSession?.user?.role||'')==='admin';
  const services=()=>window.OleiroServices;
  const roleLabel=role=>({admin:'Administrador',coordinator:'Coordenador',activity_assistant:'Assistente de atividades'}[role]||'Acesso');
  function styles(){
    if($('#adminSettingsCenterStyles'))return;
    const s=document.createElement('style');s.id='adminSettingsCenterStyles';
    s.textContent=`
      .modal.admin-settings-center{width:min(720px,calc(100vw - 20px))!important;max-width:720px!important;max-height:min(90vh,820px)!important}
      .admin-settings-center .modal-head{padding:20px 22px 14px!important;text-align:left!important}
      .admin-settings-center .modal-head h2{font-size:1.05rem!important;text-align:left!important}
      .admin-settings-center .modal-body{padding:18px 22px 22px!important}
      .asc-wrap{display:grid;gap:16px;color:var(--text)}
      .asc-intro{display:flex;align-items:center;gap:13px;padding:15px;border:1px solid var(--border);border-radius:16px;background:var(--surface)}
      .asc-intro-icon{width:44px;height:44px;flex:none;display:grid;place-items:center;border-radius:14px;background:var(--primary-soft);color:var(--primary);font-size:1rem}
      .asc-intro h3{font-size:.82rem;margin:0 0 3px}.asc-intro p{font-size:.62rem;line-height:1.45;color:var(--muted);margin:0}
      .asc-section{display:grid;gap:9px}.asc-section-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.asc-section-head h3{font-size:.76rem;margin:0}.asc-section-head p{font-size:.58rem;color:var(--muted);margin:3px 0 0}
      .asc-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .asc-tile{border:1px solid var(--border);background:var(--surface);border-radius:14px;padding:13px;text-align:left;color:var(--text);display:flex;align-items:center;gap:10px;min-height:66px;cursor:pointer}
      .asc-tile i{color:var(--primary);font-size:.9rem;width:20px;text-align:center}.asc-tile span{display:grid;gap:3px}.asc-tile strong{font-size:.65rem}.asc-tile small{font-size:.53rem;color:var(--muted)}
      .asc-card{border:1px solid var(--border);border-radius:14px;background:var(--surface);padding:12px;display:grid;gap:10px}
      .asc-person{display:flex;align-items:center;gap:10px;min-width:0}.asc-avatar{width:36px;height:36px;flex:none;border-radius:12px;background:var(--surface-2);display:grid;place-items:center;color:var(--primary)}
      .asc-person-copy{min-width:0;display:grid;gap:3px;flex:1}.asc-person-copy strong{font-size:.65rem;overflow-wrap:anywhere}.asc-person-copy small{font-size:.54rem;color:var(--muted);overflow-wrap:anywhere}
      .asc-meta{display:flex;gap:6px;flex-wrap:wrap}.asc-pill{font-size:.5rem;font-weight:700;padding:5px 8px;border-radius:99px;background:var(--surface-2);color:var(--muted)}.asc-pill.active{background:var(--primary-soft);color:var(--primary)}.asc-pill.inactive{background:color-mix(in srgb,var(--danger) 10%,var(--surface));color:var(--danger)}
      .asc-row-actions{display:flex;gap:7px;flex-wrap:wrap}.asc-row-actions button{border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text);font-size:.55rem;font-weight:700;padding:8px 10px;cursor:pointer}.asc-row-actions button.danger{color:var(--danger)}
      .asc-form{display:grid;gap:11px}.asc-field{display:grid;gap:5px}.asc-field label{font-size:.58rem;font-weight:700;color:var(--text)}.asc-field input,.asc-field select{width:100%;min-height:42px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);padding:9px 11px;font:inherit;font-size:.65rem}.asc-help{font-size:.53rem;line-height:1.45;color:var(--muted)}
      .asc-unit-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.asc-unit-check{display:flex;gap:7px;align-items:center;padding:8px;border:1px solid var(--border);border-radius:9px;font-size:.56rem}
      .asc-footer{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}.asc-empty{border:1px dashed var(--border);border-radius:13px;padding:18px;text-align:center;color:var(--muted);font-size:.6rem}
      .asc-danger-note{padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--warning,#d99a2b) 10%,var(--surface));font-size:.55rem;line-height:1.45;color:var(--text)}

      .admin-settings-center .modal-head{display:flex;align-items:center;gap:10px}
      .asc-header-back,.asc-header-action{width:40px;height:40px;flex:none;border:0;border-radius:12px;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center;font-size:1rem;cursor:pointer}
      .asc-header-back{order:0}.admin-settings-center .modal-head>div{order:1;flex:1;min-width:0}.admin-settings-center .modal-head .modal-close{order:3}
      .asc-header-action{order:2;background:var(--primary);color:#fff}
      .asc-admin-list{display:grid;gap:12px}.asc-admin-card{padding:14px}
      .asc-admin-form{display:grid;gap:14px}.asc-admin-form .field{display:grid;gap:6px}
      .asc-admin-form .field label{font-size:.68rem;font-weight:700;color:var(--text)}
      .asc-admin-form .input,.asc-admin-form .select{width:100%;min-height:48px;border:1px solid var(--border);border-radius:13px;padding:11px 13px;background:var(--surface);color:var(--text);font:inherit;font-size:.82rem}
      .asc-admin-form-footer .btn{width:100%;min-height:50px;border-radius:13px;font-size:.78rem}
      .asc-theme-switch{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:4px;border:1px solid var(--border);border-radius:13px;background:var(--surface)}
      .asc-theme-switch button{min-height:42px;border:0;border-radius:9px;background:transparent;color:var(--muted);font-size:.68rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}
      .asc-theme-switch button.active{background:var(--primary);color:#fff}
      .asc-release-card .admin-release-items{display:grid;gap:8px;grid-column:1/-1}
      .asc-release-card .admin-release-item{display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;padding:10px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
      .asc-release-card .admin-release-item>span{width:34px;height:34px;border-radius:10px;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center}
      .asc-release-card .admin-release-item strong{font-size:.65rem}
      .asc-release-card .admin-release-item p{margin:3px 0 0;font-size:.58rem;line-height:1.45;color:var(--muted)}
      .asc-release-card .admin-release-details{display:none!important}
      .asc-category-grid{display:grid;grid-template-columns:1fr;gap:10px}
      .asc-category-grid .asc-tile{min-height:76px;padding:16px;border-radius:16px}
      .asc-category-grid .asc-tile strong{font-size:.72rem}
      .asc-category-grid .asc-tile small{font-size:.58rem}
      .asc-tile .asc-tile-chevron{margin-left:auto;width:auto;color:var(--muted);font-size:.72rem}
      .asc-back{display:inline-flex;align-items:center;gap:8px;width:max-content;border:0;background:transparent;color:var(--primary);font:inherit;font-size:.62rem;font-weight:700;padding:8px 2px;cursor:pointer}
      .asc-release-card .release-info{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px}
      .asc-release-card .release-info p{margin:0!important;padding:10px 11px;border:1px solid var(--border);border-radius:11px;background:var(--surface-2);font-size:.58rem!important;line-height:1.4;color:var(--muted)}
      .asc-release-card .release-info strong{color:var(--text)}
      .asc-release-card .admin-release-details{grid-column:1/-1}
      .asc-release-card .admin-release-version-whatsnew{grid-column:1/-1}
      .admin-content-r62>.app-header .header-actions .icon-btn{width:44px;height:44px;border-radius:14px}
      #navRoot .bottom-nav .nav-btn.nav-logout{color:var(--danger)!important}
      #navRoot .bottom-nav .nav-btn.nav-logout i{color:var(--danger)!important}
      #navRoot .bottom-nav .nav-btn.nav-logout span{color:var(--danger)!important}
      @media(max-width:520px){.asc-release-card .release-info{grid-template-columns:1fr}}

      @media(max-width:520px){.admin-settings-center .modal-head{padding:16px 16px 12px!important}.admin-settings-center .modal-body{padding:14px 16px 18px!important}.asc-actions{grid-template-columns:1fr}.asc-unit-list{grid-template-columns:1fr}.asc-section-head{align-items:flex-start}}
    `;document.head.appendChild(s);
  }
  function unitOptions(selected=[]){return (state.units||[]).filter(u=>u.active!==false).map(u=>'<label class="asc-unit-check"><input type="checkbox" name="adminUnit" value="'+esc(u.id)+'" '+(selected.includes(String(u.id))?'checked':'')+'> '+esc(u.name||u.id)+'</label>').join('')||'<small class="asc-help">Nenhuma unidade ativa cadastrada.</small>'}
  function openShell(title,html,footer='',withBack=false,withAdd=false){openModal(title,'',html,footer);const modal=$('.modal');modal?.classList.add('admin-settings-center');const head=modal?.querySelector('.modal-head');if(!head)return;if(withBack){const b=document.createElement('button');b.type='button';b.className='asc-header-back';b.setAttribute('aria-label','Voltar');b.innerHTML='<i class="fa-solid fa-arrow-left"></i>';b.onclick=()=>typeof withBack==='function'?withBack():window.openMyAccount();head.prepend(b)}if(withAdd){const b=document.createElement('button');b.type='button';b.className='asc-header-action';b.setAttribute('aria-label','Cadastrar administrador');b.innerHTML='<i class="fa-solid fa-plus"></i>';b.onclick=()=>window.openAdminCreateForm();head.insertBefore(b,head.querySelector('.modal-close'))}}
  function settingsTile(icon,title,description,action){
    return `<button class="asc-tile" type="button" onclick="${action}"><i class="fa-solid ${icon}"></i><span><strong>${title}</strong><small>${description}</small></span><i class="fa-solid fa-chevron-right asc-tile-chevron"></i></button>`;
  }
  function settingsIntro(title,description,icon='fa-gear'){
    return `<div class="asc-intro"><span class="asc-intro-icon"><i class="fa-solid ${icon}"></i></span><div><h3>${title}</h3><p>${description}</p></div></div>`;
  }
  function settingsHtml(){
    const categories=[
      ['fa-user','Minha conta','Dados e preferências pessoais','openSettingsCategory(\'account\')'],
      ['fa-house','Casa do Oleiro','Informações, unidades e grupos','openSettingsCategory(\'house\')'],
      ...(isAdmin()?[['fa-users-gear','Administração','Administradores e permissões de acesso','openSettingsCategory(\'admin\')']]:[]),
      ['fa-sliders','Sistema','Aparência, versão e informações técnicas','openSettingsCategory(\'system\')']
    ];
    return `<div class="modal-body"><div class="asc-wrap">
      <div class="asc-category-grid">${categories.map(([icon,title,description,action])=>settingsTile(icon,title,description,action)).join('')}</div>
    </div></div>`;
  }
  function settingsCategoryHtml(key){
    const session=state.currentSession||{},user=session.user||{},pref=state.themePreference||'system';
    if(key==='account')return `<div class="modal-body"><div class="asc-wrap">
      <section class="asc-card"><div class="asc-person"><span class="asc-avatar"><i class="fa-solid fa-user"></i></span><div class="asc-person-copy"><strong>${esc(user.displayName||user.name||'Conta administrativa')}</strong><small>${esc(session.email||'—')}</small></div></div></section>
    </div></div>`;
    if(key==='house')return `<div class="modal-body"><div class="asc-wrap">
      ${settingsIntro('Casa do Oleiro','Conteúdos e configurações operacionais.','fa-house')}
      <div class="asc-actions">
        ${settingsTile('fa-house','Informações da Casa','Rotina e orientações do portal',"openHouseInfo()")}
        ${settingsTile('fa-building','Unidades','Gerenciar unidades cadastradas',"openUnits()")}
        ${settingsTile('fa-people-group','Grupos','Gerenciar grupos e integrantes por unidade',"openAdminGroups()")}
      </div>
    </div></div>`;
    if(key==='admin')return '';
    return `<div class="modal-body"><div class="asc-wrap">
            <section class="asc-section"><div class="asc-section-head"><div><h3>Aparência</h3><p>Escolha como o painel será exibido neste dispositivo.</p></div></div>
        <div class="asc-card"><div class="asc-theme-switch" role="group" aria-label="Aparência"><button class="${pref==='system'?'active':''}" type="button" aria-pressed="${pref==='system'}" onclick="setAdminTheme('system')"><i class="fa-solid fa-circle-half-stroke"></i>Automático</button><button class="${pref==='light'?'active':''}" type="button" aria-pressed="${pref==='light'}" onclick="setAdminTheme('light')"><i class="fa-solid fa-sun"></i>Claro</button><button class="${pref==='dark'?'active':''}" type="button" aria-pressed="${pref==='dark'}" onclick="setAdminTheme('dark')"><i class="fa-solid fa-moon"></i>Escuro</button></div></div>
      </section>
      <section class="asc-section"><div class="asc-section-head"><div><h3>Versão do sistema</h3><p>Ambiente, publicação e histórico de atualizações.</p></div></div>
        <div class="asc-card asc-release-card">${typeof releaseInformationHtml==='function'?releaseInformationHtml():'<div class="asc-empty">Informações de versão indisponíveis.</div>'}</div>
      </section>
    </div></div>`;
  }
  window.openSettingsCategory=function(key){
    const labels={account:'Minha conta',house:'Casa do Oleiro',admin:'Administração',system:'Sistema'};
    if(key==='admin'&&!isAdmin()){showToast?.('Somente administradores podem acessar esta área.');return}
    if(key==='admin'){window.openAdminAccessManagement();return}openShell(labels[key]||'Configurações',settingsCategoryHtml(key),'',true);
  };
  window.openAdminGroups=function(){if(typeof closeModal==='function')closeModal();if(typeof navigateManager==='function')navigateManager('groups')};
  window.openMyAccount=function(){openShell('Configurações',settingsHtml())};
  window.setAdminTheme=function(target){window.setThemePreference?.(target);setTimeout(()=>window.openSettingsCategory('system'),0)};
  window.openAdminAccessManagement=async function(){
    if(!isAdmin()){showToast?.('Somente administradores podem gerenciar acessos.');return}
    openShell('Administradores e acessos','<div class="modal-body"><div class="asc-wrap"><div id="ascManagerList" class="asc-admin-list"><div class="asc-empty"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando administradores...</div></div></div></div>','',true,true);
    await loadManagers();
  };
  async function loadManagers(){
    const host=$('#ascManagerList');if(!host)return;
    try{
      const rows=await services().users.listManagers({force:true,includeInactive:true});
      host.innerHTML=rows.length?rows.map(row=>`<article class="asc-card"><div class="asc-person"><span class="asc-avatar"><i class="fa-solid fa-user-shield"></i></span><div class="asc-person-copy"><strong>${esc(row.displayName||row.name||'Nome não informado')}</strong><small>${esc(row.email||'E-mail não informado')}</small></div><span class="asc-pill ${row.active===true?'active':'inactive'}">${row.active===true?'Ativo':'Inativo'}</span></div><div class="asc-row-actions"><button onclick="editAdminAccess('${esc(row.id)}')">Editar perfil</button><button onclick="sendAdminReset('${esc(row.id)}')">Reenviar acesso</button>${row.id!==state.currentSession?.uid?'<button class="danger" onclick="toggleAdminAccess(\''+esc(row.id)+'\','+(row.active===true?'false':'true')+')">'+(row.active===true?'Suspender':'Reativar')+'</button>':''}</div></article>`).join(''):'<div class="asc-empty">Nenhuma conta administrativa encontrada.</div>';
      window.__oleiroManagerRows=rows;
    }catch(error){console.error(error);host.innerHTML='<div class="asc-empty">Não foi possível consultar os acessos. Verifique sua conexão e suas permissões.</div>'}
  }
  window.openAdminCreateForm=function(){
    if(!isAdmin())return;
    openShell('Cadastrar administrador',`<div class="modal-body"><form id="ascCreateForm" class="asc-admin-form">
      <div class="field"><label for="ascName">Nome completo</label><input id="ascName" class="input" name="name" required maxlength="100" autocomplete="name" placeholder="Nome do administrador"></div>
      <div class="field"><label for="ascEmail">E-mail de acesso</label><input id="ascEmail" class="input" name="email" type="email" required maxlength="160" autocomplete="email" placeholder="nome@exemplo.com"></div>
      <div class="field"><label for="ascRole">Nível de acesso</label><select id="ascRole" class="select" name="role" onchange="document.getElementById('ascUnitScope').hidden=this.value!=='coordinator'"><option value="admin">Administrador — acesso completo</option><option value="coordinator">Coordenador — limitado às unidades selecionadas</option></select></div>
      <div id="ascUnitScope" class="field" hidden><label>Unidades autorizadas</label><div class="asc-unit-list">${unitOptions()}</div><small class="asc-help">O coordenador só poderá administrar registros vinculados às unidades selecionadas.</small></div>
      <div class="asc-danger-note">Será criada uma conta real no Firebase Authentication. O novo usuário receberá um e-mail para definir a própria senha. Não compartilhe senhas temporárias.</div>
      <div class="asc-admin-form-footer"><button type="submit" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Criar administrador e enviar acesso</button></div>
    </form></div>`,'',()=>window.openAdminAccessManagement());
    $('#ascCreateForm')?.addEventListener('submit',createAdminAccount);
  };
  async function createAdminAccount(event){
    event.preventDefault();if(!isAdmin())return;
    const form=event.currentTarget,button=form.querySelector('[type="submit"]');button.disabled=true;button.textContent='Criando conta...';
    const name=form.elements.namedItem('name').value.trim(),email=form.elements.namedItem('email').value.trim().toLowerCase(),role=form.elements.namedItem('role').value,unitIds=[...form.querySelectorAll('[name="adminUnit"]:checked')].map(x=>x.value);
    try{
      if(role==='coordinator'&&!unitIds.length)throw new Error('Selecione ao menos uma unidade para o coordenador.');
      const result=await services().adminAccess.createAccount({name,email,role,unitIds,createdBy:state.currentSession.uid});
      if(!result.emailSent)showToast?.('Conta criada, mas o e-mail falhou. Use Reenviar acesso na lista.');
      services().users.invalidateManagers?.();showToast?.('Conta administrativa criada.');await window.openAdminAccessManagement();
    }catch(error){console.error('Falha ao criar administrador:',error);showToast?.(error.message||'Não foi possível criar a conta.');button.disabled=false;button.textContent='Criar conta e enviar acesso'}
  }
  window.editAdminAccess=function(uid){
    if(!isAdmin())return;const row=(window.__oleiroManagerRows||[]).find(x=>x.id===uid);if(!row)return;
    openShell('Editar permissões',`<div class="modal-body"><form id="ascEditForm" class="asc-form"><div class="asc-person"><span class="asc-avatar"><i class="fa-solid fa-user-shield"></i></span><div class="asc-person-copy"><strong>${esc(row.displayName||row.name||'Administrador')}</strong><small>${esc(row.email||'')}</small></div></div><div class="asc-field"><label for="ascEditRole">Nível de acesso</label><select id="ascEditRole"><option value="admin" ${row.role==='admin'?'selected':''}>Administrador — acesso completo</option><option value="coordinator" ${row.role==='coordinator'?'selected':''}>Coordenador — acesso por unidade</option></select></div><div class="asc-field" id="ascEditUnits" ${row.role==='coordinator'?'':'hidden'}><label>Unidades autorizadas</label><div class="asc-unit-list">${unitOptions(row.unitIds||[])}</div></div><div class="asc-footer"><button type="button" class="btn btn-outline" onclick="openAdminAccessManagement()">Cancelar</button><button type="submit" class="btn btn-primary">Salvar permissões</button></div></form></div>`);
    $('#ascEditRole').addEventListener('change',e=>$('#ascEditUnits').hidden=e.target.value!=='coordinator');
    $('#ascEditForm').addEventListener('submit',async e=>{e.preventDefault();const role=$('#ascEditRole').value,unitIds=[...document.querySelectorAll('[name="adminUnit"]:checked')].map(x=>x.value);const admins=(window.__oleiroManagerRows||[]).filter(r=>r.role==='admin'&&r.active===true);if(row.role==='admin'&&role!=='admin'&&admins.length<=1){showToast?.('Não é possível rebaixar o último administrador ativo.');return}if(role==='coordinator'&&!unitIds.length){showToast?.('Selecione ao menos uma unidade.');return}try{await services().adminAccess.updatePermissions(uid,{role,unitIds});showToast?.('Permissões atualizadas.');await window.openAdminAccessManagement()}catch(error){console.error(error);showToast?.('Não foi possível atualizar as permissões.')}});
  };
  window.toggleAdminAccess=async function(uid,active){
    if(!isAdmin()||uid===state.currentSession?.uid)return;
    const rows=window.__oleiroManagerRows||[],activeAdmins=rows.filter(r=>r.role==='admin'&&r.active===true);
    const target=rows.find(r=>r.id===uid);if(!target)return;
    if(target.role==='admin'&&!active&&activeAdmins.length<=1){showToast?.('Não é possível suspender o último administrador ativo.');return}
    try{await services().adminAccess.setActive(uid,active);showToast?.(active?'Acesso reativado.':'Acesso suspenso.');await loadManagers()}catch(error){console.error(error);showToast?.('Não foi possível alterar o acesso.')}
  };
  window.sendAdminReset=async function(uid){
    if(!isAdmin())return;const row=(window.__oleiroManagerRows||[]).find(x=>x.id===uid);if(!row?.email)return;
    try{await window.OleiroAuth.sendPasswordReset(row.email);showToast?.('E-mail para definir a senha enviado.')}catch(error){console.error(error);showToast?.(error.message||'Não foi possível enviar o e-mail.')}
  };
  styles();
})();