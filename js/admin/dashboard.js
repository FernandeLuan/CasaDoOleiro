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

function openDashboardVolunteerFilter(status){
  state.candidateFilter=String(status||'all');
  state.candidateUnit='all';
  state.candidateSearch='';
  navigateManager('volunteer');
}
function openDashboardProjectFilter(status){
  state.projectFilter=String(status||'all');
  state.projectUnit='all';
  state.projectSearch='';
  navigateManager('projects');
}
let _managerHomePendingIndex=0;
const _managerHomePendingDismissed=new Set();
function managerHomePendingSlides(volunteerAnalysis,volunteerAdjustments,projectCounts){
  return [
    volunteerAnalysis?{id:'volunteer-analysis',icon:'fa-users',area:'Voluntariado',title:`${volunteerAnalysis} ${volunteerAnalysis===1?'perfil em análise':'perfis em análise'}`,text:'Aguardando sua revisão.',statusLabel:'Em análise',tone:'',action:"openDashboardVolunteerFilter('analysis')"}:null,
    volunteerAdjustments?{id:'volunteer-adjustments',icon:'fa-users',area:'Voluntariado',title:`${volunteerAdjustments} ${volunteerAdjustments===1?'ajuste pendente':'ajustes pendentes'}`,text:'Mudanças aguardando nova revisão.',statusLabel:'Ajustes',tone:'',action:"openDashboardVolunteerFilter('adjustments')"}:null,
    projectCounts.analysis?{id:'project-analysis',icon:'fa-seedling',area:'Projetos',title:`${projectCounts.analysis} ${projectCounts.analysis===1?'projeto em análise':'projetos em análise'}`,text:'Projeto Legado aguardando sua decisão.',statusLabel:'Em análise',tone:'',action:"openDashboardProjectFilter('analysis')"}:null,
    projectCounts.adjustments?{id:'project-adjustments',icon:'fa-seedling',area:'Projetos',title:`${projectCounts.adjustments} ${projectCounts.adjustments===1?'projeto com ajuste':'projetos com ajustes'}`,text:'Projeto Legado aguardando nova revisão.',statusLabel:'Ajustes',tone:'',action:"openDashboardProjectFilter('adjustments')"}:null
  ].filter(Boolean).filter(slide=>!_managerHomePendingDismissed.has(slide.id));
}
function managerHomePreviewPendingSlides(){
  if(window.OleiroProjects?.isPreview!==true)return [];
  return [
    {id:'preview-volunteer-analysis',icon:'fa-users',area:'Voluntariado',title:'2 candidaturas em análise',text:'Perfis aguardando sua revisão.',statusLabel:'Em análise',tone:'',action:"openDashboardVolunteerFilter('analysis')",preview:true},
    {id:'preview-volunteer-adjustments',icon:'fa-users',area:'Voluntariado',title:'1 ajuste pendente',text:'Mudança aguardando nova revisão.',statusLabel:'Ajustes',tone:'',action:"openDashboardVolunteerFilter('adjustments')",preview:true},
    {id:'preview-project-analysis',icon:'fa-seedling',area:'Projetos',title:'1 projeto em análise',text:'Projeto Legado aguardando sua decisão.',statusLabel:'Em análise',tone:'',action:"openDashboardProjectFilter('analysis')",preview:true},
    {id:'preview-project-adjustments',icon:'fa-seedling',area:'Projetos',title:'1 projeto com ajuste',text:'Projeto Legado aguardando nova revisão.',statusLabel:'Ajustes',tone:'',action:"openDashboardProjectFilter('adjustments')",preview:true}
  ].filter(slide=>!_managerHomePendingDismissed.has(slide.id));
}
function managerHomePendingSlidesVisible(volunteerAnalysis,volunteerAdjustments,projectCounts){
  const real=managerHomePendingSlides(volunteerAnalysis,volunteerAdjustments,projectCounts);
  const preview=managerHomePreviewPendingSlides();
  if(!preview.length)return real;

  /* Homologação: mantém os exemplos disponíveis mesmo quando já existe uma pendência real.
     Assim o carrossel inteiro pode ser validado sem criar dados falsos no banco. */
  const realKeys=new Set(real.map(slide=>slide.id));
  return [...real,...preview.filter(slide=>!realKeys.has(slide.id))];
}
function managerHomePendingPagerHtml(total,index){
  if(total<=1)return '';
  const first=index===0,last=index===total-1;
  return `<div class="notice-carousel-pager" aria-label="Navegação das pendências">
    <strong class="notice-carousel-counter">${index+1}/${total}</strong>
    <div class="notice-carousel-nav">
      ${first?'':`<button type="button" class="notice-carousel-arrow" onclick="shiftManagerHomePending(-1,event)" aria-label="Pendência anterior"><i class="fa-solid fa-arrow-left"></i></button>`}
      ${last?'':`<button type="button" class="notice-carousel-arrow" onclick="shiftManagerHomePending(1,event)" aria-label="Próxima pendência"><i class="fa-solid fa-arrow-right"></i></button>`}
    </div>
  </div>`;
}
function managerHomePendingCard(slides){
  if(!slides.length)return '';
  if(_managerHomePendingIndex>=slides.length)_managerHomePendingIndex=0;
  const slide=slides[_managerHomePendingIndex],total=slides.length;
  return `<section class="notice-carousel-card" aria-label="Pendências" data-notice-carousel="admin-home" data-manager-home-pending>
    <div class="notice-carousel-top">
      <span class="notice-carousel-icon" data-manager-pending-icon><i class="fa-solid ${slide.icon}"></i></span>
      <div class="notice-carousel-copy">
        <div class="notice-carousel-meta"><span data-manager-pending-meta>${escapeHtml(slide.preview?'Simulação · '+slide.area:slide.area+' · precisa de atenção')}</span></div>
        <strong data-notice-title data-manager-pending-title>${escapeHtml(slide.title)}</strong>
        <p data-notice-summary data-manager-pending-summary>${escapeHtml(slide.text)}</p>
      </div>
      ${managerHomePendingPagerHtml(total,_managerHomePendingIndex)}
    </div>
    <div class="notice-carousel-actions">
      <button class="btn btn-outline" type="button" onclick="dismissManagerHomePending(event)">Agora não</button>
      <button class="btn btn-primary" type="button" data-manager-pending-cta onclick="${slide.action}">Ver pendência</button>
    </div>
  </section>`;
}
function renderManagerHomePendingSlide(direction='next'){
  const card=document.querySelector('[data-manager-home-pending]');
  if(!card)return;
  const projectCounts=dashboardProjectCounts();
  const slides=managerHomePendingSlidesVisible(dashboardCount('analysis'),dashboardCount('adjustments'),projectCounts);
  if(!slides.length){
    card.classList.add('is-leaving');
    setTimeout(()=>card.remove(),220);
    return;
  }
  _managerHomePendingIndex=Math.max(0,Math.min(_managerHomePendingIndex,slides.length-1));
  const slide=slides[_managerHomePendingIndex];

  card.classList.remove('is-slide-next','is-slide-prev');
  void card.offsetWidth;
  card.classList.add(direction==='prev'?'is-slide-prev':'is-slide-next');

  const title=card.querySelector('[data-manager-pending-title]');
  const summary=card.querySelector('[data-manager-pending-summary]');
  const meta=card.querySelector('[data-manager-pending-meta]');
  const icon=card.querySelector('[data-manager-pending-icon] i');
  const cta=card.querySelector('[data-manager-pending-cta]');
  const pager=card.querySelector('.notice-carousel-pager');

  if(title)title.textContent=slide.title||'';
  if(summary)summary.textContent=slide.text||'';
  if(meta)meta.textContent=slide.preview?'Simulação · '+slide.area:slide.area+' · precisa de atenção';
  if(icon)icon.className='fa-solid '+(slide.icon||'fa-circle-info');
  if(cta)cta.setAttribute('onclick',slide.action||'');

  const nextPager=managerHomePendingPagerHtml(slides.length,_managerHomePendingIndex);
  if(pager){
    if(nextPager)pager.outerHTML=nextPager;
    else pager.remove();
  }else if(nextPager){
    card.querySelector('.notice-carousel-top')?.insertAdjacentHTML('beforeend',nextPager);
  }
}
document.addEventListener('oleiro:notice-swipe',event=>{
  if(event.detail?.source!=='admin-home')return;
  shiftManagerHomePending(event.detail.direction==='next'?1:-1);
});
function dismissManagerHomePending(event){
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const projectCounts=dashboardProjectCounts();
  const slides=managerHomePendingSlidesVisible(dashboardCount('analysis'),dashboardCount('adjustments'),projectCounts);
  const slide=slides[_managerHomePendingIndex];
  if(slide?.id)_managerHomePendingDismissed.add(slide.id);

  const remaining=managerHomePendingSlidesVisible(dashboardCount('analysis'),dashboardCount('adjustments'),dashboardProjectCounts());
  if(!remaining.length){
    const card=document.querySelector('[data-manager-home-pending]');
    if(card){card.classList.add('is-leaving');setTimeout(()=>card.remove(),220)}
    return;
  }
  _managerHomePendingIndex=Math.min(_managerHomePendingIndex,remaining.length-1);
  renderManagerHomePendingSlide('next');
}
function shiftManagerHomePending(delta,event){
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const projectCounts=dashboardProjectCounts();
  const slides=managerHomePendingSlidesVisible(dashboardCount('analysis'),dashboardCount('adjustments'),projectCounts);
  if(!slides.length)return;
  const next=Math.max(0,Math.min(slides.length-1,_managerHomePendingIndex+Number(delta||0)));
  if(next===_managerHomePendingIndex)return;
  const direction=next<_managerHomePendingIndex?'prev':'next';
  _managerHomePendingIndex=next;
  renderManagerHomePendingSlide(direction);
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
    .manager-home-hero{margin:0;min-width:0}.manager-home-hero h1{letter-spacing:-.035em}.manager-home-hero-eyebrow{color:#d9eadf}.manager-home-hero .manager-home-hero-secondary{border-color:rgba(255,255,255,.28);color:#fff}.manager-home-today-list{display:grid;gap:10px;min-height:0}.manager-home-today-list>.empty{min-height:100px;display:grid;place-items:center}.manager-home-movements .card{box-shadow:none}
    .manager-home-today-item{cursor:pointer}.manager-home-movement-list{margin-top:10px}.manager-home-movement-row{padding:8px 0;border-bottom:1px solid var(--border)}.manager-home-movement-row:last-child{border-bottom:0}.manager-home-movement-row strong{font-size:.7rem}.manager-home-movement-row div{font-size:.61rem;color:var(--muted)}
    .manager-home-top.single{grid-template-columns:1fr!important}
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
    <div class="manager-home-grid manager-home-top single">
      <section class="hero manager-home-hero">
        <div class="eyebrow manager-home-hero-eyebrow">Casa do Oleiro • Gestão</div><h1>${managerGreeting()}</h1><p class="muted">Veja o que precisa da sua atenção e o que acontece hoje na Casa.</p>
        <div class="hero-actions"><button class="btn btn-light" onclick="navigateManager('volunteer')"><i class="fa-solid fa-users"></i>Ver voluntariado</button><button class="btn btn-outline manager-home-hero-secondary" onclick="navigateManager('planning')"><i class="fa-regular fa-calendar-check"></i>Abrir planejamento</button></div>
      </section>
    </div>
    ${pendingCardHtml}
    <div class="manager-home-grid manager-home-bottom">
      <section class="manager-home-card manager-home-today"><div class="section-head"><div><h2>Hoje na Casa</h2><p>${longDate(_oleiroToday)}</p></div></div><div class="list manager-home-today-list">${todayHtml}</div></section>
      <section class="manager-home-card manager-home-movements-card"><div class="section-head"><div><h2>Próximas movimentações</h2><p>Chegadas e saídas confirmadas nos próximos 15 dias.</p></div></div><div class="grid-2 manager-home-moves"><div class="card"><span class="eyebrow"><i class="fa-solid fa-arrow-right-to-bracket"></i> Chegadas</span><div class="list manager-home-movement-list">${dashboardLoading?movementsLoading:movementList(arrivals,'from')}</div></div><div class="card"><span class="eyebrow"><i class="fa-solid fa-arrow-right-from-bracket"></i> Saídas</span><div class="list manager-home-movement-list">${dashboardLoading?movementsLoading:movementList(departures,'to')}</div></div></div></section>
    </div>
    ${typeof window.managerHomeOccupancyHtml==='function'?window.managerHomeOccupancyHtml():''}
  </div>`;
}
function agendaItem(name,person,group,status,period='Sem preferência',duration=0){const [l,t]=statusMeta(status);return `<div class="list-item manager-home-today-item" role="button" tabindex="0" onclick="openTodayAgenda()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openTodayAgenda()}"><div class="item-main"><h3 data-no-i18n>${escapeHtml(name||'Atividade')}</h3><p>${Number(duration)||0} min • ${escapeHtml(period)} • ${escapeHtml(person||'Voluntário')} • ${escapeHtml(group||'A definir')}</p><div class="item-meta">${badge(l,t)}</div></div></div>`}
function miniMove(name,date,label){return `<div class="manager-home-movement-row"><strong>${escapeHtml(name||'Voluntário')}</strong><div>${date} • ${label}</div></div>`}

// Mantém uma referência estável da Home aprovada para a homologação. Scripts legados carregados depois podem redefinir managerHome, mas não esta referência.
window.managerHomeDashboard=managerHome;
