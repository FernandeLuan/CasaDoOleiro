/* Preferências da conta administrativa: perfil, aparência e versão em composição compacta. */
(function accountSettings(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_ADMIN_ACCOUNT_SETTINGS__)return;
  window.__OLEIRO_ADMIN_ACCOUNT_SETTINGS__=true;

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function installStyles(){
    if(document.getElementById('adminAccountSettingsStyles'))return;
    const style=document.createElement('style');
    style.id='adminAccountSettingsStyles';
    style.textContent=`
      .modal.admin-account-settings-modal{
        width:min(500px,calc(100vw - 28px))!important;
        max-width:500px!important;
        max-height:min(78vh,520px)!important;
      }
      .admin-account-settings-modal .modal-head{padding:15px 16px 12px!important}
      .admin-account-settings-modal .modal-body{padding:16px!important}

      .admin-account-settings{display:grid;gap:13px}
      .admin-account-top{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:10px}
      .admin-account-panel{min-width:0;border:1px solid var(--border);border-radius:15px;background:var(--surface);padding:13px}

      .admin-account-profile{display:grid;grid-template-columns:42px minmax(0,1fr);gap:10px;align-items:center}
      .admin-account-avatar{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:.8rem}
      .admin-account-profile-copy{min-width:0;display:grid;gap:3px}
      .admin-account-profile-line{min-width:0;display:flex;align-items:center;gap:8px}
      .admin-account-profile-copy strong{font-size:.72rem;line-height:1.2;color:var(--text)}
      .admin-account-profile-copy span{font-size:.55rem;line-height:1.35;color:var(--muted);overflow-wrap:anywhere}
      .admin-account-profile-divider{display:none;width:1px;height:42px;background:var(--border);border-radius:999px}
      .admin-account-inline-signout{border:1px solid color-mix(in srgb,var(--danger) 26%,var(--border));border-radius:11px;background:transparent;color:var(--danger);padding:0 13px;min-width:78px;min-height:42px;font:inherit;font-size:.6rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}
      .admin-account-inline-signout:hover{background:color-mix(in srgb,var(--danger) 7%,transparent)}

      .admin-account-preference{display:grid;gap:8px}
      .admin-account-preference-copy{min-width:0;display:grid;gap:2px}
      .admin-account-preference-copy small{font-size:.5rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
      .admin-account-preference-copy strong{font-size:.66rem;color:var(--text)}
      .admin-account-preference-copy span{font-size:.52rem;line-height:1.35;color:var(--muted)}
      .admin-account-theme-switch{display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:3px;border:1px solid var(--border);border-radius:11px;background:var(--surface)}
      .admin-account-theme-switch button{min-height:32px;border:0;border-radius:8px;background:transparent;color:var(--muted);font-size:.56rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}
      .admin-account-theme-switch button:hover{background:var(--surface-2);color:var(--text)}
      .admin-account-theme-switch button.active{background:var(--primary);color:#fff}

      .admin-account-release{border-top:1px solid var(--border);padding-top:12px;display:grid;gap:8px}
      .admin-account-release-head{display:grid;gap:2px}
      .admin-account-release-head small{font-size:.5rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
      .admin-account-release-head strong{font-size:.66rem;color:var(--text)}
      .admin-account-release .release-info{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 12px;padding:10px 11px;border:1px solid var(--border);border-radius:13px;background:var(--surface-2)}
      .admin-account-release .release-info p{margin:0!important;min-width:0;font-size:.54rem!important;color:var(--muted);line-height:1.35}
      .admin-account-release .release-info strong{color:var(--text);font-weight:600}
      .admin-account-release .release-info code,.admin-account-release .release-info span{overflow-wrap:anywhere}

      @media(min-width:1024px){
        .admin-account-inline-signout,.admin-account-profile-divider{display:none!important}
      }
      @media(max-width:520px){
        .modal.admin-account-settings-modal{width:calc(100vw - 20px)!important;max-width:calc(100vw - 20px)!important}
        .admin-account-top{grid-template-columns:1fr}
        .admin-account-release .release-info{grid-template-columns:1fr}
        .admin-account-profile{
          grid-template-columns:42px minmax(0,1fr) 1px auto;
          gap:10px;
          align-items:center;
        }
        .admin-account-profile-divider{display:block}
        .admin-account-inline-signout{justify-self:end}
      }
      @media(max-width:380px){
        .admin-account-profile{grid-template-columns:38px minmax(0,1fr) 1px auto;gap:8px;padding:11px}
        .admin-account-avatar{width:38px;height:38px;border-radius:12px}
        .admin-account-inline-signout{min-width:70px;padding-inline:10px}
      }
    `;
    document.head.appendChild(style);
  }

  function releaseHtml(){
    try{return typeof releaseInformationHtml==='function'?releaseInformationHtml():'<div class="release-info"><p>Informação de versão indisponível.</p></div>'}
    catch{return '<div class="release-info"><p>Informação de versão indisponível.</p></div>'}
  }

  window.setAdminTheme=function(target){
    const desired=target==='dark'?'dark':'light';
    if(String(state.theme||'light')===desired)return;
    if(typeof toggleTheme==='function')toggleTheme();
    setTimeout(()=>window.openMyAccount?.(),0);
  };

  window.openMyAccount=function(){
    const session=state.currentSession||{},dark=String(state.theme||'light')==='dark';
    const body=`<div class="modal-body admin-account-settings-body"><div class="admin-account-settings">
      <div class="admin-account-top">
        <section class="admin-account-panel admin-account-profile">
          <span class="admin-account-avatar"><i class="fa-solid fa-user-shield"></i></span>
          <div class="admin-account-profile-copy"><div class="admin-account-profile-line"><strong>Administrador</strong></div><span>${esc(session.email||'—')}</span></div>
          <span class="admin-account-profile-divider" aria-hidden="true"></span>
          <button class="admin-account-inline-signout" type="button" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i>Sair</button>
        </section>
        <section class="admin-account-panel admin-account-preference">
          <div class="admin-account-preference-copy"><small>Aparência</small><strong>Tema do painel</strong><span>Preferência salva neste dispositivo.</span></div>
          <div class="admin-account-theme-switch" role="group" aria-label="Tema do painel">
            <button class="${!dark?'active':''}" type="button" aria-pressed="${!dark?'true':'false'}" onclick="setAdminTheme('light')"><i class="fa-solid fa-sun"></i>Claro</button>
            <button class="${dark?'active':''}" type="button" aria-pressed="${dark?'true':'false'}" onclick="setAdminTheme('dark')"><i class="fa-solid fa-moon"></i>Escuro</button>
          </div>
        </section>
      </div>
      <section class="admin-account-release">
        <div class="admin-account-release-head"><small>Sistema</small><strong>Versão do software</strong></div>
        ${releaseHtml()}
      </section>
    </div></div>`;
    openModal('Minha conta','',body);
    modalRoot?.querySelector?.('.modal')?.classList.add('admin-account-settings-modal');
  };

  installStyles();
})();