function uiDateText(value){
  if(!value)return 'Selecionar data';
  const parts=value.split('-');
  return parts.length===3?`${parts[2]}/${parts[1]}/${parts[0]}`:value;
}
function datePickerField(id,label,value='',required=false,handler='syncVisualDateField'){
  const text=uiDateText(value),placeholder=value?'':' is-placeholder';
  return `<div class="field date-field"><label for="${id}">${label}</label><div class="date-picker-shell"><span id="${id}Text" class="date-picker-value${placeholder}">${text}</span><i class="fa-regular fa-calendar"></i><input id="${id}" class="date-native-overlay" type="date" value="${value||''}" ${required?'required':''} onchange="${handler}('${id}')" oninput="${handler}('${id}')"></div></div>`;
}
function syncVisualDateField(id){
  const input=document.getElementById(id),text=document.getElementById(`${id}Text`);if(!input||!text)return;
  text.textContent=uiDateText(input.value);text.classList.toggle('is-placeholder',!input.value);
}
function syncCandidateDateField(id){
  syncVisualDateField(id);
  const from=document.getElementById('ncFrom'),to=document.getElementById('ncTo');
  if(from&&to){
    to.min=from.value||'';from.max=to.value||'';
    if(from.value&&to.value&&to.value<from.value){
      if(id==='ncFrom'){to.value='';syncVisualDateField('ncTo')}else{from.value='';syncVisualDateField('ncFrom')}
    }
  }
  syncNewCandidateSubmit();
}
function syncNewCandidateSubmit(){
  const button=document.getElementById('ncSubmit');if(!button)return;
  const name=document.getElementById('ncName')?.value.trim()||'',email=document.getElementById('ncEmail')?.value.trim()||'',from=document.getElementById('ncFrom')?.value||'',to=document.getElementById('ncTo')?.value||'';
  button.disabled=!name||!email||!from||!to||to<from;
}
function openNewCandidate(){
  const body=`<div class="form-grid new-candidate-form"><div class="field"><label for="ncName">Nome</label><input id="ncName" class="input" autocomplete="name" placeholder="Nome completo" required oninput="syncNewCandidateSubmit()"></div><div class="field"><label for="ncEmail">E-mail</label><input id="ncEmail" class="input" type="email" autocomplete="email" placeholder="email@exemplo.com" required oninput="syncNewCandidateSubmit()"></div><div class="field-row"><div class="field"><label for="ncPhone">WhatsApp</label><input id="ncPhone" class="input" type="tel" autocomplete="tel" placeholder="+55 ..."></div><div class="field"><label for="ncCountry">Nacionalidade</label><input id="ncCountry" class="input" placeholder="País"></div></div><div class="field"><label for="ncUnit">Unidade</label><select id="ncUnit" class="select"><option>Rodeio</option><option>Indaial</option></select></div><div class="field-row candidate-date-row">${datePickerField('ncFrom','Chegada proposta','',true,'syncCandidateDateField')}${datePickerField('ncTo','Saída proposta','',true,'syncCandidateDateField')}</div><div class="field"><label for="ncNote">Observação interna</label><textarea id="ncNote" class="textarea" placeholder="Opcional"></textarea></div></div>`;
  const footer=`<button id="ncSubmit" class="btn btn-primary btn-block" type="button" onclick="saveCandidate()" disabled><i class="fa-solid fa-user-plus"></i>Cadastrar e liberar acesso</button>`;
  openModal('Novo voluntário','Cadastre quem já está no processo real de avaliação.',body,footer);modalRoot.querySelector('.modal')?.classList.add('new-candidate-modal');syncNewCandidateSubmit();
}
function syncAgendaDateField(id){
  syncVisualDateField(id);const from=document.getElementById('agendaFromInput'),to=document.getElementById('agendaToInput');if(!from||!to)return;
  to.min=from.value||'';from.max=to.value||'';
  if(from.value&&to.value&&to.value<from.value){if(id==='agendaFromInput'){to.value='';syncVisualDateField('agendaToInput')}else{from.value='';syncVisualDateField('agendaFromInput')}}
}
function openAgendaRangeModal(){
  ensureAgendaRange();
  const body=`<div class="agenda-range-form"><div class="field-row agenda-range-fields">${datePickerField('agendaFromInput','De',state.agendaFrom,false,'syncAgendaDateField')}${datePickerField('agendaToInput','Até',state.agendaTo,false,'syncAgendaDateField')}</div></div>`;
  openModal('Período da agenda','Escolha as datas que deseja visualizar.',body,`<button class="btn btn-primary btn-block" type="button" onclick="applyAgendaRange()">Aplicar período</button>`);modalRoot.querySelector('.modal')?.classList.add('agenda-range-modal');syncAgendaDateField('agendaFromInput');syncAgendaDateField('agendaToInput');
}
function saveCandidate(){
  const name=document.getElementById('ncName')?.value.trim()||'',email=document.getElementById('ncEmail')?.value.trim()||'',from=document.getElementById('ncFrom')?.value||'',to=document.getElementById('ncTo')?.value||'';
  if(!name||!email)return showToast('Informe nome e e-mail.');
  if(!from||!to)return showToast('Informe a data de chegada e a data de saída.');
  if(to<from)return showToast('A saída deve ser igual ou posterior à chegada.');
  const p={id:Date.now(),name,country:document.getElementById('ncCountry')?.value||'—',email,phone:document.getElementById('ncPhone')?.value||'',unit:document.getElementById('ncUnit')?.value||'Rodeio',from,to,status:'pending',sessions:0,activities:0,submitted:'—',pendingUntil:typeof candidateDeadlineFrom==='function'?candidateDeadlineFrom(new Date(),7):null,inactive:false,rejectedReason:'',autoRejected:false};
  state.candidates.unshift(p);if(typeof saveCandidateLifecycle==='function')saveCandidateLifecycle(p);closeModal();state.managerPage='volunteer';state.candidateFilter='pending';state.candidateSearch='';state.candidateUnit='all';render();if(typeof scrollPageTop==='function')scrollPageTop();showToast('Voluntário cadastrado. Prazo de 7 dias iniciado.');
}
