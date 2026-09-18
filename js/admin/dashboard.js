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
function openDashboardVolunteerFilter(status){
  state.candidateFilter=String(status||'all');
  state.candidateUnit='all';
  state.candidateSearch='';
  navigateManager('volunteer');
}
function openDashboardProjectFilter(status){
  state.projectFilter=String(status||'all');
  state.projectSearch='';
  navigateManager('projects');
}
function dashboardQuickAction({icon,title,count,label,action,tone=''}) {
  return `<button class="manager-home-quick-action ${tone}" type="button" onclick="${action}">
    <span class="manager-home-quick-icon"><i class="fa-solid ${icon}"></i></span>
    <span class="manager-home-quick-copy"><strong>${escapeHtml(title)}</strong><small><b>${Number(count)||0}</b> ${escapeHtml(label)}</small></span>
    <i class="fa-solid fa-chevron-right"></i>
  </button>`;
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
  const attentionActions=[
    volunteerAnalysis?dashboardQuickAction({icon:'fa-clipboard-check',title:'Voluntariado',count:volunteerAnalysis,label:'em análise',action:"openDashboardVolunteerFilter('analysis')",tone:'warning'}):'',
    volunteerAdjustments?dashboardQuickAction({icon:'fa-rotate',title:'Voluntariado',count:volunteerAdjustments,label:'com ajustes',action:"openDashboardVolunteerFilter('adjustments')",tone:'warning'}):'',
    projectCounts.analysis?dashboardQuickAction({icon:'fa-seedling',title:'Projetos',count:projectCounts.analysis,label:'em análise',action:"openDashboardProjectFilter('analysis')",tone:'warning'}):'',
    projectCounts.adjustments?dashboardQuickAction({icon:'fa-pen-ruler',title:'Projetos',count:projectCounts.adjustments,label:'com ajustes',action:"openDashboardProjectFilter('adjustments')",tone:'warning'}):''
  ].filter(Boolean).join('');
  const followupActions=[
    projectCounts.in_progress?dashboardQuickAction({icon:'fa-chart-line',title:'Projetos',count:projectCounts.in_progress,label:'em execução',action:"openDashboardProjectFilter('in_progress')",tone:'success'}):''
  ].filter(Boolean).join('');
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
    .manager-home-operational{display:grid;gap:14px}
    .manager-home-operational-group{display:grid;gap:8px}
    .manager-home-operational-label{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 2px}
    .manager-home-operational-label strong{font-size:.68rem;line-height:1.25;color:var(--text)}
    .manager-home-operational-label span{font-size:.54rem;color:var(--muted)}
    .manager-home-quick-list{display:grid;gap:8px}
    .manager-home-quick-action{width:100%;border:1px solid var(--border);background:var(--surface);border-radius:16px;padding:10px 11px;display:grid;grid-template-columns:38px minmax(0,1fr) 14px;gap:10px;align-items:center;text-align:left;color:var(--text);font:inherit;cursor:pointer;box-shadow:none}
    .manager-home-quick-action:active{transform:scale(.995)}
    .manager-home-quick-icon{width:38px;height:38px;border-radius:12px;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center;font-size:.74rem}
    .manager-home-quick-copy{min-width:0}
    .manager-home-quick-copy strong{display:block;font-size:.7rem;line-height:1.2;margin:0}
    .manager-home-quick-copy small{display:block;margin-top:2px;color:var(--muted);font-size:.58rem;line-height:1.3}
    .manager-home-quick-copy small b{color:var(--text);font-size:.64rem}
    .manager-home-quick-action>i{justify-self:end;color:var(--muted);font-size:.62rem}
    .manager-home-quick-action.warning .manager-home-quick-icon{background:#fff3d5;color:#97630d}
    .manager-home-quick-action.success .manager-home-quick-icon{background:var(--success-soft);color:var(--success)}
    .manager-home-all-clear{min-height:64px;border:1px dashed color-mix(in srgb,var(--success) 26%,var(--border));border-radius:16px;background:color-mix(in srgb,var(--success-soft) 50%,var(--surface));display:flex;align-items:center;gap:10px;padding:12px;color:var(--success)}
    .manager-home-all-clear i{width:36px;height:36px;border-radius:12px;background:var(--success-soft);display:grid;place-items:center}
    .manager-home-all-clear div strong{display:block;font-size:.68rem}.manager-home-all-clear div small{display:block;margin-top:2px;font-size:.55rem;color:var(--muted)}
    @media(min-width:1024px){
      .manager-home-grid{grid-template-columns:minmax(0,1.18fr) minmax(380px,.92fr)}
      .manager-home-hero{min-height:238px;padding:28px 34px;display:flex;flex-direction:column;justify-content:center;border-radius:26px}.manager-home-hero h1{font-size:clamp(2.2rem,2.8vw,3.35rem);line-height:1.04;margin:8px 0 10px}.manager-home-hero p{font-size:.88rem;max-width:720px;margin:0}.manager-home-hero .hero-actions{margin-top:20px}.manager-home-hero .btn{min-height:44px;padding:10px 16px;font-size:.75rem}
      .manager-home-card{padding:22px 24px;min-height:0}.manager-home-pending{display:flex;flex-direction:column;justify-content:flex-start}.manager-home-pending .manager-home-operational{margin-top:auto;margin-bottom:auto}
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
        <div class="section-head"><div><h2>Visão operacional</h2><p>Atalhos diretos para o que precisa de atenção e acompanhamento.</p></div></div>
        <div class="manager-home-operational">
          <div class="manager-home-operational-group">
            <div class="manager-home-operational-label"><strong>Precisa de atenção</strong></div>
            <div class="manager-home-quick-list">
              ${attentionActions||'<div class="manager-home-all-clear"><i class="fa-solid fa-circle-check"></i><div><strong>Tudo em dia</strong><small>Nenhuma análise ou ajuste pendente.</small></div></div>'}
            </div>
          </div>
          ${followupActions?`<div class="manager-home-operational-group">
            <div class="manager-home-operational-label"><strong>Em acompanhamento</strong></div>
            <div class="manager-home-quick-list">${followupActions}</div>
          </div>`:''}
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
