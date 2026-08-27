/* Round 20 — acabamento da lista, Conta, Agenda e revisão de planejamento sem leituras adicionais. */
(function refinementsR20Admin(){
  function safe(value){return encodeURIComponent(String(value??''))}

  /* Lista: prazo fica ao lado de Em preparação. Mudanças e ajustes permanecem amarelos. */
  personCompact=function(p){
    const meta=p.status==='pending'&&typeof candidateDeadlineMeta==='function'?candidateDeadlineMeta(p):null;
    const changeIds=typeof adjustmentCandidateIds==='function'?adjustmentCandidateIds():new Set();
    const hasPendingChange=changeIds.has(String(p.id));
    let [label,type]=statusMeta(p.status);
    if(hasPendingChange&&p.status==='approved'){label='Mudança solicitada';type='warning'}
    else if(p.status==='adjustments')type='warning';
    const inactive=p.inactive&&p.status!=='rejected'?badge('Inativo','danger'):'';
    const deadline=meta?`<span class="candidate-deadline-inline"><i class="fa-regular fa-clock"></i>${escapeHtml(meta.label)}</span>`:'';
    const period=p.from&&p.to?`${fmtDate(p.from,true)}–${fmtDate(p.to,true)}`:'Período não informado';
    const id=typeof candidateActionArg==='function'?candidateActionArg(p.id):safe(p.id);
    const initials=String(p.name||'V').split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('');
    return `<div class="list-item clickable" onclick="openPerson(decodeURIComponent('${id}'))"><div class="avatar">${escapeHtml(initials)}</div><div class="item-main"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.country||'—')} • ${escapeHtml(p.unit||'—')} • ${period}</p><div class="item-meta candidate-status-row">${badge(label,type)}${deadline}${inactive}</div></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);margin-top:11px"></i></div>`;
  };

  function canManagerCreateActivity(p){return !!p&&!p.inactive&&p.status!=='rejected'}
  function injectManagerActivityButtons(p,tab){
    if(tab!=='plan'||!canManagerCreateActivity(p))return;
    modalRoot.querySelectorAll('details.planning-day-card[data-plan-date]').forEach(card=>{
      const date=card.dataset.planDate,content=card.querySelector('.planning-day-content');
      if(!date||!content||content.querySelector('.admin-create-activity-action'))return;
      content.insertAdjacentHTML('beforeend',`<div class="admin-create-activity-action"><button class="btn btn-soft btn-block" type="button" onclick="openAdminPlanningActivity('${safe(p.id)}','${safe(date)}')"><i class="fa-solid fa-plus"></i>Adicionar atividade</button></div>`);
    });
  }

  /* Conta: exclusão é feita pelo utilitário administrativo do Cloud Shell.
     Editar e-mail também sai da interface enquanto não há backend privilegiado publicado. */
  const baseRenderPersonModal=renderPersonModal;
  renderPersonModal=function(p,tab='plan'){
    const result=baseRenderPersonModal(p,tab);
    if((tab==='account'||modalRoot.dataset.personTab==='account')&&p){
      modalRoot.querySelector('.account-danger-zone')?.remove();
      modalRoot.querySelectorAll('button[onclick*="requestVolunteerEmailEdit"]').forEach(button=>button.remove());
    }
    injectManagerActivityButtons(p,tab);
    return result;
  };

  window.openAdminPlanningActivity=function(encodedId,encodedDate){
    const id=decodeURIComponent(encodedId),date=decodeURIComponent(encodedDate),p=candidateById(id);
    if(!p||!canManagerCreateActivity(p))return showToast('Este cadastro não permite novas atividades.');
    const eligible=typeof planningEligibleDates==='function'?planningEligibleDates(String(p.stayStart||p.from||'').slice(0,10),String(p.stayEnd||p.to||'').slice(0,10)):[];
    if(!eligible.includes(date))return showToast('Esse dia não está disponível para atividade.');
    const body=`<div class="form-grid manager-activity-form"><div class="field"><label for="managerActName">Nome da atividade</label><input id="managerActName" class="input" placeholder="Ex.: Conversação em espanhol"></div><div class="field"><label for="managerActDesc">Descrição</label><textarea id="managerActDesc" class="textarea" placeholder="Como a atividade será realizada?"></textarea></div><div class="field-row"><div class="field"><label for="managerActDuration">Duração (min)</label><input id="managerActDuration" class="input" type="number" min="15" max="240" step="15" value="60"></div><div class="field"><label for="managerActParticipation">Grupo / quantidade</label><input id="managerActParticipation" class="input" placeholder="Ex.: Todos / até 20"></div></div><div class="field-row"><div class="field"><label for="managerActPeriod">Período</label><select id="managerActPeriod" class="select"><option>Manhã</option><option>Tarde</option><option>Noite</option><option selected>Sem preferência</option></select></div><div class="field"><label for="managerActTime">Horário</label><input id="managerActTime" class="input" type="time" value="15:15"></div></div><div class="field"><label for="managerActMaterials">Materiais necessários</label><input id="managerActMaterials" class="input" placeholder="Nenhum, cartolina, bola..."></div><div class="field"><label for="managerActNotes">Observações</label><textarea id="managerActNotes" class="textarea" placeholder="Opcional"></textarea></div><div class="manager-activity-date"><i class="fa-regular fa-calendar"></i><span>${escapeHtml(dayName(date))} • ${escapeHtml(fmtDate(date,true))}</span></div></div>`;
    const footer=`<button class="btn btn-primary btn-block" id="managerActSave" type="button" onclick="saveAdminPlanningActivity('${safe(p.id)}','${safe(date)}')"><i class="fa-solid fa-check"></i>Adicionar ao planejamento</button>`;
    openModal('Nova atividade',p.status==='approved'?'Criada pela gestão e confirmada diretamente na agenda.':'Criada pela gestão e visível para o candidato no planejamento.',body,footer);
    modalRoot.querySelector('.modal')?.classList.add('activity-modal','manager-activity-modal');
  };

  function updateAdminPlanCacheAfterCreate(p,date,result){
    const activity={...(result.activity||{}),id:String(result.activityId),dates:[date]};
    const rows=(result.sessions||[]).map(row=>({...row,activity}));
    Object.entries(state.adminPlanPageCache||{}).forEach(([key,cache])=>{
      if(!key.startsWith(`${p.id}|`)||!Array.isArray(cache?.dates)||!cache.dates.includes(date))return;
      cache.activities=cache.activities||[];
      if(!cache.activities.some(item=>String(item.id)===String(activity.id)))cache.activities.push(activity);
      cache.sessions=(cache.sessions||[]).concat(rows).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
      cache.at=Date.now();
    });
    p.activities=(Number(p.activities)||0)+1;
    p.sessions=(Number(p.sessions)||0)+rows.length;
  }

  window.saveAdminPlanningActivity=async function(encodedId,encodedDate){
    const id=decodeURIComponent(encodedId),date=decodeURIComponent(encodedDate),p=candidateById(id),button=document.getElementById('managerActSave');
    if(!p)return showToast('Cadastro não encontrado.');
    const data={
      name:document.getElementById('managerActName')?.value.trim()||'',
      description:document.getElementById('managerActDesc')?.value.trim()||'',
      duration:Number(document.getElementById('managerActDuration')?.value)||60,
      participation:document.getElementById('managerActParticipation')?.value.trim()||'Livre',
      materials:document.getElementById('managerActMaterials')?.value.trim()||'Nenhum',
      notes:document.getElementById('managerActNotes')?.value.trim()||'',
      period:document.getElementById('managerActPeriod')?.value||'Sem preferência',
      time:document.getElementById('managerActTime')?.value||''
    };
    if(!data.name)return showToast('Informe o nome da atividade.');
    if(data.duration<15||data.duration>240)return showToast('Informe uma duração entre 15 e 240 minutos.');
    const uid=state.currentSession?.uid;if(!uid)return showToast('Sessão administrativa inválida.');
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...'}
    try{
      const result=await window.OleiroServices.planning.saveActivity({
        applicationId:p.id,
        unitId:p.unitId||String(p.unit||'').toLowerCase(),
        createdByUid:uid,
        ownerName:p.name||'Voluntário',
        data,
        dates:[date],
        existingSessions:[],
        postApprovalProposal:false,
        sessionStatus:p.status==='approved'?'confirmed':'proposed',
        updateApplicationCounts:true
      });
      updateAdminPlanCacheAfterCreate(p,date,result);
      renderPersonModal(p,'plan');
      const target=modalRoot.querySelector(`details[data-plan-date="${CSS.escape(date)}"]`);if(target)target.open=true;
      showToast(p.status==='approved'?'Atividade criada e confirmada.':'Atividade adicionada ao planejamento.');
    }catch(error){
      console.error(error);showToast(error?.message||'Não foi possível criar a atividade.');
      if(button?.isConnected){button.disabled=false;button.innerHTML='<i class="fa-solid fa-check"></i>Adicionar ao planejamento'}
    }
  };

  /* Usa somente as sessões já carregadas da página atual para definir o estado visual do dia. */
  const baseAdminPlanningDayCard=adminPlanningDayCard;
  function reviewState(day){
    const sessions=day?.sessions||[];
    return {
      hasChange:sessions.some(session=>session.status==='change_requested'),
      hasProposal:sessions.some(session=>session.postApprovalProposal===true&&session.reviewStatus==='analysis')
    };
  }
  function reviewBadges(hasProposal,hasChange){
    const parts=[];
    if(hasProposal)parts.push('<span class="badge info day-review-badge">Nova atividade</span>');
    if(hasChange)parts.push('<span class="badge warning day-review-badge">Mudança solicitada</span>');
    return parts.length===2?`${parts[0]}<span class="day-review-plus" aria-hidden="true">+</span>${parts[1]}`:parts.join('');
  }
  adminPlanningDayCard=function(p,day){
    let html=baseAdminPlanningDayCard(p,day);
    const {hasChange,hasProposal}=reviewState(day);
    if(!hasChange&&!hasProposal)return html;
    const tone=hasChange?'review-day-warning':'review-day-info';
    if(!html.includes(tone))html=html.replace('class="card planning-day-card','class="card planning-day-card '+tone);
    const tags=reviewBadges(hasProposal,hasChange),marker='<div class="planning-day-date">',start=html.indexOf(marker);
    if(start>=0&&!html.includes('day-review-summary')){
      const strongEnd=html.indexOf('</strong>',start);
      if(strongEnd>=0){const at=strongEnd+'</strong>'.length;html=`${html.slice(0,at)}<span class="day-review-summary">${tags}</span>${html.slice(at)}`}
    }
    return html;
  };

  window.personCompact=personCompact;
  window.renderPersonModal=renderPersonModal;
  window.adminPlanningDayCard=adminPlanningDayCard;
})();