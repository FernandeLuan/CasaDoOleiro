/* Shell desktop do portal para candidato e voluntário aprovado. */
(function portalDesktopShell(){
  if(!/\/portal\//.test(location.pathname))return;
  if(window.__OLEIRO_PORTAL_DESKTOP_SHELL__)return;
  window.__OLEIRO_PORTAL_DESKTOP_SHELL__=true;

  function installStyles(){
    if(document.getElementById('portalDesktopShellStyles'))return;
    const style=document.createElement('style');
    style.id='portalDesktopShellStyles';
    style.textContent=`
      .portal-sidebar-desktop{display:none}

      @media(min-width:1024px){
        html{height:100%!important;overflow:hidden!important}
        body{height:100%!important;min-height:100%!important;max-height:100%!important;overflow:hidden!important;padding-bottom:0!important}
        #app.portal-desktop-root{
          width:100%!important;
          max-width:none!important;
          height:100dvh!important;
          min-height:100dvh!important;
          max-height:100dvh!important;
          margin:0!important;
          overflow:hidden!important;
        }
        #app.portal-desktop-root>.app-header{display:none!important}
        #navRoot .bottom-nav{display:none!important}

        .portal-sidebar-desktop{
          position:fixed;
          z-index:55;
          inset:0 auto 0 0;
          width:216px;
          display:flex;
          flex-direction:column;
          padding:18px 14px 16px;
          background:var(--surface);
          border-right:1px solid var(--border);
          box-shadow:10px 0 30px rgba(20,43,31,.035);
        }
        .portal-sidebar-brand{
          width:100%;
          border:0;
          background:transparent;
          color:var(--text);
          display:grid;
          grid-template-columns:42px minmax(0,1fr);
          gap:10px;
          align-items:center;
          text-align:left;
          padding:6px 7px 18px;
          margin-bottom:8px;
          border-bottom:1px solid var(--border);
          cursor:pointer;
        }
        .portal-sidebar-brand-mark{
          width:42px;
          height:42px;
          border-radius:14px;
          display:grid;
          place-items:center;
          background:linear-gradient(145deg,var(--primary),#234936);
          color:#fff;
          box-shadow:var(--shadow);
        }
        .portal-sidebar-brand-copy{min-width:0}
        .portal-sidebar-brand-copy strong{display:block;font-size:.84rem;line-height:1.15}
        .portal-sidebar-brand-copy small{display:block;margin-top:3px;font-size:.6rem;color:var(--muted);font-family:var(--font-body)}

        .portal-sidebar-nav,.portal-sidebar-tools,.portal-sidebar-account{display:grid;gap:5px}
        .portal-sidebar-item{
          width:100%;
          min-height:44px;
          border:0;
          background:transparent;
          color:var(--muted);
          border-radius:13px;
          padding:0 12px;
          display:grid;
          grid-template-columns:24px minmax(0,1fr);
          gap:9px;
          align-items:center;
          text-align:left;
          font-size:.71rem;
          font-weight:600;
          cursor:pointer;
        }
        .portal-sidebar-item i{width:24px;text-align:center;font-size:.84rem}
        .portal-sidebar-item:hover{background:var(--surface-2);color:var(--text)}
        .portal-sidebar-item.active{background:var(--primary);color:#fff}
        .portal-sidebar-spacer{flex:1;min-height:28px}
        .portal-sidebar-tools{padding:10px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
        .portal-sidebar-account{padding-top:10px}
        .portal-sidebar-account .portal-sidebar-item:last-child{color:var(--danger)}

        #app.portal-desktop-root>main.page{
          margin-left:216px;
          width:calc(100% - 216px);
          height:100dvh!important;
          min-height:0!important;
          max-height:100dvh!important;
          max-width:none!important;
          overflow-x:hidden!important;
          overflow-y:auto!important;
          overscroll-behavior-y:contain;
          -webkit-overflow-scrolling:touch;
          scrollbar-gutter:stable;
          padding:18px clamp(18px,1.35vw,28px) 44px!important;
        }
        #app.portal-desktop-root>main.page>.section{
          width:100%;
          max-width:1320px;
          margin-left:auto;
          margin-right:auto;
        }
        #app.portal-desktop-root .compact-page-top{margin-top:0!important}
        body.modal-open #app.portal-desktop-root>main.page{overflow-y:hidden!important}
      }

      @media(max-width:1023px){
        /* Keep document scrolling on mobile: body must not retain a second
           scroll offset when modal-open temporarily sets overflow:hidden. */
        html,body{
          height:auto!important;
          min-height:100%!important;
          max-height:none!important;
          overflow-x:clip!important;
          overflow-y:visible!important;
        }
        body.modal-open{overflow-y:hidden!important}
        .portal-sidebar-desktop{display:none!important}
        #app.portal-desktop-root{
          height:auto!important;
          min-height:100vh!important;
          max-height:none!important;
          overflow:visible!important;
        }
        #app.portal-desktop-root>main.page{
          margin-left:0;
          width:100%;
          height:auto!important;
          min-height:100vh!important;
          max-height:none!important;
          overflow:visible!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function sidebarItem(page,icon,label){
    const active=String(state.volunteerPage||'home')===page;
    return `<button class="portal-sidebar-item ${active?'active':''}" type="button" onclick="navigateVolunteer('${page}')"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;
  }
  const navText=(key,fallback)=>typeof t==='function'?t(key):fallback;

  function sidebarHtml(){
    const approved=String(state.volunteerMode||'candidate')==='approved';
    const roleLabel=approved?navText('portal.nav.volunteer','Voluntário'):navText('portal.nav.candidate','Candidato');
    const planItem=approved?sidebarItem('agenda','fa-calendar-check',navText('portal.nav.agenda','Agenda')):sidebarItem('plan','fa-calendar-plus',navText('portal.nav.planning','Planejamento'));
    const language=typeof currentLanguageCode==='function'?currentLanguageCode():'PT';
    const dark=String(state.theme||'light')==='dark';
    return `<aside class="portal-sidebar-desktop" aria-label="${roleLabel}">
      <button class="portal-sidebar-brand" type="button" onclick="navigateVolunteer('home')" aria-label="${navText('portal.nav.home','Início')}">
        <span class="portal-sidebar-brand-mark"><i class="fa-solid fa-seedling"></i></span>
        <span class="portal-sidebar-brand-copy"><strong>Casa do Oleiro</strong><small>${roleLabel}</small></span>
      </button>
      <nav class="portal-sidebar-nav">
        ${sidebarItem('home','fa-house',navText('portal.nav.home','Início'))}
        ${planItem}
        ${sidebarItem('stay','fa-location-dot',navText('portal.nav.stay','Estadia'))}
        ${sidebarItem('info','fa-circle-info',navText('portal.nav.info','Informações'))}
        ${sidebarItem('profile','fa-user',navText('portal.nav.profile','Perfil'))}
      </nav>
      <div class="portal-sidebar-spacer"></div>
      <div class="portal-sidebar-tools">
        <button class="portal-sidebar-item" type="button" onclick="openLanguageModal()"><i class="fa-solid fa-language"></i><span>${navText('portal.nav.language','Idioma')} · ${language}</span></button>
        <button class="portal-sidebar-item" type="button" onclick="toggleTheme()"><i class="fa-solid ${dark?'fa-sun':'fa-moon'}"></i><span>${dark?navText('portal.nav.themeLight','Tema claro'):navText('portal.nav.themeDark','Tema escuro')}</span></button>
      </div>
      <div class="portal-sidebar-account">
        <button class="portal-sidebar-item" type="button" onclick="navigateVolunteer('profile')"><i class="fa-solid fa-user"></i><span>${navText('portal.nav.myProfile','Meu perfil')}</span></button>
        <button class="portal-sidebar-item" type="button" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i><span>${navText('portal.nav.signout','Sair')}</span></button>
      </div>
    </aside>`;
  }

  function syncModalLock(){
    if(!document.querySelector('#modalRoot .modal-backdrop'))document.body.classList.remove('modal-open');
  }

  function enhance(){
    if(typeof state==='undefined'||state.role!=='volunteer'||!app)return;
    syncModalLock();
    app.classList.add('portal-desktop-root');
    app.querySelector(':scope > .portal-sidebar-desktop')?.remove();
    app.insertAdjacentHTML('afterbegin',sidebarHtml());
    const sidebar=app.querySelector(':scope > .portal-sidebar-desktop');
    if(sidebar&&typeof applyI18n==='function')applyI18n(sidebar);
  }

  installStyles();

  const baseRenderVolunteer=typeof window.renderVolunteer==='function'?window.renderVolunteer:null;
  if(baseRenderVolunteer){
    window.renderVolunteer=renderVolunteer=function(){const result=baseRenderVolunteer();enhance();return result};
    window.render=render=function(){return renderVolunteer()};
  }

  enhance();
  requestAnimationFrame(enhance);
})();
