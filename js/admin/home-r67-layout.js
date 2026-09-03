/* R67 — Home administrativa mais compacta e scroll desktop normalizado. */
(function adminHomeR67(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_ADMIN_HOME_R67__)return;
  window.__OLEIRO_ADMIN_HOME_R67__=true;

  function installStyles(){
    if(document.getElementById('managerHomeR67Styles'))return;
    const style=document.createElement('style');
    style.id='managerHomeR67Styles';
    style.textContent=`
      @media(min-width:1024px){
        html{height:auto!important;min-height:100%!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important}
        body:not(.modal-open){height:auto!important;min-height:100vh!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important}
        body:not(.modal-open) #app,
        body:not(.modal-open) .admin-shell-r62,
        body:not(.modal-open) .admin-content-r62,
        body:not(.modal-open) .admin-content-r62>.page{height:auto!important;max-height:none!important;overflow:visible!important}
        body:not(.modal-open) .admin-shell-r62{min-height:100vh!important}
        body:not(.modal-open) .admin-content-r62{min-height:100vh!important}
        body:not(.modal-open) .admin-content-r62>.page{min-height:100vh!important;padding-bottom:44px!important}
      }

      .manager-home-r67{width:100%;display:grid;gap:16px}
      .manager-home-r67-grid{display:grid;gap:16px;align-items:stretch}
      .manager-home-r67-card{background:var(--surface);border:1px solid var(--border);border-radius:26px;padding:22px;box-shadow:var(--shadow);margin:0;min-width:0}
      .manager-home-r67-card .section-head{align-items:flex-start;margin-bottom:16px}
      .manager-home-r67-card .section-head h2{margin:0 0 4px;font-size:1.12rem;line-height:1.25;color:var(--text)}
      .manager-home-r67-card .section-head p{margin:0;color:var(--muted);font-size:.76rem}

      .manager-home-r67-hero{margin:0;min-width:0}
      .manager-home-r67-hero h1{letter-spacing:-.035em}
      .manager-home-r67-today-list{display:grid;gap:10px;min-height:0}
      .manager-home-r67-today-list>.empty{min-height:100px;display:grid;place-items:center}
      .manager-home-r67-pending .pending-grid{gap:12px}
      .manager-home-r67-pending .pending-grid .metric{box-shadow:none}
      .manager-home-r67-moves .card{box-shadow:none}

      @media(min-width:1024px){
        .manager-home-r67-grid{grid-template-columns:minmax(0,1.18fr) minmax(380px,.92fr)}
        .manager-home-r67-hero{min-height:238px;padding:28px 34px;display:flex;flex-direction:column;justify-content:center;border-radius:26px}
        .manager-home-r67-hero h1{font-size:clamp(2.2rem,2.8vw,3.35rem);line-height:1.04;margin:8px 0 10px}
        .manager-home-r67-hero p{font-size:.88rem;max-width:720px;margin:0}
        .manager-home-r67-hero .hero-actions{margin-top:20px}
        .manager-home-r67-hero .btn{min-height:44px;padding:10px 16px;font-size:.75rem}

        .manager-home-r67-card{padding:22px 24px;min-height:0}
        .manager-home-r67-pending{display:flex;flex-direction:column;justify-content:flex-start}
        .manager-home-r67-pending .pending-grid{grid-template-columns:1fr 1fr;margin-top:auto;margin-bottom:auto}
        .manager-home-r67-pending .pending-grid .metric{min-height:92px;display:grid;grid-template-columns:46px minmax(0,1fr);gap:12px;align-items:center;text-align:left!important;padding:14px 16px;border-radius:18px}
        .manager-home-r67-pending .pending-grid .metric-icon{margin:0;width:46px;height:46px;border-radius:14px}
        .manager-home-r67-pending .pending-grid .metric>div:last-child{width:auto}
        .manager-home-r67-pending .pending-grid .metric strong{text-align:left;font-size:1.08rem}
        .manager-home-r67-pending .pending-grid .metric span{text-align:left;margin-top:2px;font-size:.68rem}

        .manager-home-r67-today,.manager-home-r67-movements{min-height:310px}
        .manager-home-r67-today{display:flex;flex-direction:column}
        .manager-home-r67-today-list{flex:1;align-content:start}
        .manager-home-r67-today-list .list-item{min-height:0}
        .manager-home-r67-moves{gap:12px}
        .manager-home-r67-moves>.card{min-height:122px;border-radius:18px;padding:16px}
      }

      @media(min-width:1500px){
        .manager-home-r67-grid{grid-template-columns:minmax(0,1.2fr) minmax(420px,.9fr)}
        .manager-home-r67-hero{min-height:228px;padding:26px 34px}
      }

      @media(max-width:1023px){
        .manager-home-r67-grid{grid-template-columns:1fr}
        .manager-home-r67-card{padding:20px}
        .manager-home-r67-hero{padding:28px 24px;border-radius:24px}
      }
    `;
    document.head.appendChild(style);
  }

  function releaseStaleScrollLock(){
    const hasModal=typeof modalRoot!=='undefined'&&modalRoot?.querySelector?.('.modal-backdrop');
    if(hasModal)return;
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('height');
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('height');
  }

  managerHome=function(){
    const todaySessions=getSessions(_oleiroToday),arrivals=nextMovements('from'),departures=nextMovements('to');
    return `<div class="manager-home-r67">
      <div class="manager-home-r67-grid manager-home-r67-top">
        <section class="hero manager-home-r67-hero">
          <div class="eyebrow" style="color:#d9eadf">Casa do Oleiro • Gestão</div>
          <h1>${managerGreeting()}</h1>
          <p class="muted">Veja o que precisa da sua atenção e o que acontece hoje na Casa.</p>
          <div class="hero-actions">
            <button class="btn btn-light" onclick="navigateManager('volunteer')"><i class="fa-solid fa-users"></i>Ver voluntariado</button>
            <button class="btn btn-outline" style="border-color:rgba(255,255,255,.28);color:white" onclick="openTodayAgenda()"><i class="fa-regular fa-calendar"></i>Abrir agenda de hoje</button>
          </div>
        </section>

        <section class="manager-home-r67-card manager-home-r67-pending">
          <div class="section-head"><div><h2>Pendências operacionais</h2><p>Itens que dependem de decisão ou revisão.</p></div></div>
          <div class="grid-2 pending-grid">${metric(dashboardCount('analysis'),'fa-clipboard-check','Em análise',"state.candidateFilter='analysis';navigateManager('volunteer')")}${metric(dashboardCount('adjustments'),'fa-rotate','Ajustes pendentes',"openManagerAdjustments()")}</div>
        </section>
      </div>

      <div class="manager-home-r67-grid manager-home-r67-bottom">
        <section class="manager-home-r67-card manager-home-r67-today">
          <div class="section-head"><div><h2>Hoje na Casa</h2><p>${longDate(_oleiroToday)}</p></div></div>
          <div class="list manager-home-r67-today-list">${todaySessions.length?todaySessions.map(s=>agendaItem(s.activity.name,s.activity.owner,s.group,s.status,activityPeriodValue(s.raw||{},s.activity),s.activity.duration)).join(''):'<div class="empty">Nenhuma atividade prevista para hoje.</div>'}</div>
        </section>

        <section class="manager-home-r67-card manager-home-r67-movements">
          <div class="section-head"><div><h2>Próximas movimentações</h2><p>Chegadas e saídas confirmadas.</p></div></div>
          <div class="grid-2 manager-home-r67-moves"><div class="card"><span class="eyebrow"><i class="fa-solid fa-arrow-right-to-bracket"></i> Chegadas</span><div style="margin-top:10px" class="list">${movementList(arrivals,'from')}</div></div><div class="card"><span class="eyebrow"><i class="fa-solid fa-arrow-right-from-bracket"></i> Saídas</span><div style="margin-top:10px" class="list">${movementList(departures,'to')}</div></div></div>
        </section>
      </div>
    </div>`;
  };
  window.managerHome=managerHome;

  installStyles();
  releaseStaleScrollLock();
  window.addEventListener('pageshow',releaseStaleScrollLock);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')releaseStaleScrollLock()});

  if(typeof state!=='undefined'&&state.role==='manager'&&state.managerPage==='home'&&typeof render==='function')render();
})();
