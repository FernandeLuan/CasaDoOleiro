/* Round 31 — final color/status semantics for planning review cards. */
(function reviewPolishR31(){
  const R=window.OleiroR31AdminReview;if(!R)return;
  function signal(tone,message,label){return `<span class="r31-day-signal-wrap"><button class="r31-day-signal ${tone}" type="button" aria-label="${escapeHtml(label)}" data-r31-message="${escapeHtml(message)}" onclick="toggleR31DaySignal(this,event)"><i class="fa-solid fa-circle-info"></i></button></span>`}
  function closeSignalPopover(){document.getElementById('r31DaySignalPopover')?.remove()}
  window.toggleR31DaySignal=function(button,event){
    event?.preventDefault?.();event?.stopPropagation?.();
    const current=document.getElementById('r31DaySignalPopover');
    if(current&&current.dataset.owner===String(button?.dataset.r31SignalId||'')){current.remove();return}
    closeSignalPopover();if(!button)return;
    if(!button.dataset.r31SignalId)button.dataset.r31SignalId=`r31-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const popover=document.createElement('div');popover.id='r31DaySignalPopover';popover.className='r31-day-signal-popover';popover.setAttribute('role','status');popover.dataset.owner=button.dataset.r31SignalId;popover.textContent=button.dataset.r31Message||'';document.body.appendChild(popover);
    const rect=button.getBoundingClientRect(),box=popover.getBoundingClientRect(),pad=12;
    let left=rect.left+rect.width/2-box.width/2;left=Math.max(pad,Math.min(left,window.innerWidth-box.width-pad));
    let top=rect.bottom+7;if(top+box.height>window.innerHeight-pad)top=Math.max(pad,rect.top-box.height-7);
    popover.style.left=`${Math.round(left)}px`;popover.style.top=`${Math.round(top)}px`;
  };
  document.addEventListener('click',event=>{if(!event.target.closest?.('.r31-day-signal'))closeSignalPopover()});
  window.addEventListener('scroll',closeSignalPopover,true);window.addEventListener('resize',closeSignalPopover);

  R.daySignals=function(day){
    const sessions=day?.sessions||[],out=[],count=fn=>sessions.filter(fn).length;let n;
    n=count(s=>s.adminAdjustmentStatus==='requested');if(n)out.push(signal('warning',`${n} ${n===1?'atividade com ajuste solicitado':'atividades com ajuste solicitado'} neste dia.`,'Ajuste solicitado'));
    n=count(s=>s.adminAdjustmentStatus==='analysis'&&s.changeReviewStatus!=='adjustments');if(n)out.push(signal('info',`${n} ${n===1?'ajuste reenviado aguardando análise':'ajustes reenviados aguardando análise'}.`,'Ajuste reenviado'));
    n=count(s=>s.status==='change_requested'&&(s.changeReviewStatus||'analysis')==='analysis'&&s.adminAdjustmentStatus!=='analysis');if(n)out.push(signal('warning',`${n} ${n===1?'alteração proposta aguardando análise':'alterações propostas aguardando análise'}.`,'Mudança solicitada'));
    n=count(s=>s.status==='change_requested'&&s.changeReviewStatus==='adjustments');if(n)out.push(signal('warning',`${n} ${n===1?'alteração aguardando reajuste do voluntário':'alterações aguardando reajuste do voluntário'}.`,'Reajuste solicitado'));
    n=count(s=>s.postApprovalProposal===true&&s.reviewStatus==='analysis'&&!s.reviewBaseline);if(n)out.push(signal('info',`${n} ${n===1?'nova atividade proposta neste dia':'novas atividades propostas neste dia'}.`,'Nova atividade proposta'));
    n=count(s=>s.postApprovalProposal===true&&s.reviewStatus==='analysis'&&!!s.reviewBaseline);if(n)out.push(signal('info',`${n} ${n===1?'reajuste de nova atividade reenviado':'reajustes de novas atividades reenviados'} para análise.`,'Reajuste reenviado'));
    n=count(s=>s.postApprovalProposal===true&&s.reviewStatus==='adjustments');if(n)out.push(signal('warning',`${n} ${n===1?'nova atividade aguardando reajuste':'novas atividades aguardando reajuste'} do voluntário.`,'Reajuste solicitado'));
    n=count(s=>(s.postApprovalProposal===true&&s.reviewStatus==='rejected')||s.changeReviewStatus==='rejected'||s.adminAdjustmentStatus==='rejected');if(n)out.push(signal('danger',`${n} ${n===1?'proposta recusada neste dia':'propostas recusadas neste dia'}.`,'Proposta recusada'));
    return out.join('');
  };
  R.statusMeta=function(session){
    const badges=[],classes=[];
    if(session.postApprovalProposal===true){const review=session.reviewStatus||'analysis';if(review==='analysis'){badges.push(`<span class="badge info">${session.reviewBaseline?'Reajuste enviado':'Nova atividade'}</span>`);classes.push('r31-card-info')}else if(review==='adjustments'){badges.push('<span class="badge warning">Reajuste solicitado</span>');classes.push('r31-card-warning')}else if(review==='rejected'){badges.push('<span class="badge danger">Recusada</span>');classes.push('r31-card-danger')}return {badges:badges.join(''),classes:classes.join(' ')}}
    if(session.changeReviewStatus==='rejected'||session.adminAdjustmentStatus==='rejected'){badges.push('<span class="badge danger">Recusada</span>');classes.push('r31-card-danger');return {badges:badges.join(''),classes:classes.join(' ')}}
    if(session.status==='change_requested'&&session.changeReviewStatus==='adjustments'){badges.push('<span class="badge warning">Reajuste solicitado</span>');classes.push('r31-card-warning');return {badges:badges.join(''),classes:classes.join(' ')}}
    if(session.adminAdjustmentStatus==='requested'){badges.push('<span class="badge warning">Ajuste solicitado</span>');classes.push('r31-card-warning')}
    else if(session.adminAdjustmentStatus==='analysis'){badges.push('<span class="badge info">Ajuste reenviado</span>');classes.push('r31-card-info')}
    else if(session.status==='change_requested'){badges.push('<span class="badge warning">Mudança solicitada</span>');classes.push('r31-card-warning')}
    return {badges:[...new Set(badges)].join(''),classes:[...new Set(classes)].join(' ')};
  };
  R.reviewDetails=function(session){
    const rows=[],current={date:session.date,duration:session.duration,period:activityPeriodValue(session,session.activity||{}),activityName:session.activityName,activityDescription:session.activityDescription,participation:session.participation,materials:session.materials,notes:session.notes};
    if(session.adminAdjustmentStatus==='requested'&&session.adminAdjustmentNote)rows.push(`<div class="r31-review-block warning"><strong>Motivo do ajuste:</strong><p>${escapeHtml(session.adminAdjustmentNote)}</p></div>`);
    if(session.adminAdjustmentStatus==='analysis'&&session.adminAdjustmentNote){const target=session.changeProposal?{...current,...session.changeProposal}:current,diff=session.adminAdjustmentBaseline?R.snapshotDiff(session.adminAdjustmentBaseline,target):null;rows.push(`<div class="r31-review-block"><strong>Motivo do ajuste:</strong><p>${escapeHtml(session.adminAdjustmentNote)}</p>${diff?`<div class="r31-change-pair"><span><b>De:</b> ${escapeHtml(diff.from)}</span><span><b>Para:</b> ${escapeHtml(diff.to)}</span></div>`:''}</div>`)}
    if(session.status==='change_requested'&&session.adminAdjustmentStatus!=='analysis'){
      const diff=R.summarizeDiff(session,session.changeProposal||{});if(session.changeNote)rows.push(`<div class="r31-review-block"><strong>Motivo da alteração:</strong><p>${escapeHtml(session.changeNote)}</p><div class="r31-change-pair"><span><b>De:</b> ${escapeHtml(diff.from)}</span><span><b>Para:</b> ${escapeHtml(diff.to)}</span></div></div>`);
    }
    if(session.status==='change_requested'&&session.changeReviewStatus==='adjustments'&&session.changeReviewNote)rows.push(`<div class="r31-review-block warning"><strong>Motivo do reajuste:</strong><p>${escapeHtml(session.changeReviewNote)}</p></div>`);
    if(session.status==='change_requested'&&session.changeReviewStatus==='analysis'&&session.changeReviewBaseline&&session.changeReviewRequestNote){const adjusted=R.snapshotDiff(session.changeReviewBaseline,session.changeProposal||{});rows.push(`<div class="r31-review-block warning"><strong>Motivo do reajuste:</strong><p>${escapeHtml(session.changeReviewRequestNote)}</p><div class="r31-change-pair"><span><b>De:</b> ${escapeHtml(adjusted.from)}</span><span><b>Para:</b> ${escapeHtml(adjusted.to)}</span></div></div>`)}
    if(session.postApprovalProposal===true&&session.reviewStatus==='adjustments'&&session.reviewNote)rows.push(`<div class="r31-review-block warning"><strong>Motivo do reajuste:</strong><p>${escapeHtml(session.reviewNote)}</p></div>`);
    if(session.postApprovalProposal===true&&session.reviewStatus==='analysis'&&session.reviewBaseline){const adjusted=R.snapshotDiff(session.reviewBaseline,current);rows.push(`<div class="r31-review-block"><strong>Motivo do reajuste:</strong><p>${escapeHtml(session.reviewRequestNote||'Reajuste solicitado pela equipe.')}</p><div class="r31-change-pair"><span><b>De:</b> ${escapeHtml(adjusted.from)}</span><span><b>Para:</b> ${escapeHtml(adjusted.to)}</span></div></div>`)}
    return rows.length?`<div class="admin-portal-detail-divider r31-review-divider" aria-hidden="true"></div><div class="r31-review-details">${rows.join('')}</div>`:'';
  };
})();
