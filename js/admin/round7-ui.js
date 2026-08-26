/* Round 7 — editor de datas robusto, reset de teste e status de agenda enxutos. */
(function round7Admin(){
  function stayDateText(value){
    if(!value)return 'Selecionar data';
    const parts=String(value).split('-');
    return parts.length===3?`${parts[2]}/${parts[1]}/${parts[0]}`:String(value);
  }
  function stayDateField(id,label,value=''){
    return `<label class="stay-date-field-v3" for="${id}"><span class="stay-date-label-v3">${label}</span><span class="stay-date-shell-v3"><span id="${id}Text" class="stay-date-value-v3 ${value?'':'is-placeholder'}">${stayDateText(value)}</span><i class="fa-regular fa-calendar"></i><input id="${id}" class="stay-date-native-v3" type="date" value="${escapeHtml(value||'')}" onchange="syncStayDateEditorV3('${id}')" oninput="syncStayDateEditorV3('${id}')"></span></label>`;
  }

  window.syncStayDateEditorV3=function(id){
    const input=document.getElementById(id),text=document.getElementById(`${id}Text`);
    if(input&&text){text.textContent=stayDateText(input.value);text.classList.toggle('is-placeholder',!input.value)}
    const from=document.getElementById('editStayFrom'),to=document.getElementById('editStayTo');
    if(!from||!to)return;
    to.min=from.value||'';
    if(from.value&&to.value&&to.value<from.value){to.value='';const toText=document.getElementById('editStayToText');if(toText){toText.textContent='Selecionar data';toText.classList.add('is-placeholder')}}
  };

  openStayDateEditor=function(id){
    const p=candidateById(id);if(!p)return;
    const body=`<div class="stay-date-editor-v3">${stayDateField('editStayFrom','Chegada',p.from||'')}${stayDateField('editStayTo','Saída',p.to||'')}</div>`;
    openModal('Editar datas','',body,`<button class="btn btn-primary btn-block" type="button" onclick='saveStayDates(${JSON.stringify(String(id))})'>Salvar período</button>`);
    modalRoot.querySelector('.modal')?.classList.add('stay-date-modal-v3');
    requestAnimationFrame(()=>{syncStayDateEditorV3('editStayFrom');syncStayDateEditorV3('editStayTo')});
  };

  /* Agenda: confirmado é o estado normal e não precisa de badge repetitivo. */
  agendaItem=function(time,name,person,group,status){
    const [label,type]=statusMeta(status),showStatus=status!=='confirmed';
    return `<div class="list-item"><div class="time-box single"><strong>${time||'—'}</strong></div><div class="item-main"><h3>${escapeHtml(name||'Atividade')}</h3><p>${escapeHtml(person||'Voluntário')} • ${escapeHtml(group||'A definir')}</p>${showStatus?`<div class="item-meta">${badge(label,type)}</div>`:''}</div></div>`;
  };

  const baseCandidatePlanContent=candidatePlanContent;
  candidatePlanContent=function(p){
    const content=baseCandidatePlanContent(p);
    if(!candidatePlanningCache(p.id))return content;
    const arg=encodeURIComponent(String(p.id));
    return `${content}<div class="admin-test-tools"><button class="btn btn-outline" type="button" onclick="requestResetPlanning(decodeURIComponent('${arg}'))"><i class="fa-solid fa-arrow-rotate-left"></i>Reiniciar planejamento</button></div>`;
  };

  function returnToPlanning(id){const p=candidateById(id);if(p)renderPersonModal(p,'plan');else closeModal()}

  window.requestResetPlanning=function(id){
    const p=candidateById(id);if(!p)return;
    const arg=encodeURIComponent(String(id));
    openModal('Reiniciar planejamento?','Ferramenta para repetir testes sem criar outra conta.',`<div class="notice warning"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Todas as atividades e sessões serão apagadas.</strong><br>A conta, o e-mail e as datas da estadia serão mantidos.</div></div><div class="notice" style="margin-top:10px"><i class="fa-solid fa-rotate"></i><div>O voluntário voltará para <strong>Em preparação</strong> com um novo prazo de 7 dias.</div></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="returnToPlanningFromReset(decodeURIComponent('${arg}'))">Cancelar</button><button id="resetPlanningConfirm" class="btn btn-danger" type="button" onclick="confirmResetPlanning(decodeURIComponent('${arg}'))">Reiniciar</button></div>`);
    const close=modalRoot.querySelector('.modal-close');if(close)close.onclick=()=>returnToPlanning(id);
    const backdrop=modalRoot.querySelector('.modal-backdrop');if(backdrop)backdrop.onclick=e=>{if(e.target===backdrop)returnToPlanning(id)};
  };
  window.returnToPlanningFromReset=returnToPlanning;

  window.confirmResetPlanning=async function(id){
    const p=candidateById(id),button=document.getElementById('resetPlanningConfirm');if(!p)return;
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i>Reiniciando...'}
    try{
      const result=await window.OleiroServices.applications.resetPlanning(p.id,{deadlineDays:7});
      p.status='pending';p.inactive=false;p.activities=0;p.sessions=0;p.submitted='—';p.dayAdjustments={};p.pendingUntil=result.planningDeadlineAt;
      if(typeof invalidateCandidatePlanning==='function')invalidateCandidatePlanning(p.id);
      if(typeof invalidateManagerScheduleCache==='function')invalidateManagerScheduleCache();
      if(typeof deriveAdminNotifications==='function')deriveAdminNotifications();
      try{await hydrateCandidatePlanning(p.id,{force:true})}catch(error){console.error('Falha ao recarregar planejamento vazio:',error)}
      renderPersonModal(p,'plan');
      showToast('Planejamento reiniciado.');
    }catch(error){
      console.error(error);showToast(error?.message||'Não foi possível reiniciar o planejamento.');
      if(button){button.disabled=false;button.textContent='Reiniciar'}
    }
  };
})();
