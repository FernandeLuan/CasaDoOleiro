/* R62 homologação: shell desktop do Admin + composição final da Home.
   Carregado após todos os scripts para não ser sobrescrito por refinamentos históricos. */
(function applyFinalAdminHomeR62(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin')return;

  function adminSidebarR62(){
    const item=(active,icon,label,action)=>`<button class="admin-sidebar-item-r62 ${active?'active':''}" type="button" onclick="${action}"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;
    const menuActive=['menu','groups'].includes(state.managerPage);
    return `<aside class="admin-sidebar-r62" aria-label="Navegação da gestão">
      <button class="admin-sidebar-brand-r62" type="button" onclick="goHome()" aria-label="Ir para o início">
        <span class="admin-sidebar-brand-mark-r62"><i class="fa-solid fa-seedling"></i></span>
        <span class="admin-sidebar-brand-copy-r62"><strong>Casa do Oleiro</strong><small>Gestão</small></span>
      </button>
      <nav class="admin-sidebar-nav-r62">
        ${item(state.managerPage==='home','fa-house','Início',"navigateManager('home')")}
        ${item(state.managerPage==='volunteer','fa-users','Voluntariado',"navigateManager('volunteer')")}
        ${item(state.managerPage==='agenda','fa-calendar-days','Agenda',"navigateManager('agenda')")}
        ${item(false,'fa-bed','Ocupação','openOccupancyCalendar()')}
        ${item(menuActive,'fa-bars','Menu',"navigateManager('menu')")}
      </nav>
      <div class="admin-sidebar-spacer-r62"></div>
      <div class="admin-sidebar-tools-r62">
        ${item(false,'fa-language',typeof currentLanguageCode==='function'?`Idioma · ${currentLanguageCode()}`:'Idioma · PT','openLanguageModal()')}
        ${item(false,state.theme==='dark'?'fa-sun':'fa-moon',state.theme==='dark'?'Tema claro':'Tema escuro','toggleTheme()')}
      </div>
      <div class="admin-sidebar-account-r62">
        ${item(false,'fa-user','Minha conta','openMyAccount()')}
        ${item(false,'fa-right-from-bracket','Sair','logout()')}
      </div>
    </aside>`;
  }

  function installAdminShellStylesR62(){
    if(document.getElementById('adminShellR62Styles'))return;
    const style=document.createElement('style');
    style.id='adminShellR62Styles';
    style.textContent=`
      .admin-sidebar-r62{display:none}
      @media(min-width:1024px){
        body{padding-bottom:0!important}
        #app{width:100%!important;max-width:none!important;margin:0!important;min-height:100vh!important}
        .admin-shell-r62{min-height:100vh;width:100%;background:var(--bg)}
        .admin-shell-r62>.admin-content-r62>.app-header{display:none!important}
        #navRoot .bottom-nav{display:none!important}
        .admin-sidebar-r62{position:fixed;z-index:55;inset:0 auto 0 0;width:216px;display:flex;flex-direction:column;padding:18px 14px 16px;background:var(--surface);border-right:1px solid var(--border);box-shadow:10px 0 30px rgba(20,43,31,.035)}
        .admin-sidebar-brand-r62{width:100%;border:0;background:transparent;color:var(--text);display:grid;grid-template-columns:42px minmax(0,1fr);gap:10px;align-items:center;text-align:left;padding:6px 7px 18px;margin-bottom:8px;border-bottom:1px solid var(--border)}
        .admin-sidebar-brand-mark-r62{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,var(--primary),#234936);color:#fff;box-shadow:var(--shadow)}
        .admin-sidebar-brand-copy-r62{min-width:0}.admin-sidebar-brand-copy-r62 strong{display:block;font-size:.84rem;line-height:1.15}.admin-sidebar-brand-copy-r62 small{display:block;margin-top:3px;font-size:.6rem;color:var(--muted);font-family:var(--font-body)}
        .admin-sidebar-nav-r62,.admin-sidebar-tools-r62,.admin-sidebar-account-r62{display:grid;gap:5px}
        .admin-sidebar-item-r62{width:100%;min-height:44px;border:0;background:transparent;color:var(--muted);border-radius:13px;padding:0 12px;display:grid;grid-template-columns:24px minmax(0,1fr);gap:9px;align-items:center;text-align:left;font-size:.71rem;font-weight:600}
        .admin-sidebar-item-r62 i{width:24px;text-align:center;font-size:.84rem}.admin-sidebar-item-r62:hover{background:var(--surface-2);color:var(--text)}.admin-sidebar-item-r62.active{background:var(--primary);color:#fff}
        .admin-sidebar-spacer-r62{flex:1;min-height:28px}
        .admin-sidebar-tools-r62{padding:10px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
        .admin-sidebar-account-r62{padding-top:10px}.admin-sidebar-account-r62 .admin-sidebar-item-r62:last-child{color:var(--danger)}
        .admin-content-r62{margin-left:216px;width:calc(100% - 216px);min-height:100vh}
        .admin-content-r62>.page{width:100%;max-width:none!important;padding:18px clamp(18px,1.35vw,28px) 34px!important}
      }
      @media(max-width:1023px){
        .admin-sidebar-r62{display:none!important}.admin-content-r62{margin-left:0;width:100%}
      }
    `;
    document.head.appendChild(style);
  }

  managerHome=function(){
    const todaySessions=getSessions(_oleiroToday),arrivals=nextMovements('from'),departures=nextMovements('to');
    return `<style id="managerHomeR62FinalStyles">
      .manager-home-r62{width:100%;display:grid;gap:16px}
      .manager-home-r62-top,.manager-home-r62-bottom{display:grid;gap:16px}
      .manager-home-r62-hero{margin:0}
      .manager-home-r62-card{background:var(--surface);border:1px solid var(--border);border-radius:26px;padding:22px;box-shadow:var(--shadow);margin:0}
      .manager-home-r62-head{align-items:flex-start}
      .manager-home-r62-count{display:grid;place-items:center;min-width:58px;height:58px;padding:0 15px;border-radius:18px;background:var(--primary-soft);color:var(--primary);font-family:var(--font-heading);font-size:1.05rem;font-weight:800}
      .manager-home-r62-today-list{min-height:150px}
      .manager-home-r62-today-list>.empty{min-height:150px;display:grid;place-items:center}
      .manager-home-r62-moves .card{box-shadow:none}
      @media(min-width:1024px){
        .manager-home-r62-top{grid-template-columns:minmax(0,2.32fr) minmax(350px,.9fr);align-items:stretch;gap:16px}
        .manager-home-r62-bottom{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);align-items:stretch;gap:16px}
        .manager-home-r62-hero{min-height:390px;padding:48px 50px;display:flex;flex-direction:column;justify-content:center;border-radius:30px}
        .manager-home-r62-hero h1{font-size:clamp(2.8rem,3.65vw,4.45rem);line-height:1.02;letter-spacing:-.045em;margin:12px 0 16px;max-width:1100px}
        .manager-home-r62-hero p{font-size:1rem;max-width:850px}
        .manager-home-r62-hero .hero-actions{margin-top:32px}
        .manager-home-r62-hero .btn{min-height:50px;padding:13px 20px;font-size:.8rem}
        .manager-home-r62-card{padding:28px;min-height:220px}
        .manager-home-r62-today{min-height:390px;display:flex;flex-direction:column}
        .manager-home-r62-today .section-head{margin-bottom:20px}
        .manager-home-r62-today-list{flex:1;min-height:0;justify-content:center}
        .manager-home-r62-today-list>.empty{min-height:165px}
        .manager-home-r62-panel>.section-head{margin-bottom:16px}
        .manager-home-r62-panel>.section-head h2{font-size:1.12rem}
        .manager-home-r62-panel .pending-grid{gap:12px}
        .manager-home-r62-panel .pending-grid .metric{min-height:108px;display:grid;grid-template-columns:50px minmax(0,1fr);gap:14px;align-items:center;text-align:left!important;padding:16px 18px;border-radius:18px;box-shadow:none}
        .manager-home-r62-panel .pending-grid .metric-icon{margin:0;width:50px;height:50px;border-radius:14px}
        .manager-home-r62-panel .pending-grid .metric>div:last-child{width:auto}
        .manager-home-r62-panel .pending-grid .metric strong{text-align:left;font-size:1.15rem}
        .manager-home-r62-panel .pending-grid .metric span{text-align:left;margin-top:3px;font-size:.69rem}
        .manager-home-r62-moves{gap:12px}
        .manager-home-r62-moves>.card{min-height:124px;border-radius:18px;padding:16px}
      }
      @media(min-width:1600px){
        .manager-home-r62-top{grid-template-columns:minmax(0,2.45fr) minmax(390px,.88fr)}
        .manager-home-r62-hero{min-height:420px;padding:52px 56px}
        .manager-home-r62-today{min-height:420px}
      }
      @media(max-width:1023px){
        .manager-home-r62-top,.manager-home-r62-bottom{grid-template-columns:1fr}
        .manager-home-r62-card{margin:0}
      }
    </style>
    <div class="manager-home-r62">
      <div class="manager-home-r62-top">
        <section class="hero manager-home-r62-hero">
          <div class="eyebrow" style="color:#d9eadf">Casa do Oleiro • Gestão</div>
          <h1>${managerGreeting()}</h1>
          <p class="muted">Veja o que precisa da sua atenção e o que acontece hoje na Casa.</p>
          <div class="hero-actions">
            <button class="btn btn-light" onclick="navigateManager('volunteer')"><i class="fa-solid fa-users"></i>Ver voluntariado</button>
            <button class="btn btn-outline" style="border-color:rgba(255,255,255,.28);color:white" onclick="openTodayAgenda()"><i class="fa-regular fa-calendar"></i>Abrir agenda de hoje</button>
          </div>
        </section>
        <section class="manager-home-r62-card manager-home-r62-today">
          <div class="section-head manager-home-r62-head"><div><div class="eyebrow">Hoje na Casa</div><p>${longDate(_oleiroToday)}</p></div><span class="manager-home-r62-count">${todaySessions.length}</span></div>
          <div class="list manager-home-r62-today-list">${todaySessions.length?todaySessions.map(s=>agendaItem(s.activity.name,s.activity.owner,s.group,s.status,activityPeriodValue(s.raw||{},s.activity),s.activity.duration)).join(''):'<div class="empty">Nenhuma atividade prevista para hoje.</div>'}</div>
        </section>
      </div>
      <div class="manager-home-r62-bottom">
        <section class="manager-home-r62-card manager-home-r62-panel">
          <div class="section-head"><div><h2>Pendências operacionais</h2><p>Itens que dependem de decisão ou revisão.</p></div></div>
          <div class="grid-2 pending-grid">${metric(dashboardCount('analysis'),'fa-clipboard-check','Em análise',"state.candidateFilter='analysis';navigateManager('volunteer')")}${metric(dashboardCount('adjustments'),'fa-rotate','Ajustes pendentes',"openManagerAdjustments()")}</div>
        </section>
        <section class="manager-home-r62-card manager-home-r62-panel">
          <div class="section-head"><div><h2>Próximas movimentações</h2><p>Chegadas e saídas confirmadas.</p></div></div>
          <div class="grid-2 manager-home-r62-moves"><div class="card"><span class="eyebrow"><i class="fa-solid fa-arrow-right-to-bracket"></i> Chegadas</span><div style="margin-top:10px" class="list">${movementList(arrivals,'from')}</div></div><div class="card"><span class="eyebrow"><i class="fa-solid fa-arrow-right-from-bracket"></i> Saídas</span><div style="margin-top:10px" class="list">${movementList(departures,'to')}</div></div></div>
        </section>
      </div>
    </div>`;
  };

  installAdminShellStylesR62();
  renderManager=function(){
    const pages={home:managerHome,volunteer:managerVolunteers,agenda:managerAgenda,groups:managerGroups,menu:managerMenu};
    app.innerHTML=`<div class="admin-shell-r62">${adminSidebarR62()}<div class="admin-content-r62">${header()}<main class="page">${pages[state.managerPage]()}</main></div></div>`;
    navRoot.innerHTML=managerNav();
    if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
  };
  render=function(){renderManager()};

  if(typeof state!=='undefined'&&state.role==='manager')render();
})();
