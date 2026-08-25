const CANDIDATE_LIFECYCLE_KEY='oleiro-candidate-lifecycle-v2';

function candidateLifecycleStore(){
  try{return JSON.parse(localStorage.getItem(CANDIDATE_LIFECYCLE_KEY)||'{}')}catch{return {}}
}
function candidateDeadlineFrom(base=new Date(),days=7){
  const d=new Date(base);d.setDate(d.getDate()+days);return d.toISOString();
}
function saveCandidateLifecycle(p){
  if(!p)return;
  const store=candidateLifecycleStore();
  store[String(p.id)]={status:p.status,pendingUntil:p.pendingUntil||null,inactive:!!p.inactive,rejectedReason:p.rejectedReason||'',rejectedAt:p.rejectedAt||null,autoRejected:!!p.autoRejected};
  localStorage.setItem(CANDIDATE_LIFECYCLE_KEY,JSON.stringify(store));
}
function hydrateCandidateLifecycle(){
  const store=candidateLifecycleStore();
  state.candidates.forEach(p=>{
    const saved=store[String(p.id)];
    if(saved)Object.assign(p,saved);
    if(p.status==='pending'&&!p.pendingUntil){p.pendingUntil=candidateDeadlineFrom(new Date(),7);p.inactive=false;saveCandidateLifecycle(p)}
  });
}
function rejectCandidateRecord(id,reason,autoRejected=false){
  const p=state.candidates.find(x=>String(x.id)===String(id));if(!p)return null;
  p.status='rejected';p.inactive=true;p.autoRejected=!!autoRejected;p.pendingUntil=null;p.rejectedReason=reason;p.rejectedAt=new Date().toISOString();
  saveCandidateLifecycle(p);return p;
}
function processExpiredCandidatesOnStartup(){
  const now=Date.now();
  state.candidates.forEach(p=>{
    if(p.status!=='pending'||!p.pendingUntil)return;
    const deadline=new Date(p.pendingUntil).getTime();
    if(Number.isFinite(deadline)&&deadline<now)rejectCandidateRecord(p.id,'Prazo de 7 dias para envio do planejamento expirado.',true);
  });
}
function candidateDeadlineMeta(p){
  if(!p?.pendingUntil)return null;
  const deadline=new Date(p.pendingUntil);const days=Math.max(0,Math.ceil((deadline.getTime()-Date.now())/86400000));
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';const date=new Intl.DateTimeFormat(locale,{day:'numeric',month:'long'}).format(deadline);
  return {days,date,label:days===0?'Vence hoje':days===1?'1 dia restante':`${days} dias restantes`};
}
function candidatePendingPanel(p){
  const meta=candidateDeadlineMeta(p);if(!meta)return '';
  return `<div class="candidate-lifecycle-panel"><div class="candidate-deadline-card"><i class="fa-regular fa-clock"></i><div><strong>Prazo para enviar o planejamento</strong><p>${meta.date} • ${meta.label}. Se o prazo vencer sem envio, o perfil é recusado e inativado automaticamente.</p></div></div><div class="candidate-lifecycle-actions"><button class="btn btn-soft" type="button" onclick="extendCandidateDeadline(${JSON.stringify(p.id)})"><i class="fa-solid fa-clock-rotate-left"></i>Prorrogar +7 dias</button><button class="btn btn-danger" type="button" onclick="requestRejectPendingCandidate(${JSON.stringify(p.id)})"><i class="fa-solid fa-user-slash"></i>Recusar e inativar</button></div></div>`;
}
function extendCandidateDeadline(id){
  const p=state.candidates.find(x=>String(x.id)===String(id));if(!p)return;
  const current=p.pendingUntil?new Date(p.pendingUntil):new Date();const base=current.getTime()>Date.now()?current:new Date();
  p.pendingUntil=candidateDeadlineFrom(base,7);p.status='pending';p.inactive=false;p.autoRejected=false;p.rejectedReason='';p.rejectedAt=null;
  saveCandidateLifecycle(p);openPerson(p.id,'overview');showToast('Prazo prorrogado por mais 7 dias.');
}
function requestRejectPendingCandidate(id){
  const p=state.candidates.find(x=>String(x.id)===String(id));if(!p)return;
  openModal('Recusar e inativar?','O acesso ficará inativo até uma reativação manual.',`<div class="confirm-delete-content"><div class="confirm-person"><i class="fa-solid fa-user-slash"></i><strong>${p.name}</strong></div><div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="openPerson(${JSON.stringify(p.id)},'overview')">Cancelar</button><button class="btn btn-danger" type="button" onclick="confirmRejectPendingCandidate(${JSON.stringify(p.id)})">Recusar e inativar</button></div></div>`);
}
function confirmRejectPendingCandidate(id){
  const p=state.candidates.find(x=>String(x.id)===String(id));
  if(!p||p.status!=='pending')return showToast('Este perfil não está mais com planejamento pendente.');
  rejectCandidateRecord(p.id,'Recusado pela gestão antes do envio do planejamento.',false);
  closeModal();state.candidateFilter='rejected';render();scrollPageTop();showToast(`${p.name} foi recusado e inativado.`);
}
function reactivateCandidate(id){
  const p=state.candidates.find(x=>String(x.id)===String(id));if(!p)return;
  p.status='pending';p.inactive=false;p.autoRejected=false;p.pendingUntil=candidateDeadlineFrom(new Date(),7);p.rejectedReason='';p.rejectedAt=null;p.submitted='—';
  saveCandidateLifecycle(p);closeModal();state.candidateFilter='pending';render();scrollPageTop();showToast('Perfil reativado com novo prazo de 7 dias.');
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
  return `<div class="list-item clickable" onclick="openPerson(${JSON.stringify(p.id)})"><div class="avatar">${p.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div class="item-main"><h3>${p.name}</h3><p>${p.country} • ${p.unit} • ${fmtDate(p.from,true)}–${fmtDate(p.to,true)}</p><div class="item-meta">${badge(l,t)}${inactive}</div>${extra}</div><i class="fa-solid fa-chevron-right" style="color:var(--muted);margin-top:11px"></i></div>`;
};

hydrateCandidateLifecycle();
processExpiredCandidatesOnStartup();
