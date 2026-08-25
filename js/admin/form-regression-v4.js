function syncNewCandidateSubmit(){
  const button=document.getElementById('ncSubmit');
  if(!button)return;
  const required=['ncName','ncEmail','ncFrom','ncTo'];
  button.disabled=required.some(id=>!document.getElementById(id)?.value?.trim());
}

function openNewCandidate(){
  const body=`<div class="form-grid new-candidate-form">
    <div class="field"><label for="ncName">Nome</label><input id="ncName" class="input" autocomplete="name" placeholder="Nome completo" required oninput="syncNewCandidateSubmit()"></div>
    <div class="field"><label for="ncEmail">E-mail</label><input id="ncEmail" class="input" type="email" autocomplete="email" placeholder="email@exemplo.com" required oninput="syncNewCandidateSubmit()"></div>
    <div class="field-row"><div class="field"><label for="ncPhone">WhatsApp</label><input id="ncPhone" class="input" type="tel" autocomplete="tel" placeholder="+55 ..."></div><div class="field"><label for="ncCountry">Nacionalidade</label><input id="ncCountry" class="input" placeholder="País"></div></div>
    <div class="field"><label for="ncUnit">Unidade</label><select id="ncUnit" class="select"><option>Rodeio</option><option>Indaial</option></select></div>
    <div class="field-row candidate-date-row"><div class="field date-field"><label for="ncFrom">Chegada proposta</label><input id="ncFrom" class="input" type="date" required onchange="syncNewCandidateSubmit()" oninput="syncNewCandidateSubmit()"></div><div class="field date-field"><label for="ncTo">Saída proposta</label><input id="ncTo" class="input" type="date" required onchange="syncNewCandidateSubmit()" oninput="syncNewCandidateSubmit()"></div></div>
    <div class="field"><label for="ncNote">Observação interna</label><textarea id="ncNote" class="textarea" placeholder="Opcional"></textarea></div>
  </div>`;
  const footer=`<button id="ncSubmit" class="btn btn-primary btn-block" type="button" onclick="saveCandidate()" disabled><i class="fa-solid fa-user-plus"></i>Cadastrar e liberar acesso</button>`;
  openModal('Novo voluntário','Cadastre quem já está no processo real de avaliação.',body,footer);
  modalRoot.querySelector('.modal')?.classList.add('new-candidate-modal');
  syncNewCandidateSubmit();
}

function saveCandidate(){
  const name=document.getElementById('ncName')?.value.trim()||'';
  const email=document.getElementById('ncEmail')?.value.trim()||'';
  const from=document.getElementById('ncFrom')?.value||'';
  const to=document.getElementById('ncTo')?.value||'';
  if(!name||!email)return showToast('Informe nome e e-mail.');
  if(!from||!to){
    showToast('Informe a data de chegada e a data de saída.');
    const target=!from?document.getElementById('ncFrom'):document.getElementById('ncTo');
    target?.focus();
    if(typeof openDatePicker==='function')openDatePicker(target);
    return;
  }
  if(to<from){
    showToast('A saída deve ser igual ou posterior à chegada.');
    document.getElementById('ncTo')?.focus();
    return;
  }
  const p={
    id:Date.now(),name,
    country:document.getElementById('ncCountry')?.value||'—',
    email,
    phone:document.getElementById('ncPhone')?.value||'',
    unit:document.getElementById('ncUnit')?.value||'Rodeio',
    from,to,
    status:'pending',sessions:0,activities:0,submitted:'—',
    pendingUntil:typeof candidateDeadlineFrom==='function'?candidateDeadlineFrom(new Date(),7):null,
    inactive:false,rejectedReason:'',autoRejected:false
  };
  state.candidates.unshift(p);
  if(typeof saveCandidateLifecycle==='function')saveCandidateLifecycle(p);
  closeModal();
  state.managerPage='volunteer';state.candidateFilter='pending';state.candidateSearch='';state.candidateUnit='all';
  render();
  if(typeof scrollPageTop==='function')scrollPageTop();
  showToast('Voluntário cadastrado. Prazo de 7 dias iniciado.');
}
