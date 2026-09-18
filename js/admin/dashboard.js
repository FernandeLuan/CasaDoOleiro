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
let _managerHomePendingIndex=0;
const _managerHomePendingDismissed=new Set();
function managerHomePendingSlides(volunteerAnalysis,volunteerAdjustments,projectCounts){
  return [
    volunteerAnalysis?{id:'volunteer-analysis',icon:'fa-clipboard-check',eyebrow:'Voluntariado',title:`${volunteerAnalysis} ${volunteerAnalysis===1?'perfil em análise':'perfis em análise'}`,text:'Há candidatura aguardando sua revisão.',action:"openDashboardVolunteerFilter('analysis')"}:null,
    volunteerAdjustments?{id:'volunteer-adjustments',icon:'fa-rotate',eyebrow:'Voluntariado',title:`${volunteerAdjustments} ${volunteerAdjustments===1?'ajuste pendente':'ajustes pendentes'}`,text:'Há mudanças que precisam ser revisadas.',action:"openDashboardVolunteerFilter('adjustments')"}:null,
    projectCounts.analysis?{id:'project-analysis',icon:'fa-seedling',eyebrow:'Projetos',title:`${projectCounts.analysis} ${projectCounts.analysis===1?'projeto em análise':'projetos em análise'}`,text:'Há Projeto Legado aguardando decisão.',action:"openDashboardProjectFilter('analysis')"}:null,
    projectCounts.adjustments?{id:'project-adjustments',icon:'fa-pen-ruler',eyebrow:'Projetos',title:`${projectCounts.adjustments} ${projectCounts.adjustments===1?'projeto com ajuste':'projetos com ajustes'}`,text:'Há Projeto Legado aguardando nova revisão.',action:"openDashboardProjectFilter('adjustments')"}:null
  ].filter(Boolean).filter(slide=>!_managerHomePendingDismissed.has(slide.id));
}
function managerHomePreviewPendingSlides(){
  if(window.OleiroProjects?.isPreview!==true)return [];
  return [
    {id:'preview-project-analysis',icon:'fa-seedling',eyebrow:'Projetos',title:'1 projeto em análise',text:'Há Projeto Legado aguardando sua decisão.',action:"openDashboardProjectFilter('analysis')"},
    {id:'preview-volunteer-adjustments',icon:'fa-rotate',eyebrow:'Voluntariado',title:'1 ajuste pendente',text:'Há uma alteração aguardando nova revisão.',action:"openDashboardVolunteerFilter('adjustments')"},
    {id:'preview-project-adjustments',icon:'fa-pen-ruler',eyebrow:'Projetos',title:'1 projeto com ajuste',text:'Há Projeto Legado aguardando nova revisão.',action:"openDashboardProjectFilter('adjustments')"}
  ].filter(slide=>!_managerHomePendingDismissed.has(slide.id));
}
function managerHomePendingSlidesVisible(volunteerAnalysis,volunteerAdjustments,projectCounts){
  const real=managerHomePendingSlides(volunteerAnalysis,volunteerAdjustments,projectCounts);
  return real.length?real:managerHomePreviewPendingSlides();
}
function managerHomePendingPagerHtml(total,index){
  if(total<=1)return '';
  const first=index===0,last=index===total-1;
  return `<div class="manager-home-update-pager" aria-label="Navegação das pendências">
    <strong class="manager-home-update-counter">${index+1}/${total}</strong>
    <div class="manager-home-update-nav ${first?'is-forward':last?'is-backward':'is-middle'}">
      ${first?'':`<button type="button" class="manager-home-update-arrow" onclick="shiftManagerHomePending(-1,event)" aria-label="Pendência anterior"><i class="fa-solid fa-arrow-left"></i></button>`}
      ${last?'':`<button type="button" class="manager-home-update-arrow" onclick="shiftManagerHomePending(1,event)" aria-label="Próxima pendência"><i class="fa-solid fa-arrow-right"></i></button>`}
      <span class="manager-home-update-travel" aria-hidden="true"></span>
    </div>
  </div>`;
}
function managerHomePendingCard(slides){
  if(!slides.length)return '';
  if(_managerHomePendingIndex>=slides.length)_managerHomePendingIndex=0;
  const slide=slides[_managerHomePendingIndex],total=slides.length;
  return `<section class="manager-home-update-card" aria-label="Pendências" data-manager-home-pending>
    <div class="manager-home-update-top">
      <span class="manager-home-update-icon"><i class="fa-solid ${slide.icon}"></i></span>
      <div class="manager-home-update-copy">
        <div class="manager-home-update-meta"><span>${escapeHtml(slide.eyebrow)} · precisa de atenção</span></div>
        <strong>${escapeHtml(slide.title)}</strong>
        <p>${escapeHtml(slide.text)}</p>
      </div>
      ${managerHomePendingPagerHtml(total,_managerHomePendingIndex)}
    </div>
    <div class="manager-home-update-actions">
      <button class="btn btn-outline" type="button" onclick="dismissManagerHomePending(event)">Agora não</button>
      <button class="btn btn-primary" type="button" onclick="${slide.action}">Ver pendência</button>
    </div>
  </section>`;
}
function dismissManagerHomePending(event){
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const projectCounts=dashboardProjectCounts();
  const slides=managerHomePendingSlidesVisible(dashboardCount('analysis'),dashboardCount('adjustments'),projectCounts);
  const slide=slides[_managerHomePendingIndex];
  if(slide?.id)_managerHomePendingDismissed.add(slide.id);
  const remaining=managerHomePendingSlidesVisible(dashboardCount('analysis'),dashboardCount('adjustments'),dashboardProjectCounts());
  _managerHomePendingIndex=Math.min(_managerHomePendingIndex,Math.max(0,remaining.length-1));
  if(state.managerPage==='home')render();
}
function shiftManagerHomePending(delta,event){
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const projectCounts=dashboardProjectCounts(),slides=managerHomePendingSlidesVisible(dashboardCount('analysis'),dashboardCount('adjustments'),projectCounts);
  if(!slides.length)return;
  _managerHomePendingIndex=Math.max(0,Math.min(slides.length-1,_managerHomePendingIndex+Number(delta||0)));
  if(state.managerPage==='home')render();
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
  const pendingSlides=managerHomePendingSlidesVisible(volunteerAnalysis,volunteerAdjustments,projectCounts);
  const pendingCardHtml=managerHomePendingCard(pendingSlides);
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
    .manager-home-top.single{grid-template-columns:1fr!important}
    .manager-home-update-card{position:relative;overflow:hidden;display:grid;gap:14px;margin:0;padding:16px;border:1px solid color-mix(in srgb,var(--primary) 24%,var(--border));border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--primary-soft) 86%,var(--surface)),var(--surface));box-shadow:0 8px 24px rgba(31,78,57,.06);animation:managerHomeUpdateIn .28s ease both;align-self:stretch}
    .manager-home-update-card::after{content:"";position:absolute;width:150px;height:150px;border-radius:50%;right:-72px;top:-78px;background:color-mix(in srgb,var(--primary) 10%,transparent);pointer-events:none}
    @keyframes managerHomeUpdateIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
    .manager-home-update-top{display:grid;grid-template-columns:46px minmax(0,1fr) auto;gap:12px;align-items:start;position:relative;z-index:1}
    .manager-home-update-icon{width:46px;height:46px;border-radius:14px;background:var(--primary);color:#fff;display:grid;place-items:center;font-size:.92rem;box-shadow:0 7px 18px color-mix(in srgb,var(--primary) 22%,transparent)}
    .manager-home-update-copy{min-width:0}
    .manager-home-update-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:3px}
    .manager-home-update-meta>span{font-size:.56rem;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:var(--primary)}
    .manager-home-update-copy>strong{display:block;font-size:.86rem;line-height:1.25;color:var(--text)}
    .manager-home-update-copy>p{margin:4px 0 0;color:var(--muted);font-size:.66rem;line-height:1.45}
    .manager-home-update-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;position:relative;z-index:1}
    .manager-home-update-actions .btn{width:100%;min-height:42px}
    .manager-home-update-pager{position:relative;z-index:2;min-width:50px;display:grid;justify-items:end;align-content:start;gap:5px;padding-top:1px}
    .manager-home-update-counter{display:block;color:var(--primary);font-size:.6rem;font-weight:700;line-height:1;letter-spacing:.02em}
    .manager-home-update-nav{position:relative;display:flex;align-items:center;justify-content:flex-end;gap:2px;min-width:42px;min-height:22px;padding-bottom:4px}
    .manager-home-update-arrow{position:relative;z-index:2;width:22px;height:22px;padding:0;border:0;border-radius:8px;background:transparent;color:color-mix(in srgb,var(--primary) 78%,var(--muted));display:grid;place-items:center;cursor:pointer;font:inherit;font-size:.58rem;transition:background .18s ease,color .18s ease,transform .18s ease}
    .manager-home-update-arrow:active{transform:scale(.92)}
    .manager-home-update-travel{position:absolute;left:2px;right:2px;bottom:0;height:2px;overflow:hidden;border-radius:999px;background:color-mix(in srgb,var(--primary) 7%,transparent);pointer-events:none}
    .manager-home-update-travel::after{content:"";position:absolute;top:0;width:18px;height:2px;border-radius:999px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--primary) 60%,transparent),rgba(255,255,255,.78),transparent);filter:drop-shadow(0 0 3px color-mix(in srgb,var(--primary) 25%,transparent))}
    .manager-home-update-nav.is-forward .manager-home-update-travel::after,.manager-home-update-nav.is-middle .manager-home-update-travel::after{left:-18px;animation:managerHomePendingTravelForward 2.2s ease-in-out infinite}
    .manager-home-update-nav.is-backward .manager-home-update-travel::after{right:-18px;animation:managerHomePendingTravelBackward 2.2s ease-in-out infinite}
    @keyframes managerHomePendingTravelForward{0%{transform:translateX(0);opacity:0}16%{opacity:.8}84%{opacity:.8}100%{transform:translateX(58px);opacity:0}}
    @keyframes managerHomePendingTravelBackward{0%{transform:translateX(0);opacity:0}16%{opacity:.8}84%{opacity:.8}100%{transform:translateX(-58px);opacity:0}}
    @media(max-width:760px){
      .manager-home-update-card{padding:14px}
      .manager-home-update-top{grid-template-columns:42px minmax(0,1fr) auto;gap:10px}
      .manager-home-update-icon{width:42px;height:42px}
      .manager-home-update-copy>strong{font-size:.82rem}
      .manager-home-update-copy>p{font-size:.65rem}
    }
    @media(max-width:360px){.manager-home-update-actions{grid-template-columns:1fr}}
    @media(min-width:1024px){
      .manager-home-grid{grid-template-columns:minmax(0,1.18fr) minmax(380px,.92fr)}
      .manager-home-hero{min-height:238px;padding:28px 34px;display:flex;flex-direction:column;justify-content:center;border-radius:26px}.manager-home-hero h1{font-size:clamp(2.2rem,2.8vw,3.35rem);line-height:1.04;margin:8px 0 10px}.manager-home-hero p{font-size:.88rem;max-width:720px;margin:0}.manager-home-hero .hero-actions{margin-top:20px}.manager-home-hero .btn{min-height:44px;padding:10px 16px;font-size:.75rem}
      .manager-home-card{padding:22px 24px;min-height:0}
      .manager-home-today,.manager-home-movements-card{min-height:310px}.manager-home-today{display:flex;flex-direction:column}.manager-home-today-list{flex:1;align-content:start}.manager-home-today-list .list-item{min-height:0}.manager-home-moves{gap:12px}.manager-home-moves>.card{min-height:122px;border-radius:18px;padding:16px}
    }
    @media(min-width:1500px){.manager-home-grid{grid-template-columns:minmax(0,1.2fr) minmax(420px,.9fr)}.manager-home-hero{min-height:228px;padding:26px 34px}}
    @media(max-width:1023px){.manager-home-grid{grid-template-columns:1fr}.manager-home-card{padding:20px}.manager-home-hero{padding:28px 24px;border-radius:24px}}
  </style>
  <div class="manager-home">
    <div class="manager-home-grid manager-home-top ${pendingCardHtml?'':'single'}">
      <section class="hero manager-home-hero">
        <div class="eyebrow" style="color:#d9eadf">Casa do Oleiro • Gestão</div><h1>${managerGreeting()}</h1><p class="muted">Veja o que precisa da sua atenção e o que acontece hoje na Casa.</p>
        <div class="hero-actions"><button class="btn btn-light" onclick="navigateManager('volunteer')"><i class="fa-solid fa-users"></i>Ver voluntariado</button><button class="btn btn-outline" style="border-color:rgba(255,255,255,.28);color:white" onclick="navigateManager('planning')"><i class="fa-regular fa-calendar-check"></i>Abrir planejamento</button></div>
      </section>
      ${pendingCardHtml}
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
