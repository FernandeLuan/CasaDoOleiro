function managerHome(){
  const today=_oleiroToday;
  const todaySessions=getSessions(today);
  return `<section class="hero"><div class="eyebrow" style="color:#d9eadf">Gestão • Rodeio</div><h1>Boa noite, Luan</h1><p class="muted">Veja o que precisa da sua atenção e o que acontece hoje na Casa.</p><div class="hero-actions"><button class="btn btn-light" onclick="openNewCandidate()"><i class="fa-solid fa-user-plus"></i>Novo candidato</button><button class="btn btn-outline" style="border-color:rgba(255,255,255,.28);color:white" onclick="state.managerPage='agenda';state.agendaAnchor='${today}';state.selectedDate='${today}';render()"><i class="fa-regular fa-calendar"></i>Ver agenda</button></div></section>
  <section class="section"><div class="section-head"><div><h2>Pendências</h2><p>Ações que merecem atenção</p></div></div><div class="grid-2 grid-md-4 pending-grid">
    ${metric('3','fa-clipboard-check','Em análise',"state.managerPage='volunteer';state.candidateFilter='analysis';render()")}
    ${metric('1','fa-rotate','Ajustes',"state.managerPage='volunteer';state.candidateFilter='adjustments';render()")}
    ${metric('2','fa-plane-arrival','Chegadas','showToast(\'Próximas chegadas abertas abaixo.\')')}
    ${metric('1','fa-triangle-exclamation','Alteração','openNotifications()')}
  </div></section>
  <section class="section"><div class="section-head"><div><h2>Hoje na Casa</h2><p>${longDate(today)}</p></div><button class="btn btn-soft" onclick="state.managerPage='agenda';state.agendaAnchor='${today}';state.selectedDate='${today}';render()">Agenda</button></div><div class="list">
    ${todaySessions.length?todaySessions.map(s=>agendaItem(s.activity.time,s.activity.name,s.activity.owner,s.group,s.status)).join(''):`<div class="empty">Nenhuma atividade prevista para hoje.</div>`}
  </div></section>
  <section class="section"><div class="section-head"><div><h2>Próximas movimentações</h2><p>Chegadas e saídas</p></div></div><div class="grid-2">
    <div class="card"><span class="eyebrow">Chegadas</span><div style="margin-top:10px" class="list">${miniMove('Thomas Miller','03/09','em 10 dias')}${miniMove('Maria Gómez','10/09','em 17 dias')}</div></div>
    <div class="card"><span class="eyebrow">Saídas</span><div style="margin-top:10px" class="list">${miniMove('Sophie Martin','02/09','em 9 dias')}</div></div>
  </div></section>
  <section class="section"><div class="notice warning"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>2 pontos precisam de atenção</strong><br>Existe uma sessão em conflito e uma alteração feita por voluntário aguardando confirmação.</div></div></section>`;
}

function metric(n,icon,label,action){return `<button class="card metric" style="border:1px solid var(--border);color:var(--text)" onclick="${action}"><div class="metric-icon"><i class="fa-solid ${icon}"></i></div><div><strong>${n}</strong><span style="display:block">${label}</span></div></button>`}

function agendaItem(time,name,person,group,status){const [l,t]=statusMeta(status);return `<div class="list-item"><div class="time-box single"><strong>${time}</strong></div><div class="item-main"><h3>${name}</h3><p>${person} • ${group}</p><div class="item-meta">${badge(l,t)}</div></div></div>`}

function miniMove(name,date,label){return `<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong style="font-size:.7rem">${name}</strong><div style="font-size:.61rem;color:var(--muted)">${date} • ${label}</div></div>`}

function personCompact(p){const [l,t]=statusMeta(p.status);return `<div class="list-item clickable" onclick="openPerson(${p.id})"><div class="avatar">${p.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div class="item-main"><h3>${p.name}</h3><p>${p.country} • ${p.unit} • ${fmtDate(p.from,true)}–${fmtDate(p.to,true)}</p><div class="item-meta">${badge(l,t)}</div></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);margin-top:11px"></i></div>`}
