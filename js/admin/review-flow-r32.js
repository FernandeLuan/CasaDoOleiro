/* Round 32 — activity-scoped review signals, coherent day states and emergency-contact cleanup. */
(function reviewFlowR32Admin(){
  const R=window.OleiroR31AdminReview;if(!R)return;
  const baseAdminPlanningDayCard=window.adminPlanningDayCard||adminPlanningDayCard;
  const baseStatusMeta=R.statusMeta;
  const baseRenderPersonModal=window.renderPersonModal||renderPersonModal;
  const text=key=>typeof t==='function'?t(key):key;
  const safe=value=>encodeURIComponent(String(value??''));

  function timeMs(value){
    if(!value)return 0;
    try{if(typeof value.toMillis==='function')return Number(value.toMillis())||0;if(typeof value.toDate==='function')return Number(value.toDate().getTime())||0}catch{}
    const parsed=Date.parse(String(value));return Number.isFinite(parsed)?parsed:0;
  }
  function adjustmentReady(session){
    if(!session||session.adminAdjustmentStatus!=='requested')return false;
    if(session._r32AdjustmentReady===true)return true;
    const requested=timeMs(session.adminAdjustmentRequestedAt),updated=timeMs(session.updatedAt);
    return requested>0&&updated>requested;
  }
  R.adjustmentReady=adjustmentReady;

  R.statusMeta=function(session){
    if(adjustmentReady(session))return {badges:'<span class="badge success">Ajustado</span>',classes:'r32-card-ready'};
    return baseStatusMeta(session);
  };

  function dayButton(tone,label,message){return `<button class="r31-day-signal r32-day-state ${tone}" type="button" data-r31-message="${escapeHtml(message)}" onclick="toggleR31DaySignal(this,event)">${escapeHtml(label)}</button>`}
  R.daySignals=function(day){
    const sessions=day?.sessions||[],pending=sessions.filter(s=>s.adminAdjustmentStatus==='requested'&&!adjustmentReady(s)),ready=sessions.filter(adjustmentReady),resent=sessions.filter(s=>s.adminAdjustmentStatus==='analysis'),changes=sessions.filter(s=>s.status==='change_requested'&&(s.changeReviewStatus||'analysis')==='analysis'&&s.adminAdjustmentStatus!=='analysis'),newActivities=sessions.filter(s=>s.postApprovalProposal===true&&s.reviewStatus==='analysis'&&!s.reviewBaseline),readjust=sessions.filter(s=>(s.changeReviewStatus==='adjustments')||(s.postApprovalProposal===true&&s.reviewStatus==='adjustments'));
    if(pending.length)return dayButton('warning','Reajustar',`${pending.length} ${pending.length===1?'atividade precisa de ajuste':'atividades precisam de ajuste'} neste dia.`);
    if(ready.length)return dayButton('success','Ajustado',`${ready.length} ${ready.length===1?'atividade foi ajustada e aguarda reenvio':'atividades foram ajustadas e aguardam reenvio'}.`);
    if(readjust.length)return dayButton('warning','Reajustar',`${readjust.length} ${readjust.length===1?'atividade aguarda reajuste':'atividades aguardam reajuste'} do voluntário.`);
    if(changes.length)return dayButton('warning','Alteração',`${changes.length} ${changes.length===1?'alteração aguarda análise':'alterações aguardam análise'} neste dia.`);
    if(newActivities.length)return dayButton('info','Nova atividade',`${newActivities.length} ${newActivities.length===1?'atividade nova foi proposta':'atividades novas foram propostas'} neste dia.`);
    if(resent.length)return dayButton('info','Reenviado',`${resent.length} ${resent.length===1?'ajuste reenviado aguarda análise':'ajustes reenviados aguardam análise'}.`);
    return '';
  };

  function signalMeta(session){
    if(!session)return null;
    if(session.postApprovalProposal===true&&(session.reviewStatus||'analysis')==='analysis'&&!session.reviewBaseline)return {tone:'info',label:'Informações da nova atividade',message:'Nova atividade proposta pelo voluntário.'};
    return null;
  }
  function signalHtml(session){const meta=signalMeta(session);if(!meta)return '';return `<span class="r32-session-signal-wrap"><button class="r32-session-signal ${meta.tone}" type="button" aria-label="${escapeHtml(meta.label)}" data-r32-message="${escapeHtml(meta.message)}" onclick="toggleR32SessionSignal(this,event)"><i class="fa-solid fa-circle-info" aria-hidden="true"></i></button></span>`}
  function closeSignal(){document.getElementById('r32SessionSignalPopover')?.remove()}
  window.toggleR32SessionSignal=function(button,event){
    event?.preventDefault?.();event?.stopPropagation?.();const current=document.getElementById('r32SessionSignalPopover');if(current&&current.dataset.owner===String(button?.dataset.r32SignalId||'')){current.remove();return}closeSignal();if(!button)return;if(!button.dataset.r32SignalId)button.dataset.r32SignalId=`r32-${Date.now()}-${Math.random().toString(36).slice(2)}`;const popover=document.createElement('div');popover.id='r32SessionSignalPopover';popover.className='r32-session-signal-popover';popover.setAttribute('role','status');popover.dataset.owner=button.dataset.r32SignalId;popover.textContent=button.dataset.r32Message||'';document.body.appendChild(popover);const rect=button.getBoundingClientRect(),box=popover.getBoundingClientRect(),pad=12;let left=rect.left+rect.width/2-box.width/2;left=Math.max(pad,Math.min(left,window.innerWidth-box.width-pad));let top=rect.bottom+7;if(top+box.height>window.innerHeight-pad)top=Math.max(pad,rect.top-box.height-7);popover.style.left=`${Math.round(left)}px`;popover.style.top=`${Math.round(top)}px`;
  };
  document.addEventListener('click',event=>{if(!event.target.closest?.('.r32-session-signal'))closeSignal()});window.addEventListener('scroll',closeSignal,true);window.addEventListener('resize',closeSignal);

  function ensureActions(p,session,card){
    const actions=card.querySelector('.admin-portal-actions')||card.querySelector('.admin-portal-activity-main');if(!actions||!session?.id)return;
    if(session.postApprovalProposal===true&&(session.reviewStatus||'analysis')==='analysis'&&!card.querySelector('.post-approval-admin-actions')&&session.activityId){
      const app=safe(p.id),activity=safe(session.activityId);actions.insertAdjacentHTML('beforeend',`<div class="post-approval-admin-actions"><button class="btn btn-primary btn-xs" type="button" onclick="reviewPostApprovalProposal('${app}','${activity}','approve')"><i class="fa-solid fa-check"></i>Aprovar</button><button class="btn btn-soft btn-xs" type="button" onclick="requestPostApprovalReajust('${app}','${activity}')"><i class="fa-solid fa-rotate"></i>Reajustar</button><button class="btn btn-danger-soft btn-xs" type="button" onclick="reviewPostApprovalProposal('${app}','${activity}','reject')"><i class="fa-solid fa-xmark"></i>Recusar</button></div>`);
    }
    if(session.status==='change_requested'&&(session.changeReviewStatus||'analysis')==='analysis'&&!card.querySelector('.post-approval-admin-actions')){
      const app=safe(p.id),sid=safe(session.id);actions.insertAdjacentHTML('beforeend',`<div class="post-approval-admin-actions"><button class="btn btn-primary btn-xs" type="button" onclick="reviewR31ExistingChange('${app}','${sid}','approve')"><i class="fa-solid fa-check"></i>Aprovar</button><button class="btn btn-soft btn-xs" type="button" onclick="openR31ExistingReajust('${app}','${sid}')"><i class="fa-solid fa-rotate"></i>Reajustar</button><button class="btn btn-danger-soft btn-xs" type="button" onclick="openR31ExistingReject('${app}','${sid}')"><i class="fa-solid fa-xmark"></i>Recusar</button></div>`);
    }
  }

  adminPlanningDayCard=function(p,day){
    const html=baseAdminPlanningDayCard(p,day),template=document.createElement('template');template.innerHTML=html;
    (day?.sessions||[]).forEach(session=>{
      const card=template.content.querySelector(`.admin-portal-activity-card[data-session-id="${CSS.escape(String(session.id||''))}"]`);if(!card)return;
      if(adjustmentReady(session)){card.classList.remove('r31-card-warning');card.classList.add('r32-card-ready')}
      if(session.postApprovalProposal===true&&(session.reviewStatus||'analysis')==='analysis'&&!session.reviewBaseline)card.classList.add('r32-new-activity');
      const signal=signalHtml(session);if(signal){let status=card.querySelector('.admin-portal-status');if(!status){status=document.createElement('div');status.className='admin-portal-status';card.querySelector('.admin-portal-activity-head')?.appendChild(status)}status.insertAdjacentHTML('beforeend',signal)}
      ensureActions(p,session,card);
    });
    return template.innerHTML;
  };
  window.adminPlanningDayCard=adminPlanningDayCard;

  function participantName(p,index,row){return row.querySelector('small')?.textContent?.trim()||(Array.isArray(p?.participantNames)?p.participantNames[index]:'')||p?.name||`Participante ${index+1}`}
  function decorateEmergency(p){
    const card=modalRoot.querySelector('.account-emergency-card');if(!card)return;
    [...card.querySelectorAll('.emergency-person-row')].forEach((row,index)=>{
      row.querySelector('.account-person-icon')?.remove();const info=row.querySelector(':scope > div');if(!info)return;const name=participantName(p,index,row),contact=p?.participantProfiles?.[index]?.emergencyContact||{},has=!!(String(contact.name||'').trim()||String(contact.relationship||'').trim()||String(contact.phone||'').trim());info.className='r32-emergency-person';if(!has){info.innerHTML=`<small>${escapeHtml(name)}</small><span>${escapeHtml(text('emergency.none'))}</span>`;return}const none=text('emergency.none');info.innerHTML=`<small>${escapeHtml(name)}</small><div class="r32-emergency-values"><div class="r32-emergency-value"><span>${escapeHtml(text('emergency.name'))}</span><strong>${escapeHtml(contact.name||none)}</strong></div><div class="r32-emergency-value"><span>${escapeHtml(text('emergency.relationship'))}</span><strong>${escapeHtml(contact.relationship||none)}</strong></div><div class="r32-emergency-value"><span>${escapeHtml(text('emergency.phone'))}</span><strong>${escapeHtml(contact.phone||none)}</strong></div></div>`;
    });
  }
  renderPersonModal=function(p,tab='plan'){const result=baseRenderPersonModal(p,tab);if(p&&(tab==='account'||modalRoot.dataset.personTab==='account'))decorateEmergency(p);return result};
  window.renderPersonModal=renderPersonModal;
})();
