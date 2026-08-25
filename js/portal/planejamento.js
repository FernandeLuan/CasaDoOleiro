function volunteerPlan(){
  const acts=volunteerActivities();
  const status=state.volunteerPlanStatus||'draft';
  const approved=state.volunteerMode==='approved';
  const editable=approved||status==='draft'||status==='adjustments';
  const notice=approved
    ?'Seu planejamento aprovado continua disponível para consulta. Alterações em sessões confirmadas voltam para análise da Casa.'
    :status==='submitted'
      ?'Planejamento enviado. Enquanto a equipe estiver analisando, atividades e sessões ficam bloqueadas para edição.'
      :status==='adjustments'
        ?'A equipe solicitou ajustes. Faça as alterações necessárias e reenvie o planejamento para uma nova análise.'
        :'Monte o planejamento pelos dias da sua estadia. Você poderá editar tudo até realizar o primeiro envio.';
  const submitButton=approved
    ?`<button class="btn btn-soft btn-block" style="margin-top:12px" disabled><i class="fa-solid fa-circle-check"></i>Planejamento aprovado</button>`
    :status==='submitted'
      ?`<button class="btn btn-soft btn-block" style="margin-top:12px" disabled><i class="fa-solid fa-paper-plane"></i>Enviado</button>`
      :`<button class="btn btn-primary btn-block" style="margin-top:12px" onclick="submitPlan()"><i class="fa-solid fa-paper-plane"></i>${status==='adjustments'?'Reenviar planejamento':'Enviar planejamento'}</button>`;

  return `<section class="section"><div class="section-head"><div><span class="eyebrow">03–18 SET</span><h2>Meu planejamento</h2><p>Datas e horários são sugestões até a confirmação da Casa</p></div></div>
  <div class="notice ${status==='adjustments'?'warning':''}"><i class="fa-solid fa-circle-info"></i><div>${notice}</div></div>
  <div style="margin-top:14px">${volunteerAgendaContent(editable)}</div>
  <div class="card plan-summary" style="margin-top:14px"><span class="eyebrow">Resumo</span><div class="stat-row"><span class="stat-pill">${acts.length} atividades</span><span class="stat-pill">${acts.reduce((s,a)=>s+a.dates.length,0)} sessões</span><span class="stat-pill">${(acts.reduce((s,a)=>s+a.duration*a.dates.length,0)/60).toFixed(1).replace('.',',')}h planejadas</span></div>${submitButton}</div></section>`;
}

function volunteerAgendaContent(editable=false){
  const dates=volunteerStayDates();
  return `<div class="calendar-strip">${dates.map(d=>`<button class="date-chip" onclick="document.getElementById('vday-${d}').scrollIntoView({behavior:'smooth',block:'start'})"><span>${dayName(d)}</span><strong>${new Date(d+'T12:00:00').getDate()}</strong><span>SET</span></button>`).join('')}</div><div style="margin-top:14px">${dates.map(d=>{const ss=getSessions(d,true);return `<div class="day-block" id="vday-${d}"><div class="day-title"><h3>${dayName(d)}, ${fmtDate(d)}</h3><span>${ss.length?((ss.reduce((x,s)=>x+s.activity.duration,0)/60)+'h'):''}</span></div>${ss.map(s=>sessionCardVolunteer(s,editable)).join('')||'<div class="empty">Nenhuma atividade planejada.</div>'}${editable?`<button class="btn btn-soft btn-block" style="margin-top:6px" onclick="openActivityModal('${d}')"><i class="fa-solid fa-plus"></i>Adicionar atividade</button>`:''}</div>`}).join('')}</div>`;
}

function sessionCardVolunteer(s,editable){const [l,t]=statusMeta(s.status);return `<div class="activity-card"><div class="activity-row"><div><h4>${s.activity.time} • ${s.activity.name}</h4><p>${s.activity.duration} min • ${s.activity.period}</p></div>${badge(l,t)}</div>${editable?`<div class="activity-actions"><button class="btn btn-outline" onclick="openActivityModal('${s.date}',${s.activity.id})">Editar</button><button class="btn btn-outline" onclick="moveSession(${s.activity.id},'${s.date}',true)">Mover</button></div>`:''}</div>`}

function activityList(editable=false){
  const acts=volunteerActivities();
  return `<div class="list">${acts.map(a=>`<div class="card"><div class="activity-row"><div><h3 style="font-size:.8rem">${a.name}</h3><p style="font-size:.65rem;color:var(--muted)">${a.description}</p></div><span class="session-count-badge">${badge(a.dates.length+' sessões','primary')}</span></div><div class="stat-row"><span class="stat-pill">${a.duration} min</span><span class="stat-pill">${a.participation}</span><span class="stat-pill">${a.period}</span></div><div style="font-size:.63rem;color:var(--muted);margin-top:10px">${a.dates.map(d=>fmtDate(d,true)).join(' • ')}</div>${editable?`<div class="activity-actions"><button class="btn btn-outline" onclick="openActivityModal(null,${a.id})">Editar atividade</button><button class="btn btn-soft" onclick="openReuseActivity(${a.id})">+ Sessão</button></div>`:''}</div>`).join('')}</div>`
}

function openActivityModal(date=null,id=null){
  if(state.volunteerMode!=='approved'&&!['draft','adjustments'].includes(state.volunteerPlanStatus||'draft'))return showToast('O planejamento já foi enviado. Aguarde a análise da Casa.');
  const a=id?state.activities.find(x=>x.id===id):null;const defaultDate=date||'2026-09-08';const availableDates=volunteerStayDates();
  openModal(a?'Editar atividade':'Nova atividade',a?'A descrição é compartilhada entre todas as sessões.':'Cadastre uma vez e selecione quantas datas precisar.',`<div class="form-grid activity-modal-form"><div class="field"><label>Nome da atividade</label><input id="actName" class="input" value="${a?a.name:''}" placeholder="Ex.: Conversação em inglês"></div><div class="field"><label>Descrição</label><textarea id="actDesc" class="textarea" placeholder="Como a atividade funciona?">${a?a.description:''}</textarea></div><div class="field-row"><div class="field"><label>Duração</label><select id="actDuration" class="select">${[30,60,90,120].map(v=>`<option value="${v}" ${a&&a.duration===v?'selected':''}>${v===90?'1h30':v===120?'2h':v+' min'}</option>`).join('')}</select></div><div class="field"><label>Participação</label><select id="actParticipation" class="select">${['Até 5','Até 10','Livre','Outro'].map(v=>`<option ${a&&a.participation===v?'selected':''}>${v}</option>`).join('')}</select></div></div><div class="field"><label>Materiais necessários</label><input id="actMaterials" class="input" value="${a?a.materials:''}" placeholder="Nenhum, quadro, bola..."></div><div class="field"><label>Observações</label><textarea id="actNotes" class="textarea" placeholder="Opcional">${a?a.notes:''}</textarea></div><div class="field-row"><div class="field"><label>Período preferido</label><select id="actPeriod" class="select">${['Manhã','Tarde','Noite','Sem preferência'].map(v=>`<option ${a&&a.period===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Horário sugerido</label><input id="actTime" class="input" type="time" value="${a?a.time:'15:15'}"><small>Opcional na versão final.</small></div></div><div class="field"><label>Datas em que deseja realizar</label><div class="check-grid activity-date-grid">${availableDates.map(d=>`<label class="check-card"><input type="checkbox" name="actDate" value="${d}" ${(a&&a.dates.includes(d))||(!a&&d===defaultDate)?'checked':''}><span>${dayName(d)} ${fmtDate(d,true)}</span></label>`).join('')}</div></div><button class="btn btn-primary btn-block" onclick="saveActivity(${a?a.id:'null'})">${a?'Salvar alterações':'Adicionar atividade'}</button></div>`);modalRoot.querySelector('.modal')?.classList.add('activity-modal')
}

function saveActivity(id){const dates=[...document.querySelectorAll('input[name="actDate"]:checked')].map(x=>x.value);const data={name:document.getElementById('actName').value.trim(),description:document.getElementById('actDesc').value.trim(),duration:+document.getElementById('actDuration').value,participation:document.getElementById('actParticipation').value,materials:document.getElementById('actMaterials').value.trim()||'Nenhum',notes:document.getElementById('actNotes').value.trim(),period:document.getElementById('actPeriod').value,time:document.getElementById('actTime').value||'15:15',dates};if(!data.name)return showToast('Informe o nome da atividade.');if(!dates.length)return showToast('Selecione pelo menos uma data.');if(id){Object.assign(state.activities.find(x=>x.id===id),data)}else{state.activities.push({id:Date.now(),owner:'Thomas Miller',...data})}closeModal();render();showToast(id?'Atividade atualizada.':'Atividade adicionada ao planejamento.')}

function openReuseActivity(id){if(state.volunteerMode!=='approved'&&!['draft','adjustments'].includes(state.volunteerPlanStatus||'draft'))return showToast('O planejamento já foi enviado.');const a=state.activities.find(x=>x.id===id);openModal('Adicionar sessão',a.name,`<div class="field"><label>Selecione uma nova data</label><select id="reuseDate" class="select">${volunteerStayDates().filter(d=>!a.dates.includes(d)).map(d=>`<option value="${d}">${dayName(d)} • ${fmtDate(d)}</option>`).join('')}</select></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="addReuseDate(${id})">Adicionar sessão</button>`)}

function addReuseDate(id){const a=state.activities.find(x=>x.id===id);const d=document.getElementById('reuseDate').value;a.dates.push(d);state.sessionStatus[`${id}-${d}`]='proposed';closeModal();render();showToast('Nova sessão adicionada.')}

function submitPlan(){
  const acts=volunteerActivities();
  if(!acts.length)return showToast('Adicione pelo menos uma atividade antes de enviar.');
  const wasAdjustment=state.volunteerPlanStatus==='adjustments';
  state.volunteerPlanStatus='submitted';
  localStorage.setItem('oleiro-volunteer-plan-status','submitted');
  const p=state.candidates.find(x=>x.name==='Thomas Miller');
  if(p){p.status='analysis';p.activities=acts.length;p.sessions=acts.reduce((s,a)=>s+a.dates.length,0);p.submitted='Agora'}
  state.notifications.unshift({id:Date.now(),title:wasAdjustment?'Planejamento reenviado':'Planejamento enviado',text:'A equipe da Casa recebeu seu planejamento.',unread:true});
  render();
  showToast(wasAdjustment?'Planejamento reenviado para análise.':'Planejamento enviado para análise.');
}

function openQuickSession(date='2026-09-08'){openActivityModal(date)}
