/* Round 3 — ajustes finais do Portal candidato/voluntário. */
(function round3PortalUi(){
  const mapsUrl='https://www.google.com/maps/search/?api=1&query=R.%20S%C3%A3o%20Pedro%20Novo%2C%201999%2C%20Rodeio%20-%20SC%2C%2089136-000';
  window.openOleiroMaps=function(){const opened=window.open(mapsUrl,'_blank','noopener,noreferrer');if(!opened)location.href=mapsUrl};

  const baseVolunteerHome=volunteerHome;
  volunteerHome=function(){
    let html=baseVolunteerHome();
    html=html.replace(`<button class="menu-link" onclick="navigateVolunteer('info')"><i class="fa-solid fa-route"></i><span>Como chegar`, `<button class="menu-link" onclick="openOleiroMaps()"><i class="fa-solid fa-route"></i><span>Como chegar`);
    return html;
  };

  /* Cabeçalho enxuto: título à esquerda e período à direita, sem subtítulo redundante. */
  volunteerPlan=function(){
    const acts=volunteerActivities(),status=state.volunteerPlanStatus||'draft',approved=state.volunteerMode==='approved',editable=!approved&&(status==='draft'||status==='adjustments'),dates=volunteerStayDates(),periodLabel=dates.length?`${fmtDate(dates[0],true)}–${fmtDate(dates[dates.length-1],true)}`:'Período a confirmar';
    const notice=approved?'Seu planejamento aprovado está disponível para consulta. Mudanças precisam de nova confirmação da Casa.':status==='submitted'?'Planejamento enviado. Enquanto a equipe estiver analisando, a edição fica bloqueada.':status==='adjustments'?'Revise os dias marcados como “Reajustar” e reenvie o planejamento.':'Monte o planejamento pelos dias da sua estadia. Você pode editar, mover ou excluir até enviar.';
    const submitButton=approved?`<button class="btn btn-soft btn-block" style="margin-top:12px" disabled><i class="fa-solid fa-circle-check"></i>Planejamento aprovado</button>`:status==='submitted'?`<button class="btn btn-soft btn-block" style="margin-top:12px" disabled><i class="fa-solid fa-paper-plane"></i>Enviado</button>`:`<button class="btn btn-primary btn-block" style="margin-top:12px" onclick="submitPlan()"><i class="fa-solid fa-paper-plane"></i>${status==='adjustments'?'Reenviar planejamento':'Enviar planejamento'}</button>`;
    return `<section class="section volunteer-plan-page"><div class="plan-title-row"><div><h2>Meu planejamento</h2></div><strong>${periodLabel}</strong></div><div class="notice ${status==='adjustments'?'warning':''}"><i class="fa-solid fa-circle-info"></i><div>${notice}</div></div><div style="margin-top:14px">${volunteerAgendaContent(editable)}</div><div class="card plan-summary" style="margin-top:14px"><span class="eyebrow">Resumo</span><div class="stat-row"><span class="stat-pill">${acts.length} atividades</span><span class="stat-pill">${(state.sessions||[]).length} sessões</span><span class="stat-pill">${((state.sessions||[]).reduce((s,row)=>s+(Number(row.duration)||60),0)/60).toFixed(1).replace('.',',')}h planejadas</span></div>${submitButton}</div></section>`;
  };
})();
