/* Editor contextual de grupos do Planejamento. A UI mostra A/B/C/D/Livre; o card mantém rótulos completos. */
(function planningGroupEditor(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;

  function installStyles(){
    if(document.getElementById('planningGroupEditorStyles'))return;
    const style=document.createElement('style');
    style.id='planningGroupEditorStyles';
    style.textContent=`
      .planning-group-grid{
        display:grid!important;
        grid-template-columns:repeat(5,minmax(0,1fr))!important;
        gap:6px!important;
        align-items:stretch;
      }
      .planning-group-option{
        min-width:0;
        min-height:40px;
        padding:7px 8px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start;
        gap:7px!important;
        box-sizing:border-box;
      }
      .planning-group-option input[type="checkbox"]{
        width:16px;
        height:16px;
        margin:0!important;
        flex:0 0 16px;
        align-self:center;
        accent-color:var(--primary);
      }
      .planning-group-option span{
        display:block;
        min-width:0;
        line-height:1;
        font-size:.66rem;
        font-weight:600;
        white-space:nowrap;
      }

      /* Dias sem atividade usam o mesmo padrão de card das atividades, com mensagem centralizada. */
      .planning-person-day.is-empty .planning-person-day-summary{display:none!important}
      .planning-person-day.is-empty .planning-person-day-body{padding:10px 12px 12px!important}
      .planning-person-day.is-empty .planning-person-empty{
        min-height:92px!important;
        margin:0!important;
        padding:14px!important;
        border:1px solid var(--border)!important;
        border-radius:12px!important;
        background:var(--surface)!important;
        display:grid!important;
        place-items:center!important;
        text-align:center!important;
        box-sizing:border-box!important;
        color:var(--muted)!important;
        font-size:.7rem!important;
      }
      .planning-person-day.is-empty .planning-person-empty i{display:none!important}

      @media(max-width:640px){
        .planning-group-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important}
        .planning-group-option{min-height:38px;padding:6px!important;gap:6px!important}
        .planning-group-option input[type="checkbox"]{width:15px;height:15px;flex-basis:15px}
        .planning-group-option span{font-size:.62rem}
        .planning-person-day.is-empty .planning-person-empty{min-height:82px!important}
      }
    `;
    document.head.appendChild(style);
  }

  const safe=value=>encodeURIComponent(String(value??''));
  async function currentSession(applicationId,sessionId){
    const rows=await window.OleiroServices?.planning?.listSessions?.({applicationId});
    return (rows||[]).find(row=>String(row.id)===String(sessionId))||null;
  }
  function exclusiveChoice(input){
    const boxes=[...document.querySelectorAll('input[data-planning-group]')];
    if(input.checked&&input.value==='Livre')boxes.forEach(box=>{if(box!==input)box.checked=false});
    else if(input.checked)boxes.filter(box=>box.value==='Livre').forEach(box=>box.checked=false);
  }

  window.planningOpenGroup=async function(encodedApplicationId,encodedSessionId){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId),p=typeof candidateById==='function'?candidateById(applicationId):null;
    if(typeof closePlanningActivityActions==='function')closePlanningActivityActions();
    const session=await currentSession(applicationId,sessionId);if(!p||!session)return showToast('Atividade não encontrada.');
    let rows=[];try{rows=await window.OleiroServices?.groups?.list?.({unitId:p.unitId||String(p.unit||'').toLowerCase()})||[]}catch(error){console.warn('Não foi possível carregar grupos da unidade:',error)}
    const codes=[...new Set([...(rows||[]).map(row=>String(row.code||'').trim()).filter(code=>['A','B','C','D'].includes(code)),'A','B','C','D'])];
    const selected=String(session.groupId||'Livre').split('+').map(value=>value.trim()).filter(Boolean),options=[...codes,'Livre'];
    const body=`<div class="field"><label>Grupos</label><div class="check-grid planning-group-grid">${options.map(group=>`<label class="check-card planning-group-option"><input type="checkbox" data-planning-group value="${escapeHtml(group)}" ${selected.includes(group)?'checked':''}><span>${escapeHtml(group)}</span></label>`).join('')}</div></div>`;
    openModal('Grupos',escapeHtml(session.activityName||session.activity?.name||'Atividade'),body,`<button class="btn btn-primary btn-block" type="button" onclick="planningSaveGroup('${safe(applicationId)}','${safe(sessionId)}')">Salvar</button>`);
    requestAnimationFrame(()=>document.querySelectorAll('input[data-planning-group]').forEach(input=>input.addEventListener('change',()=>exclusiveChoice(input))));
  };

  window.planningSaveGroup=async function(encodedApplicationId,encodedSessionId){
    const applicationId=decodeURIComponent(encodedApplicationId),sessionId=decodeURIComponent(encodedSessionId);
    let groups=[...document.querySelectorAll('input[data-planning-group]:checked')].map(input=>input.value);
    if(!groups.length)return showToast('Selecione um grupo ou Livre.');
    if(groups.includes('Livre'))groups=['Livre'];
    const groupId=groups[0]==='Livre'?'Livre':groups.join(' + '),participation=groups[0]==='Livre'?'Livre':groups.length>1?`Grupos ${groups.join(' + ')}`:`Grupo ${groups[0]}`;
    try{await window.OleiroServices.planning.updateSession(sessionId,{groupId,participation});if(typeof closeModal==='function')closeModal();if(typeof refreshPlanning==='function')await refreshPlanning(applicationId);else if(typeof openPerson==='function')await openPerson(applicationId,'plan');showToast('Grupo atualizado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível atualizar o grupo.')}
  };

  installStyles();
})();
