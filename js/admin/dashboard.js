function managerGreeting(){
  const hour=new Date().getHours();const lang=typeof currentLanguage==='function'?currentLanguage():'pt';
  if(hour<12)return lang==='en'?'Good morning':lang==='es'?'Buenos días':'Bom dia';
  if(hour<18)return lang==='en'?'Good afternoon':lang==='es'?'Buenas tardes':'Boa tarde';
  return lang==='en'?'Good evening':lang==='es'?'Buenas noches':'Boa noite';
}
function openTodayAgenda(){navigateManager('planning')}
function pendingChangeApplicationIds(){return new Set((state.pendingChangeRequests||[]).map(row=>String(row.applicationId||'')).filter(Boolean))}
function dashboardCount(status){
  const base=Number(state.dashboardCounts?.[status])||0;
  if(status!=='adjustments')return base;
  const postApproval=new Set((state.pendingChangeRequests||[]).filter(row=>row.reviewKind==='post_approval'||row.status==='change_requested').map(row=>String(row.applicationId||'')).filter(Boolean));
  return base+postApproval.size;
}
function dashboardProjectCounts(){
  const rows=window.OleiroProjects?.list?.()||[];
  return rows.reduce((acc,p)=>{
    const status=String(p?.status||'draft');
    if(Object.prototype.hasOwnProperty.call(acc,status))acc[status]+=1;
    return acc;
  },{analysis:0,adjustments:0,approved:0,in_progress:0,completed:0});
}
function dashboardStatusPill(value,label,tone=''){
  return `<span class="manager-home-focus-pill ${tone}"><strong>${Number(value)||0}</strong><small>${escapeHtml(label)}</small></span>`;
}
function movementDaysLabel(iso){if(!iso)return '';const diff=Math.ceil((new Date(iso+'T12:00:00')-new Date(_oleiroToday+'T12:00:00'))/86400000);return diff===0?'hoje':diff===1?'amanhã':diff>1?`em ${diff} dias`:diff===-1?'ontem':`${Math.abs(diff)} dias atrás`}
function nextMovements(field,limit=20){const rows=field==='from'?(state.dashboardArrivals||[]):(state.dashboardDepartures||[]);return rows.slice(0,limit)}
function movementList(rows,field){return rows.length?rows.map(p=>miniMove(p.name,fmtDate(p[field],true),movementDaysLabel(p[field]))).join(''):'<div class="empty">Nenhuma movimentação prevista.</div>'}
function releaseManagerHomeScrollLock(){
  const hasModal=typeof modalRoot!=='undefined'&&modalRoot?.querySelector?.('.modal-backdrop');if(hasModal)return;
  document.body.classList.remove('modal-open');document.body.style.removeProperty('overflow');document.body.style.removeProperty('height');document.documentElement.style.removeProperty('overflow');document.documentElement.style.removeProperty('height');
}
function managerHome(){
  releaseManagerHomeScrollLock();
  const todayRows=Array.isArray(state.managerTodaySessions)?state.managerTodaySessions:[],todaySessions=todayRows.filter(row=>String(row.date||'')===String(_oleiroToday)).map(session=>{const activity=session.activity||{};return {activity:{...activity,name:session.activityName||activity.name||'Atividade',owner:session.ownerName||activity.ownerName||activity.owner||'Voluntário',duration:Number(session.duration||activity.duration||60)},group:session.groupId||'A definir',status:session.status||'proposed',raw:session}}),arrivals=nextMovements('from'),departures=nextMovements('to');
  const todayLoading=state.managerTodayLoaded!==true,dashboardLoading=state.managerDashboardLoaded!==true;
  const projectCounts=dashboardProjectCounts(),volunteerAnalysis=dashboardCount('analysis'),volunteerAdjustments=dashboardCount('adjustments');
  const todayHtml=todayLoading?'<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando atividades...</div>':todaySessions.length?todaySessions.map(s=>agendaItem(s.activity.name,s.activity.owner,s.group,s.status,activityPeriodValue(s.raw||{},s.activity),s.activity.duration)).join(''):'<div class="empty">Nenhuma atividade prevista para hoje.</div>';
  const movementsLoading='<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando movimentações...</div>';
  return `<style id="managerHomeStyles">
    @media(min-width:1024px){
      html{height:auto!important;min-height:100%!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important}
      body:not(.modal-open){height:auto!important;min-height:100vh!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important}
      body:not(.modal-open) #app,body:not(.modal-open) .admin-shell-r62,body:not(.modal-open) .admin-content-r62,body:not(.modal-open) .admin-content-r62>.page{height:auto!important;max-height:none!important;overflow:visible!important}
      body:not(.modal-open) .admin-shell-r62,body:not(.modal-open) .admin-content-r62,body:not(.modal-open) .admin-content-r62>.page{min-height:100vh!important}
      body:not(.modal-open) .admin-content-r62>.page{padding-bottom:44px!important}
    }
    .manager-home{width:100%;display:grid;gap:16px}.manager-home-grid{display:grid;gap:16px;align-items:stretch}
    .manager-home-card{background:var(--surface);border:1px solid var(--border);border-radius:26px;padding:22px;box-shadow:var(--shadow);margin:0;min-width:0}
    .manager-home-card .section-head{align-items:flex-start;margin-bottom:16px}.manager-home-card .section-head h2{margin:0 0 4px;font-size:1.12rem;line-height:1.25;color:var(--text)}.manager-home-card .section-head p{margin:0;color:var(--muted);font-size:.76rem}
    .manager-home-hero{margin:0;min-width:0}.manager-home-hero h1{letter-spacing:-.035em}.manager-home-today-list{display:grid;gap:10px;min-height:0}.manager-home-today-list>.empty{min-height:100px;display:grid;place-items:center}.manager-home-movements .card{box-shadow:none}
    .manager-home-today-item{cursor:pointer}
    .manager-home-focus-list{display:grid;gap:10px}
    .manager-home-focus-row{width:100%;border:1px solid var(--border);background:var(--surface);border-radius:18px;padding:12px;display:grid;grid-template-columns:42px minmax(0,1fr) 16px;gap:11px;align-items:center;text-align:left;color:var(--text);font:inherit;cursor:pointer;box-shadow:none}
    .manager-home-focus-row:active{transform:scale(.995)}
    .manager-home-focus-icon{width:42px;height:42px;border-radius:13px;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center;font-size:.82rem}
    .manager-home-focus-copy{min-width:0}
    .manager-home-focus-copy>strong{display:block;font-size:.77rem;line-height:1.25;margin:0 0 7px}
    .manager-home-focus-pills{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .manager-home-focus-pill{display:inline-flex;align-items:center;gap:4px;min-height:25px;padding:4px 8px;border-radius:999px;background:var(--surface-2);color:var(--muted);font-size:.51rem;line-height:1;white-space:nowrap}
    .manager-home-focus-pill strong{font-size:.58rem;color:var(--text)}
    .manager-home-focus-pill small{font-size:.51rem;color:inherit}
    .manager-home-focus-pill.warning{background:#fff3d5;color:#97630d}.manager-home-focus-pill.warning strong{color:#97630d}
    .manager-home-focus-pill.success{background:var(--success-soft);color:var(--success)}.manager-home-focus-pill.success strong{color:var(--success)}
    .manager-home-focus-pill.info{background:#e9f2f8;color:#3d6982}.manager-home-focus-pill.info strong{color:#3d6982}
    .manager-home-focus-row>i{justify-self:end;color:var(--muted);font-size:.7rem}
    @media(min-width:1024px){
      .manager-home-grid{grid-template-columns:minmax(0,1.18fr) minmax(380px,.92fr)}
      .manager-home-hero{min-height:238px;padding:28px 34px;display:flex;flex-direction:column;justify-content:center;border-radius:26px}.manager-home-hero h1{font-size:clamp(2.2rem,2.8vw,3.35rem);line-height:1.04;margin:8px 0 10px}.manager-home-hero p{font-size:.88rem;max-width:720px;margin:0}.manager-home-hero .hero-actions{margin-top:20px}.manager-home-hero .btn{min-height:44px;padding:10px 16px;font-size:.75rem}
      .manager-home-card{padding:22px 24px;min-height:0}.manager-home-pending{display:flex;flex-direction:column;justify-content:flex-start}.manager-home-pending .manager-home-focus-list{margin-top:auto;margin-bottom:auto}
      .manager-home-today,.manager-home-movements-card{min-height:310px}.manager-home-today{display:flex;flex-direction:column}.manager-home-today-list{flex:1;align-content:start}.manager-home-today-list .list-item{min-height:0}.manager-home-moves{gap:12px}.manager-home-moves>.card{min-height:122px;border-radius:18px;padding:16px}
    }
    @media(min-width:1500px){.manager-home-grid{grid-template-columns:minmax(0,1.2fr) minmax(420px,.9fr)}.manager-home-hero{min-height:228px;padding:26px 34px}}
    @media(max-width:1023px){.manager-home-grid{grid-template-columns:1fr}.manager-home-card{padding:20px}.manager-home-hero{padding:28px 24px;border-radius:24px}}
  </style>
  <div class="manager-home">
    <div class="manager-home-grid manager-home-top">
      <section class="hero manager-home-hero">
        <div class="eyebrow" style="color:#d9eadf">Casa do Oleiro • Gestão</div><h1>${managerGreeting()}</h1><p class="muted">Veja o que precisa da sua atenção e o que acontece hoje na Casa.</p>
        <div class="hero-actions"><button class="btn btn-light" onclick="navigateManager('volunteer')"><i class="fa-solid fa-users"></i>Ver voluntariado</button><button class="btn btn-outline" style="border-color:rgba(255,255,255,.28);color:white" onclick="navigateManager('planning')"><i class="fa-regular fa-calendar-check"></i>Abrir planejamento</button></div>
      </section>
      <section class="manager-home-card manager-home-pending">
        <div class="section-head"><div><h2>Atenção e acompanhamento</h2><p>Veja rapidamente o que precisa de revisão e o que está em andamento.</p></div></div>
        <div class="manager-home-focus-list">
          <button class="manager-home-focus-row" type="button" onclick="navigateManager('volunteer')">
            <span class="manager-home-focus-icon"><i class="fa-solid fa-users"></i></span>
            <span class="manager-home-focus-copy">
              <strong>Voluntariado</strong>
              <span class="manager-home-focus-pills">
                ${dashboardStatusPill(volunteerAnalysis,'em análise',volunteerAnalysis?'warning':'')}
                ${dashboardStatusPill(volunteerAdjustments,'ajustes',volunteerAdjustments?'warning':'')}
              </span>
            </span>
            <i class="fa-solid fa-chevron-right"></i>
          </button>
          <button class="manager-home-focus-row" type="button" onclick="navigateManager('projects')">
            <span class="manager-home-focus-icon"><i class="fa-solid fa-seedling"></i></span>
            <span class="manager-home-focus-copy">
              <strong>Projetos</strong>
              <span class="manager-home-focus-pills">
                ${dashboardStatusPill(projectCounts.analysis,'em análise',projectCounts.analysis?'warning':'')}
                ${dashboardStatusPill(projectCounts.adjustments,'ajustes',projectCounts.adjustments?'warning':'')}
                ${dashboardStatusPill(projectCounts.in_progress,'em execução',projectCounts.in_progress?'success':'')}
              </span>
            </span>
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </section>
    </div>
    <div class="manager-home-grid manager-home-bottom">
      <section class="manager-home-card manager-home-today"><div class="section-head"><div><h2>Hoje na Casa</h2><p>${longDate(_oleiroToday)}</p></div></div><div class="list manager-home-today-list">${todayHtml}</div></section>
      <section class="manager-home-card manager-home-movements-card"><div class="section-head"><div><h2>Próximas movimentações</h2><p>Chegadas e saídas confirmadas nos próximos 15 dias.</p></div></div><div class="grid-2 manager-home-moves"><div class="card"><span class="eyebrow"><i class="fa-solid fa-arrow-right-to-bracket"></i> Chegadas</span><div style="margin-top:10px" class="list">${dashboardLoading?movementsLoading:movementList(arrivals,'from')}</div></div><div class="card"><span class="eyebrow"><i class="fa-solid fa-arrow-right-from-bracket"></i> Saídas</span><div style="margin-top:10px" class="list">${dashboardLoading?movementsLoading:movementList(departures,'to')}</div></div></div></section>
    </div>
    ${typeof window.managerHomeOccupancyHtml==='function'?window.managerHomeOccupancyHtml():''}
  </div>`;
}
function metric(n,icon,label,action){return `<button class="card metric" style="border:1px solid var(--border);color:var(--text)" onclick="${action}"><div class="metric-icon"><i class="fa-solid ${icon}"></i></div><div><strong>${n} &rsaquo; ${label}</strong></div></button>`}
function agendaItem(name,person,group,status,period='Sem preferência',duration=0){const [l,t]=statusMeta(status);return `<div class="list-item manager-home-today-item" role="button" tabindex="0" onclick="openTodayAgenda()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openTodayAgenda()}"><div class="item-main"><h3 data-no-i18n>${escapeHtml(name||'Atividade')}</h3><p>${Number(duration)||0} min • ${escapeHtml(period)} • ${escapeHtml(person||'Voluntário')} • ${escapeHtml(group||'A definir')}</p><div class="item-meta">${badge(l,t)}</div></div></div>`}
function miniMove(name,date,label){return `<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong style="font-size:.7rem">${escapeHtml(name||'Voluntário')}</strong><div style="font-size:.61rem;color:var(--muted)">${date} • ${label}</div></div>`}

// Mantém uma referência estável da Home aprovada para a homologação. Scripts legados carregados depois podem redefinir managerHome, mas não esta referência.
window.managerHomeDashboard=managerHome;
