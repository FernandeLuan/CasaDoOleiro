/* Round 15/28 — somente o estado de revisão de cartões ainda participa da cadeia atual. */
(function consistencyR15Portal(){
  const baseSessionCard=sessionCardVolunteer;
  const tx=(key,fallback)=>typeof t==='function'?t(key):fallback;
  const tr=value=>typeof translateText==='function'?translateText(value):value;
  const valueLabel=value=>typeof tValue==='function'?tValue(value):tr(value);

  function safe(value){return encodeURIComponent(String(value??''))}
  function parseChangeNote(note){
    const parts=String(note||'').split('|'),kind=parts[0]||'';
    if(!['move','rejected','adjustments'].includes(kind))return {kind:'',text:String(note||'')};
    return {kind,oldDate:parts[1]||'',oldTime:parts[2]||'',newDate:parts[3]||'',newTime:parts[4]||'',note:kind==='adjustments'?decodeURIComponent(parts.slice(5).join('|')||''):''};
  }
  function proposalMeta(s){const raw=s?.raw||{},activity=s?.activity||{};if(raw.postApprovalProposal!==true&&activity.postApprovalProposal!==true)return null;return {status:raw.reviewStatus||activity.reviewStatus||'',note:raw.reviewNote||activity.reviewNote||''}}
  function sessionInfoButton(a,raw){
    const notes=raw.notes||a.notes||'',materials=raw.materials||a.materials||'';
    if(!notes&&(!materials||materials==='Nenhum'))return '';
    return `<button class="planning-note-button volunteer-info-button" type="button" aria-label="${escapeHtml(tx('portal.activity.infoAria','Ver informações da atividade'))}" onclick="openVolunteerActivityInfo('${safe(a.name||raw.activityName||tr('Atividade'))}','${safe(notes)}','${safe(materials)}')"><i class="fa-solid fa-circle-info"></i></button>`;
  }
  function stateButton(text,tone,icon='fa-clock'){return `<div class="activity-actions review-state-actions"><button class="btn review-state-button ${tone}" type="button" disabled><i class="fa-solid ${icon}"></i>${escapeHtml(text)}</button></div>`}

  sessionCardVolunteer=function(s,editable){
    const a=s.activity||{},raw=s.raw||{},approved=state.volunteerMode==='approved';if(!approved)return baseSessionCard(s,editable);
    const description=raw.activityDescription||a.description||'',proposal=proposalMeta(s),change=parseChangeNote(raw.changeNote),activityId=a.id||raw.activityId||'',sessionId=s.sessionId||raw.id||'',info=sessionInfoButton(a,raw);
    let actions='';
    if(proposal&&proposal.status!=='approved'){
      if(proposal.status==='analysis')actions=stateButton(tx('portal.session.awaitingReview','Aguardando análise'),'info');
      else if(proposal.status==='adjustments')actions=`${proposal.note?`<div class="notice warning proposal-review-note"><i class="fa-solid fa-rotate"></i><div data-no-i18n>${escapeHtml(proposal.note)}</div></div>`:''}<div class="activity-actions candidate-session-actions"><button class="btn btn-outline" type="button" onclick='openActivityModal(${JSON.stringify(s.date)},${JSON.stringify(String(activityId))})'><i class="fa-solid fa-pen"></i>${escapeHtml(tx('action.adjust','Reajustar'))}</button><button class="btn btn-danger-soft" type="button" onclick='requestDeletePlanningSession(${JSON.stringify(String(activityId))},${JSON.stringify(s.date)})'>${escapeHtml(tx('action.delete','Excluir'))}</button></div>`;
      else if(proposal.status==='rejected')actions=stateButton(tx('portal.session.rejected','Recusada'),'danger','fa-xmark');
    }else if(s.status==='change_requested')actions=stateButton(tx('portal.session.awaitingReview','Aguardando análise'),'warning');
    else if(change.kind==='adjustments')actions=`${change.note?`<div class="notice warning proposal-review-note"><i class="fa-solid fa-rotate"></i><div data-no-i18n>${escapeHtml(change.note)}</div></div>`:''}<div class="activity-actions"><button class="btn btn-outline" type="button" onclick="moveSessionById('${safe(sessionId)}',true)"><i class="fa-solid fa-pen"></i>${escapeHtml(tx('action.adjust','Reajustar'))}</button></div>`;
    else if(change.kind==='rejected')actions=stateButton(tx('portal.session.rejected','Recusada'),'danger','fa-xmark');
    else actions=`<div class="activity-actions"><button class="btn btn-outline" type="button" onclick="moveSessionById('${safe(sessionId)}',true)">${escapeHtml(tx('action.requestChange','Solicitar mudança'))}</button></div>`;
    const activityName=a.name||raw.activityName||tr('Atividade'),period=valueLabel(a.period||raw.period||'Sem preferência');
    return `<div class="activity-card volunteer-session-card"><div class="activity-row"><div class="volunteer-session-main"><div class="volunteer-session-title"><h4>${escapeHtml(a.time||raw.time||'—')} • ${escapeHtml(activityName)}</h4>${info}</div><p>${Number(a.duration||raw.duration)||0} min • ${escapeHtml(period)}</p>${description?`<p class="volunteer-session-description"><strong>${escapeHtml(tx('portal.activity.descriptionLabel','Descrição:'))}</strong> <span data-no-i18n>${escapeHtml(description)}</span></p>`:''}</div></div>${actions}</div>`;
  };

  window.sessionCardVolunteer=sessionCardVolunteer;
})();
