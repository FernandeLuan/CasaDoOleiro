function volunteerHome(){
  const approved=state.volunteerMode==='approved';
  const planStatus=state.volunteerPlanStatus||'draft';
  const showPlanStatus=!approved&&planStatus!=='draft';
  const planMeta={
    submitted:['Enviado para análise','success','A equipe da Casa recebeu seu planejamento. Enquanto ele estiver em análise, a edição fica bloqueada.'],
    adjustments:['Ajustes solicitados','warning','A equipe pediu alterações. Revise o planejamento e reenvie quando estiver pronto.'],
    approved:['Planejamento aprovado','success','Seu planejamento foi aprovado pela equipe da Casa.']
  }[planStatus]||['Planejamento pendente','warning','Monte seu planejamento e envie para análise.'];
  const heroAction=approved
    ?`<button class="btn btn-light" onclick="state.volunteerPage='agenda';render()"><i class="fa-regular fa-calendar-check"></i>Minha agenda</button>`
    :`<button class="btn btn-light" onclick="state.volunteerPage='plan';render()"><i class="fa-solid ${planStatus==='adjustments'?'fa-pen-to-square':planStatus==='submitted'?'fa-eye':'fa-calendar-plus'}"></i>${planStatus==='adjustments'?'Ajustar planejamento':planStatus==='submitted'?'Ver planejamento':'Montar planejamento'}</button>`;
  const nextActivity=approved?getNextVolunteerActivity():null;

  return `<section class="hero"><div class="eyebrow" style="color:#d9eadf">${approved?'Estadia confirmada':'Período proposto'}</div><h1>${approved?'Bem-vindo à sua experiência':'Prepare sua experiência'}</h1><p class="muted">Rodeio • 03 a 18 de setembro de 2026</p><div class="hero-actions">${heroAction}</div></section>
  ${approved?`<section class="section"><div class="notice warning"><i class="fa-regular fa-bell"></i><div><strong>Seu cronograma foi atualizado</strong><br>Confira sua agenda para acompanhar alterações recentes.</div></div></section>`:''}
  ${approved?`<section class="section"><div class="section-head"><div><h2>Próxima atividade</h2><p>O que vem a seguir</p></div><button class="btn btn-soft" onclick="state.volunteerPage='agenda';render()">Agenda</button></div>${nextActivity?volunteerHomeActivityCard(nextActivity):'<div class="empty"><i class="fa-regular fa-calendar-check"></i>Nenhuma próxima atividade confirmada.</div>'}</section>`:''}
  ${showPlanStatus?`<section class="section"><div class="section-head"><div><h2>Seu planejamento</h2><p>Status da proposta enviada</p></div><button class="btn btn-soft" onclick="state.volunteerPage='plan';render()">Ver</button></div><div class="card"><div class="status-line"><span class="dot ${planMeta[1]==='success'?'success':'warning'}"></span><strong style="font-size:.76rem">${planMeta[0]}</strong></div><p style="font-size:.66rem;color:var(--muted);margin-top:7px">${planMeta[2]}</p><div class="stat-row"><span class="stat-pill">${volunteerActivities().length} atividades</span><span class="stat-pill">${volunteerActivities().reduce((s,a)=>s+a.dates.length,0)} sessões</span><span class="stat-pill">${(volunteerActivities().reduce((s,a)=>s+a.duration*a.dates.length,0)/60).toFixed(1).replace('.',',')}h</span></div></div></section>`:''}
  <section class="section"><div class="section-head"><div><h2>Minha estadia</h2><p>Informações principais</p></div></div><div class="grid-2"><div class="card"><span class="eyebrow">Chegada</span><strong style="display:block;margin-top:8px;font-size:.85rem">03/09</strong><span style="font-size:.62rem;color:var(--muted)">Rodeio</span></div><div class="card"><span class="eyebrow">Saída</span><strong style="display:block;margin-top:8px;font-size:.85rem">18/09</strong><span style="font-size:.62rem;color:var(--muted)">Dia sem atividade</span></div></div></section>
  <section class="section"><div class="section-head"><div><h2>Informações importantes</h2><p>Tudo para sua chegada</p></div></div><div class="list"><button class="menu-link" onclick="state.volunteerPage='info';render()"><i class="fa-solid fa-route"></i><span>Como chegar<small>Transporte, endereço e horários</small></span><i class="fa-solid fa-chevron-right"></i></button><button class="menu-link" onclick="state.volunteerPage='info';render()"><i class="fa-solid fa-house"></i><span>Acomodação e refeições<small>O que está incluído na experiência</small></span><i class="fa-solid fa-chevron-right"></i></button></div></section>`
}

function getNextVolunteerActivity(){
  const sessions=[];
  volunteerActivities().forEach(a=>a.dates.forEach(date=>sessions.push({activity:a,date,status:state.sessionStatus[`${a.id}-${date}`]||'proposed',group:state.sessionGroups[`${a.id}-${date}`]||'A definir'})));
  return sessions.filter(s=>s.status==='confirmed').sort((a,b)=>(a.date+a.activity.time).localeCompare(b.date+b.activity.time))[0]||null;
}

function volunteerHomeActivityCard(s){
  return `<button class="list-item clickable volunteer-home-activity" onclick="state.volunteerPage='agenda';render()"><div class="time-box single"><strong>${s.activity.time}</strong></div><div class="item-main"><h3>${s.activity.name}</h3><p>${fmtDate(s.date)} • ${s.group}</p><div class="item-meta">${badge('Confirmada','success')}</div></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);align-self:center"></i></button>`;
}

function volunteerActivities(){return state.activities.filter(a=>a.owner==='Thomas Miller')}

function volunteerStayDates(){return dateRange('2026-09-03',16)}
