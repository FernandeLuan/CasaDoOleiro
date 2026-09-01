/* Round 15 — consistência administrativa entre planejamento, mudanças e propostas. */
(function consistencyR15Admin(){
  const basePersonTabContent=personTabContent;
  const baseOpenPerson=openPerson;
  const baseCandidatePlanningDays=candidatePlanningDays;
  state.preparedStayDateChanges=state.preparedStayDateChanges||{};

  function safe(value){return encodeURIComponent(String(value??''))}
  function parseChangeNote(note){
    const parts=String(note||'').split('|'),kind=parts[0]||'';
    if(!['move','rejected','adjustments'].includes(kind))return {kind:'',text:String(note||'')};
    return {kind,oldDate:parts[1]||'',oldTime:parts[2]||'',newDate:parts[3]||'',newTime:parts[4]||'',note:kind==='adjustments'?decodeURIComponent(parts.slice(5).join('|')||''):''};
  }
  function compactDay(date){try{return new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date(`${date}T12:00:00`))}catch{return fmtDate(date,true)}}
  function weekday(date){try{return new Intl.DateTimeFormat(typeof currentLocale==='function'?currentLocale():'pt-BR',{weekday:'short'}).format(new Date(`${date}T12:00:00`)).replace('.','').toLowerCase()}catch{return String(dayName(date)||'').slice(0,3).toLowerCase()}}
  function dayHours(day){const minutes=(day.sessions||[]).reduce((sum,row)=>sum+(Number(row.duration||row.activity?.duration)||0),0),h=Math.floor(minutes/60),m=minutes%60;return h?(m?`${h}h${String(m).padStart(2,'0')}`:`${h}h`):`${m}min`}
  function activityFromSession(p,session){return {id:String(session.activityId||''),applicationId:String(p.id),name:session.activityName||'Atividade',description:session.activityDescription||'',duration:Number(session.duration)||60,participation:session.participation||'Livre',materials:session.materials||'',notes:session.notes||'',period:session.period||'Sem preferência',time:session.time||'',ownerName:session.ownerName||p.name||'Voluntário',createdByUid:session.createdByUid||'',postApprovalProposal:session.postApprovalProposal===true,reviewStatus:session.reviewStatus||'',reviewNote:session.reviewNote||'',dates:[]}}

  hydrateCandidatePlanning=async function(applicationId,{force=false}={}){
    const p=(state.candidates||[]).find(x=>String(x.id)===String(applicationId));if(!p||!window.OleiroServices?.planning)return null;const key=String(p.id),cached=candidatePlanningCache(key);if(cached&&!force){applyCandidatePlanningCache(p.id,cached);return cached}
    const sessions=await window.OleiroServices.planning.listSessions({applicationId:p.id}),byActivity=new Map();
    (sessions||[]).forEach(session=>{const id=String(session.activityId||'');if(!id)return;let activity=byActivity.get(id);if(!activity){activity=activityFromSession(p,session);byActivity.set(id,activity)}if(session.date&&!activity.dates.includes(session.date))activity.dates.push(session.date)});
    byActivity.forEach(activity=>activity.dates.sort());const cache={activities:[...byActivity.values()],sessions:sessions||[],at:Date.now()};state.candidatePlanningCache[key]=cache;p.activities=cache.activities.length;p.sessions=cache.sessions.length;applyCandidatePlanningCache(p.id,cache);return cache;
  };

  candidatePlanningDays=function(p){return baseCandidatePlanningDays(p).map(day=>({...day,sessions:(day.sessions||[]).filter(session=>session.status!=='rejected'&&session.reviewStatus!=='rejected')})).filter(day=>day.sessions.length)};

  function changeActions(p,session){const app=safe(p.id),sid=safe(session.id);return `<div class="review-admin-actions"><button class="btn btn-primary btn-xs" type="button" onclick="reviewVolunteerChange('${app}','${sid}','approve')"><i class="fa-solid fa-check"></i>Aprovar</button><button class="btn btn-soft btn-xs" type="button" onclick="requestVolunteerChangeReajust('${app}','${sid}')"><i class="fa-solid fa-rotate"></i>Reajustar</button><button class="btn btn-danger-soft btn-xs" type="button" onclick="reviewVolunteerChange('${app}','${sid}','reject')"><i class="fa-solid fa-xmark"></i>Recusar</button></div>`}
  function proposalActions(p,session){const app=safe(p.id),activity=safe(session.activityId);return `<div class="review-admin-actions"><button class="btn btn-primary btn-xs" type="button" onclick="reviewPostApprovalProposal('${app}','${activity}','approve')"><i class="fa-solid fa-check"></i>Aprovar</button><button class="btn btn-soft btn-xs" type="button" onclick="requestPostApprovalReajust('${app}','${activity}')"><i class="fa-solid fa-rotate"></i>Reajustar</button><button class="btn btn-danger-soft btn-xs" type="button" onclick="reviewPostApprovalProposal('${app}','${activity}','reject')"><i class="fa-solid fa-xmark"></i>Recusar</button></div>`}

  adminPlanningDayCard=function(p,day){
    const adjustment=candidateDayAdjustment(p,day.date),canAdjust=['analysis','adjustments'].includes(p.status),id=safe(p.id),dateArg=safe(day.date);
    const rows=(day.sessions||[]).map(session=>{const a=session.activity||{},description=session.activityDescription||a.description||'',notes=session.notes||a.notes||'',group=session.groupId&&session.groupId!=='A definir'?` • Grupo ${escapeHtml(session.groupId)}`:'',proposal=session.postApprovalProposal===true&&session.reviewStatus==='analysis',change=session.status==='change_requested',changeData=parseChangeNote(session.changeNote),info=notes?`<button class="planning-note-button" type="button" aria-label="Ver observações" onclick="openAdminActivityInfo('${safe(a.name||session.activityName||'Atividade')}','','${safe(notes)}','${dateArg}')"><i class="fa-solid fa-circle-info"></i></button>`:'';
      const kind=proposal?'<span class="review-kind-label info">Nova atividade</span>':change?'<span class="review-kind-label warning">Mudança solicitada</span>':'';
      const diff=change&&changeData.kind==='move'?`<div class="change-diff"><span><small>Antes</small><strong>${fmtDate(changeData.oldDate,true)} • ${escapeHtml(activityPeriodMeta(changeData.oldTime).value)}</strong></span><i class="fa-solid fa-arrow-right"></i><span><small>Proposto</small><strong>${fmtDate(changeData.newDate,true)} • ${escapeHtml(activityPeriodMeta(changeData.newTime).value)}</strong></span></div>`:'';
      const actions=proposal?proposalActions(p,session):change?changeActions(p,session):'';
      return `<div class="planning-session-row ${proposal||change?'review-admin-row':''}"><div><div class="planning-session-title"><strong>${escapeHtml(a.name||session.activityName||'Atividade')}</strong>${kind}${info}</div><span>${Number(session.duration||a.duration)||0} min • ${escapeHtml(activityPeriodValue(session,a))}${group}</span>${description?`<p class="admin-session-description"><strong>Descrição:</strong> ${escapeHtml(description)}</p>`:''}${diff}${actions}</div></div>`;
    }).join('');
    return `<details class="card planning-day-card" data-plan-date="${escapeHtml(day.date)}"><summary class="planning-day-head"><div class="planning-day-date"><strong>${compactDay(day.date)} ${weekday(day.date)}</strong>${adjustment?'<span class="badge warning">Reajustar</span>':''}</div><div class="planning-day-total"><strong>${dayHours(day)}</strong><i class="fa-solid fa-chevron-down"></i></div></summary><div class="planning-day-content">${adjustment?`<div class="day-adjustment-note"><i class="fa-solid fa-circle-info"></i><span>${escapeHtml(adjustment.note||'Ajuste solicitado pela equipe.')}</span></div>`:''}<div class="planning-day-sessions">${rows}</div>${canAdjust?`<div class="planning-day-adjust-action"><button class="btn btn-soft" type="button" onclick="requestDayAdjust(decodeURIComponent('${id}'),decodeURIComponent('${dateArg}'))"><i class="fa-solid fa-pen"></i>Solicitar ajuste neste dia</button></div>`:''}</div></details>`;
  };

  window.requestVolunteerChangeReajust=function(encodedApplicationId,encodedSessionId){const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId);openModal('Solicitar reajuste','Explique o que precisa ser alterado nesta mudança.',`<div class="field"><label for="changeReajustNote">Orientação ao voluntário</label><textarea id="changeReajustNote" class="textarea" placeholder="Ex.: mantenha o dia e altere somente o período."></textarea></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" type="button" onclick="reviewVolunteerChange('${safe(applicationId)}','${safe(sessionId)}','adjustments')">Enviar reajuste</button></div>`)};
  window.reviewVolunteerChange=async function(encodedApplicationId,encodedSessionId,decision){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),p=candidateById(applicationId),note=decision==='adjustments'?(document.getElementById('changeReajustNote')?.value.trim()||''):'';if(!p)return;if(decision==='adjustments'&&!note)return showToast('Informe o reajuste solicitado.');
    try{await window.OleiroServices.planning.reviewChangeRequest({sessionId,decision,note});invalidateCandidatePlanning(applicationId);invalidateManagerPendingChanges?.();invalidateManagerScheduleCache?.();await hydrateManagerPendingChanges({force:true});await hydrateCandidatePlanning(applicationId,{force:true});renderPersonModal(p,'plan');showToast(decision==='approve'?'Mudança aprovada.':decision==='reject'?'Mudança recusada.':'Reajuste enviado ao voluntário.');hydrateManagerDashboardData?.().catch(console.error)}catch(error){console.error(error);showToast(error?.message||'Não foi possível revisar a mudança.')}
  };

  personTabContent=function(p,tab){
    let html=basePersonTabContent(p,tab);
    if(tab==='overview'){
      html=html.replace(/<div class="activity-actions" style="margin-top:12px">[\s\S]*?<\/div>/,'');
      if(!candidatePlanningCache(p.id)&&Number(p.activities||0)===0&&['analysis','adjustments','approved'].includes(p.status))html=html.replace(/<span class="stat-pill">0 atividades<\/span>/,'<span class="stat-pill stat-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando atividades</span>');
    }
    if(tab==='stay'&&html.includes('Editar datas')&&!html.includes('Alterar unidade'))html=html.replace(/(<button[^>]*onclick="openStayDateEditor[^>]*>[\s\S]*?Editar datas<\/button>)/,`$1<button class="btn btn-outline btn-block" style="margin-top:8px" type="button" onclick="openVolunteerUnitEditor('${safe(p.id)}')"><i class="fa-solid fa-building"></i>Alterar unidade</button>`);
    return html;
  };

  openPerson=async function(id,tab='overview'){
    const p=candidateById(id),result=baseOpenPerson(id,tab);if(p&&tab==='overview'&&!candidatePlanningCache(p.id)&&Number(p.activities||0)===0&&['analysis','adjustments','approved'].includes(p.status)){hydrateCandidatePlanning(p.id).then(()=>refreshOpenPersonModal?.(p.id)).catch(error=>console.error('Não foi possível carregar as atividades:',error))}return result;
  };

  window.openVolunteerUnitEditor=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;const units=(state.units||[]).filter(unit=>unit&&unit.id),current=String(p.unitId||p.unit||'').toLowerCase();
    openModal('Alterar unidade','A agenda e as sessões existentes acompanharão a nova unidade.',`<div class="field"><label for="volunteerUnitSelect">Unidade</label><select id="volunteerUnitSelect" class="select">${units.map(unit=>`<option value="${escapeHtml(unit.id)}" ${String(unit.id).toLowerCase()===current?'selected':''}>${escapeHtml(unit.name||unit.id)}</option>`).join('')}</select></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${escapeHtml(String(p.id))}'),'stay')">Cancelar</button><button class="btn btn-primary" type="button" onclick="saveVolunteerUnit('${safe(p.id)}')">Salvar unidade</button></div>`);
  };
  window.saveVolunteerUnit=async function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id),unitId=document.getElementById('volunteerUnitSelect')?.value||'',unit=(state.units||[]).find(row=>String(row.id)===String(unitId));if(!p||!unitId)return showToast('Selecione uma unidade.');if(String(p.unitId||'').toLowerCase()===String(unitId).toLowerCase())return renderPersonModal(p,'stay');
    try{const result=await window.OleiroServices.applications.changeUnit(p.id,{unitId,unitName:unit?.name||unitId});p.unitId=result.unitId;p.unit=result.unitName;p.unitName=result.unitName;invalidateCandidatePlanning(p.id);invalidateManagerScheduleCache?.();renderPersonModal(p,'stay');showToast('Unidade alterada.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível alterar a unidade.')}
  };

  saveStayDates=async function(id){
    const p=candidateById(id),from=document.getElementById('editStayFrom')?.value||'',to=document.getElementById('editStayTo')?.value||'';if(!p||!from||!to||to<from)return showToast('Confira as datas informadas.');
    try{
      const prepared=await window.OleiroServices.applications.prepareStayDateChange(p.id,{stayStart:from,stayEnd:to});state.preparedStayDateChanges[String(p.id)]=prepared;
      if(prepared.outsideCount){openModal('Confirmar alteração',`${prepared.outsideCount} ${prepared.outsideCount===1?'sessão ficará':'sessões ficarão'} fora do novo período.`,`<div class="notice warning"><i class="fa-solid fa-triangle-exclamation"></i><div>As sessões em ${prepared.outsideDates.map(d=>fmtDate(d,true)).join(', ')} serão removidas para manter o planejamento consistente.</div></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="openStayDateEditor('${escapeHtml(String(id))}')">Cancelar</button><button id="confirmPreparedStay" class="btn btn-danger" type="button" onclick="confirmPreparedStayDates('${safe(id)}')">Alterar e remover</button></div>`);return}
      await confirmPreparedStayDates(safe(id));
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível verificar o novo período.')}
  };
  window.confirmPreparedStayDates=async function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id),prepared=state.preparedStayDateChanges[String(id)],button=document.getElementById('confirmPreparedStay');if(!p||!prepared)return showToast('Verifique novamente as datas.');if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Alterando...'}
    try{const result=await window.OleiroServices.applications.applyPreparedStayDateChange(p.id,prepared);p.from=prepared.stayStart;p.to=prepared.stayEnd;p.stayStart=prepared.stayStart;p.stayEnd=prepared.stayEnd;p.sessions=result.sessionCount;p.activities=result.activityCount;delete state.preparedStayDateChanges[String(id)];invalidateCandidatePlanning(p.id);invalidateManagerScheduleCache?.();renderPersonModal(p,'stay');showToast(result.removedSessions?`Datas alteradas e ${result.removedSessions} ${result.removedSessions===1?'sessão removida':'sessões removidas'}.`:'Datas da estadia atualizadas.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível alterar as datas.');if(button?.isConnected){button.disabled=false;button.textContent='Alterar e remover'}}
  };

  window.hydrateCandidatePlanning=hydrateCandidatePlanning;window.candidatePlanningDays=candidatePlanningDays;window.adminPlanningDayCard=adminPlanningDayCard;window.personTabContent=personTabContent;window.openPerson=openPerson;
  if(state.role==='manager'&&typeof render==='function')render();
})();
