/* R69 — Conta/Histórico usam a mesma largura do Planejamento e Histórico abre na página dedicada. */
(function planningProfileLayoutR69(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_PROFILE_LAYOUT_R69__)return;
  window.__OLEIRO_PLANNING_PROFILE_LAYOUT_R69__=true;

  function installStyles(){
    if(document.getElementById('planningProfileLayoutR69Styles'))return;
    const style=document.createElement('style');
    style.id='planningProfileLayoutR69Styles';
    style.textContent=`
      .planning-detail-page{max-width:1160px!important}
      .planning-detail-page .planning-page-content{width:100%;min-width:0}
      .planning-detail-page .candidate-history-panel{max-width:none!important;width:100%;margin-inline:0!important}
      .planning-detail-page .admin-account-refactor{max-width:none!important;width:100%!important;margin-inline:0!important}

      @media(min-width:900px){
        .planning-detail-page .admin-account-refactor{
          display:grid!important;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:16px!important;
          align-items:start;
        }
        .planning-detail-page .admin-account-refactor>*{min-width:0;margin-top:0!important;margin-bottom:0!important}
        .planning-detail-page .admin-account-refactor>.account-status-line{grid-column:1/-1}
        .planning-detail-page .admin-account-refactor>.account-contact-card{grid-column:1}
        .planning-detail-page .admin-account-refactor>.account-emergency-card{grid-column:2}
        .planning-detail-page .admin-account-refactor>.account-stay-card{grid-column:1}
        .planning-detail-page .admin-account-refactor>.account-access-card{grid-column:2}
        .planning-detail-page .admin-account-refactor>.selection-flow-card{grid-column:1/-1}
        .planning-detail-page .admin-account-refactor>.account-lifecycle-actions{grid-column:1}
        .planning-detail-page .admin-account-refactor>.account-danger-zone{grid-column:2}

        .planning-detail-page .account-contact-card,
        .planning-detail-page .account-emergency-card,
        .planning-detail-page .account-stay-card,
        .planning-detail-page .account-access-card,
        .planning-detail-page .selection-flow-card,
        .planning-detail-page .account-danger-zone{height:100%;box-sizing:border-box}
      }

      @media(max-width:899px){
        .planning-detail-page .admin-account-refactor{display:grid!important;grid-template-columns:1fr;gap:12px!important}
      }

      .planning-history-r69{display:grid;gap:14px}
      .planning-history-r69 .section-head{margin:0}
      .planning-history-r69 .section-head h3{margin:0;font-size:.96rem}
      .planning-history-r69 .section-head p{margin:4px 0 0;color:var(--muted);font-size:.72rem}
      .planning-history-r69-list{display:grid;gap:0;background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:8px 18px}
      .planning-history-r69-event{display:grid;grid-template-columns:18px minmax(0,1fr);gap:10px;position:relative;padding:12px 0}
      .planning-history-r69-event+.planning-history-r69-event{border-top:1px solid var(--border)}
      .planning-history-r69-dot{width:9px;height:9px;border-radius:50%;background:var(--primary);margin-top:6px;box-shadow:0 0 0 4px var(--primary-soft)}
      .planning-history-r69-body{min-width:0;display:grid;gap:4px}
      .planning-history-r69-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .planning-history-r69-head strong{font-size:.74rem;color:var(--text)}
      .planning-history-r69-head time{font-size:.61rem;color:var(--muted);white-space:nowrap}
      .planning-history-r69-body p{margin:0;font-size:.66rem;color:var(--text);line-height:1.4}
      .planning-history-r69-body span{font-size:.62rem;color:var(--muted)}
      .planning-history-r69-state{min-height:150px;display:grid;place-items:center;color:var(--muted);font-size:.72rem}
      @media(max-width:640px){.planning-history-r69-head{display:grid;gap:3px}.planning-history-r69-head time{white-space:normal}}
    `;
    document.head.appendChild(style);
  }

  const safe=value=>encodeURIComponent(String(value??''));
  const asDate=value=>{if(!value)return null;if(typeof value?.toDate==='function')return value.toDate();const d=new Date(value);return Number.isNaN(d.getTime())?null:d};
  function when(value){const d=asDate(value);if(!d)return '—';const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';return new Intl.DateTimeFormat(locale,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)}
  function eventLabel(type){
    const key=String(type||'');
    const map={candidate_created:'Perfil criado',planning_submitted:'Planejamento enviado',planning_approved:'Planejamento aprovado',meeting_scheduled:'Reunião agendada',meeting_completed:'Reunião realizada',candidate_approved:'Candidato aprovado',candidate_rejected:'Candidato não aprovado',activity_created:'Atividade criada',activity_updated:'Atividade atualizada',session_moved:'Atividade movida',adjustment_requested:'Ajuste solicitado',stay_dates_changed:'Período alterado',post_proposal_reviewed:'Proposta revisada'};
    return map[key]||key.replaceAll('_',' ').replace(/^./,c=>c.toUpperCase())||'Evento';
  }
  function roleLabel(role){const value=String(role||'').toLowerCase();if(value==='coordinator')return 'Coordenador';if(value==='volunteer')return 'Voluntário';if(value==='system')return 'Sistema';return 'Administrador'}
  function metadata(row){const m=row?.metadata||{};if(row?.type==='meeting_scheduled')return [m.date,m.time].filter(Boolean).join(' • ');if(row?.type==='session_moved')return [m.date,m.period].filter(Boolean).join(' • ');if(row?.type==='stay_dates_changed')return m.stayStart&&m.stayEnd?`${m.stayStart} → ${m.stayEnd}`:'';return m.activityName||m.date||''}
  function legacyRows(p){
    const rows=[],push=(type,date)=>{if(date)rows.push({id:`legacy-${type}`,type,createdAt:date,actorRole:'system',actorLabel:'Registro anterior',metadata:{}})};
    push('candidate_created',p?.createdAt);push('planning_submitted',p?.planningSubmittedAt);push('planning_approved',p?.planningApprovedAt);push('meeting_scheduled',p?.meetingScheduledAt);push('meeting_completed',p?.meetingCompletedAt);if(p?.finalDecisionAt)push(p.finalDecision==='approved'?'candidate_approved':'candidate_rejected',p.finalDecisionAt);return rows;
  }
  function mergeRows(p,rows){const persisted=rows||[],types=new Set(persisted.map(row=>row.type));return [...persisted,...legacyRows(p).filter(row=>!types.has(row.type))].sort((a,b)=>(asDate(b.createdAt)?.getTime()||0)-(asDate(a.createdAt)?.getTime()||0))}
  function tabs(p,tab){const id=safe(p.id);return `<div class="person-refactor-tabs person-history-tabs planning-profile-tabs"><button class="${tab==='plan'?'active':''}" type="button" onclick="openPerson(decodeURIComponent('${id}'),'plan')">Planejamento</button><button class="${tab==='account'?'active':''}" type="button" onclick="openPerson(decodeURIComponent('${id}'),'account')">Conta</button><button class="${tab==='history'?'active':''}" type="button" onclick="openPerson(decodeURIComponent('${id}'),'history')">Histórico</button></div>`}
  function historyPanel(p,rows,{loading=false,error=''}={}){
    let content='';
    if(loading)content='<div class="planning-history-r69-state"><span><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando histórico...</span></div>';
    else if(error)content=`<div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div>${escapeHtml(error)}</div></div>`;
    else if(!rows.length)content='<div class="planning-history-r69-state"><span><i class="fa-regular fa-clock"></i> Nenhum evento registrado ainda.</span></div>';
    else content=`<div class="planning-history-r69-list">${rows.map(row=>{const meta=metadata(row),actor=String(row.actorLabel||'').trim(),who=actor?`${actor} • ${roleLabel(row.actorRole)}`:roleLabel(row.actorRole);return `<article class="planning-history-r69-event"><div class="planning-history-r69-dot"></div><div class="planning-history-r69-body"><div class="planning-history-r69-head"><strong>${escapeHtml(eventLabel(row.type))}</strong><time>${escapeHtml(when(row.createdAt))}</time></div>${meta?`<p data-no-i18n>${escapeHtml(meta)}</p>`:''}<span>${escapeHtml(who)}</span></div></article>`}).join('')}</div>`;
    return `${tabs(p,'history')}<section class="candidate-history-panel planning-history-r69"><div class="section-head"><div><h3>Histórico do candidato</h3><p>Ações e mudanças registradas neste processo.</p></div></div>${content}</section>`;
  }

  function renderHistoryState(p,rows,opts){
    state.managerPlanningPersonId=String(p.id);state.managerPlanningTab='history';state.managerPlanningLoading=false;state.managerPlanningBody=historyPanel(p,rows,opts);state.managerPage='planning';
    if(typeof render==='function')render();
    if(typeof afterNavigation==='function')afterNavigation();
  }
  async function openHistory(id){
    const p=typeof candidateById==='function'?candidateById(id):null;if(!p)return;
    const cached=state.adminHistoryCache?.[String(p.id)];
    const cachedRows=Array.isArray(cached?.items)?mergeRows(p,cached.items):mergeRows(p,[]);
    renderHistoryState(p,cachedRows,{loading:!cached?.loadedAt});
    try{
      if(!window.OleiroServices?.history?.list){renderHistoryState(p,cachedRows,{});return}
      const result=await window.OleiroServices.history.list(p.id,{limit:50,cursor:null});
      const rows=mergeRows(p,result?.items||[]);
      state.adminHistoryCache=state.adminHistoryCache||{};
      state.adminHistoryCache[String(p.id)]={items:result?.items||[],cursor:result?.nextCursor||null,hasMore:!!result?.hasMore,loadedAt:Date.now(),loading:false,error:''};
      if(state.managerPage==='planning'&&String(state.managerPlanningPersonId)===String(p.id)&&state.managerPlanningTab==='history')renderHistoryState(p,rows,{});
    }catch(error){
      console.error('Falha ao carregar histórico na página dedicada:',error);
      if(state.managerPage==='planning'&&String(state.managerPlanningPersonId)===String(p.id)&&state.managerPlanningTab==='history')renderHistoryState(p,cachedRows,{error:'Não foi possível carregar o histórico.'});
    }
  }

  const baseOpenPerson=typeof window.openPerson==='function'?window.openPerson:(typeof openPerson==='function'?openPerson:null);
  if(baseOpenPerson){
    openPerson=async function(id,tab='plan'){
      if(state.managerPage==='planning'&&tab==='history')return openHistory(id);
      return baseOpenPerson(id,tab);
    };
    window.openPerson=openPerson;
  }

  installStyles();
  if(typeof state!=='undefined'&&state.role==='manager'&&state.managerPage==='planning'&&typeof render==='function')render();
})();
