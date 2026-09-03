function managerGreeting(){
  const hour=new Date().getHours();const lang=typeof currentLanguage==='function'?currentLanguage():'pt';
  if(hour<12)return lang==='en'?'Good morning':lang==='es'?'Buenos días':'Bom dia';
  if(hour<18)return lang==='en'?'Good afternoon':lang==='es'?'Buenas tardes':'Boa tarde';
  return lang==='en'?'Good evening':lang==='es'?'Buenas noches':'Boa noite';
}
function openTodayAgenda(){state.agendaAnchor=_oleiroToday;state.selectedDate=_oleiroToday;state.agendaFrom=_oleiroToday;state.agendaTo=_oleiroToday;navigateManager('agenda')}
function pendingChangeApplicationIds(){return new Set((state.pendingChangeRequests||[]).map(row=>String(row.applicationId||'')).filter(Boolean))}
function dashboardCount(status){const base=Number(state.dashboardCounts?.[status])||0;if(status!=='adjustments')return base;const postApproval=new Set((state.pendingChangeRequests||[]).filter(row=>row.reviewKind==='post_approval'||row.status==='change_requested').map(row=>String(row.applicationId||'')).filter(Boolean));return base+postApproval.size}
function movementDaysLabel(iso){if(!iso)return '';const diff=Math.ceil((new Date(iso+'T12:00:00')-new Date(_oleiroToday+'T12:00:00'))/86400000);return diff===0?'hoje':diff===1?'amanhã':diff>1?`em ${diff} dias`:diff===-1?'ontem':`${Math.abs(diff)} dias atrás`}
function nextMovements(field,limit=3){const rows=field==='from'?(state.dashboardArrivals||[]):(state.dashboardDepartures||[]);return rows.slice(0,limit)}
function r61TodayRows(rows){if(!rows.length)return '<div class="empty">Nenhuma atividade prevista para hoje.</div>';return rows.slice(0,4).map(s=>{const a=s.activity||{};return `<div class="r61-today-row"><i class="r61-dot"></i><div><b>${escapeHtml(a.name||'Atividade')}</b><small>${escapeHtml(a.owner||'Voluntário')} • ${Number(a.duration)||0} min</small></div><span class="r61-period">${escapeHtml(activityPeriodValue(s.raw||{},a))}</span></div>`}).join('')}
function r61MovementRows(rows,field){if(!rows.length)return '<div class="empty">Nenhuma movimentação prevista.</div>';return rows.map(p=>`<div class="r61-move-row"><b>${escapeHtml(p.name||'Voluntário')}</b><span>${fmtDate(p[field],true)} • ${movementDaysLabel(p[field])}</span></div>`).join('')}
function managerHome(){
  const todaySessions=getSessions(_oleiroToday),arrivals=nextMovements('from'),departures=nextMovements('to');
  return `<div class="r61-page r61-dashboard">
    <div class="r61-dashboard-top">
      <section class="r61-command-card"><span class="r61-kicker">Casa do Oleiro • Gestão</span><h1>${managerGreeting()}. O que precisa da sua atenção?</h1><p>Uma visão operacional do voluntariado, das pendências e do que acontece hoje na Casa.</p><div class="r61-command-actions"><button class="btn" onclick="navigateManager('volunteer')"><i class="fa-solid fa-users"></i>Ver voluntariado</button><button class="btn secondary" onclick="openTodayAgenda()"><i class="fa-regular fa-calendar"></i>Abrir agenda de hoje</button></div></section>
      <aside class="r61-today-card"><div class="r61-today-head"><div><strong>Hoje na Casa</strong><span>${longDate(_oleiroToday)}</span></div><div class="r61-today-number">${todaySessions.length}</div></div><div class="r61-today-list">${r61TodayRows(todaySessions)}</div></aside>
    </div>
    <div class="r61-dashboard-bottom">
      <section class="r61-panel"><div class="r61-panel-head"><div><h2>Pendências operacionais</h2><p>Itens que precisam de decisão ou revisão.</p></div></div><div class="r61-kpi-grid"><button class="r61-kpi" onclick="state.candidateFilter='analysis';navigateManager('volunteer')"><span class="r61-kpi-icon"><i class="fa-solid fa-clipboard-check"></i></span><div><b>${dashboardCount('analysis')}</b><small>Em análise</small></div><i class="fa-solid fa-arrow-right"></i></button><button class="r61-kpi" onclick="openManagerAdjustments()"><span class="r61-kpi-icon"><i class="fa-solid fa-rotate"></i></span><div><b>${dashboardCount('adjustments')}</b><small>Ajustes pendentes</small></div><i class="fa-solid fa-arrow-right"></i></button></div></section>
      <section class="r61-panel"><div class="r61-panel-head"><div><h2>Próximas movimentações</h2><p>Chegadas e saídas confirmadas.</p></div></div><div class="r61-move-grid"><div class="r61-move-card"><strong><i class="fa-solid fa-arrow-right-to-bracket"></i> Chegadas</strong>${r61MovementRows(arrivals,'from')}</div><div class="r61-move-card"><strong><i class="fa-solid fa-arrow-right-from-bracket"></i> Saídas</strong>${r61MovementRows(departures,'to')}</div></div></section>
    </div>
  </div>`;
}
function metric(n,icon,label,action){return `<button class="card metric" style="border:1px solid var(--border);color:var(--text)" onclick="${action}"><div class="metric-icon"><i class="fa-solid ${icon}"></i></div><div><strong>${n}</strong><span style="display:block">${label}</span></div></button>`}
function agendaItem(name,person,group,status,period='Sem preferência',duration=0){const [l,t]=statusMeta(status);return `<div class="list-item"><div class="item-main"><h3 data-no-i18n>${escapeHtml(name||'Atividade')}</h3><p>${Number(duration)||0} min • ${escapeHtml(period)} • ${escapeHtml(person||'Voluntário')} • ${escapeHtml(group||'A definir')}</p><div class="item-meta">${badge(l,t)}</div></div></div>`}
function miniMove(name,date,label){return `<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong style="font-size:.7rem">${escapeHtml(name||'Voluntário')}</strong><div style="font-size:.61rem;color:var(--muted)">${date} • ${label}</div></div>`}
