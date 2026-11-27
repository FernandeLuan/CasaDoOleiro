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
      @media(max-width:520px){.admin-settings-center .modal-head{padding:16px 16px 12px!important}.admin-settings-center .modal-body{padding:14px 16px 18px!important}.asc-actions{grid-template-columns:1fr}.asc-unit-list{grid-template-columns:1fr}.asc-section-head{align-items:flex-start}}
    `;document.head.appendChild(s);
  }
  function unitOptions(selected=[]){return (state.units||[]).filter(u=>u.active!==false).map(u=>'<label class="asc-unit-check"><input type="checkbox" name="adminUnit" value="'+esc(u.id)+'" '+(selected.includes(String(u.id))?'checked':'')+'> '+esc(u.name||u.id)+'</label>').join('')||'<small class="asc-help">Nenhuma unidade ativa cadastrada.</small>'}
  function openShell(title,html,footer=''){openModal(title,'',html,footer);$('.modal')?.classList.add('admin-settings-center')}
  function settingsHtml(){
    const session=state.currentSession||{},user=session.user||{},pref=state.themePreference||'system';
    return `<div class="modal-body"><div class="asc-wrap">
      <section class="asc-intro"><span class="asc-intro-icon"><i class="fa-solid fa-gear"></i></span><div><h3>Configurações</h3><p>Preferências da sua conta, informações da Casa e controle dos acessos administrativos.</p></div></section>
      <section class="asc-section"><div class="asc-section-head"><div><h3>Minha conta</h3><p>Identificação e preferências pessoais.</p></div></div><div class="asc-card"><div class="asc-person"><span class="asc-avatar"><i class="fa-solid fa-user"></i></span><div class="asc-person-copy"><strong>${esc(user.displayName||user.name||'Conta administrativa')}</strong><small>${esc(session.email||'—')}</small></div><span class="asc-pill active">${esc(roleLabel(user.role))}</span></div><div class="asc-field"><label for="ascTheme">Aparência do painel</label><select id="ascTheme" onchange="setAdminTheme(this.value)"><option value="system" ${pref==='system'?'selected':''}>Seguir o dispositivo</option><option value="light" ${pref==='light'?'selected':''}>Claro</option><option value="dark" ${pref==='dark'?'selected':''}>Escuro</option></select></div></div></section>
      <section class="asc-section"><div class="asc-section-head"><div><h3>Casa do Oleiro</h3><p>Conteúdos e configurações operacionais.</p></div></div><div class="asc-actions"><button class="asc-tile" onclick="openHouseInfo()"><i class="fa-solid fa-house"></i><span><strong>Informações da Casa</strong><small>Rotina, orientações e unidades</small></span></button><button class="asc-tile" onclick="openUnits()"><i class="fa-solid fa-building"></i><span><strong>Unidades</strong><small>Gerenciar unidades cadastradas</small></span></button></div></section>
      ${isAdmin()?'<section class="asc-section"><div class="asc-section-head"><div><h3>Administração</h3><p>Gerencie quem pode acessar o painel e o que cada perfil pode fazer.</p></div></div><button class="asc-tile" onclick="openAdminAccessManagement()"><i class="fa-solid fa-users-gear"></i><span><strong>Administradores e acessos</strong><small>Consultar, cadastrar e ajustar permissões</small></span><i class="fa-solid fa-chevron-right"></i></button></section>':''}
      <section class="asc-section"><div class="asc-section-head"><div><h3>Sistema</h3><p>Informações técnicas e versão.</p></div></div><div class="asc-card">${typeof releaseInformationHtml==='function'?releaseInformationHtml():'Informações de versão indisponíveis.'}</div></section>
      <button class="btn btn-outline btn-block" style="width:100%;min-height:46px" onclick="confirmAdminLogout()"><i class="fa-solid fa-right-from-bracket"></i> Sair da conta</button>
    </div></div>`;
  }
  window.openMyAccount=function(){openShell('Configurações',settingsHtml())};
  window.setAdminTheme=function(target){window.setThemePreference?.(target);setTimeout(()=>window.openMyAccount(),0)};
  window.openAdminAccessManagement=async function(){
    if(!isAdmin()){showToast?.('Somente administradores podem gerenciar acessos.');return}
    openShell('Administradores e acessos','<div class="modal-body"><div class="asc-wrap"><div class="asc-intro"><span class="asc-intro-icon"><i class="fa-solid fa-shield-halved"></i></span><div><h3>Controle de acesso</h3><p>Contas administrativas vinculadas ao Firebase Authentication e ao cadastro de permissões.</p></div></div><div id="ascManagerList" class="asc-section"><div class="asc-empty"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando administradores...</div></div><div class="asc-footer"><button class="btn btn-outline" onclick="openMyAccount()">Voltar</button><button class="btn btn-primary" onclick="openAdminCreateForm()"><i class="fa-solid fa-user-plus"></i> Cadastrar administrador</button></div></div></div>');
    await loadManagers();
  };
  async function loadManagers(){
    const host=$('#ascManagerList');if(!host)return;
    try{
      const rows=await services().users.listManagers({force:true,includeInactive:true});
      host.innerHTML=rows.length?rows.map(row=>`<article class="asc-card"><div class="asc-person"><span class="asc-avatar"><i class="fa-solid fa-user-shield"></i></span><div class="asc-person-copy"><strong>${esc(row.displayName||row.name||'Nome não informado')}</strong><small>${esc(row.email||'E-mail não informado')}</small></div><span class="asc-pill ${row.active===true?'active':'inactive'}">${row.active===true?'Ativo':'Inativo'}</span></div><div class="asc-meta"><span class="asc-pill">${esc(roleLabel(row.role))}</span>${row.id===state.currentSession?.uid?'<span class="asc-pill active">Você</span>':''}</div><div class="asc-row-actions"><button onclick="editAdminAccess('${esc(row.id)}')">Editar perfil</button><button onclick="sendAdminReset('${esc(row.id)}')">Reenviar acesso</button>${row.id!==state.currentSession?.uid?'<button class="danger" onclick="toggleAdminAccess(\''+esc(row.id)+'\','+(row.active===true?'false':'true')+')">'+(row.active===true?'Suspender':'Reativar')+'</button>':''}</div></article>`).join(''):'<div class="asc-empty">Nenhuma conta administrativa encontrada.</div>';
      window.__oleiroManagerRows=rows;
    }catch(error){console.error(error);host.innerHTML='<div class="asc-empty">Não foi possível consultar os acessos. Verifique sua conexão e suas permissões.</div>'}
  }
  window.openAdminCreateForm=function(){
    if(!isAdmin())return;
    openShell('Cadastrar administrador',`<div class="modal-body"><form id="ascCreateForm" class="asc-form">
      <div class="asc-field"><label for="ascName">Nome completo</label><input id="ascName" name="name" required maxlength="100" autocomplete="name" placeholder="Nome do administrador"></div>
      <div class="asc-field"><label for="ascEmail">E-mail de acesso</label><input id="ascEmail" name="email" type="email" required maxlength="160" autocomplete="email" placeholder="nome@exemplo.com"></div>
      <div class="asc-field"><label for="ascRole">Nível de acesso</label><select id="ascRole" name="role" onchange="document.getElementById('ascUnitScope').hidden=this.value!=='coordinator'"><option value="admin">Administrador — acesso completo</option><option value="coordinator">Coordenador — limitado às unidades selecionadas</option></select></div>
      <div id="ascUnitScope" class="asc-field" hidden><label>Unidades autorizadas</label><div class="asc-unit-list">${unitOptions()}</div><small class="asc-help">O coordenador só poderá administrar registros vinculados às unidades selecionadas.</small></div>
      <div class="asc-danger-note">Será criada uma conta real no Firebase Authentication. O novo usuário receberá um e-mail para definir a própria senha. Não compartilhe senhas temporárias.</div>
      <div class="asc-footer"><button type="button" class="btn btn-outline" onclick="openAdminAccessManagement()">Cancelar</button><button type="submit" class="btn btn-primary">Criar conta e enviar acesso</button></div>
    </form></div>`);
    $('#ascCreateForm')?.addEventListener('submit',createAdminAccount);
  };
  async function createAdminAccount(event){
    event.preventDefault();if(!isAdmin())return;
    const form=event.currentTarget,button=form.querySelector('[type="submit"]');button.disabled=true;button.textContent='Criando conta...';
    const name=form.elements.namedItem('name').value.trim(),email=form.elements.namedItem('email').value.trim().toLowerCase(),role=form.elements.namedItem('role').value,unitIds=[...form.querySelectorAll('[name="adminUnit"]:checked')].map(x=>x.value);
    try{
      if(role==='coordinator'&&!unitIds.length)throw new Error('Selecione ao menos uma unidade para o coordenador.');
      const context=await services().firebase(),appModule=context.modules.app,authModule=context.modules.auth,firestore=context.modules.firestore;
      const secondaryName='oleiro-admin-provision-'+Date.now(),secondaryApp=appModule.initializeApp(window.OLEIRO_FIREBASE_CONFIG,secondaryName),secondaryAuth=authModule.getAuth(secondaryApp);
      let credential=null;
      try{
        const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);const password=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')+'aA1!';
        credential=await authModule.createUserWithEmailAndPassword(secondaryAuth,email,password);
        await firestore.setDoc(firestore.doc(context.db,'users',credential.user.uid),{displayName:name,name,email,role,active:true,unitIds:role==='coordinator'?unitIds:[],createdAt:firestore.serverTimestamp(),updatedAt:firestore.serverTimestamp(),createdBy:state.currentSession.uid});
        try{await authModule.sendPasswordResetEmail(context.auth,email,{url:location.origin+location.pathname.replace(/admin\/.*$/,'')+'index.html',handleCodeInApp:false})}
        catch(error){console.warn('Conta criada, mas o e-mail de definição de senha não foi enviado:',error);showToast?.('Conta criada. O envio do e-mail falhou; use Reenviar acesso na lista.')}
      }catch(error){
        if(credential?.user)await authModule.deleteUser(secondaryAuth.currentUser).catch(()=>{});
        if(error?.code==='auth/email-already-in-use')throw new Error('Já existe uma conta de autenticação com esse e-mail.');
        if(error?.code==='permission-denied')throw new Error('O Firebase bloqueou a gravação do perfil. Verifique se sua conta tem permissão de administrador.');
        throw error;
      }finally{await appModule.deleteApp(secondaryApp).catch(()=>{})}
      services().users.invalidateManagers?.();showToast?.('Conta administrativa criada.');await window.openAdminAccessManagement();
    }catch(error){console.error('Falha ao criar administrador:',error);showToast?.(error.message||'Não foi possível criar a conta.');button.disabled=false;button.textContent='Criar conta e enviar acesso'}
  }
  window.editAdminAccess=function(uid){
    if(!isAdmin())return;const row=(window.__oleiroManagerRows||[]).find(x=>x.id===uid);if(!row)return;
    openShell('Editar permissões',`<div class="modal-body"><form id="ascEditForm" class="asc-form"><div class="asc-person"><span class="asc-avatar"><i class="fa-solid fa-user-shield"></i></span><div class="asc-person-copy"><strong>${esc(row.displayName||row.name||'Administrador')}</strong><small>${esc(row.email||'')}</small></div></div><div class="asc-field"><label for="ascEditRole">Nível de acesso</label><select id="ascEditRole"><option value="admin" ${row.role==='admin'?'selected':''}>Administrador — acesso completo</option><option value="coordinator" ${row.role==='coordinator'?'selected':''}>Coordenador — acesso por unidade</option></select></div><div class="asc-field" id="ascEditUnits" ${row.role==='coordinator'?'':'hidden'}><label>Unidades autorizadas</label><div class="asc-unit-list">${unitOptions(row.unitIds||[])}</div></div><div class="asc-footer"><button type="button" class="btn btn-outline" onclick="openAdminAccessManagement()">Cancelar</button><button type="submit" class="btn btn-primary">Salvar permissões</button></div></form></div>`);
    $('#ascEditRole').addEventListener('change',e=>$('#ascEditUnits').hidden=e.target.value!=='coordinator');
    $('#ascEditForm').addEventListener('submit',async e=>{e.preventDefault();const role=$('#ascEditRole').value,unitIds=[...document.querySelectorAll('[name="adminUnit"]:checked')].map(x=>x.value);const admins=(window.__oleiroManagerRows||[]).filter(r=>r.role==='admin'&&r.active===true);if(row.role==='admin'&&role!=='admin'&&admins.length<=1){showToast?.('Não é possível rebaixar o último administrador ativo.');return}if(role==='coordinator'&&!unitIds.length){showToast?.('Selecione ao menos uma unidade.');return}try{const c=await services().firebase();await c.modules.firestore.updateDoc(c.modules.firestore.doc(c.db,'users',uid),{role,unitIds:role==='coordinator'?unitIds:[],updatedAt:c.modules.firestore.serverTimestamp()});services().users.invalidateManagers?.();showToast?.('Permissões atualizadas.');await window.openAdminAccessManagement()}catch(error){console.error(error);showToast?.('Não foi possível atualizar as permissões.')}});
  };
  window.toggleAdminAccess=async function(uid,active){
    if(!isAdmin()||uid===state.currentSession?.uid)return;
    const rows=window.__oleiroManagerRows||[],activeAdmins=rows.filter(r=>r.role==='admin'&&r.active===true);
    const target=rows.find(r=>r.id===uid);if(!target)return;
    if(target.role==='admin'&&!active&&activeAdmins.length<=1){showToast?.('Não é possível suspender o último administrador ativo.');return}
    try{const c=await services().firebase();await c.modules.firestore.updateDoc(c.modules.firestore.doc(c.db,'users',uid),{active:!!active,updatedAt:c.modules.firestore.serverTimestamp()});services().users.invalidateManagers?.();showToast?.(active?'Acesso reativado.':'Acesso suspenso.');await loadManagers()}catch(error){console.error(error);showToast?.('Não foi possível alterar o acesso.')}
  };
  window.sendAdminReset=async function(uid){
    if(!isAdmin())return;const row=(window.__oleiroManagerRows||[]).find(x=>x.id===uid);if(!row?.email)return;
    try{await window.OleiroAuth.sendPasswordReset(row.email);showToast?.('E-mail para definir a senha enviado.')}catch(error){console.error(error);showToast?.(error.message||'Não foi possível enviar o e-mail.')}
  };
  styles();
})();