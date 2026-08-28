/* Round 27 — acabamento estrutural do fluxo de seleção sem MutationObserver.
   Textos dinâmicos usam t() no momento em que são criados. */
(function selectionUiR27(){
  const tx=(key,fallback)=>typeof t==='function'?t(key):fallback;
  function meetingStageLabel(p){
    if(p?.status!=='meeting')return '';
    const status=String(p.meetingStatus||'pending');
    if(status==='completed')return tx('meeting.completed','Reunião realizada');
    if(status==='scheduled')return tx('meeting.scheduled','Reunião agendada');
    return tx('meeting.waiting','Aguardando reunião');
  }
  function setProtectedLabeledText(node,label,value){
    if(!node)return;node.replaceChildren();
    const strong=document.createElement('strong');strong.textContent=label;
    const text=document.createElement('span');text.setAttribute('data-no-i18n','');text.textContent=String(value||'');
    node.append(strong,document.createTextNode(' '),text);
  }
  function setActionLabel(button,label,iconClass){
    if(!button||button.disabled||button.getAttribute('aria-busy')==='true')return;
    button.innerHTML=`<i class="fa-solid ${iconClass}"></i>${escapeHtml(label)}`;
  }
  function normalizeFinalDecisionButtons(){
    if(typeof modalRoot==='undefined'||!modalRoot)return;
    modalRoot.querySelectorAll('.selection-final-actions button').forEach(button=>{
      const action=String(button.getAttribute('onclick')||'');
      if(action.includes("'reject'"))setActionLabel(button,tx('action.reject','Recusar'),'fa-xmark');
      if(action.includes("'approve'"))setActionLabel(button,tx('action.approve','Aprovar'),'fa-check');
    });
    setActionLabel(document.getElementById('finalSelectionReject'),tx('action.reject','Recusar'),'fa-xmark');
    setActionLabel(document.getElementById('finalSelectionApprove'),tx('action.approve','Aprovar'),'fa-check');
  }

  const basePersonCompact=typeof window.personCompact==='function'?window.personCompact:null;
  if(basePersonCompact){
    personCompact=function(p){
      const html=basePersonCompact(p);if(p?.status!=='meeting')return html;
      const template=document.createElement('template');template.innerHTML=html;
      const statusBadge=template.content.querySelector('.candidate-status-row .badge');if(statusBadge)statusBadge.textContent=meetingStageLabel(p);
      return template.innerHTML;
    };window.personCompact=personCompact;
  }

  if(typeof renderPersonModal==='function'){
    const baseRenderPersonModal=renderPersonModal;
    renderPersonModal=function(p,...args){
      const result=baseRenderPersonModal(p,...args);
      if(p?.status==='meeting'){
        const label=meetingStageLabel(p),titleBadge=modalRoot.querySelector('.person-title-line .badge');if(titleBadge)titleBadge.textContent=label;
        const accountRoot=modalRoot.querySelector('.admin-account-refactor'),statusLine=accountRoot?.querySelector('.account-status-line');
        if(statusLine){let badge=statusLine.querySelector('.meeting-stage-badge');if(!badge){badge=document.createElement('span');badge.className='badge info meeting-stage-badge';statusLine.prepend(badge)}badge.textContent=label}
      }
      const meetingNotes=String(p?.meetingNotes||'').trim(),notesNode=modalRoot.querySelector('.selection-meeting-notes');
      if(notesNode&&meetingNotes)setProtectedLabeledText(notesNode,tx('meeting.note','Observação:'),meetingNotes);
      const reason=String(p?.rejectedReason||'').trim(),reasonNode=modalRoot.querySelector('.account-reason > div');
      if(reasonNode&&reason)setProtectedLabeledText(reasonNode,tx('candidate.reason','Motivo:'),reason);
      normalizeFinalDecisionButtons();return result;
    };window.renderPersonModal=renderPersonModal;
  }

  const baseOpenSelectionMeetingEditor=typeof window.openSelectionMeetingEditor==='function'?window.openSelectionMeetingEditor:null;
  if(baseOpenSelectionMeetingEditor){
    window.openSelectionMeetingEditor=function(...args){const result=baseOpenSelectionMeetingEditor(...args),dateInput=document.getElementById('selectionMeetingDate'),row=dateInput?.closest('.field-row');if(row)row.classList.add('selection-meeting-datetime');return result};
  }

  const baseOpenVolunteerUnitEditor=typeof window.openVolunteerUnitEditor==='function'?window.openVolunteerUnitEditor:null;
  if(baseOpenVolunteerUnitEditor){window.openVolunteerUnitEditor=function(...args){const result=baseOpenVolunteerUnitEditor(...args),button=modalRoot.querySelector('button[onclick*="saveVolunteerUnit"]');if(button)button.id='saveVolunteerUnitButton';return result}}
  const baseSaveVolunteerUnit=typeof window.saveVolunteerUnit==='function'?window.saveVolunteerUnit:null;
  if(baseSaveVolunteerUnit){
    window.saveVolunteerUnit=async function(...args){
      const button=document.getElementById('saveVolunteerUnitButton')||modalRoot.querySelector('button[onclick*="saveVolunteerUnit"]');if(button?.disabled)return;
      const original=button?.innerHTML||'';if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(tx('action.saving','Salvando...'))}`}
      try{return await baseSaveVolunteerUnit(...args)}finally{if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=original||escapeHtml(tx('action.save','Salvar'))}}
    };
  }
})();
