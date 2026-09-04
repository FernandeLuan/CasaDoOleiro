/* Navegação e hierarquia visual definitivas do Admin na homologação. */
(function adminNavigation(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_ADMIN_NAVIGATION__)return;
  window.__OLEIRO_ADMIN_NAVIGATION__=true;

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function installStyles(){
    if(document.getElementById('adminNavigationStyles'))return;
    const style=document.createElement('style');
    style.id='adminNavigationStyles';
    style.textContent=`
      /* Um único padrão de cabeçalho para páginas administrativas. */
      .admin-page-title .eyebrow,
      .planning-board-title .eyebrow,
      .occupancy-v2-copy .eyebrow{
        display:block!important;
        margin:0 0 3px!important;
        color:var(--primary)!important;
        font-size:.65rem!important;
        font-weight:700!important;
        letter-spacing:.1em!important;
        text-transform:uppercase!important;
      }
      .admin-page-title h1,
      .planning-board-title h1,
      .occupancy-v2-copy h1{
        margin:3px 0 4px!important;
        font-size:1.45rem!important;
        line-height:1.15!important;
        color:var(--text)!important;
        letter-spacing:normal!important;
      }
      .admin-page-title p,
      .planning-board-title p,
      .occupancy-v2-copy>p{
        margin:0!important;
        color:var(--muted)!important;
        font-size:.7rem!important;
        line-height:1.45!important;
      }

      .admin-sidebar-item-info{margin-top:8px}
      .admin-sidebar-account-r62{border-top:1px solid var(--border);padding-top:10px!important}
      .admin-content-r62>.app-header .header-actions{display:flex;align-items:center;gap:8px}

      .admin-groups-page,.admin-house-info{width:100%;max-width:1320px;margin:0 auto;display:grid;gap:14px}
      .admin-groups-page>.section{margin:0}
      .admin-house-info-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:14px;align-items:start}
      .admin-house-info-card{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:16px 18px;box-shadow:var(--shadow);min-width:0}
      .admin-house-info-card.wide{grid-row:span 2}
      .admin-house-info-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px}
      .admin-house-info-card-head>div{min-width:0}
      .admin-house-info-card-head strong{display:block;font-size:.8rem;color:var(--text)}
      .admin-house-info-card-head p{margin:3px 0 0;color:var(--muted);font-size:.62rem;line-height:1.45}
      .admin-house-info-card .info-accordion,.admin-house-info-card .accordion{margin:0}
      .admin-house-routine{display:grid;gap:0;border:1px solid var(--border);border-radius:14px;overflow:hidden}
      .admin-house-routine-row{display:grid;grid-template-columns:88px minmax(0,1fr);gap:12px;padding:9px 11px;border-bottom:1px solid var(--border);align-items:center}
      .admin-house-routine-row:last-child{border-bottom:0}
      .admin-house-routine-row time{font-size:.59rem;font-weight:700;color:var(--primary)}
      .admin-house-routine-row span{font-size:.62rem;color:var(--text)}
      .admin-house-units{display:grid;gap:8px}
      .admin-house-unit{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 11px;border:1px solid var(--border);border-radius:13px;background:var(--surface)}
      .admin-house-unit>div{min-width:0;display:grid;gap:2px}
      .admin-house-unit strong{font-size:.67rem;color:var(--text)}
      .admin-house-unit small{font-size:.55rem;color:var(--muted)}
      .admin-house-unit-status{font-size:.51rem;font-weight:700;border-radius:999px;padding:5px 7px;background:var(--surface-2);color:var(--muted);white-space:nowrap}
      .admin-house-unit-status.active{background:var(--primary-soft);color:var(--primary)}

      .admin-account-card-refined{display:grid;gap:0}
      .admin-account-appearance{margin-top:14px;padding-top:14px;border-top:1px solid var(--border)}
      .admin-account-appearance-head{display:grid;gap:3px;margin-bottom:9px}
      .admin-account-appearance-head small{font-size:.55rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
      .admin-account-appearance-head strong{font-size:.72rem;color:var(--text)}
      .admin-theme-switch{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border:1px solid var(--border);border-radius:13px;background:var(--surface)}
      .admin-theme-switch button{min-height:38px;border:0;border-radius:9px;background:transparent;color:var(--muted);font-size:.64rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:7px}
      .admin-theme-switch button.active{background:var(--primary);color:#fff}
      .admin-account-signout{margin-top:14px;padding-top:14px;border-top:1px solid var(--border)}

      @media(max-width:1023px){
        #navRoot .bottom-nav{grid-template-columns:repeat(5,minmax(74px,1fr))!important;overflow-x:auto;justify-content:start}
        #navRoot .bottom-nav .nav-btn{min-width:74px}
        .admin-house-info-grid{grid-template-columns:1fr}
        .admin-house-info-card.wide{grid-row:auto}
      }
    `;
    document.head.appendChild(style);
  }

  function sidebarButton(active,icon,label,action,extra=''){
    return `<button class="admin-sidebar-item-r62 ${active?'active':''} ${extra}" type="button" onclick="${action}"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;
  }

  function enhanceSidebar(){
    const nav=document.querySelector('.admin-sidebar-nav-r62');
    if(nav){
      nav.innerHTML=[
        sidebarButton(state.managerPage==='home','fa-house','Início',"navigateManager('home')"),
        sidebarButton(state.managerPage==='volunteer','fa-users','Voluntariado',"navigateManager('volunteer')"),
        sidebarButton(state.managerPage==='planning','fa-calendar-check','Planejamento',"navigateManager('planning')"),
        sidebarButton(state.managerPage==='occupancy','fa-bed','Ocupação','openManagerOccupancy()'),
        sidebarButton(state.managerPage==='groups','fa-people-group','Grupos',"navigateManager('groups')"),
        sidebarButton(state.managerPage==='houseInfo','fa-circle-info','Informações da Casa','openHouseInfo()','admin-sidebar-item-info')
      ].join('');
    }
    document.querySelector('.admin-sidebar-tools-r62')?.remove();
    const account=document.querySelector('.admin-sidebar-account-r62');
    if(account){
      account.innerHTML=sidebarButton(false,'fa-user','Minha conta','openMyAccount()')+sidebarButton(false,'fa-right-from-bracket','Sair','logout()');
    }
  }

  function enhanceAdminHeader(){
    const actions=document.querySelector('.admin-content-r62>.app-header .header-actions');
    if(!actions)return;
    actions.innerHTML='<button class="icon-btn" type="button" onclick="openMyAccount()" aria-label="Minha conta" title="Minha conta"><i class="fa-solid fa-user"></i></button><button class="icon-btn" type="button" onclick="openHouseInfo()" aria-label="Informações da Casa" title="Informações da Casa"><i class="fa-solid fa-circle-info"></i></button>';
  }

  function bottomNav(){
    const item=(icon,label,action,active)=>`<button class="nav-btn ${active?'active':''}" onclick="${action}"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`;
    return `<nav class="bottom-nav">${item('fa-house','Início',"navigateManager('home')",state.managerPage==='home')}${item('fa-users','Voluntariado',"navigateManager('volunteer')",state.managerPage==='volunteer')}${item('fa-calendar-check','Planejamento',"navigateManager('planning')",state.managerPage==='planning')}${item('fa-bed','Ocupação','openManagerOccupancy()',state.managerPage==='occupancy')}${item('fa-people-group','Grupos',"navigateManager('groups')",state.managerPage==='groups')}</nav>`;
  }

  function pageTitle(eyebrow,title,description){
    return `<header class="admin-page-title"><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></header>`;
  }

  function routineHtml(){
    const rows=[
      ['06:00','Despertar e higiene'],['06:15–07:30','Devocional'],['07:30–08:15','Café da manhã'],['08:15–11:15','Atividades práticas'],['11:15–12:00','Reunião de sentimentos'],['12:00–13:30','Almoço e descanso'],['13:45–15:00','Atividades'],['15:00–15:15','Café da tarde'],['15:15–16:30','Atividades'],['16:30 em diante','Banho, lazer e jantar'],['19:30–21:00','Filme, palestra, documentário ou outras atividades'],['21:00','Alojamento'],['21:30','Silêncio total']
    ];
    return `<div class="admin-house-routine">${rows.map(([time,label])=>`<div class="admin-house-routine-row"><time>${esc(time)}</time><span>${esc(label)}</span></div>`).join('')}</div>`;
  }

  function unitsHtml(){
    const rows=Array.isArray(state.units)?state.units:[];
    if(!rows.length)return '<div class="empty">Nenhuma unidade cadastrada.</div>';
    return `<div class="admin-house-units">${rows.map(unit=>{const active=unit.active!==false;return `<div class="admin-house-unit"><div><strong>${esc(unit.name||unit.id)}</strong><small>${unit.acceptingVolunteers===true?'Aceitando voluntários':active?'Unidade ativa':'Unidade inativa'}</small></div><span class="admin-house-unit-status ${active?'active':''}">${active?'Ativa':'Inativa'}</span></div>`}).join('')}</div>`;
  }

  function portalHtml(){
    try{
      if(typeof infoAccordion==='function')return infoAccordion();
    }catch(error){console.warn('Informações do portal indisponíveis:',error)}
    return '<div class="empty">As informações do portal não puderam ser carregadas.</div>';
  }

  function houseInfoHtml(){
    return `<section class="admin-house-info compact-page-top">${pageTitle('Informações','Informações da Casa','Centralize orientações do portal, rotina e dados gerais das unidades.')}<div class="admin-house-info-grid"><article class="admin-house-info-card wide"><div class="admin-house-info-card-head"><div><strong>Portal do voluntário</strong><p>Conteúdo e orientações apresentados aos candidatos e voluntários.</p></div></div>${portalHtml()}</article><article class="admin-house-info-card"><div class="admin-house-info-card-head"><div><strong>Rotina da Casa</strong><p>Horários de referência usados na comunidade.</p></div></div>${routineHtml()}</article><article class="admin-house-info-card"><div class="admin-house-info-card-head"><div><strong>Unidades</strong><p>Visão rápida das unidades cadastradas.</p></div><button class="btn btn-soft" type="button" onclick="openUnits()"><i class="fa-solid fa-gear"></i>Gerenciar</button></div>${unitsHtml()}</article></div></section>`;
  }

  function enhanceGroupsPage(){
    if(state.managerPage!=='groups')return;
    const main=document.querySelector('.admin-content-r62 main.page');
    if(!main)return;
    if(!main.querySelector('.admin-groups-page')){
      const current=main.innerHTML;
      main.innerHTML=`<div class="admin-groups-page compact-page-top">${current}</div>`;
    }
    main.querySelectorAll('.admin-groups-page .admin-page-title,.groups-page>.admin-page-title').forEach(node=>node.remove());
    main.querySelectorAll('.groups-unit-summary>span').forEach(node=>{node.textContent=String(node.textContent||'').replace(/\s*·\s*capacidade\s+\d+/i,'')});
  }

  function enhancePageTitles(){
    document.querySelector('.planning-board-title')?.classList.add('admin-page-title');
    document.querySelector('.occupancy-v2-copy')?.classList.add('admin-page-title');
  }

  window.openHouseInfo=function(){
    state.managerPage='houseInfo';
    if(typeof window.render==='function')window.render();
    if(typeof afterNavigation==='function')afterNavigation();
  };

  window.setAdminTheme=function(target){
    const desired=target==='dark'?'dark':'light';
    if(String(state.theme||'light')===desired)return;
    if(typeof toggleTheme==='function')toggleTheme();
    setTimeout(()=>{if(typeof window.openMyAccount==='function')window.openMyAccount()},0);
  };

  window.openMyAccount=function(){
    const session=state.currentSession||{},dark=state.theme==='dark';
    openModal('Minha conta','',`<div class="admin-account-card admin-account-card-refined"><div class="admin-account-row"><span class="admin-account-icon"><i class="fa-regular fa-envelope"></i></span><div><small>Email</small><strong>${esc(session.email||'—')}</strong></div></div><div class="admin-account-row"><span class="admin-account-icon"><i class="fa-solid fa-user-shield"></i></span><div><small>Perfil</small><strong>Administrador</strong></div></div><div class="admin-account-appearance"><div class="admin-account-appearance-head"><small>Aparência</small><strong>Tema do painel</strong></div><div class="admin-theme-switch" role="group" aria-label="Tema do painel"><button class="${!dark?'active':''}" type="button" aria-pressed="${!dark?'true':'false'}" onclick="setAdminTheme('light')"><i class="fa-solid fa-sun"></i>Claro</button><button class="${dark?'active':''}" type="button" aria-pressed="${dark?'true':'false'}" onclick="setAdminTheme('dark')"><i class="fa-solid fa-moon"></i>Escuro</button></div></div><div class="admin-account-signout"><button class="btn btn-outline btn-block" type="button" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i>Sair</button></div></div>`);
  };

  installStyles();

  window.managerNav=managerNav=function(){return bottomNav()};

  const baseRenderManager=window.renderManager;
  if(typeof baseRenderManager!=='function')return;

  window.renderManager=renderManager=function(){
    if(state.managerPage==='menu')state.managerPage='houseInfo';
    const requested=state.managerPage;
    const result=baseRenderManager();
    if(requested==='houseInfo'){
      const main=document.querySelector('.admin-content-r62 main.page');
      if(main)main.innerHTML=houseInfoHtml();
    }
    enhanceSidebar();
    enhanceAdminHeader();
    enhancePageTitles();
    enhanceGroupsPage();
    if(typeof navRoot!=='undefined'&&navRoot)navRoot.innerHTML=bottomNav();
    return result;
  };
  window.render=render=function(){return window.renderManager()};

  if(state.role==='manager')window.render();
})();