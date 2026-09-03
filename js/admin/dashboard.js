function managerGreeting(){
  const hour=new Date().getHours();const lang=typeof currentLanguage==='function'?currentLanguage():'pt';
  if(hour<12)return lang==='en'?'Good morning':lang==='es'?'Buenos días':'Bom dia';
  if(hour<18)return lang==='en'?'Good afternoon':lang==='es'?'Buenas tardes':'Boa tarde';
  return lang==='en'?'Good evening':lang==='es'?'Buenas noches':'Boa noite';
}
function openTodayAgenda(){state.agendaAnchor=_oleiroToday;state.selectedDate=_oleiroToday;state.agendaFrom=_oleiroToday;state.agendaTo=_oleiroToday;navigateManager('agenda')}
function pendingChangeApplicationIds(){return new Set((state.pendingChangeRequests||[]).map(row=>String(row.applicationId||'')).filter(Boolean))}
function dashboardCount(status){
  const base=Number(state.dashboardCounts?.[status])||0;
  if(status!=='adjustments')return base;
  const postApproval=new Set((state.pendingChangeRequests||[]).filter(row=>row.reviewKind==='post_approval'||row.status==='change_requested').map(row=>String(row.applicationId||'')).filter(Boolean));
  return base+postApproval.size;
}
function movementDaysLabel(iso){if(!iso)return '';const diff=Math.ceil((new Date(iso+'T12:00:00')-new Date(_oleiroToday+'T12:00:00'))/86400000);return diff===0?'hoje':diff===1?'amanhã':diff>1?`em ${diff} dias`:diff===-1?'ontem':`${Math.abs(diff)} dias atrás`}
function nextMovements(field,limit=3){const rows=field==='from'?(state.dashboardArrivals||[]):(state.dashboardDepartures||[]);return rows.slice(0,limit)}
function movementList(rows,field){return rows.length?rows.map(p=>miniMove(p.name,fmtDate(p[field],true),movementDaysLabel(p[field]))).join(''):'<div class="empty">Nenhuma movimentação prevista.</div>'}
function managerHome(){
  const todaySessions=getSessions(_oleiroToday),arrivals=nextMovements('from'),departures=nextMovements('to');
  return `<style id="managerHomeR62Styles">
    .manager-home-layout{width:100%}
    .manager-home-top,.manager-home-bottom{display:grid;gap:16px}
    .manager-home-hero{margin-bottom:16px}
    .manager-home-today,.manager-home-panel{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:18px;box-shadow:var(--shadow)}
    .manager-home-card-head{align-items:flex-start}
    .manager-home-count{display:grid;place-items:center;min-width:54px;height:54px;padding:0 14px;border-radius:18px;background:var(--primary-soft);color:var(--primary);font-family:var(--font-heading);font-size:1.05rem;font-weight:800}
    .manager-home-today-list{min-height:150px}.manager-home-today-list>.empty{min-height:150px;display:grid;place-items:center}
    .manager-home-movements .card{box-shadow:none}
    @media(min-width:1024px){
      .manager-home-layout{display:grid;gap:20px}
      .manager-home-top{grid-template-columns:minmax(0,2.05fr) minmax(340px,1fr);gap:20px;align-items:stretch}
      .manager-home-bottom{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:20px;align-items:stretch}
      .manager-home-hero{min-height:310px;margin-bottom:0;padding:38px 40px;display:flex;flex-direction:column;justify-content:center;border-radius:28px}
      .manager-home-hero h1{font-size:clamp(2.35rem,3.1vw,3.7rem);line-height:1.06;margin:12px 0 14px;letter-spacing:-.035em}
      .manager-home-hero p{max-width:760px;font-size:.92rem}
      .manager-home-hero .hero-actions{margin-top:28px}
      .manager-home-hero .btn{min-height:48px;padding:12px 18px;font-size:.78rem}
      .manager-home-today{min-height:310px;margin-bottom:0;padding:28px;display:flex;flex-direction:column}
      .manager-home-today .section-head{margin-bottom:20px}
      .manager-home-today-list{flex:1;min-height:0;justify-content:center}
      .manager-home-today-list>.empty{min-height:120px}
      .manager-home-panel{margin-bottom:0;padding:24px 26px;min-height:205px}
      .manager-home-panel>.section-head{margin-bottom:16px}
      .manager-home-panel>.section-head h2{font-size:1.08rem}
      .manager-home-panel .pending-grid{gap:12px}
      .manager-home-panel .pending-grid .metric{min-height:96px;display:grid;grid-template-columns:48px minmax(0,1fr);gap:14px;align-items:center;text-align:left!important;padding:16px 18px;border-radius:18px;box-shadow:none}
      .manager-home-panel .pending-grid .metric-icon{margin:0;width:48px;height:48px;border-radius:14px}
      .manager-home-panel .pending-grid .metric>div:last-child{width:auto}
      .manager-home-panel .pending-grid .metric strong{text-align:left;font-size:1.1rem}
      .manager-home-panel .pending-grid .metric span{text-align:left;margin-top:3px;font-size:.68rem}
      .manager-home-movements{gap:12px}
      .manager-home-movements>.card{min-height:112px;border-radius:18px;padding:16px}
    }
    @media(max-width:1023px){
      .manager-home-top,.manager-home-bottom{grid-template-columns:1fr}
      .manager-home-panel{margin-bottom:16px}
    }
  </style>
  <div class="manager-home-layout">
    <div class="manager-home-top">
      <section class="hero manager-home-hero"><div class="eyebrow" style="color:#d9eadf">Casa do Oleiro • Gestão</div><h1>${managerGreeting()}</h1><p class="muted">Veja o que precisa da sua atenção e o que acontece hoje na Casa.</p><div class="hero-actions"><button class="btn btn-light" onclick="navigateManager('volunteer')"><i class="fa-solid fa-users"></i>Ver voluntariado</button><button class="btn btn-outline" style="border-color:rgba(255,255,255,.28);color:white" onclick="openTodayAgenda()"><i class="fa-regular fa-calendar"></i>Abrir agenda de hoje</button></div></section>
      <section class="section manager-home-today"><div class="section-head manager-home-card-head"><div><div class="eyebrow">Hoje na Casa</div><p>${longDate(_oleiroToday)}</p></div><span class="manager-home-count">${todaySessions.length}</span></div><div class="list manager-home-today-list">${todaySessions.length?todaySessions.map(s=>agendaItem(s.activity.name,s.activity.owner,s.group,s.status,activityPeriodValue(s.raw||{},s.activity),s.activity.duration)).join(''):'<div class="empty">Nenhuma atividade prevista para hoje.</div>'}</div></section>
    </div>
    <div class="manager-home-bottom">
      <section class="section manager-home-panel"><div class="section-head"><div><h2>Pendências operacionais</h2><p>Itens que dependem de decisão ou revisão.</p></div></div><div class="grid-2 pending-grid">${metric(dashboardCount('analysis'),'fa-clipboard-check','Em análise',"state.candidateFilter='analysis';navigateManager('volunteer')")}${metric(dashboardCount('adjustments'),'fa-rotate','Ajustes pendentes',"openManagerAdjustments()")}</div></section>
      <section class="section manager-home-panel"><div class="section-head"><div><h2>Próximas movimentações</h2><p>Chegadas e saídas confirmadas.</p></div></div><div class="grid-2 manager-home-movements"><div class="card"><span class="eyebrow"><i class="fa-solid fa-arrow-right-to-bracket"></i> Chegadas</span><div style="margin-top:10px" class="list">${movementList(arrivals,'from')}</div></div><div class="card"><span class="eyebrow"><i class="fa-solid fa-arrow-right-from-bracket"></i> Saídas</span><div style="margin-top:10px" class="list">${movementList(departures,'to')}</div></div></div></section>
    </div>
  </div>`;
}
function metric(n,icon,label,action){return `<button class="card metric" style="border:1px solid var(--border);color:var(--text)" onclick="${action}"><div class="metric-icon"><i class="fa-solid ${icon}"></i></div><div><strong>${n}</strong><span style="display:block">${label}</span></div></button>`}
function agendaItem(name,person,group,status,period='Sem preferência',duration=0){const [l,t]=statusMeta(status);return `<div class="list-item"><div class="item-main"><h3 data-no-i18n>${escapeHtml(name||'Atividade')}</h3><p>${Number(duration)||0} min • ${escapeHtml(period)} • ${escapeHtml(person||'Voluntário')} • ${escapeHtml(group||'A definir')}</p><div class="item-meta">${badge(l,t)}</div></div></div>`}
function miniMove(name,date,label){return `<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong style="font-size:.7rem">${escapeHtml(name||'Voluntário')}</strong><div style="font-size:.61rem;color:var(--muted)">${date} • ${label}</div></div>`}
