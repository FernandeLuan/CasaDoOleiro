/* Preferências da conta administrativa: identidade e aparência em um modal compacto. */
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
        width:min(430px,calc(100vw - 28px))!important;
        max-width:430px!important;
        max-height:min(78vh,520px)!important;
      }
      .admin-account-settings-modal .modal-head{padding:15px 16px 12px!important}
      .admin-account-settings-modal .modal-body{padding:18px 18px 16px!important}
      .admin-account-settings-modal .modal-footer{padding:10px 18px 14px!important}

      .admin-account-settings{display:grid;gap:18px}
      .admin-account-profile{display:flex;flex-direction:column;align-items:center;text-align:center;padding:2px 0 3px}
      .admin-account-avatar{width:52px;height:52px;border-radius:17px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:1rem;margin-bottom:9px}
      .admin-account-profile strong{font-size:.82rem;line-height:1.25;color:var(--text)}
      .admin-account-profile span{margin-top:3px;max-width:100%;font-size:.6rem;line-height:1.35;color:var(--muted);overflow-wrap:anywhere}

      .admin-account-preference{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding-top:15px;border-top:1px solid var(--border)}
      .admin-account-preference-copy{min-width:0;display:grid;gap:2px}
      .admin-account-preference-copy small{font-size:.51rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
      .admin-account-preference-copy strong{font-size:.68rem;color:var(--text)}
      .admin-account-preference-copy span{font-size:.54rem;line-height:1.35;color:var(--muted)}

      .admin-account-theme-switch{display:grid;grid-template-columns:1fr 1fr;gap:3px;width:184px;padding:3px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
      .admin-account-theme-switch button{min-height:34px;border:0;border-radius:9px;background:transparent;color:var(--muted);font-size:.58rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}
      .admin-account-theme-switch button:hover{background:var(--surface-2);color:var(--text)}
      .admin-account-theme-switch button.active{background:var(--primary);color:#fff}

      .admin-account-footer{display:flex;align-items:center;justify-content:center}
      .admin-account-signout-button{min-height:34px!important;padding:6px 10px!important;border:0!important;background:transparent!important;box-shadow:none!important;font-size:.58rem!important;color:var(--danger,#b94040)!important}
      .admin-account-signout-button:hover{background:var(--danger-soft,#fff0ee)!important}

      @media(max-width:480px){
        .modal.admin-account-settings-modal{width:calc(100vw - 20px)!important;max-width:calc(100vw - 20px)!important}
        .admin-account-preference{grid-template-columns:1fr;gap:9px}
        .admin-account-theme-switch{width:100%}
      }
    `;
    document.head.appendChild(style);
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
      <div class="admin-account-profile">
        <span class="admin-account-avatar"><i class="fa-solid fa-user-shield"></i></span>
        <strong>Administrador</strong>
        <span>${esc(session.email||'—')}</span>
      </div>
      <section class="admin-account-preference">
        <div class="admin-account-preference-copy"><small>Aparência</small><strong>Tema do painel</strong><span>Preferência salva neste dispositivo.</span></div>
        <div class="admin-account-theme-switch" role="group" aria-label="Tema do painel">
          <button class="${!dark?'active':''}" type="button" aria-pressed="${!dark?'true':'false'}" onclick="setAdminTheme('light')"><i class="fa-solid fa-sun"></i>Claro</button>
          <button class="${dark?'active':''}" type="button" aria-pressed="${dark?'true':'false'}" onclick="setAdminTheme('dark')"><i class="fa-solid fa-moon"></i>Escuro</button>
        </div>
      </section>
    </div></div>`;
    const footer=`<div class="modal-footer admin-account-footer"><button class="btn admin-account-signout-button" type="button" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i>Sair da conta</button></div>`;
    openModal('Minha conta','',body,footer);
    modalRoot?.querySelector?.('.modal')?.classList.add('admin-account-settings-modal');
  };

  installStyles();
})();