/* Admin — editor de datas simples, reset de teste e status de agenda enxutos. */
(function round7Admin(){
  window.syncStayDateNative=function(){
    const from=document.getElementById('editStayFrom');
    const to=document.getElementById('editStayTo');
    if(!from||!to)return;
    to.min=from.value||'';
    if(from.value&&to.value&&to.value<from.value)to.value='';
  };

  openStayDateEditor=function(id){
    const p=candidateById(id);if(!p)return;
    const body=`<div class="stay-date-editor-native">
      <div class="stay-date-field-native">
        <label for="editStayFrom">Chegada</label>
        <input id="editStayFrom" class="stay-date-input-native" type="date" value="${escapeHtml(p.from||'')}" onchange="syncStayDateNative()" oninput="syncStayDateNative()">
      </div>
      <div class="stay-date-field-native">
        <label for="editStayTo">Saída</label>
        <input id="editStayTo" class="stay-date-input-native" type="date" value="${escapeHtml(p.to||'')}" onchange="syncStayDateNative()" oninput="syncStayDateNative()">
      </div>
    </div>`;
    openModal('Editar datas','',body,`<button id="stayDateSaveButton" class="btn btn-primary btn-block" type="button" onclick='saveStayDatesWithFeedback(${JSON.stringify(String(id))})'>Salvar período</button>`);
    modalRoot.querySelector('.modal')?.classList.add('stay-date-modal-native');
    requestAnimationFrame(syncStayDateNative);
  };

  window.saveStayDatesWithFeedback=async function(id){
    const button=document.getElementById('stayDateSaveButton');
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Verificando...'}
    await saveStayDates(id);
    if(button?.isConnected){button.disabled=false;button.textContent='Salvar período'}
  };

  const baseConfirmStayDates=confirmStayDates;
  confirmStayDates=async function(id,from,to){
    const button=[...modalRoot.querySelectorAll('.btn-danger')].find(item=>/Alterar e remover/i.test(item.textContent||''));
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Alterando...'}
    try{return await baseConfirmStayDates(id,from,to)}finally{
      if(button?.isConnected){button.disabled=false;button.textContent='Alterar e remover'}
    }
  };

  agendaItem=function(name,person,group,status,period='Sem preferência',duration=0){
    const [label,type]=statusMeta(status),showStatus=status!=='confirmed';
    return `<div class="list-item"><div class="item-main"><h3 data-no-i18n>${escapeHtml(name||'Atividade')}</h3><p>${Number(duration)||0} min • ${escapeHtml(period)} • ${escapeHtml(person||'Voluntário')} • ${escapeHtml(group||'A definir')}</p>${showStatus?`<div class="item-meta">${badge(label,type)}</div>`:''}</div></div>`;
  };

  const baseCandidatePlanContent=candidatePlanContent;
  candidatePlanContent=function(p){
    const content=baseCandidatePlanContent(p);
    if(!candidatePlanningCache(p.id)||!content.includes('planning-admin-footer'))return content;
    const arg=encodeURIComponent(String(p.id));
    const reset=`<button class="btn btn-outline planning-reset-button" type="button" onclick="requestResetPlanning(decodeURIComponent('${arg}'))"><i class="fa-solid fa-arrow-rotate-left"></i>Reiniciar planejamento</button>`;
    const marker='<div class="planning-admin-footer">',start=content.lastIndexOf(marker),end=start>=0?content.indexOf('</div>',start):-1;
    if(start<0||end<0)return content;
    return `${content.slice(0,end)}${reset}${content.slice(end)}`;
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
      const result=await window.OleiroServices.applications.resetPlanning(p.id,{deadlineDays:7,participantUids:p.participantUids||[]});
      p.status='pending';p.inactive=false;p.activities=0;p.sessions=0;p.submitted='—';p.dayAdjustments={};p.pendingUntil=result.planningDeadlineAt;
      const emptyCache={activities:[],sessions:[],at:Date.now()};
      state.candidatePlanningCache[String(p.id)]=emptyCache;applyCandidatePlanningCache(p.id,emptyCache);
      if(typeof invalidateManagerScheduleCache==='function')invalidateManagerScheduleCache();
      renderPersonModal(p,'plan');showToast('Planejamento reiniciado.');
    }catch(error){
      console.error(error);showToast(error?.message||'Não foi possível reiniciar o planejamento.');
      if(button){button.disabled=false;button.textContent='Reiniciar'}
    }
  };
})();
