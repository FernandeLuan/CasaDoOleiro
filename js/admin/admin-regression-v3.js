function candidateById(id){return state.candidates.find(x=>String(x.id)===String(id))||null}

function openNewCandidate(){
  const body=`<div class="form-grid new-candidate-form">
    <div class="field"><label for="ncName">Nome</label><input id="ncName" class="input" autocomplete="name" placeholder="Nome completo"></div>
    <div class="field"><label for="ncEmail">E-mail</label><input id="ncEmail" class="input" type="email" autocomplete="email" placeholder="email@exemplo.com"></div>
    <div class="field-row"><div class="field"><label for="ncPhone">WhatsApp</label><input id="ncPhone" class="input" type="tel" autocomplete="tel" placeholder="+55 ..."></div><div class="field"><label for="ncCountry">Nacionalidade</label><input id="ncCountry" class="input" placeholder="País"></div></div>
    <div class="field"><label for="ncUnit">Unidade</label><select id="ncUnit" class="select"><option>Rodeio</option><option>Indaial</option></select></div>
    <div class="field-row candidate-date-row"><div class="field date-field"><label for="ncFrom">Chegada proposta</label><input id="ncFrom" class="input" type="date"></div><div class="field date-field"><label for="ncTo">Saída proposta</label><input id="ncTo" class="input" type="date"></div></div>
    <div class="field"><label for="ncNote">Observação interna</label><textarea id="ncNote" class="textarea" placeholder="Opcional"></textarea></div>
  </div>`;
  const footer=`<button class="btn btn-primary btn-block" type="button" onclick="saveCandidate()"><i class="fa-solid fa-user-plus"></i>Cadastrar e liberar acesso</button>`;
  openModal('Novo voluntário','Cadastre quem já está no processo real de avaliação.',body,footer);
  modalRoot.querySelector('.modal')?.classList.add('new-candidate-modal');
}

function openAgendaRangeModal(){
  ensureAgendaRange();
  openModal('Período da agenda','Escolha as datas que deseja visualizar.',`<div class="agenda-range-form"><div class="field-row agenda-range-fields"><div class="field date-field"><label for="agendaFromInput">De</label><input id="agendaFromInput" class="input" type="date" value="${state.agendaFrom}"></div><div class="field date-field"><label for="agendaToInput">Até</label><input id="agendaToInput" class="input" type="date" value="${state.agendaTo}"></div></div></div>`,`<button class="btn btn-primary btn-block" type="button" onclick="applyAgendaRange()">Aplicar período</button>`);
  modalRoot.querySelector('.modal')?.classList.add('agenda-range-modal');
}

function requestRejectPendingCandidate(id){
  const p=candidateById(id);if(!p||p.status!=='pending')return showToast('Este perfil não está mais com planejamento pendente.');
  openModal('Recusar e inativar?',`A ação será aplicada somente a ${p.name}.`,`<div class="confirm-delete-content"><div class="confirm-person"><i class="fa-solid fa-user-slash"></i><strong>${p.name}</strong></div><p class="compact-hint">O acesso ficará inativo até uma reativação manual.</p></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancelar</button><button class="btn btn-danger" type="button" onclick="confirmRejectPendingCandidate(${JSON.stringify(p.id)})">Recusar e inativar</button></div>`);
  modalRoot.querySelector('.modal')?.classList.add('confirm-delete-modal');
}
function confirmRejectPendingCandidate(id){
  const p=candidateById(id);if(!p||p.status!=='pending')return closeModal();
  p.status='rejected';p.inactive=true;p.autoRejected=false;p.pendingUntil=null;p.rejectedReason='Recusado pela gestão antes do envio do planejamento.';p.rejectedAt=new Date().toISOString();
  if(typeof saveCandidateLifecycle==='function')saveCandidateLifecycle(p);
  if(typeof syncPrototypeVolunteer==='function')syncPrototypeVolunteer(p,'rejected','candidate');
  closeModal();render();scrollPageTop();showToast(`${p.name} foi recusado e inativado.`);
}
function rejectCandidate(id){
  const p=candidateById(id);if(!p||!['analysis','adjustments'].includes(p.status))return showToast('Este perfil não pode ser recusado neste status.');
  openModal('Recusar perfil?',`A ação será aplicada somente a ${p.name}.`,`<div class="confirm-delete-content"><div class="confirm-person"><i class="fa-solid fa-user-slash"></i><strong>${p.name}</strong></div><p class="compact-hint">O planejamento será recusado e o acesso ficará inativo.</p></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="openPerson(${JSON.stringify(p.id)},'overview')">Cancelar</button><button class="btn btn-danger" type="button" onclick="confirmRejectCandidate(${JSON.stringify(p.id)})">Recusar</button></div>`);
  modalRoot.querySelector('.modal')?.classList.add('confirm-delete-modal');
}
function confirmRejectCandidate(id){
  const p=candidateById(id);if(!p||!['analysis','adjustments'].includes(p.status))return closeModal();
  p.status='rejected';p.inactive=true;p.pendingUntil=null;p.rejectedReason='Planejamento recusado pela gestão.';p.rejectedAt=new Date().toISOString();
  if(typeof saveCandidateLifecycle==='function')saveCandidateLifecycle(p);
  if(typeof syncPrototypeVolunteer==='function')syncPrototypeVolunteer(p,'rejected','candidate');
  closeModal();render();scrollPageTop();showToast(`${p.name} foi recusado e inativado.`);
}
function reactivateCandidate(id){
  const p=candidateById(id);if(!p||p.status!=='rejected')return showToast('Este perfil não está inativo.');
  p.status='pending';p.inactive=false;p.autoRejected=false;p.pendingUntil=typeof candidateDeadlineFrom==='function'?candidateDeadlineFrom(new Date(),7):null;p.rejectedReason='';p.rejectedAt=null;p.submitted='—';
  if(typeof saveCandidateLifecycle==='function')saveCandidateLifecycle(p);
  if(typeof syncPrototypeVolunteer==='function')syncPrototypeVolunteer(p,'draft','candidate');
  closeModal();state.candidateFilter='pending';render();scrollPageTop();showToast(`${p.name} foi reativado com novo prazo de 7 dias.`);
}
