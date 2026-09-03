/* Preferências da conta administrativa: modal compacto e isolado do layout de perfis. */
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
        width:min(520px,calc(100vw - 28px))!important;
        max-width:520px!important;
        max-height:min(82vh,620px)!important;
      }
      .admin-account-settings-modal .modal-head{padding:16px 18px 13px!important}
      .admin-account-settings-modal .modal-body{padding:16px 18px 18px!important}
      .admin-account-settings-modal .modal-footer{padding:11px 18px 14px!important}

      .admin-account-settings{display:grid;gap:16px}
      .admin-account-identity{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,.55fr);border:1px solid var(--border);border-radius:16px;background:var(--surface);overflow:hidden}
      .admin-account-identity-item{min-width:0;display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;align-items:center;padding:12px 13px}
      .admin-account-identity-item+ .admin-account-identity-item{border-left:1px solid var(--border)}
      .admin-account-identity-icon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:.7rem}
      .admin-account-identity-copy{min-width:0;display:grid;gap:2px}
      .admin-account-identity-copy small{font-size:.52rem;color:var(--muted)}
      .admin-account-identity-copy strong{font-size:.68rem;line-height:1.3;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

      .admin-account-settings-section{display:grid;gap:9px}
      .admin-account-settings-heading{display:grid;gap:2px}
      .admin-account-settings-heading span{font-size:.52rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
      .admin-account-settings-heading strong{font-size:.7rem;color:var(--text)}
      .admin-account-settings-heading p{margin:0;color:var(--muted);font-size:.56rem;line-height:1.4}

      .admin-account-theme-switch{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border:1px solid var(--border);border-radius:13px;background:var(--surface)}
      .admin-account-theme-switch button{min-height:38px;border:0;border-radius:9px;background:transparent;color:var(--muted);font-size:.62rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer}
      .admin-account-theme-switch button:hover{background:var(--surface-2);color:var(--text)}
      .admin-account-theme-switch button.active{background:var(--primary);color:#fff}

      .admin-account-footer{display:flex;align-items:center;justify-content:flex-end}
      .admin-account-signout-button{min-height:36px!important;padding:7px 11px!important;font-size:.6rem!important}

      @media(max-width:560px){
        .modal.admin-account-settings-modal{width:100%!important;max-width:100%!important}
        .admin-account-identity{grid-template-columns:1fr}
        .admin-account-identity-item+ .admin-account-identity-item{border-left:0;border-top:1px solid var(--border)}
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
    const body=`<div class="admin-account-settings">
      <div class="admin-account-identity">
        <div class="admin-account-identity-item"><span class="admin-account-identity-icon"><i class="fa-regular fa-envelope"></i></span><div class="admin-account-identity-copy"><small>Email</small><strong title="${esc(session.email||'—')}">${esc(session.email||'—')}</strong></div></div>
        <div class="admin-account-identity-item"><span class="admin-account-identity-icon"><i class="fa-solid fa-user-shield"></i></span><div class="admin-account-identity-copy"><small>Perfil</small><strong>Administrador</strong></div></div>
      </div>
      <section class="admin-account-settings-section">
        <div class="admin-account-settings-heading"><span>Aparência</span><strong>Tema do painel</strong><p>Escolha como a interface administrativa será exibida neste dispositivo.</p></div>
        <div class="admin-account-theme-switch" role="group" aria-label="Tema do painel">
          <button class="${!dark?'active':''}" type="button" aria-pressed="${!dark?'true':'false'}" onclick="setAdminTheme('light')"><i class="fa-solid fa-sun"></i>Claro</button>
          <button class="${dark?'active':''}" type="button" aria-pressed="${dark?'true':'false'}" onclick="setAdminTheme('dark')"><i class="fa-solid fa-moon"></i>Escuro</button>
        </div>
      </section>
    </div>`;
    const footer=`<div class="admin-account-footer"><button class="btn btn-danger-soft admin-account-signout-button" type="button" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i>Sair da conta</button></div>`;
    openModal('Minha conta','',body,footer);
    modalRoot?.querySelector?.('.modal')?.classList.add('admin-account-settings-modal');
  };

  installStyles();
})();
