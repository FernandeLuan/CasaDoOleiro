/* Round 25 — aprovação do planejamento != aprovação final. Reunião e decisão final ficam em Conta. */
(function selectionFlowR25Admin(){
  function safe(value){return encodeURIComponent(String(value??''))}
  function validUrl(value){try{const url=new URL(String(value||''));return ['http:','https:'].includes(url.protocol)?url.toString():''}catch{return ''}}
  function patchPlanSessions(applicationId,status){
    const apply=row=>{if(String(row.applicationId||applicationId)===String(applicationId)){row.status=status;if(row.raw)row.raw.status=status}};
    (state.sessions||[]).forEach(apply);
    Object.entries(state.adminPlanPageCache||{}).forEach(([key,cache])=>{if(key.startsWith(`${applicationId}|`))(cache.sessions||[]).forEach(apply)});
  }
  function clearAdminPlanningCaches(id){if(typeof invalidateCandidatePlanning==='function')invalidateCandidatePlanning(id);delete state.adminAccountReadAt?.[String(id)]}

  /* A aprovação nesta etapa confirma somente o planejamento e abre a etapa de reunião. */
  window.approveCandidate=function(id){
    const p=candidateById(id);if(!p||!['analysis','adjustments'].includes(p.status))return showToast('Este planejamento não está disponível para aprovação.');
    const arg=safe(p.id);
    openModal('Aprovar planejamento?','Esta aprovação ainda não aprova o candidato como voluntário.',`<div class="notice"><i class="fa-solid fa-calendar-check"></i><div>As atividades ficam aprovadas para o processo, mas só entram na Agenda da Casa depois da reunião de definição e da aprovação final.</div></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${safe(p.id)}'),'plan')">Cancelar</button><button id="approvePlanningConfirmR25" class="btn btn-primary" type="button" onclick="confirmApprovePlanningR25('${arg}')"><i class="fa-solid fa-check"></i>Aprovar planejamento</button></div>`);
  };
  window.confirmApprovePlanningR25=async function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id),button=document.getElementById('approvePlanningConfirmR25');if(!p)return;
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Aprovando...'}
    try{
      const result=await window.OleiroServices.applications.approvePlanning(p.id,{participantUids:p.participantUids||[]});
      Object.assign(p,{status:'meeting',active:true,inactive:false,pendingUntil:null,planningDeadlineAt:null,dayAdjustments:{},meetingStatus:'pending',meetingDate:null,meetingTime:'',meetingDuration:30,meetingLink:'',meetingNotes:'',activities:Number(result.activityCount)||p.activities,sessions:Number(result.sessionCount)||p.sessions});
      patchPlanSessions(p.id,'plan_approved');invalidateManagerScheduleCache?.();renderPersonModal(p,'plan');showToast('Planejamento aprovado. Próxima etapa: reunião de definição.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível aprovar o planejamento.');if(button?.isConnected){button.disabled=false;button.textContent='Aprovar planejamento'}}
  };

  function meetingDetails(p){
    const date=p.meetingDate?fmtDate(String(p.meetingDate).slice(0,10)):null,time=String(p.meetingTime||''),duration=Number(p.meetingDuration)||30,link=validUrl(p.meetingLink||''),notes=String(p.meetingNotes||'').trim();
    return `<div class="selection-meeting-details"><div><span>Data</span><strong>${escapeHtml(date||'Não definida')}</strong></div><div><span>Horário</span><strong>${escapeHtml(time||'Não definido')}</strong></div><div><span>Duração</span><strong>${duration} min</strong></div></div>${notes?`<p class="selection-meeting-notes">${escapeHtml(notes)}</p>`:''}${link?`<a class="btn btn-soft btn-block selection-meeting-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-video"></i>Abrir reunião</a>`:''}`;
  }
  function selectionAccountCard(p){
    if(p.status!=='meeting')return '';
    const status=String(p.meetingStatus||'pending'),id=safe(p.id);
    if(status==='pending')return `<div class="card selection-flow-card"><div class="selection-flow-head"><div><span class="eyebrow">Próxima etapa</span><strong>Reunião de definição</strong><small>O planejamento já foi aprovado. Agora agende a conversa de definição.</small></div><span class="badge info">Aguardando reunião</span></div><button class="btn btn-primary btn-block" type="button" onclick="openSelectionMeetingEditor('${id}')"><i class="fa-regular fa-calendar-plus"></i>Agendar reunião</button></div>`;
    const completed=status==='completed';
    return `<div class="card selection-flow-card"><div class="selection-flow-head"><div><span class="eyebrow">Reunião de definição</span><strong>${completed?'Reunião realizada':'Reunião agendada'}</strong></div><span class="badge ${completed?'success':'info'}">${completed?'Realizada':'Agendada'}</span></div>${meetingDetails(p)}${completed?`<div class="selection-final-actions"><button class="btn btn-danger" type="button" onclick="requestFinalSelectionDecision('${id}','reject')"><i class="fa-solid fa-xmark"></i>Não aprovar</button><button class="btn btn-primary" type="button" onclick="requestFinalSelectionDecision('${id}','approve')"><i class="fa-solid fa-check"></i>Aprovar candidato</button></div>`:`<div class="selection-meeting-actions"><button class="btn btn-outline" type="button" onclick="openSelectionMeetingEditor('${id}')"><i class="fa-solid fa-pen"></i>Editar</button><button class="btn btn-primary" type="button" onclick="requestCompleteSelectionMeeting('${id}')"><i class="fa-solid fa-check"></i>Marcar como realizada</button></div>`}</div>`;
  }

  const baseRenderPersonModal=renderPersonModal;
  renderPersonModal=function(p,tab='plan'){
    const result=baseRenderPersonModal(p,tab);if(!p)return result;
    if(tab==='plan'){
      const footer=modalRoot.querySelector('.admin-review-actions-r24');
      if(footer&&['analysis','adjustments'].includes(p.status))footer.innerHTML=`<button class="btn btn-plan-clear-warning" type="button" onclick="requestClearCandidatePlanning('${safe(p.id)}')"><i class="fa-solid fa-broom"></i>Limpar</button><button class="btn btn-primary" type="button" onclick="approveCandidate(decodeURIComponent('${safe(p.id)}'))"><i class="fa-solid fa-check"></i>Aprovar</button>`;
      if(p.status==='meeting'){modalRoot.querySelectorAll('.admin-session-manage-actions,.admin-create-activity-action,.planning-day-adjust-action').forEach(node=>node.remove())}
    }
    if((tab==='account'||modalRoot.dataset.personTab==='account')&&p){
      const root=modalRoot.querySelector('.admin-account-refactor');if(root&&!root.querySelector('.selection-flow-card')){
        const html=selectionAccountCard(p);if(html){const stay=root.querySelector('.account-stay-card');if(stay)stay.insertAdjacentHTML('afterend',html);else root.insertAdjacentHTML('afterbegin',html)}
      }
    }
    return result;
  };

  window.openSelectionMeetingEditor=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p||p.status!=='meeting')return;
    const date=String(p.meetingDate||''),time=String(p.meetingTime||''),duration=Number(p.meetingDuration)||30,link=String(p.meetingLink||''),notes=String(p.meetingNotes||'');
    openModal(p.meetingStatus==='scheduled'?'Editar reunião':'Agendar reunião','Cadastre os dados que também aparecerão no portal do candidato.',`<div class="form-grid"><div class="field-row"><div class="field"><label for="selectionMeetingDate">Data</label><input id="selectionMeetingDate" class="input" type="date" value="${escapeHtml(date)}"></div><div class="field"><label for="selectionMeetingTime">Horário</label><input id="selectionMeetingTime" class="input" type="time" value="${escapeHtml(time)}"></div></div><div class="field"><label for="selectionMeetingDuration">Duração</label><select id="selectionMeetingDuration" class="select">${[30,45,60,90].map(v=>`<option value="${v}" ${duration===v?'selected':''}>${v} min</option>`).join('')}</select></div><div class="field"><label for="selectionMeetingLink">Link da reunião</label><input id="selectionMeetingLink" class="input" type="url" inputmode="url" value="${escapeHtml(link)}" placeholder="https://meet.google.com/..."></div><div class="field"><label for="selectionMeetingNotes">Detalhes</label><textarea id="selectionMeetingNotes" class="textarea" placeholder="Orientações para a reunião">${escapeHtml(notes)}</textarea></div></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${safe(p.id)}'),'account')">Cancelar</button><button id="selectionMeetingSave" class="btn btn-primary" type="button" onclick="saveSelectionMeeting('${safe(p.id)}')"><i class="fa-solid fa-check"></i>Salvar reunião</button></div>`);
  };
  window.saveSelectionMeeting=async function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id),date=document.getElementById('selectionMeetingDate')?.value||'',time=document.getElementById('selectionMeetingTime')?.value||'',duration=Number(document.getElementById('selectionMeetingDuration')?.value)||30,link=document.getElementById('selectionMeetingLink')?.value.trim()||'',notes=document.getElementById('selectionMeetingNotes')?.value.trim()||'',button=document.getElementById('selectionMeetingSave');if(!p)return;
    if(!date||!time)return showToast('Informe a data e o horário da reunião.');if(link&&!validUrl(link))return showToast('Informe um link de reunião válido.');
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...'}
    try{await window.OleiroServices.applications.scheduleSelectionMeeting(p.id,{date,time,duration,link,notes});Object.assign(p,{meetingStatus:'scheduled',meetingDate:date,meetingTime:time,meetingDuration:duration,meetingLink:link,meetingNotes:notes});renderPersonModal(p,'account');showToast('Reunião agendada.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível agendar a reunião.');if(button?.isConnected){button.disabled=false;button.textContent='Salvar reunião'}}
  };

  window.requestCompleteSelectionMeeting=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p||p.status!=='meeting'||p.meetingStatus!=='scheduled')return;
    openModal('Marcar reunião como realizada?','Depois disso a decisão final ficará disponível em Conta.',`<div class="notice"><i class="fa-solid fa-circle-check"></i><div>Confirme somente depois que a reunião de definição tiver acontecido.</div></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${safe(p.id)}'),'account')">Cancelar</button><button id="selectionMeetingComplete" class="btn btn-primary" type="button" onclick="confirmCompleteSelectionMeeting('${safe(p.id)}')">Confirmar</button></div>`);
  };
  window.confirmCompleteSelectionMeeting=async function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id),button=document.getElementById('selectionMeetingComplete');if(!p)return;if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Confirmando...'}
    try{await window.OleiroServices.applications.completeSelectionMeeting(p.id);p.meetingStatus='completed';p.meetingCompletedAt=new Date().toISOString();renderPersonModal(p,'account');showToast('Reunião marcada como realizada.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível concluir a reunião.');if(button?.isConnected){button.disabled=false;button.textContent='Confirmar'}}
  };

  window.requestFinalSelectionDecision=function(encodedId,decision){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p||p.status!=='meeting'||p.meetingStatus!=='completed')return;
    if(decision==='approve'){
      openModal('Aprovar candidato?','Esta é a aprovação final do processo.',`<div class="notice"><i class="fa-solid fa-circle-check"></i><div>O perfil passará para Aprovado e as atividades confirmadas entrarão na Agenda da Casa.</div></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${safe(p.id)}'),'account')">Cancelar</button><button id="finalSelectionApprove" class="btn btn-primary" type="button" onclick="confirmFinalSelectionDecision('${safe(p.id)}','approve')">Aprovar candidato</button></div>`);return;
    }
    openModal('Não aprovar candidato?','O motivo abaixo é interno e não será exibido no portal do candidato.',`<div class="notice warning"><i class="fa-solid fa-user-slash"></i><div>O acesso será inativado e as atividades ficarão recusadas, sem aparecer na Agenda.</div></div><div class="field" style="margin-top:12px"><label for="finalSelectionReason">Motivo interno da não aprovação</label><textarea id="finalSelectionReason" class="textarea" placeholder="Registre o motivo para o histórico administrativo."></textarea></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${safe(p.id)}'),'account')">Cancelar</button><button id="finalSelectionReject" class="btn btn-danger" type="button" onclick="confirmFinalSelectionDecision('${safe(p.id)}','reject')">Não aprovar</button></div>`);
  };
  window.confirmFinalSelectionDecision=async function(encodedId,decision){
    const id=decodeURIComponent(encodedId),p=candidateById(id),reason=decision==='reject'?(document.getElementById('finalSelectionReason')?.value.trim()||''):'',button=document.getElementById(decision==='approve'?'finalSelectionApprove':'finalSelectionReject');if(!p)return;if(decision==='reject'&&!reason)return showToast('Informe o motivo interno da não aprovação.');if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Confirmando...'}
    try{
      const result=await window.OleiroServices.applications.finalizeSelection(p.id,{decision,reason,participantUids:p.participantUids||[],managerUid:state.currentSession?.uid||''});
      Object.assign(p,{status:result.status,active:result.active,inactive:!result.active,rejectedReason:result.rejectedReason||'',finalDecision:result.status==='approved'?'approved':'rejected',finalDecisionAt:new Date().toISOString()});
      clearAdminPlanningCaches(p.id);invalidateManagerScheduleCache?.();invalidateManagerPendingChanges?.();renderPersonModal(p,'account');showToast(result.status==='approved'?'Candidato aprovado.':'Candidato não aprovado e perfil inativado.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível concluir a decisão.');if(button?.isConnected){button.disabled=false;button.textContent=decision==='approve'?'Aprovar candidato':'Não aprovar'}}
  };

  /* Limpeza é destrutiva: depois do backend, invalida todos os caches e faz 1 refresh direcionado da página atual. */
  window.confirmResetPlanning=async function(id){
    const p=candidateById(id),button=document.getElementById('resetPlanningConfirm');if(!p)return;
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Limpando...'}
    try{
      const result=await window.OleiroServices.applications.resetPlanning(p.id,{deadlineDays:7,participantUids:p.participantUids||[]});
      Object.assign(p,{status:'pending',inactive:false,active:true,activities:0,sessions:0,submitted:'—',dayAdjustments:{},pendingUntil:result.planningDeadlineAt,meetingStatus:null,meetingDate:null,meetingTime:'',meetingLink:'',meetingNotes:''});
      clearAdminPlanningCaches(p.id);invalidateManagerScheduleCache?.();
      if(typeof hydrateCandidatePlanning==='function')await hydrateCandidatePlanning(p.id,{force:true});
      renderPersonModal(p,'plan');showToast('Planejamento limpo.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível limpar o planejamento.');if(button?.isConnected){button.disabled=false;button.textContent='Limpar'}}
  };

  window.renderPersonModal=renderPersonModal;
})();
