/* Round 25 — acabamento final das injeções Admin: i18n, estados de reunião e feedback assíncrono. */
(function i18nAfterAdminInjectionsR25(){
  if(typeof OLEIRO_TRANSLATIONS!=='undefined'){
    Object.assign(OLEIRO_TRANSLATIONS.en,{
      'Observação:':'Note:','Motivo:':'Reason:','Não definida':'Not set','Não definido':'Not set',
      'Salvando...':'Saving...','Excluindo...':'Deleting...','Aprovando...':'Approving...','Confirmando...':'Confirming...','Enviando...':'Sending...','Reenviando...':'Resending...','Alterando...':'Updating...',
      'Salvar unidade':'Save unit','Unidade alterada.':'Unit changed.','Selecione uma unidade.':'Select a unit.','Não foi possível alterar a unidade.':'Could not change the unit.'
    });
    Object.assign(OLEIRO_TRANSLATIONS.es,{
      'Observação:':'Observación:','Motivo:':'Motivo:','Não definida':'No definida','Não definido':'No definido',
      'Salvando...':'Guardando...','Excluindo...':'Eliminando...','Aprovando...':'Aprobando...','Confirmando...':'Confirmando...','Enviando...':'Enviando...','Reenviando...':'Reenviando...','Alterando...':'Actualizando...',
      'Salvar unidade':'Guardar unidad','Unidade alterada.':'Unidad cambiada.','Selecione uma unidade.':'Selecciona una unidad.','Não foi possível alterar a unidade.':'No fue posible cambiar la unidad.'
    });
  }

  function meetingStageLabel(p){
    if(p?.status!=='meeting')return '';
    const status=String(p.meetingStatus||'pending');
    if(status==='completed')return 'Reunião realizada';
    if(status==='scheduled')return 'Reunião agendada';
    return 'Aguardando reunião';
  }
  function setProtectedLabeledText(node,label,value){
    if(!node)return;
    node.replaceChildren();
    const strong=document.createElement('strong');strong.textContent=label;
    const text=document.createElement('span');text.setAttribute('data-no-i18n','');text.textContent=String(value||'');
    node.append(strong,document.createTextNode(' '),text);
  }
  function applyAdminI18n(){if(typeof applyI18n==='function'&&typeof modalRoot!=='undefined'&&modalRoot)applyI18n(modalRoot)}
  function visibleText(pt){return typeof translateText==='function'?translateText(pt):pt}
  function setActionLabel(button,ptLabel,iconClass){
    if(!button||button.disabled||button.getAttribute('aria-busy')==='true')return;
    const label=visibleText(ptLabel);
    if(String(button.textContent||'').trim()===label)return;
    button.innerHTML=`<i class="fa-solid ${iconClass}"></i>${escapeHtml(label)}`;
  }
  function normalizeFinalDecisionButtons(){
    if(typeof modalRoot==='undefined'||!modalRoot)return;
    modalRoot.querySelectorAll('.selection-final-actions button').forEach(button=>{
      const action=String(button.getAttribute('onclick')||'');
      if(action.includes("'reject'"))setActionLabel(button,'Recusar','fa-xmark');
      if(action.includes("'approve'"))setActionLabel(button,'Aprovar','fa-check');
    });
    setActionLabel(document.getElementById('finalSelectionReject'),'Recusar','fa-xmark');
    setActionLabel(document.getElementById('finalSelectionApprove'),'Aprovar','fa-check');
  }

  /* Lista de voluntários: status da etapa de reunião deriva também de meetingStatus. */
  const basePersonCompact=typeof window.personCompact==='function'?window.personCompact:null;
  if(basePersonCompact){
    personCompact=function(p){
      const html=basePersonCompact(p);if(p?.status!=='meeting')return html;
      const template=document.createElement('template');template.innerHTML=html;
      const statusBadge=template.content.querySelector('.candidate-status-row .badge');if(statusBadge)statusBadge.textContent=meetingStageLabel(p);
      return template.innerHTML;
    };
    window.personCompact=personCompact;
  }

  /* Render de perfil/Conta: status específico, observação rotulada e motivo administrativo protegido do i18n. */
  if(typeof renderPersonModal==='function'){
    const baseRenderPersonModal=renderPersonModal;
    renderPersonModal=function(p,...args){
      const result=baseRenderPersonModal(p,...args);
      if(p?.status==='meeting'){
        const label=meetingStageLabel(p),titleBadge=modalRoot.querySelector('.person-title-line .badge');if(titleBadge)titleBadge.textContent=label;
        const accountRoot=modalRoot.querySelector('.admin-account-refactor'),statusLine=accountRoot?.querySelector('.account-status-line');
        if(statusLine){
          let meetingBadge=statusLine.querySelector('.meeting-stage-badge');
          if(!meetingBadge){meetingBadge=document.createElement('span');meetingBadge.className='badge info meeting-stage-badge';statusLine.prepend(meetingBadge)}
          meetingBadge.textContent=label;
        }
      }
      const meetingNotes=String(p?.meetingNotes||'').trim(),notesNode=modalRoot.querySelector('.selection-meeting-notes');
      if(notesNode&&meetingNotes)setProtectedLabeledText(notesNode,'Observação:',meetingNotes);
      const reason=String(p?.rejectedReason||'').trim(),reasonNode=modalRoot.querySelector('.account-reason > div');
      if(reasonNode&&reason)setProtectedLabeledText(reasonNode,'Motivo:',reason);
      applyAdminI18n();normalizeFinalDecisionButtons();
      return result;
    };
    window.renderPersonModal=renderPersonModal;
  }

  /* O modal de reunião recebe uma classe estrutural própria para o Safari/iPhone. */
  const baseOpenSelectionMeetingEditor=typeof window.openSelectionMeetingEditor==='function'?window.openSelectionMeetingEditor:null;
  if(baseOpenSelectionMeetingEditor){
    window.openSelectionMeetingEditor=function(...args){
      const result=baseOpenSelectionMeetingEditor(...args),dateInput=document.getElementById('selectionMeetingDate'),row=dateInput?.closest('.field-row');
      if(row)row.classList.add('selection-meeting-datetime');
      applyAdminI18n();
      return result;
    };
  }

  /* Alterar unidade: loading local imediato, bloqueio de duplo clique e restauração automática se o modal permanecer aberto. */
  const baseOpenVolunteerUnitEditor=typeof window.openVolunteerUnitEditor==='function'?window.openVolunteerUnitEditor:null;
  if(baseOpenVolunteerUnitEditor){
    window.openVolunteerUnitEditor=function(...args){
      const result=baseOpenVolunteerUnitEditor(...args),button=modalRoot.querySelector('button[onclick*="saveVolunteerUnit"]');
      if(button)button.id='saveVolunteerUnitButton';applyAdminI18n();return result;
    };
  }
  const baseSaveVolunteerUnit=typeof window.saveVolunteerUnit==='function'?window.saveVolunteerUnit:null;
  if(baseSaveVolunteerUnit){
    window.saveVolunteerUnit=async function(...args){
      const button=document.getElementById('saveVolunteerUnitButton')||modalRoot.querySelector('button[onclick*="saveVolunteerUnit"]');
      if(button?.disabled)return;
      const original=button?.innerHTML||'';
      if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';applyAdminI18n()}
      try{return await baseSaveVolunteerUnit(...args)}finally{
        if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original||'Salvar unidade';applyAdminI18n()}
      }
    };
  }

  /* Qualquer conteúdo inserido no modal depois de applyI18n recebe tradução, inclusive estados de loading. */
  if(typeof MutationObserver!=='undefined'&&typeof modalRoot!=='undefined'&&modalRoot&&typeof applyI18n==='function'){
    const observer=new MutationObserver(()=>{applyAdminI18n();normalizeFinalDecisionButtons()});
    observer.observe(modalRoot,{childList:true,subtree:true});
  }
})();
