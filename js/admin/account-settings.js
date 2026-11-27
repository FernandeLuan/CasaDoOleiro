/* Preferências da conta administrativa: perfil, aparência e versão em composição compacta. */
(function accountSettings(){
  if(!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_ADMIN_ACCOUNT_SETTINGS__)return;
  window.__OLEIRO_ADMIN_ACCOUNT_SETTINGS__=true;

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function installStyles(){
    if(document.getElementById('adminAccountSettingsStyles'))return;
    const style=document.createElement('style');
    style.id='adminAccountSettingsStyles';
    style.textContent=`
      .modal.admin-account-settings-modal{
        width:min(620px,calc(100vw - 24px))!important;
        max-width:620px!important;
        max-height:min(86vh,760px)!important;
      }
      .admin-account-settings-modal .modal-head{padding:18px 20px 14px!important;text-align:left!important}
      .admin-account-settings-modal .modal-head h2{font-size:1rem!important;text-align:left!important;letter-spacing:-.02em}
      .admin-account-settings-modal .modal-body{padding:18px 20px 22px!important}

      .admin-account-settings{display:grid;gap:13px}
      .admin-account-top{grid-template-columns:1fr!important}
      .admin-account-sections{display:grid;gap:8px}
      .admin-account-accordion{border:1px solid var(--border);border-radius:14px;background:var(--surface);overflow:hidden}
      .admin-account-accordion>summary{padding:13px 14px;cursor:pointer;font-size:.68rem;font-weight:700;color:var(--text)}
      .admin-account-accordion-content{padding:0 12px 12px}
      .admin-account-routine-group{border:1px solid var(--border);border-radius:11px;overflow:hidden;margin-top:8px}
      .admin-account-routine-group>strong{display:block;padding:8px 10px;background:var(--surface-2);font-size:.58rem;color:var(--muted)}
      .admin-account-routine-row{display:grid;grid-template-columns:112px 1fr;gap:9px;padding:8px 10px;border-top:1px solid var(--border);font-size:.62rem}
      .admin-account-routine-row b{color:var(--primary);white-space:nowrap}
      .admin-account-unit{display:grid;gap:7px;padding:10px 0;border-bottom:1px solid var(--border)}
      .admin-account-unit-toggle{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:3px;border:1px solid var(--border);border-radius:11px;background:var(--surface-2)}
      .admin-account-unit-toggle button{min-height:36px;border:0;border-radius:8px;background:transparent;color:var(--muted);font-size:.62rem;font-weight:700}
      .admin-account-unit-toggle button.active{background:var(--primary);color:white}
      .admin-account-unit-toggle button.inactive{background:var(--danger);color:white}
      .admin-account-footer{display:flex;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--border)}

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
      .admin-account-theme-switch{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;padding:3px;border:1px solid var(--border);border-radius:11px;background:var(--surface)}
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
        .modal.admin-account-settings-modal{width:calc(100vw - 16px)!important;max-width:calc(100vw - 16px)!important;max-height:88vh!important}
        .admin-account-settings-modal .modal-head{padding:17px 18px 13px!important}
        .admin-account-settings-modal .modal-body{padding:16px 18px 20px!important}
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

  function routineRows(rows){return rows.map(row=>'<div class="admin-account-routine-row"><b>'+row[0]+'</b><span>'+row[1]+'</span></div>').join('')}
  function routineHtml(){return '<div class="admin-account-routine-group"><strong>MANHÃ</strong>'+routineRows([['06:00','Despertar e higiene'],['06:15–07:30','Devocional'],['07:30–08:15','Café da manhã'],['08:15–11:15','Atividades práticas'],['11:15–12:00','Reunião de sentimentos'],['12:00–13:30','Almoço e descanso']])+'</div><div class="admin-account-routine-group"><strong>TARDE E NOITE</strong>'+routineRows([['13:45–15:00','Atividades'],['15:00–15:15','Café da tarde'],['15:15–16:30','Atividades'],['16:30 em diante','Banho, lazer e jantar'],['19:30–21:00','Filme, palestra, documentário ou outras atividades'],['21:00','Alojamento'],['21:30','Silêncio total']])+'</div>'}
  function unitsHtml(){const rows=Array.isArray(state.units)?state.units:[];return rows.map(unit=>{const id=encodeURIComponent(String(unit.id)),active=unit.active!==false;return '<div class="admin-account-unit"><strong>'+esc(unit.name||unit.id)+'</strong><small>Disponibilidade da unidade</small><div class="admin-account-unit-toggle"><button class="'+(active?'active':'')+'" onclick="setAccountUnitActive(\''+id+'\',true)">Ativo</button><button class="'+(!active?'inactive':'')+'" onclick="setAccountUnitActive(\''+id+'\',false)">Inativo</button></div></div>'}).join('')||'<p>Nenhuma unidade cadastrada.</p>'}
  window.setAccountUnitActive=async function(encoded,next){const id=decodeURIComponent(encoded),unit=(state.units||[]).find(row=>String(row.id)===id);if(!unit||unit.active===(next===true))return;try{await window.OleiroServices.units.update(id,{active:next===true});state.units=state.units.map(row=>String(row.id)===id?{...row,active:next===true}:row);window.OleiroServices.units.invalidate?.();window.openMyAccount()}catch(error){console.error(error);showToast?.('Não foi possível atualizar a unidade.')}};
  window.setAdminTheme=function(target){
    window.setThemePreference?.(target);
    setTimeout(()=>window.openMyAccount?.(),0);
  };

  window.openMyAccount=function(){
    const session=state.currentSession||{},preference=state.themePreference||'system';
    const body=`<div class="modal-body admin-account-settings-body"><div class="admin-account-settings">
      <div class="admin-account-top">
        <section class="admin-account-panel admin-account-profile">
          <span class="admin-account-avatar"><i class="fa-solid fa-user-shield"></i></span>
          <div class="admin-account-profile-copy"><div class="admin-account-profile-line"><strong>Administrador</strong></div><span>${esc(session.email||'—')}</span></div>
          <span class="admin-account-profile-divider" aria-hidden="true"></span>
        </section>
        <section class="admin-account-panel admin-account-preference">
          <div class="admin-account-preference-copy"><small>Aparência</small><strong>Tema do painel</strong><span>Preferência salva neste dispositivo.</span></div>
          <div class="admin-account-theme-switch" role="group" aria-label="Aparência">
            <button class="${preference==='system'?'active':''}" type="button" aria-pressed="${preference==='system'}" onclick="setAdminTheme('system')"><i class="fa-solid fa-circle-half-stroke"></i>Sistema</button>
            <button class="${preference==='light'?'active':''}" type="button" aria-pressed="${preference==='light'}" onclick="setAdminTheme('light')"><i class="fa-solid fa-sun"></i>Claro</button>
            <button class="${preference==='dark'?'active':''}" type="button" aria-pressed="${preference==='dark'}" onclick="setAdminTheme('dark')"><i class="fa-solid fa-moon"></i>Escuro</button>
          </div>
        </section>
      </div>
      <div class="admin-account-sections"><details class="admin-account-accordion"><summary>Rotina da Casa</summary><div class="admin-account-accordion-content">${routineHtml()}</div></details><details class="admin-account-accordion"><summary>Unidades</summary><div class="admin-account-accordion-content">${unitsHtml()}</div></details><details class="admin-account-accordion"><summary>Sistema e versão</summary><div class="admin-account-accordion-content"><section class="admin-account-release">
        <div class="admin-account-release-head"><small>Sistema</small><strong>Versão do software</strong></div>
        ${releaseHtml()}
      </section></div></details></div><footer class="admin-account-footer"><button class="admin-account-inline-signout" type="button" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i>Sair</button></footer>
    </div></div>`;
    openModal('Minha conta','',body);
    modalRoot?.querySelector?.('.modal')?.classList.add('admin-account-settings-modal');
  };

  installStyles();
})();