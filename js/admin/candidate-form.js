/* Cadastro real de candidatos e campos de data compartilhados pelas telas administrativas. */
function uiDateText(value){if(!value)return 'Selecionar data';const parts=value.split('-');return parts.length===3?`${parts[2]}/${parts[1]}/${parts[0]}`:value;}
function datePickerField(id,label,value='',required=false,handler='syncVisualDateField'){const text=uiDateText(value),placeholder=value?'':' is-placeholder';return `<div class="field date-field"><label for="${id}">${label}</label><div class="date-picker-shell"><span id="${id}Text" class="date-picker-value${placeholder}">${text}</span><i class="fa-regular fa-calendar"></i><input id="${id}" class="date-native-overlay" type="date" value="${value||''}" ${required?'required':''} onchange="${handler}('${id}')" oninput="${handler}('${id}')"></div></div>`;}
function syncVisualDateField(id){const input=document.getElementById(id),text=document.getElementById(`${id}Text`);if(!input||!text)return;text.textContent=uiDateText(input.value);text.classList.toggle('is-placeholder',!input.value);}

function candidateUnitOptions(){
  const available=(state.units||[]).filter(unit=>unit.active===true&&unit.acceptingVolunteers!==false);
  const rows=available.length?available:[{id:'rodeio',name:'Rodeio'}];
  return rows.map(unit=>`<option value="${escapeHtml(unit.id)}">${escapeHtml(unit.name||unit.id)}</option>`).join('');
}
function candidateParticipantFields(index,{optional=false}={}){
  const n=Number(index);return `<div class="card candidate-participant-card" id="ncParticipant${n}" ${optional?'hidden':''}>
    <div class="activity-row"><div><span class="eyebrow">Participante ${n}</span><h3 style="font-size:.82rem;margin-top:4px">Dados de acesso</h3></div>${n===2?badge('Dupla','primary'):''}</div>
    <div class="form-grid" style="margin-top:12px">
      <div class="field"><label for="ncName${n}">Nome completo</label><input id="ncName${n}" class="input" autocomplete="name" placeholder="Nome completo" oninput="syncNewCandidateSubmit()"></div>
      <div class="field"><label for="ncEmail${n}">E-mail</label><input id="ncEmail${n}" class="input" type="email" autocomplete="email" placeholder="email@exemplo.com" oninput="syncNewCandidateSubmit()"></div>
      <div class="field-row"><div class="field"><label for="ncPhone${n}">WhatsApp</label><input id="ncPhone${n}" class="input" type="tel" autocomplete="tel" placeholder="+55 ..."></div><div class="field"><label for="ncCountry${n}">País</label><input id="ncCountry${n}" class="input" placeholder="País"></div></div>
      <div class="field"><label for="ncLanguage${n}">Idioma do e-mail de acesso</label><select id="ncLanguage${n}" class="select"><option value="en">English</option><option value="pt">Português</option><option value="es">Español</option></select></div>
    </div>
  </div>`;
}
function toggleCandidateParticipant2(){
  const isCouple=document.getElementById('ncType')?.value==='couple';const card=document.getElementById('ncParticipant2');if(card)card.hidden=!isCouple;syncNewCandidateSubmit();
}
function syncCandidateDateField(id){
  syncVisualDateField(id);const from=document.getElementById('ncFrom'),to=document.getElementById('ncTo');
  if(from&&to){to.min=from.value||'';from.max=to.value||'';if(from.value&&to.value&&to.value<from.value){if(id==='ncFrom'){to.value='';syncVisualDateField('ncTo')}else{from.value='';syncVisualDateField('ncFrom')}}}
  syncNewCandidateSubmit();
}
function candidateFormParticipant(index){return {name:document.getElementById(`ncName${index}`)?.value.trim()||'',email:document.getElementById(`ncEmail${index}`)?.value.trim()||'',phone:document.getElementById(`ncPhone${index}`)?.value.trim()||'',country:document.getElementById(`ncCountry${index}`)?.value.trim()||'',language:document.getElementById(`ncLanguage${index}`)?.value||'en'}}
function syncNewCandidateSubmit(){
  const button=document.getElementById('ncSubmit');if(!button)return;const type=document.getElementById('ncType')?.value||'individual';const p1=candidateFormParticipant(1),p2=candidateFormParticipant(2);const from=document.getElementById('ncFrom')?.value||'',to=document.getElementById('ncTo')?.value||'';
  const peopleOk=!!p1.name&&!!p1.email&&(type!=='couple'||(!!p2.name&&!!p2.email&&p1.email.toLowerCase()!==p2.email.toLowerCase()));button.disabled=!peopleOk||!from||!to||to<from;
}
function openNewCandidate(){
  const body=`<div class="form-grid new-candidate-form">
    <div class="field"><label for="ncType">Tipo da candidatura</label><select id="ncType" class="select" onchange="toggleCandidateParticipant2()"><option value="individual">Individual</option><option value="couple">Dupla</option></select><small class="compact-hint">Em uma dupla, cada pessoa terá seu próprio login e ambas compartilharão a mesma candidatura e planejamento.</small></div>
    ${candidateParticipantFields(1)}${candidateParticipantFields(2,{optional:true})}
    <div class="card"><div class="form-grid"><div class="field"><label for="ncUnit">Unidade</label><select id="ncUnit" class="select">${candidateUnitOptions()}</select></div><div class="field-row candidate-date-row">${datePickerField('ncFrom','Chegada proposta','',true,'syncCandidateDateField')}${datePickerField('ncTo','Saída proposta','',true,'syncCandidateDateField')}</div><div class="field"><label for="ncNote">Observação interna</label><textarea id="ncNote" class="textarea" placeholder="Opcional"></textarea></div></div></div>
    <div class="notice"><i class="fa-solid fa-envelope"></i><div>Você não define a senha. Após o cadastro, o Firebase envia um e-mail para cada participante criar a própria senha.</div></div>
  </div>`;
  const footer=`<button id="ncSubmit" class="btn btn-primary btn-block" type="button" onclick="saveCandidate()" disabled><i class="fa-solid fa-user-plus"></i>Cadastrar e enviar acesso</button>`;
  openModal('Novo candidato','Cadastre uma pessoa ou uma dupla.',body,footer);modalRoot.querySelector('.modal')?.classList.add('new-candidate-modal');syncNewCandidateSubmit();
}
async function saveCandidate(){
  const type=document.getElementById('ncType')?.value||'individual';const participants=[candidateFormParticipant(1)];if(type==='couple')participants.push(candidateFormParticipant(2));
  const stayStart=document.getElementById('ncFrom')?.value||'',stayEnd=document.getElementById('ncTo')?.value||'',unitId=document.getElementById('ncUnit')?.value||'';
  const unit=(state.units||[]).find(item=>String(item.id)===String(unitId));const note=document.getElementById('ncNote')?.value.trim()||'';
  if(!window.OleiroServices?.onboarding?.createCandidate)return showToast('Cadastro de acesso indisponível.');
  try{
    const result=await window.OleiroServices.onboarding.createCandidate({participants,stayStart,stayEnd,unitId,unitName:unit?.name||unitId,note});
    closeModal();state.managerPage='volunteer';state.candidateFilter='pending';state.candidateSearch='';state.candidateUnit='all';state.candidateVisibleCount=CANDIDATE_PAGE_SIZE;
    if(typeof hydrateManagerData==='function')await hydrateManagerData();render();scrollPageTop();
    if(result?.invitationFailures?.length)showToast('Cadastro criado. Um e-mail de acesso não pôde ser enviado; a pessoa pode usar “Esqueci minha senha” no login.');
    else showToast(type==='couple'?'Dupla cadastrada. E-mails para criar as senhas enviados.':'Candidato cadastrado. E-mail para criar a senha enviado.');
  }catch(error){console.error(error);showToast(error?.message||'Não foi possível cadastrar o candidato.')}
}

function syncAgendaDateField(id){syncVisualDateField(id);const from=document.getElementById('agendaFromInput'),to=document.getElementById('agendaToInput');if(!from||!to)return;to.min=from.value||'';from.max=to.value||'';if(from.value&&to.value&&to.value<from.value){if(id==='agendaFromInput'){to.value='';syncVisualDateField('agendaToInput')}else{from.value='';syncVisualDateField('agendaFromInput')}}}
function openAgendaRangeModal(){ensureAgendaRange();const body=`<div class="agenda-range-form"><div class="field-row agenda-range-fields">${datePickerField('agendaFromInput','De',state.agendaFrom,false,'syncAgendaDateField')}${datePickerField('agendaToInput','Até',state.agendaTo,false,'syncAgendaDateField')}</div></div>`;openModal('Período da agenda','Escolha as datas que deseja visualizar.',body,`<button class="btn btn-primary btn-block" type="button" onclick="applyAgendaRange()">Aplicar período</button>`);modalRoot.querySelector('.modal')?.classList.add('agenda-range-modal');syncAgendaDateField('agendaFromInput');syncAgendaDateField('agendaToInput');}
