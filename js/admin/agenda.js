function changeAgenda(days){state.agendaAnchor=addDays(state.agendaAnchor,days);state.selectedDate=state.agendaAnchor;render()}

function jumpAgenda(value){if(!value)return;state.agendaAnchor=value;state.selectedDate=value;render()}

function goAgendaToday(){jumpAgenda(_oleiroToday)}

function managerAgenda(){
  const dates=dateRange(state.agendaAnchor,7);
  const isToday=state.agendaAnchor===_oleiroToday;
  return `<section class="section"><div class="section-head"><div><span class="eyebrow">Rodeio</span><h2>Agenda da Casa</h2><p>Atividades organizadas por data</p></div></div>
  <div class="agenda-toolbar"><button class="icon-btn" onclick="changeAgenda(-7)" aria-label="Ver 7 dias anteriores"><i class="fa-solid fa-chevron-left"></i></button><div class="agenda-toolbar-main"><strong>${agendaRangeLabel(state.agendaAnchor)}</strong><span>${isToday?'A partir de hoje':'7 dias a partir da data escolhida'}</span></div><button class="icon-btn" onclick="changeAgenda(7)" aria-label="Ver próximos 7 dias"><i class="fa-solid fa-chevron-right"></i></button></div>
  <div class="agenda-shortcuts"><button class="btn ${isToday?'btn-soft':'btn-outline'}" onclick="goAgendaToday()"><i class="fa-solid fa-location-crosshairs"></i>Hoje</button><label class="btn btn-outline agenda-date-button"><i class="fa-regular fa-calendar"></i>Escolher data<input id="agendaDatePicker" class="agenda-date-input" type="date" value="${state.agendaAnchor}" onchange="jumpAgenda(this.value)" aria-label="Escolher uma data"></label></div>
  ${dateStrip(dates)}
  ${renderDays(true,dates)}</section>`;
}

function dateStrip(dates=null){
  dates=dates||dateRange(state.agendaAnchor,7);
  return `<div class="calendar-strip">${dates.map(d=>`<button class="date-chip ${state.selectedDate===d?'active':''}" onclick="jumpAgenda('${d}')"><span>${dayName(d)}</span><strong>${new Date(d+'T12:00:00').getDate()}</strong><span>${new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(new Date(d+'T12:00:00')).replace('.','').toUpperCase()}</span></button>`).join('')}</div>`;
}

function renderDays(manager=false,dates=null){
  dates=dates||dateRange(state.agendaAnchor,7);
  return dates.map(d=>{const sessions=getSessions(d);const mins=sessions.reduce((s,x)=>s+x.activity.duration,0);return `<div class="day-block"><div class="day-title"><h3>${dayName(d)}, ${fmtDate(d)}</h3><span>${mins?`${(mins/60).toFixed(mins%60?1:0).replace('.',',')}h planejadas`:''}</span></div>${sessions.length?sessions.map(s=>sessionCard(s,manager)).join(''):`<div class="empty">Nenhuma atividade neste dia.</div>`}</div>`}).join('')
}

function sessionCard(s,manager=false){
  const [l,t]=statusMeta(s.status);
  return `<div class="activity-card ${manager?'clickable':''}" ${manager?`onclick="openSessionDetail(${s.activity.id},'${s.date}')"`:''}><div class="activity-row"><div><h4>${s.activity.time} • ${s.activity.name}</h4><p>${s.activity.duration} min • ${s.activity.period} • ${s.activity.participation}</p><div class="session-person"><i class="fa-regular fa-user"></i>${s.activity.owner}</div></div><div style="display:flex;align-items:flex-start;gap:7px">${badge(l,t)}${manager?'<i class="fa-solid fa-chevron-right chevron"></i>':''}</div></div><div class="item-meta">${badge(s.group,'primary')}</div></div>`
}

function openSessionDetail(id,date){
  const a=state.activities.find(x=>x.id===id);if(!a)return;
  const status=state.sessionStatus[`${id}-${date}`]||'proposed';const [l,t]=statusMeta(status);const group=state.sessionGroups[`${id}-${date}`]||'A definir';
  openModal(a.name,`${a.owner} • ${dayName(date)}, ${fmtDate(date)}`,`<div class="card"><div class="activity-row"><div><h3 style="font-size:.85rem">${a.time} • ${a.duration} min</h3><p style="font-size:.65rem;color:var(--muted);margin-top:4px">${a.description}</p></div>${badge(l,t)}</div><div class="item-meta">${badge(group,'primary')}${badge(a.participation)}</div>${a.materials?`<p class="compact-hint" style="margin-top:10px"><strong>Materiais:</strong> ${a.materials}</p>`:''}</div><div class="activity-actions" style="margin-top:12px"><button class="btn btn-soft" onclick="confirmSession(${id},'${date}');closeModal()">Confirmar</button><button class="btn btn-outline" onclick="closeModal();moveSession(${id},'${date}')">Mover</button><button class="btn btn-outline" onclick="closeModal();assignGroup(${id},'${date}')">Grupo</button></div>`)
}
