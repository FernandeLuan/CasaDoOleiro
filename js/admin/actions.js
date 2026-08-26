async function hydrateCandidatePlanning(applicationId){
  const p=state.candidates.find(x=>String(x.id)===String(applicationId));if(!p||!window.OleiroServices?.planning)return;
  const [activities,sessions]=await Promise.all([
    window.OleiroServices.planning.listActivities(p.id),
    window.OleiroServices.planning.listSessions({applicationId:p.id,from:p.from||null,to:p.to||null})
  ]);
  state.currentPlanningApplicationId=p.id;
  state.sessions=sessions||[];
  const byActivity=new Map((activities||[]).map(activity=>[String(activity.id),{...activity,owner:p.name,dates:[],time:activity.time||''}]));
  state.sessionStatus={};state.sessionGroups={};
  state.sessions.forEach(session=>{
    const activity=byActivity.get(String(session.activityId||''));
    if(activity&&session.date&&!activity.dates.includes(session.date))activity.dates.push(session.date);
    if(session.activityId&&session.date){state.sessionStatus[`${session.activityId}-${session.date}`]=session.status||'proposed';state.sessionGroups[`${session.activityId}-${session.date}`]=session.groupId||'A definir'}
  });
  state.activities=[...byActivity.values()];
}

async function openPerson(id,tab='overview'){
  let p=state.candidates.find(x=>String(x.id)===String(id));if(!p)return;
  if(!p.profileHydrated&&window.OleiroServices?.applications?.getById){
    try{
      const fresh=await window.OleiroServices.applications.getById(p.id);
      if(fresh){const index=state.candidates.findIndex(x=>String(x.id)===String(p.id));if(index>=0)state.candidates[index]=fresh;p=fresh}
    }catch(error){console.error('Não foi possível carregar os dados de contato do perfil:',error)}
  }
  state.personModalTab=tab;
  if(tab==='plan'){try{await hydrateCandidatePlanning(p.id)}catch(error){console.error(error);return showToast('Não foi possível carregar o planejamento.')}}
  const tabs=[['overview','Visão geral'],['plan','Planejamento'],['stay','Estadia'],['history','Histórico']];const arg=candidateActionArg(p.id);
  openModal(p.name,`${p.country} • ${p.unit}`,`<div class="tabs person-tabs">${tabs.map(([k,l])=>`<button class="tab ${tab===k?'active':''}" onclick="openPerson(decodeURIComponent('${arg}'),'${k}')">${l}</button>`).join('')}</div>${personTabContent(p,tab)}`)
}

function personTabContent(p,tab){
  const [l]=statusMeta(p.status);const arg=candidateActionArg(p.id);
  if(tab==='plan'){
    const acts=state.currentPlanningApplicationId===p.id?state.activities:[];
    return acts.length?`<div class="list">${acts.map(a=>`<div class="card"><div class="activity-row"><div><h3 style="font-size:.8rem">${a.name}</h3><p style="font-size:.64rem;color:var(--muted);margin-top:3px">${a.description||''}</p></div>${badge((a.dates||[]).length+' sessões','primary')}</div><div style="margin-top:10px">${(a.dates||[]).map(d=>{const st=state.sessionStatus[`${a.id}-${d}`]||'proposed';const [sl]=statusMeta(st);return `<button class="plan-session-link" style="margin-bottom:7px" onclick='closeModal();openSessionDetail(${JSON.stringify(a.id)},${JSON.stringify(d)})'><span class="plan-session-icon"><i class="fa-regular fa-calendar"></i></span><span><strong>${dayName(d)} • ${fmtDate(d)} • ${a.time||'—'}</strong><small>${sl} • ${state.sessionGroups[`${a.id}-${d}`]||'Grupo a definir'}</small></span><i class="fa-solid fa-chevron-right"></i></button>`}).join('')}</div></div>`).join('')}</div>`:`<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>Nenhuma atividade cadastrada ainda.</div>`;
  }
  if(tab==='stay')return `<div class="card"><span class="eyebrow">${p.status==='approved'?'Estadia confirmada':'Período proposto'}</span><div class="grid-2" style="margin-top:10px"><div><strong style="font-size:.8rem">Chegada</strong><p class="compact-hint">${fmtDate(p.from)}</p></div><div><strong style="font-size:.8rem">Saída</strong><p class="compact-hint">${fmtDate(p.to)}</p></div></div><div style="margin-top:12px"><strong style="font-size:.72rem">Unidade</strong><p class="compact-hint">${p.unit}</p></div></div>`;
  if(tab==='history')return `<div class="list"><div class="list-item"><div class="metric-icon"><i class="fa-solid fa-user-plus"></i></div><div class="item-main"><h3>Perfil criado</h3><p>Acesso liberado para o processo de planejamento.</p></div></div>${p.submitted&&p.submitted!=='—'?`<div class="list-item"><div class="metric-icon"><i class="fa-solid fa-paper-plane"></i></div><div class="item-main"><h3>Planejamento enviado</h3><p>${p.submitted}</p></div></div>`:''}<div class="list-item"><div class="metric-icon"><i class="fa-solid fa-circle-info"></i></div><div class="item-main"><h3>Status atual</h3><p>${l}</p></div></div></div>`;
  return `<div class="card"><div><span class="eyebrow">Status</span><h3 style="font-size:.88rem;margin-top:5px">${l}</h3></div><div class="stat-row"><span class="stat-pill">${fmtDate(p.from,true)}–${fmtDate(p.to,true)}</span><span class="stat-pill">${p.activities||0} atividades</span><span class="stat-pill">${p.sessions||0} sessões</span></div></div><div class="card" style="margin-top:10px"><h3 style="font-size:.78rem">Contato</h3><p style="font-size:.66rem;color:var(--muted);margin-top:6px">${p.email||'—'}<br>${p.phone||'—'}</p></div>${p.status==='analysis'||p.status==='adjustments'?`<div class="activity-actions" style="margin-top:12px"><button class="btn btn-primary" onclick="approveCandidate(decodeURIComponent('${arg}'))">Aprovar</button><button class="btn btn-outline" onclick="requestAdjust(decodeURIComponent('${arg}'))">Pedir ajuste</button><button class="btn btn-danger" onclick="rejectCandidate(decodeURIComponent('${arg}'))">Recusar</button></div>`:''}${p.status==='rejected'?`<button class="btn btn-soft btn-block" style="margin-top:12px" onclick="reactivateCandidate(decodeURIComponent('${arg}'))">Reativar perfil</button>`:''}`;
}

async function approveCandidate(id){
  const p=state.candidates.find(x=>String(x.id)===String(id));if(!p)return;
  try{await window.OleiroServices.applications.update(p.id,{status:'approved',active:true,planningDeadlineAt:null,approvedAt:new Date(),needsAdminAttention:false});await refreshCandidateFromBackend(p.id);closeModal();render();showToast('Voluntário aprovado. Estadia confirmada.')}catch(error){console.error(error);showToast('Não foi possível aprovar o voluntário.')}
}
async function requestAdjust(id){
  const p=state.candidates.find(x=>String(x.id)===String(id));if(!p)return;
  try{await window.OleiroServices.applications.update(p.id,{status:'adjustments',active:true,planningDeadlineAt:new Date(candidateDeadlineFrom(new Date(),7)),adjustmentRequestedAt:new Date(),needsAdminAttention:false});await refreshCandidateFromBackend(p.id);closeModal();render();showToast('Planejamento devolvido para ajustes.')}catch(error){console.error(error);showToast('Não foi possível solicitar ajustes.')}
}
async function confirmSession(id,date){
  const session=realSessionFor(id,date);if(!session)return showToast('Sessão não encontrada.');
  try{await window.OleiroServices.planning.updateSession(session.id,{status:'confirmed',confirmedAt:new Date()});await hydrateCandidatePlanning(state.currentPlanningApplicationId);render();showToast('Sessão confirmada.')}catch(error){console.error(error);showToast('Não foi possível confirmar a sessão.')}
}
function assignGroup(id,date){openModal('Definir grupo','Somente a equipe da Casa define quem participa.',`<div class="check-grid">${['A','B','C','D','A+B','C+D','Livre'].map(g=>`<button class="check-card" onclick='saveGroup(${JSON.stringify(id)},${JSON.stringify(date)},${JSON.stringify(g)})'>${g==='Livre'?'Participação livre':'Grupo '+g}</button>`).join('')}</div>`)}
async function saveGroup(id,date,g){
  const session=realSessionFor(id,date);if(!session)return showToast('Sessão não encontrada.');
  try{await window.OleiroServices.planning.updateSession(session.id,{groupId:g});await hydrateCandidatePlanning(state.currentPlanningApplicationId);closeModal();render();showToast('Grupo atualizado.')}catch(error){console.error(error);showToast('Não foi possível atualizar o grupo.')}
}
