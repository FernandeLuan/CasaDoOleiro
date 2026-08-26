function candidateDeadlineFrom(base=new Date(),days=7){
  const d=new Date(base);d.setDate(d.getDate()+days);return d.toISOString();
}
function candidateById(id){return state.candidates.find(x=>String(x.id)===String(id))||null}
async function refreshCandidateFromBackend(id){
  const fresh=await window.OleiroServices?.applications?.getById(id);
  if(!fresh)return null;
  const index=state.candidates.findIndex(x=>String(x.id)===String(id));
  if(index>=0)state.candidates[index]=fresh;else state.candidates.unshift(fresh);
  return fresh;
}
async function rejectCandidateRecord(id,reason,autoRejected=false){
  const p=candidateById(id);if(!p)return null;
  await window.OleiroServices.applications.update(p.id,{status:'rejected',active:false,planningDeadlineAt:null,rejectedReason:reason,rejectedAt:new Date(),autoRejected:!!autoRejected,needsAdminAttention:false});
  await window.OleiroServices.applications.setParticipantsActive(p.participantUids,false);
  return refreshCandidateFromBackend(p.id);
}
async function processExpiredCandidatesOnStartup(){
  const now=Date.now();
  const expired=state.candidates.filter(p=>p.status==='pending'&&p.pendingUntil&&new Date(p.pendingUntil).getTime()<now);
  for(const p of expired){try{await rejectCandidateRecord(p.id,'Prazo de 7 dias para envio do planejamento expirado.',true)}catch(error){console.error('Falha ao processar prazo expirado:',p.id,error)}}
}
function candidateDeadlineMeta(p){
  if(!p?.pendingUntil)return null;
  const deadline=new Date(p.pendingUntil);const days=Math.max(0,Math.ceil((deadline.getTime()-Date.now())/86400000));
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';const date=new Intl.DateTimeFormat(locale,{day:'numeric',month:'long'}).format(deadline);
  return {days,date,label:days===0?'Vence hoje':days===1?'1 dia restante':`${days} dias restantes`};
}
function candidatePendingPanel(p){
  const meta=candidateDeadlineMeta(p);if(!meta)return '';
  return `<div class="candidate-lifecycle-panel"><div class="candidate-deadline-card"><i class="fa-regular fa-clock"></i><div><strong>Prazo para enviar o planejamento</strong><p>${meta.date} • ${meta.label}. Se o prazo vencer sem envio, o perfil é recusado e inativado.</p></div></div><div class="candidate-lifecycle-actions"><button class="btn btn-soft" type="button" onclick="extendCandidateDeadline(${JSON.stringify(p.id)})"><i class="fa-solid fa-clock-rotate-left"></i>Prorrogar +7 dias</button><button class="btn btn-danger" type="button" onclick="requestRejectPendingCandidate(${JSON.stringify(p.id)})"><i class="fa-solid fa-user-slash"></i>Recusar e inativar</button></div></div>`;
}
async function extendCandidateDeadline(id){
  const p=candidateById(id);if(!p)return;
  const current=p.pendingUntil?new Date(p.pendingUntil):new Date();const base=current.getTime()>Date.now()?current:new Date();const next=new Date(candidateDeadlineFrom(base,7));
  try{
    await window.OleiroServices.applications.update(p.id,{planningDeadlineAt:next,status:'pending',active:true,autoRejected:false,rejectedReason:'',rejectedAt:null});
    await window.OleiroServices.applications.setParticipantsActive(p.participantUids,true);
    const fresh=await refreshCandidateFromBackend(p.id);openPerson(fresh?.id||p.id,'overview');showToast('Prazo prorrogado por mais 7 dias.');
  }catch(error){console.error(error);showToast('Não foi possível prorrogar o prazo.')}
}
function requestRejectPendingCandidate(id){
  const p=candidateById(id);if(!p||p.status!=='pending')return showToast('Este perfil não está mais com planejamento pendente.');
  openModal('Recusar e inativar?',`A ação será aplicada somente a ${p.name}.`,`<div class="confirm-delete-content"><div class="confirm-person"><i class="fa-solid fa-user-slash"></i><strong>${p.name}</strong></div><p class="compact-hint">O acesso ficará inativo até uma reativação manual.</p></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancelar</button><button class="btn btn-danger" type="button" onclick="confirmRejectPendingCandidate(${JSON.stringify(p.id)})">Recusar e inativar</button></div>`);modalRoot.querySelector('.modal')?.classList.add('confirm-delete-modal');
}
async function confirmRejectPendingCandidate(id){
  const p=candidateById(id);if(!p||p.status!=='pending')return closeModal();
  try{await rejectCandidateRecord(p.id,'Recusado pela gestão antes do envio do planejamento.',false);closeModal();state.candidateFilter='rejected';render();scrollPageTop();showToast(`${p.name} foi recusado e inativado.`)}catch(error){console.error(error);showToast('Não foi possível inativar o perfil.')}
}
function rejectCandidate(id){
  const p=candidateById(id);if(!p||!['analysis','adjustments'].includes(p.status))return showToast('Este perfil não pode ser recusado neste status.');
  openModal('Recusar perfil?',`A ação será aplicada somente a ${p.name}.`,`<div class="confirm-delete-content"><div class="confirm-person"><i class="fa-solid fa-user-slash"></i><strong>${p.name}</strong></div><p class="compact-hint">O planejamento será recusado e o acesso ficará inativo.</p></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="openPerson(${JSON.stringify(p.id)},'overview')">Cancelar</button><button class="btn btn-danger" type="button" onclick="confirmRejectCandidate(${JSON.stringify(p.id)})">Recusar</button></div>`);modalRoot.querySelector('.modal')?.classList.add('confirm-delete-modal');
}
async function confirmRejectCandidate(id){
  const p=candidateById(id);if(!p||!['analysis','adjustments'].includes(p.status))return closeModal();
  try{await rejectCandidateRecord(p.id,'Planejamento recusado pela gestão.',false);closeModal();state.candidateFilter='rejected';render();scrollPageTop();showToast(`${p.name} foi recusado e inativado.`)}catch(error){console.error(error);showToast('Não foi possível recusar o perfil.')}
}
async function reactivateCandidate(id){
  const p=candidateById(id);if(!p||p.status!=='rejected')return showToast('Este perfil não está inativo.');
  try{
    await window.OleiroServices.applications.update(p.id,{status:'pending',active:true,planningDeadlineAt:new Date(candidateDeadlineFrom(new Date(),7)),planningSubmittedAt:null,autoRejected:false,rejectedReason:'',rejectedAt:null,needsAdminAttention:false});
    await window.OleiroServices.applications.setParticipantsActive(p.participantUids,true);
    await refreshCandidateFromBackend(p.id);closeModal();state.candidateFilter='pending';render();scrollPageTop();showToast(`${p.name} foi reativado com novo prazo de 7 dias.`);
  }catch(error){console.error(error);showToast('Não foi possível reativar o perfil.')}
}

const _candidateBasePersonTabContent=personTabContent;
personTabContent=function(p,tab){
  let html=_candidateBasePersonTabContent(p,tab);
  if(p.status==='pending'&&(tab==='overview'||tab==='plan'))html+=candidatePendingPanel(p);
  if(p.status==='rejected'&&p.rejectedReason&&(tab==='overview'||tab==='history'))html+=`<div class="lifecycle-reason"><strong>Motivo da inativação:</strong><br>${p.rejectedReason}</div>`;
  return html;
};

personCompact=function(p){
  const [l,t]=statusMeta(p.status);const meta=p.status==='pending'?candidateDeadlineMeta(p):null;
  const extra=meta?`<div class="candidate-deadline-mini"><i class="fa-regular fa-clock"></i>${meta.label}</div>`:'';const inactive=p.inactive?badge('Inativo','danger'):'';
  const period=p.from&&p.to?`${fmtDate(p.from,true)}–${fmtDate(p.to,true)}`:'Período não informado';
  return `<div class="list-item clickable" onclick="openPerson(${JSON.stringify(p.id)})"><div class="avatar">${String(p.name||'V').split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div class="item-main"><h3>${p.name}</h3><p>${p.country||'—'} • ${p.unit||'—'} • ${period}</p><div class="item-meta">${badge(l,t)}${inactive}</div>${extra}</div><i class="fa-solid fa-chevron-right" style="color:var(--muted);margin-top:11px"></i></div>`;
};
