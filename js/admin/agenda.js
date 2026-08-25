function ensureAgendaRange(){
  if(!state.agendaFrom)state.agendaFrom=state.agendaAnchor||_oleiroToday;
  if(!state.agendaTo)state.agendaTo=state.agendaFrom;
  if(state.agendaFrom>state.agendaTo){const tmp=state.agendaFrom;state.agendaFrom=state.agendaTo;state.agendaTo=tmp}
}

function agendaRangeCount(){
  ensureAgendaRange();
  const start=new Date(state.agendaFrom+'T12:00:00');
  const end=new Date(state.agendaTo+'T12:00:00');
  return Math.floor((end-start)/86400000)+1;
}

function agendaRangeDates(){
  ensureAgendaRange();
  return dateRange(state.agendaFrom,Math.max(1,Math.min(31,agendaRangeCount())));
}

function shiftAgendaRange(direction){
  ensureAgendaRange();
  const span=agendaRangeCount();
  state.agendaFrom=addDays(state.agendaFrom,direction*span);
  state.agendaTo=addDays(state.agendaTo,direction*span);
  state.agendaAnchor=state.agendaFrom;
  state.selectedDate=state.agendaFrom;
  render();
}

function goAgendaToday(){
  state.agendaFrom=_oleiroToday;
  state.agendaTo=_oleiroToday;
  state.agendaAnchor=_oleiroToday;
  state.selectedDate=_oleiroToday;
  render();
}

function agendaHeaderLabel(){
  ensureAgendaRange();
  const lang=typeof currentLanguage==='function'?currentLanguage():'pt';
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
  if(state.agendaFrom===state.agendaTo){
    const d=new Date(state.agendaFrom+'T12:00:00');
    const dateText=new Intl.DateTimeFormat(locale,{day:'numeric',month:'long'}).format(d);
    if(state.agendaFrom===_oleiroToday){
      const today=lang==='en'?'Today':lang==='es'?'Hoy':'Hoje';
      return `${today} • ${dateText}`;
    }
    return dateText.charAt(0).toUpperCase()+dateText.slice(1);
  }
  return `${fmtDate(state.agendaFrom)} – ${fmtDate(state.agendaTo)}`;
}

function managerAgenda(){
  ensureAgendaRange();
  const dates=agendaRangeDates();
  const isToday=state.agendaFrom===_oleiroToday&&state.agendaTo===_oleiroToday;
  return `<section class="section"><div class="section-head"><div><span class="eyebrow">Rodeio</span><h2>Agenda da Casa</h2><p>Atividades organizadas por data</p></div></div>
    <div class="agenda-period-toolbar">
      <button class="icon-btn" type="button" onclick="shiftAgendaRange(-1)" aria-label="Período anterior"><i class="fa-solid fa-chevron-left"></i></button>
      <div class="agenda-period-copy"><strong>${agendaHeaderLabel()}</strong><span>${dates.length===1?'Agenda do dia':'Período selecionado'}</span></div>
      <button class="icon-btn agenda-calendar-trigger" type="button" onclick="openAgendaRangeModal()" aria-label="Escolher período"><i class="fa-regular fa-calendar-days"></i></button>
      <button class="icon-btn" type="button" onclick="shiftAgendaRange(1)" aria-label="Próximo período"><i class="fa-solid fa-chevron-right"></i></button>
    </div>
    ${!isToday?`<div class="agenda-today-action"><button class="btn btn-soft" type="button" onclick="goAgendaToday()"><i class="fa-solid fa-location-crosshairs"></i>Hoje</button></div>`:''}
    <div class="agenda-days">${renderDays(true,dates)}</div>
  </section>`;
}

function openAgendaRangeModal(){
  ensureAgendaRange();
  openModal('Período da agenda','Escolha as datas que deseja visualizar.',`<div class="agenda-range-form">
    <div class="field-row"><div class="field"><label>De</label><input id="agendaFromInput" class="input" type="date" value="${state.agendaFrom}"></div><div class="field"><label>Até</label><input id="agendaToInput" class="input" type="date" value="${state.agendaTo}"></div></div>
    <button class="btn btn-primary btn-block" type="button" onclick="applyAgendaRange()">Aplicar período</button>
  </div>`);
  modalRoot.querySelector('.modal')?.classList.add('agenda-range-modal');
}

function applyAgendaRange(){
  const from=document.getElementById('agendaFromInput')?.value;
  const to=document.getElementById('agendaToInput')?.value;
  if(!from||!to)return showToast('Informe as duas datas.');
  const start=new Date(from+'T12:00:00');
  const end=new Date(to+'T12:00:00');
  const days=Math.floor((end-start)/86400000)+1;
  if(days<1)return showToast('A data final deve ser igual ou posterior à inicial.');
  if(days>31)return showToast('Selecione um período de até 31 dias.');
  state.agendaFrom=from;
  state.agendaTo=to;
  state.agendaAnchor=from;
  state.selectedDate=from;
  closeModal();render();
}

function dateStrip(dates=null){
  dates=dates||agendaRangeDates();
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
  return `<div class="calendar-strip">${dates.map(d=>`<button class="date-chip ${state.selectedDate===d?'active':''}" onclick="state.selectedDate='${d}';render()"><span>${dayName(d)}</span><strong>${new Date(d+'T12:00:00').getDate()}</strong><span>${new Intl.DateTimeFormat(locale,{month:'short'}).format(new Date(d+'T12:00:00')).replace('.','').toUpperCase()}</span></button>`).join('')}</div>`;
}

function renderDays(manager=false,dates=null){
  dates=dates||agendaRangeDates();
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
