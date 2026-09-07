/* Round 20/22 — acabamento da lista, Conta e gestão completa do planejamento sem leituras redundantes. */
(function refinementsR20Admin(){
  function safe(value){return encodeURIComponent(String(value??''))}
  function groupOptions(selected=''){return ['A','B','C','D','Livre'].map(group=>`<option value="${group}" ${String(selected)===group?'selected':''}>${group==='Livre'?'Livre':`Grupo ${group}`}</option>`).join('')}
  function participationForGroup(group){return group==='Livre'?'Livre':`Grupo ${group}`}

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
  function findAdminSession(applicationId,sessionId){
    const direct=(state.sessions||[]).find(row=>String(row.id)===String(sessionId)&&String(row.applicationId||applicationId)===String(applicationId));if(direct)return direct;
    for(const [key,cache] of Object.entries(state.adminPlanPageCache||{})){
      if(!key.startsWith(`${applicationId}|`))continue;
      const row=(cache?.sessions||[]).find(item=>String(item.id)===String(sessionId));if(row)return row;
    }
    return null;
  }
  function sessionFormBody(session=null,date=''){
    const a=session?.activity||{},group=session?.groupId||'Livre';
    const period=activityPeriodValue(session||{},a);return `<div class="form-grid manager-activity-form"><div class="field"><label for="managerActName">Nome da atividade</label><input id="managerActName" class="input" value="${escapeHtml(session?.activityName||a.name||'')}" placeholder="Ex.: Conversação em espanhol"></div><div class="field"><label for="managerActDesc">Descrição</label><textarea id="managerActDesc" class="textarea" placeholder="Como a atividade será realizada?">${escapeHtml(session?.activityDescription||a.description||'')}</textarea></div><div class="field-row"><div class="field"><label for="managerActDuration">Duração estimada</label><input id="managerActDuration" class="input" type="number" min="15" max="240" step="15" value="${Number(session?.duration||a.duration)||60}"></div><div class="field"><label for="managerActGroup">Grupo</label><select id="managerActGroup" class="select">${groupOptions(group)}</select></div></div><div class="field"><label for="managerActPeriod">Período</label><select id="managerActPeriod" class="select">${['Sem preferência','Manhã','Tarde','Noite'].map(value=>`<option ${period===value?'selected':''}>${value}</option>`).join('')}</select></div><div class="field"><label for="managerActMaterials">Materiais necessários</label><input id="managerActMaterials" class="input" value="${escapeHtml(session?.materials||a.materials||'')}" placeholder="Nenhum, cartolina, bola..."></div><div class="field"><label for="managerActNotes">Observações</label><textarea id="managerActNotes" class="textarea" placeholder="Opcional">${escapeHtml(session?.notes||a.notes||'')}</textarea></div>${date?`<div class="manager-activity-date"><i class="fa-regular fa-calendar"></i><span>${escapeHtml(dayName(date))} • ${escapeHtml(fmtDate(date,true))}</span></div>`:''}</div>`;
  }
  function readManagerActivityForm(){
    const group=document.getElementById('managerActGroup')?.value||'Livre';
    return {name:document.getElementById('managerActName')?.value.trim()||'',description:document.getElementById('managerActDesc')?.value.trim()||'',duration:Number(document.getElementById('managerActDuration')?.value)||60,groupId:group,participation:participationForGroup(group),materials:document.getElementById('managerActMaterials')?.value.trim()||'Nenhum',notes:document.getElementById('managerActNotes')?.value.trim()||'',period:document.getElementById('managerActPeriod')?.value||'Sem preferência'};
  }
  function validateManagerActivity(data){if(!data.name){showToast('Informe o nome da atividade.');return false}if(data.duration<15||data.duration>240){showToast('Informe uma duração entre 15 e 240 minutos.');return false}return true}

  function updateSessionEverywhere(applicationId,sessionId,patch){
    const apply=row=>{Object.assign(row,patch);if(row.activity){Object.assign(row.activity,{name:patch.activityName??row.activity.name,description:patch.activityDescription??row.activity.description,duration:patch.duration??row.activity.duration,participation:patch.participation??row.activity.participation,materials:patch.materials??row.activity.materials,notes:patch.notes??row.activity.notes,period:patch.period??row.activity.period,time:patch.time??row.activity.time})}};
    (state.sessions||[]).filter(row=>String(row.id)===String(sessionId)).forEach(apply);
    Object.entries(state.adminPlanPageCache||{}).forEach(([key,cache])=>{if(!key.startsWith(`${applicationId}|`))return;(cache?.sessions||[]).filter(row=>String(row.id)===String(sessionId)).forEach(apply)});
  }
  function removeSessionEverywhere(applicationId,sessionId,activityId,deletedActivity){
    state.sessions=(state.sessions||[]).filter(row=>String(row.id)!==String(sessionId));
    Object.entries(state.adminPlanPageCache||{}).forEach(([key,cache])=>{
      if(!key.startsWith(`${applicationId}|`))return;
      cache.sessions=(cache.sessions||[]).filter(row=>String(row.id)!==String(sessionId));
      if(deletedActivity)cache.activities=(cache.activities||[]).filter(row=>String(row.id)!==String(activityId));
      cache.at=Date.now();
    });
  }
  function sessionsOnAdminDate(applicationId,date){
    for(const [key,cache] of Object.entries(state.adminPlanPageCache||{})){if(key.startsWith(`${applicationId}|`)&&Array.isArray(cache?.dates)&&cache.dates.includes(date))return (cache.sessions||[]).filter(row=>String(row.date)===String(date))}
    return (state.sessions||[]).filter(row=>String(row.applicationId)===String(applicationId)&&String(row.date)===String(date));
  }

  function managementActions(p,session,date){
    if(!session?.id||session.postApprovalProposal===true||session.status==='change_requested')return '';
    const app=safe(p.id),sid=safe(session.id),day=safe(date),adjust=p.status!=='approved'?`<button class="btn btn-soft btn-xs" type="button" onclick="requestAdminPlanningAdjustment('${app}','${sid}','${day}')"><i class="fa-solid fa-rotate"></i>Ajustar</button>`:'';
    return `<div class="admin-session-manage-actions"><button class="btn btn-outline btn-xs" type="button" onclick="openAdminEditPlanningSession('${app}','${sid}','${day}')"><i class="fa-solid fa-pen"></i>Editar</button>${adjust}<button class="btn btn-danger-soft btn-xs" type="button" onclick="requestAdminDeletePlanningSession('${app}','${sid}','${day}')"><i class="fa-solid fa-trash"></i>Excluir</button></div>`;
  }

  function injectManagerActivityButtons(p,tab){
    if(tab!=='plan'||!canManagerCreateActivity(p))return;
    modalRoot.querySelectorAll('details.planning-day-card[data-plan-date]').forEach(card=>{
      const date=card.dataset.planDate,content=card.querySelector('.planning-day-content');if(!date||!content)return;
      content.querySelectorAll('.planning-day-adjust-action').forEach(node=>node.remove());
      if(!content.querySelector('.admin-create-activity-action'))content.insertAdjacentHTML('beforeend',`<div class="admin-create-activity-action"><button class="btn btn-soft btn-block" type="button" onclick="openAdminPlanningActivity('${safe(p.id)}','${safe(date)}')"><i class="fa-solid fa-plus"></i>Adicionar atividade</button></div>`);
    });
  }

  /* Conta: exclusão é feita pelo utilitário administrativo do Cloud Shell. */
  const baseRenderPersonModal=renderPersonModal;
  renderPersonModal=function(p,tab='plan'){
    const result=baseRenderPersonModal(p,tab);
    if((tab==='account'||modalRoot.dataset.personTab==='account')&&p){modalRoot.querySelector('.account-danger-zone')?.remove();modalRoot.querySelectorAll('button[onclick*="requestVolunteerEmailEdit"]').forEach(button=>button.remove())}
    injectManagerActivityButtons(p,tab);return result;
  };

  window.openAdminPlanningActivity=function(encodedId,encodedDate){
    const id=decodeURIComponent(encodedId),date=decodeURIComponent(encodedDate),p=candidateById(id);if(!p||!canManagerCreateActivity(p))return showToast('Este cadastro não permite novas atividades.');
    const eligible=typeof planningEligibleDates==='function'?planningEligibleDates(String(p.stayStart||p.from||'').slice(0,10),String(p.stayEnd||p.to||'').slice(0,10)):[];if(!eligible.includes(date))return showToast('Esse dia não está disponível para atividade.');
    openModal('Nova atividade','Criada pela gestão e confirmada diretamente no planejamento.',sessionFormBody(null,date),`<button class="btn btn-primary btn-block" id="managerActSave" type="button" onclick="saveAdminPlanningActivity('${safe(p.id)}','${safe(date)}')"><i class="fa-solid fa-check"></i>Adicionar ao planejamento</button>`);modalRoot.querySelector('.modal')?.classList.add('activity-modal','manager-activity-modal');
  };
  function updateAdminPlanCacheAfterCreate(p,date,result){
    const activity={...(result.activity||{}),id:String(result.activityId),dates:[date]},rows=(result.sessions||[]).map(row=>({...row,activity}));
    Object.entries(state.adminPlanPageCache||{}).forEach(([key,cache])=>{if(!key.startsWith(`${p.id}|`)||!Array.isArray(cache?.dates)||!cache.dates.includes(date))return;cache.activities=cache.activities||[];if(!cache.activities.some(item=>String(item.id)===String(activity.id)))cache.activities.push(activity);cache.sessions=(cache.sessions||[]).concat(rows).sort(activityScheduleCompare);cache.at=Date.now()});
    p.activities=(Number(p.activities)||0)+1;p.sessions=(Number(p.sessions)||0)+rows.length;p.planningCountVersion=1;
  }
  window.saveAdminPlanningActivity=async function(encodedId,encodedDate){
    const id=decodeURIComponent(encodedId),date=decodeURIComponent(encodedDate),p=candidateById(id),button=document.getElementById('managerActSave');if(!p)return showToast('Cadastro não encontrado.');const data=readManagerActivityForm();if(!validateManagerActivity(data))return;const uid=state.currentSession?.uid;if(!uid)return showToast('Sessão administrativa inválida.');if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...'}
    try{const result=await window.OleiroServices.planning.saveActivity({applicationId:p.id,unitId:p.unitId||String(p.unit||'').toLowerCase(),createdByUid:uid,ownerName:p.name||'Voluntário',data,dates:[date],existingSessions:[],postApprovalProposal:false,sessionStatus:'confirmed',groupId:data.groupId,managerCreated:true,updateApplicationCounts:true});updateAdminPlanCacheAfterCreate(p,date,result);renderPersonModal(p,'plan');const target=modalRoot.querySelector(`details[data-plan-date="${CSS.escape(date)}"]`);if(target)target.open=true;showToast('Atividade criada e confirmada.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível criar a atividade.');if(button?.isConnected){button.disabled=false;button.innerHTML='<i class="fa-solid fa-check"></i>Adicionar ao planejamento'}}
  };

  window.openAdminEditPlanningSession=function(encodedId,encodedSessionId,encodedDate){
    const id=decodeURIComponent(encodedId),sessionId=decodeURIComponent(encodedSessionId),date=decodeURIComponent(encodedDate),p=candidateById(id),session=findAdminSession(id,sessionId);if(!p||!session)return showToast('Atividade não encontrada.');
    openModal('Editar atividade',`${escapeHtml(dayName(date))} • ${escapeHtml(fmtDate(date,true))}`,sessionFormBody(session,date),`<button id="managerEditSave" class="btn btn-primary btn-block" type="button" onclick="saveAdminEditPlanningSession('${safe(id)}','${safe(sessionId)}','${safe(date)}')"><i class="fa-solid fa-check"></i>Salvar alterações</button>`);modalRoot.querySelector('.modal')?.classList.add('activity-modal','manager-activity-modal');
  };
  window.saveAdminEditPlanningSession=async function(encodedId,encodedSessionId,encodedDate){
    const id=decodeURIComponent(encodedId),sessionId=decodeURIComponent(encodedSessionId),date=decodeURIComponent(encodedDate),p=candidateById(id),session=findAdminSession(id,sessionId),button=document.getElementById('managerEditSave');if(!p||!session)return showToast('Atividade não encontrada.');const data=readManagerActivityForm();if(!validateManagerActivity(data))return;if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...'}
    try{const patch=await window.OleiroServices.planning.managerUpdateSession({sessionId,activityId:session.activityId,patch:{activityName:data.name,activityDescription:data.description,duration:data.duration,participation:data.participation,materials:data.materials,notes:data.notes,period:data.period,groupId:data.groupId}});updateSessionEverywhere(id,sessionId,patch);renderPersonModal(p,'plan');const target=modalRoot.querySelector(`details[data-plan-date="${CSS.escape(date)}"]`);if(target)target.open=true;showToast('Atividade atualizada.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível editar a atividade.');if(button?.isConnected){button.disabled=false;button.textContent='Salvar alterações'}}
  };

  window.requestAdminPlanningAdjustment=function(encodedId,encodedSessionId,encodedDate){
    const id=decodeURIComponent(encodedId),sessionId=decodeURIComponent(encodedSessionId),date=decodeURIComponent(encodedDate),p=candidateById(id),session=findAdminSession(id,sessionId);if(!p||!session||p.status==='approved')return;const name=session.activityName||session.activity?.name||'Atividade';
    openModal('Solicitar ajuste',`${escapeHtml(name)} • ${escapeHtml(fmtDate(date,true))}`,`<div class="field"><label for="adminSessionAdjustNote">Orientação ao candidato</label><textarea id="adminSessionAdjustNote" class="textarea" placeholder="Ex.: alterar o período ou reduzir a duração estimada..."></textarea></div>`,`<button id="adminSessionAdjustSave" class="btn btn-primary btn-block" type="button" onclick="saveAdminPlanningAdjustment('${safe(id)}','${safe(date)}')">Enviar ajuste</button>`);
  };
  window.saveAdminPlanningAdjustment=async function(encodedId,encodedDate){
    const id=decodeURIComponent(encodedId),date=decodeURIComponent(encodedDate),p=candidateById(id),note=document.getElementById('adminSessionAdjustNote')?.value.trim()||'',button=document.getElementById('adminSessionAdjustSave');if(!p||!note)return showToast('Informe o ajuste solicitado.');if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...'}
    try{await window.OleiroServices.applications.requestDayAdjustment(p.id,date,note);p.status='adjustments';p.dayAdjustments=p.dayAdjustments||{};p.dayAdjustments[date]={note,status:'requested'};p.pendingUntil=typeof candidateDeadlineFrom==='function'?candidateDeadlineFrom(new Date(),7):p.pendingUntil;renderPersonModal(p,'plan');const target=modalRoot.querySelector(`details[data-plan-date="${CSS.escape(date)}"]`);if(target)target.open=true;showToast('Ajuste solicitado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível solicitar o ajuste.');if(button?.isConnected){button.disabled=false;button.textContent='Enviar ajuste'}}
  };

  window.requestAdminDeletePlanningSession=function(encodedId,encodedSessionId,encodedDate){
    const id=decodeURIComponent(encodedId),sessionId=decodeURIComponent(encodedSessionId),date=decodeURIComponent(encodedDate),p=candidateById(id),session=findAdminSession(id,sessionId);if(!p||!session)return showToast('Atividade não encontrada.');const name=session.activityName||session.activity?.name||'Atividade';
    openModal('Excluir atividade?',`${escapeHtml(name)} • ${escapeHtml(fmtDate(date,true))}`,`<div class="notice warning"><i class="fa-solid fa-trash"></i><div>Esta sessão será removida do planejamento. Se for a única ocorrência da atividade, o cadastro da atividade também será excluído.</div></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${escapeHtml(String(id))}'),'plan')">Cancelar</button><button id="adminSessionDeleteConfirm" class="btn btn-danger" type="button" onclick="confirmAdminDeletePlanningSession('${safe(id)}','${safe(sessionId)}','${safe(date)}')">Excluir</button></div>`);
  };
  window.confirmAdminDeletePlanningSession=async function(encodedId,encodedSessionId,encodedDate){
    const id=decodeURIComponent(encodedId),sessionId=decodeURIComponent(encodedSessionId),date=decodeURIComponent(encodedDate),p=candidateById(id),session=findAdminSession(id,sessionId),button=document.getElementById('adminSessionDeleteConfirm');if(!p||!session)return showToast('Atividade não encontrada.');if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Excluindo...'}
    const knownCounts=p.planningCountVersion===1?{sessionCount:Number(p.sessions)||0,activityCount:Number(p.activities)||0}:null;let planningStatePatch=null;
    if(p.status==='adjustments'){
      const remainingOnDate=sessionsOnAdminDate(id,date).filter(row=>String(row.id)!==String(sessionId)),nextAdjustments={...(p.dayAdjustments||{})};if(!remainingOnDate.length)delete nextAdjustments[date];const requested=Object.keys(nextAdjustments).filter(key=>!nextAdjustments[key]?.status||nextAdjustments[key]?.status==='requested');planningStatePatch={dayAdjustments:nextAdjustments,planningSubmittedAt:null,status:requested.length?'adjustments':'pending'};
    }
    try{const result=await window.OleiroServices.planning.deleteSession(sessionId,{applicationId:id,activityId:session.activityId,knownCounts,updateApplicationCounts:true,planningStatePatch,resetPlanningWhenEmpty:true});removeSessionEverywhere(id,sessionId,session.activityId,result.deletedActivity);p.sessions=Number(result.sessionCount)||0;p.activities=Number(result.activityCount)||0;p.planningCountVersion=1;if(result.planningStatePatch){Object.assign(p,result.planningStatePatch);p.submitted='—'}if(result.resetPlanning===true){p.status='pending';p.dayAdjustments={};p.submitted='—'}renderPersonModal(p,'plan');showToast('Atividade excluída.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível excluir a atividade.');if(button?.isConnected){button.disabled=false;button.textContent='Excluir'}}
  };

  /* Usa somente as sessões já carregadas da página atual para definir estado visual e ações. */
  const baseAdminPlanningDayCard=adminPlanningDayCard;
  function reviewState(day){const sessions=day?.sessions||[];return {hasChange:sessions.some(session=>session.status==='change_requested'),hasProposal:sessions.some(session=>session.postApprovalProposal===true&&session.reviewStatus==='analysis')}}
  function reviewBadges(hasProposal,hasChange){const parts=[];if(hasProposal)parts.push('<span class="badge info day-review-badge">Nova atividade</span>');if(hasChange)parts.push('<span class="badge warning day-review-badge">Mudança solicitada</span>');return parts.length===2?`${parts[0]}<span class="day-review-plus" aria-hidden="true">+</span>${parts[1]}`:parts.join('')}
  adminPlanningDayCard=function(p,day){
    let html=baseAdminPlanningDayCard(p,day);const template=document.createElement('template');template.innerHTML=html;const rows=[...template.content.querySelectorAll('.planning-session-row')];rows.forEach((row,index)=>{const session=(day.sessions||[])[index],actions=managementActions(p,session,day.date);if(actions)(row.firstElementChild||row).insertAdjacentHTML('beforeend',actions)});html=template.innerHTML;
    const {hasChange,hasProposal}=reviewState(day);if(!hasChange&&!hasProposal)return html;const tone=hasChange?'review-day-warning':'review-day-info';if(!html.includes(tone))html=html.replace('class="card planning-day-card','class="card planning-day-card '+tone);const tags=reviewBadges(hasProposal,hasChange),marker='<div class="planning-day-date">',start=html.indexOf(marker);if(start>=0&&!html.includes('day-review-summary')){const strongEnd=html.indexOf('</strong>',start);if(strongEnd>=0){const at=strongEnd+'</strong>'.length;html=`${html.slice(0,at)}<span class="day-review-summary">${tags}</span>${html.slice(at)}`}}return html;
  };

  window.personCompact=personCompact;window.renderPersonModal=renderPersonModal;window.adminPlanningDayCard=adminPlanningDayCard;
})();
