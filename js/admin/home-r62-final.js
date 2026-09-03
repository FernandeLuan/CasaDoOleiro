/* R62 homologação: composição final da Home e navegação desktop do Admin.
   Carregado após todos os scripts para não ser sobrescrito por refinamentos históricos. */
(function applyFinalAdminHomeR62(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin')return;

  function adminHeaderNavR62(){
    const item=(active,icon,label,action)=>`<button class="admin-header-nav-item-r62 ${active?'active':''}" type="button" onclick="${action}"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;
    return `<nav class="admin-header-nav-r62" aria-label="Navegação da gestão">${item(state.managerPage==='home','fa-house','Início',"navigateManager('home')")}${item(state.managerPage==='volunteer','fa-users','Voluntariado',"navigateManager('volunteer')")}${item(state.managerPage==='agenda','fa-calendar-days','Agenda',"navigateManager('agenda')")}${item(false,'fa-bed','Ocupação','openOccupancyCalendar()')}${item(state.managerPage==='menu','fa-bars','Menu',"navigateManager('menu')")}</nav>`;
  }

  header=function(){
    return `<header class="app-header simplified-header admin-header-r62"><div class="brand-row admin-header-row-r62"><div class="brand" role="button" tabindex="0" aria-label="Ir para a tela inicial" onclick="goHome()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goHome()}"><div class="brand-mark"><i class="fa-solid fa-seedling"></i></div><div class="brand-copy"><strong>Casa do Oleiro</strong></div></div>${adminHeaderNavR62()}<div class="header-actions"><button class="icon-btn language-button" onclick="openLanguageModal()" aria-label="Idioma"><span class="current-language-code">${typeof currentLanguageCode==='function'?currentLanguageCode():'PT'}</span></button><button class="icon-btn" onclick="toggleTheme()" aria-label="Tema"><i class="fa-solid ${state.theme==='dark'?'fa-sun':'fa-moon'}"></i></button></div></div></header>`;
  };

  managerHome=function(){
    const todaySessions=getSessions(_oleiroToday),arrivals=nextMovements('from'),departures=nextMovements('to');
    return `<style id="managerHomeR62FinalStyles">
      .manager-home-r62{width:100%;display:grid;gap:18px}
      .manager-home-r62-top,.manager-home-r62-bottom{display:grid;gap:18px}
      .manager-home-r62-hero{margin:0}
      .manager-home-r62-card{background:var(--surface);border:1px solid var(--border);border-radius:26px;padding:22px;box-shadow:var(--shadow);margin:0}
      .manager-home-r62-head{align-items:flex-start}
      .manager-home-r62-count{display:grid;place-items:center;min-width:58px;height:58px;padding:0 15px;border-radius:18px;background:var(--primary-soft);color:var(--primary);font-family:var(--font-heading);font-size:1.05rem;font-weight:800}
      .manager-home-r62-today-list{min-height:150px}
      .manager-home-r62-today-list>.empty{min-height:150px;display:grid;place-items:center}
      .manager-home-r62-moves .card{box-shadow:none}
      .admin-header-nav-r62{display:none}

      @media(min-width:1024px){
        body{padding-bottom:20px!important}
        #app{width:100%!important;max-width:none!important;margin:0!important}
        .admin-header-r62{padding:14px clamp(24px,2vw,40px)!important}
        .admin-header-row-r62{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:26px;width:100%}
        .admin-header-nav-r62{display:flex;align-items:center;justify-content:center;gap:6px;min-width:0}
        .admin-header-nav-item-r62{border:0;background:transparent;color:var(--muted);min-height:42px;padding:0 15px;border-radius:14px;display:inline-flex;align-items:center;gap:8px;font-size:.74rem;font-weight:600;white-space:nowrap}
        .admin-header-nav-item-r62 i{font-size:.8rem}
        .admin-header-nav-item-r62:hover{background:var(--surface-2);color:var(--text)}
        .admin-header-nav-item-r62.active{background:var(--primary);color:#fff}
        #navRoot .bottom-nav{display:none!important}
        .page{padding:20px clamp(24px,2vw,40px) 44px!important}

        .manager-home-r62{gap:18px}
        .manager-home-r62-top{grid-template-columns:minmax(0,2.18fr) minmax(360px,.98fr);align-items:stretch;gap:18px}
        .manager-home-r62-bottom{grid-template-columns:minmax(0,1.18fr) minmax(0,1fr);align-items:stretch;gap:18px}
        .manager-home-r62-hero{min-height:365px;padding:44px 46px;display:flex;flex-direction:column;justify-content:center;border-radius:30px}
        .manager-home-r62-hero h1{font-size:clamp(2.7rem,3.6vw,4.3rem);line-height:1.03;letter-spacing:-.04em;margin:12px 0 16px;max-width:1040px}
        .manager-home-r62-hero p{font-size:.98rem;max-width:820px}
        .manager-home-r62-hero .hero-actions{margin-top:30px}
        .manager-home-r62-hero .btn{min-height:50px;padding:13px 20px;font-size:.8rem}
        .manager-home-r62-card{padding:28px;min-height:220px}
        .manager-home-r62-today{min-height:365px;display:flex;flex-direction:column}
        .manager-home-r62-today .section-head{margin-bottom:20px}
        .manager-home-r62-today-list{flex:1;min-height:0;justify-content:center}
        .manager-home-r62-today-list>.empty{min-height:150px}
        .manager-home-r62-panel>.section-head{margin-bottom:16px}
        .manager-home-r62-panel>.section-head h2{font-size:1.12rem}
        .manager-home-r62-panel .pending-grid{gap:12px}
        .manager-home-r62-panel .pending-grid .metric{min-height:104px;display:grid;grid-template-columns:50px minmax(0,1fr);gap:14px;align-items:center;text-align:left!important;padding:16px 18px;border-radius:18px;box-shadow:none}
        .manager-home-r62-panel .pending-grid .metric-icon{margin:0;width:50px;height:50px;border-radius:14px}
        .manager-home-r62-panel .pending-grid .metric>div:last-child{width:auto}
        .manager-home-r62-panel .pending-grid .metric strong{text-align:left;font-size:1.15rem}
        .manager-home-r62-panel .pending-grid .metric span{text-align:left;margin-top:3px;font-size:.69rem}
        .manager-home-r62-moves{gap:12px}
        .manager-home-r62-moves>.card{min-height:120px;border-radius:18px;padding:16px}
      }

      @media(min-width:1500px){
        .admin-header-r62{padding-left:32px!important;padding-right:32px!important}
        .page{padding-left:32px!important;padding-right:32px!important}
        .manager-home-r62-top{grid-template-columns:minmax(0,2.25fr) minmax(420px,.95fr)}
        .manager-home-r62-hero{min-height:390px;padding:48px 52px}
        .manager-home-r62-today{min-height:390px}
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

  const baseRenderManagerR62=renderManager;
  renderManager=function(){
    const pages={home:managerHome,volunteer:managerVolunteers,agenda:managerAgenda,groups:managerGroups,menu:managerMenu};
    app.innerHTML=header()+`<main class="page">${pages[state.managerPage]()}</main>`;
    navRoot.innerHTML=managerNav();
    if(typeof applyI18n==='function'){applyI18n(app);applyI18n(navRoot)}
  };
  render=function(){renderManager()};

  if(typeof state!=='undefined'&&state.role==='manager')render();
})();
