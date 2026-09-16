/* R71 — Conta mais leve, scroll desktop dedicado e Histórico direto na página. */
(function accountHistoryScrollR71(){
  if(!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_ACCOUNT_HISTORY_SCROLL_R71__)return;
  window.__OLEIRO_ACCOUNT_HISTORY_SCROLL_R71__=true;

  function installStyles(){
    if(document.getElementById('accountHistoryScrollR71Styles'))return;
    const style=document.createElement('style');
    style.id='accountHistoryScrollR71Styles';
    style.textContent=`
      @media(min-width:1024px){
        html,body{height:100%!important;min-height:100%!important;overflow:hidden!important}
        body:not(.modal-open) .admin-content-r62{
          height:100vh!important;
          min-height:0!important;
          max-height:100vh!important;
          overflow-y:auto!important;
          overflow-x:hidden!important;
          overscroll-behavior-y:auto!important;
          scrollbar-gutter:stable;
        }
        body:not(.modal-open) .admin-content-r62>.page{
          height:auto!important;
          min-height:100%!important;
          max-height:none!important;
          overflow:visible!important;
          padding-bottom:54px!important;
        }
        body.modal-open .admin-content-r62{overflow:hidden!important}
      }

      .planning-detail-page .account-contact-card-r70 .account-person-row.account-person-inline-r71{
        display:grid!important;
        grid-template-columns:44px minmax(0,1fr) minmax(210px,.72fr)!important;
        gap:14px 18px!important;
        align-items:start!important;
      }
      .planning-detail-page .account-person-inline-r71>.avatar{grid-column:1;grid-row:1}
      .planning-detail-page .account-person-inline-r71>.account-person-main-r71{grid-column:2;grid-row:1;min-width:0!important;display:grid!important;gap:3px!important}
      .planning-detail-page .account-person-inline-r71>.account-person-emergency-inline-r71{
        grid-column:3;grid-row:1;
        min-width:0;
        padding-left:18px;
        border-left:1px solid var(--border);
        display:grid;
        gap:6px;
        align-content:start;
        min-height:100%;
      }
      .planning-detail-page .account-person-emergency-inline-r71 .account-person-section-head-r70{min-height:22px}
      .planning-detail-page .account-person-emergency-inline-r71 .account-person-section-head-r70>span{
        font-size:.56rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--primary)
      }
      .planning-detail-page .account-person-emergency-inline-r71 .account-person-emergency-body-r70{display:grid;gap:2px}
      .planning-detail-page .account-person-emergency-inline-r71 strong{font-size:.66rem!important;line-height:1.35}
      .planning-detail-page .account-person-emergency-inline-r71 span{font-size:.59rem!important;line-height:1.4;color:var(--muted)}
      .planning-detail-page .account-access-plain-r71{
        display:flex;align-items:center;gap:6px;margin-top:3px;
        font-size:.6rem!important;line-height:1.35;color:var(--muted)!important
      }
      .planning-detail-page .account-access-plain-r71::before{
        content:"";width:5px;height:5px;border-radius:50%;background:var(--primary);opacity:.7;flex:0 0 5px
      }
      .planning-detail-page .account-person-sections-r70{display:none!important}

      .planning-history-r71{display:grid;gap:14px;width:100%}
      .planning-history-r71 .section-head{margin:0}
      .planning-history-r71 .section-head h3{margin:0;font-size:.96rem}
      .planning-history-r71 .section-head p{margin:4px 0 0;color:var(--muted);font-size:.72rem}
      .planning-history-r71-list{display:grid;gap:0;background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:8px 18px}
      .planning-history-r71-event{display:grid;grid-template-columns:18px minmax(0,1fr);gap:10px;padding:12px 0}
      .planning-history-r71-event+.planning-history-r71-event{border-top:1px solid var(--border)}
      .planning-history-r71-dot{width:9px;height:9px;border-radius:50%;background:var(--primary);margin-top:6px;box-shadow:0 0 0 4px var(--primary-soft)}
      .planning-history-r71-body{min-width:0;display:grid;gap:4px}
      .planning-history-r71-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .planning-history-r71-head strong{font-size:.74rem;color:var(--text)}
      .planning-history-r71-head time{font-size:.61rem;color:var(--muted);white-space:nowrap}
      .planning-history-r71-body p{margin:0;font-size:.66rem;color:var(--text);line-height:1.4}
      .planning-history-r71-body span{font-size:.62rem;color:var(--muted)}
      .planning-history-r71-state{min-height:150px;display:grid;place-items:center;color:var(--muted);font-size:.72rem}

      @media(max-width:900px){
        .planning-detail-page .account-contact-card-r70 .account-person-row.account-person-inline-r71{
          grid-template-columns:44px minmax(0,1fr)!important;
        }
        .planning-detail-page .account-person-inline-r71>.account-person-emergency-inline-r71{
          grid-column:2;grid-row:2;padding:12px 0 0;border-left:0;border-top:1px solid var(--border)
        }
      }
      @media(max-width:640px){
        .planning-history-r71-head{display:grid;gap:3px}.planning-history-r71-head time{white-space:normal}
      }
    `;
    document.head.appendChild(style);
  }

  const safe=value=>encodeURIComponent(String(value??''));
  const HISTORY_BROWSER_CACHE_MS=60*60*1000;
  const HISTORY_BROWSER_PREFIX='oleiro.admin.history.v1.';
  const asDate=value=>{if(!value)return null;if(typeof value?.toDate==='function')return value.toDate();const d=new Date(value);return Number.isNaN(d.getTime())?null:d};
  function when(value){const d=asDate(value);if(!d)return '—';const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';return new Intl.DateTimeFormat(locale,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)}
  function eventLabel(type){const map={candidate_created:'Perfil criado',planning_submitted:'Planejamento enviado',planning_approved:'Planejamento aprovado',meeting_scheduled:'Reunião agendada',meeting_completed:'Reunião realizada',candidate_approved:'Candidato aprovado',candidate_rejected:'Candidato não aprovado',activity_created:'Atividade criada',activity_updated:'Atividade atualizada',activity_feedback_added:'Feedback adicionado',activity_feedback_updated:'Feedback atualizado',session_moved:'Atividade movida',adjustment_requested:'Ajuste solicitado',stay_dates_changed:'Período alterado',post_proposal_reviewed:'Proposta revisada'};const key=String(type||'');return map[key]||key.replaceAll('_',' ').replace(/^./,c=>c.toUpperCase())||'Evento'}
  function usableActorName(value){const actor=String(value||'').trim();return !!actor&&actor!=='Registro anterior'&&!actor.includes('@')}
  function historyAuthor(row){const actor=String(row?.actorLabel||'').trim();if(usableActorName(actor))return actor;if(String(row?.actorRole||'').toLowerCase()==='system'&&!row?.actorUid)return 'Sistema';return 'Autor não registrado'}
  async function resolveHistoryActors(rows){
    const source=(rows||[]).map(row=>({...row})),uids=[...new Set(source.filter(row=>row?.actorUid&&!usableActorName(row.actorLabel)&&String(row.actorRole||'').toLowerCase()!=='system').map(row=>String(row.actorUid)))];
    if(!uids.length||!window.OleiroServices?.users?.getByIds)return source;
    try{
      const users=await window.OleiroServices.users.getByIds(uids),byId=new Map((users||[]).filter(user=>!user?.missing).map(user=>[String(user.id),String(user.displayName||user.name||'').trim()]));
      source.forEach(row=>{const name=byId.get(String(row.actorUid||''));if(name)row.actorLabel=name});
    }catch(error){console.warn('Não foi possível resolver os autores do histórico:',error)}
    return source;
  }
  function metadata(row){const m=row?.metadata||{};if(row?.type==='meeting_scheduled')return [m.date,m.time].filter(Boolean).join(' • ');if(row?.type==='session_moved')return [m.date,m.period].filter(Boolean).join(' • ');if(row?.type==='stay_dates_changed')return m.stayStart&&m.stayEnd?`${m.stayStart} → ${m.stayEnd}`:'';return m.activityName||m.date||''}
  function legacyRows(p){const rows=[],push=(type,date)=>{if(date)rows.push({id:`legacy-${type}`,type,createdAt:date,actorRole:'',actorLabel:'Autor não registrado',metadata:{}})};push('candidate_created',p?.createdAt);push('planning_submitted',p?.planningSubmittedAt);push('planning_approved',p?.planningApprovedAt);push('meeting_scheduled',p?.meetingScheduledAt);push('meeting_completed',p?.meetingCompletedAt);if(p?.finalDecisionAt)push(p.finalDecision==='approved'?'candidate_approved':'candidate_rejected',p.finalDecisionAt);return rows}
  function mergeRows(p,rows){const persisted=rows||[],types=new Set(persisted.map(row=>row.type));return [...persisted,...legacyRows(p).filter(row=>!types.has(row.type))].sort((a,b)=>(asDate(b.createdAt)?.getTime()||0)-(asDate(a.createdAt)?.getTime()||0))}
  function browserHistoryKey(id){return HISTORY_BROWSER_PREFIX+String(id||'')}
  function browserHistoryRead(id){
    try{
      const record=JSON.parse(sessionStorage.getItem(browserHistoryKey(id))||'null');
      if(!record||Date.now()-Number(record.savedAt||0)>HISTORY_BROWSER_CACHE_MS){sessionStorage.removeItem(browserHistoryKey(id));return null}
      return {items:Array.isArray(record.items)?record.items:[],loadedAt:Number(record.loadedAt||record.savedAt||0)};
    }catch{return null}
  }
  function browserHistoryWrite(id,items,loadedAt=Date.now()){
    try{
      const normalized=(items||[]).map(row=>{const date=asDate(row?.createdAt);return {...row,createdAt:date?date.toISOString():row?.createdAt}});
      sessionStorage.setItem(browserHistoryKey(id),JSON.stringify({savedAt:Date.now(),loadedAt,items:normalized}));
    }catch{}
  }
  function browserHistoryClear(id){try{sessionStorage.removeItem(browserHistoryKey(id))}catch{}}
  function historyTabs(p){const id=safe(p.id);return `<div class="person-refactor-tabs person-history-tabs planning-profile-tabs"><button type="button" onclick="openPerson(decodeURIComponent('${id}'),'plan')">Planejamento</button><button type="button" onclick="openPerson(decodeURIComponent('${id}'),'account')">Conta</button><button class="active" type="button" data-r71-history-tab="1">Histórico</button></div>`}
  function historyHtml(p,rows,{loading=false,error=''}={}){
    let content='';
    if(loading)content='<div class="planning-history-r71-state"><span><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando histórico...</span></div>';
    else if(error)content=`<div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div>${escapeHtml(error)}</div></div>`;
    else if(!rows.length)content='<div class="planning-history-r71-state"><span><i class="fa-regular fa-clock"></i> Nenhum evento registrado ainda.</span></div>';
    else content=`<div class="planning-history-r71-list">${rows.map(row=>{const meta=metadata(row),who=historyAuthor(row);return `<article class="planning-history-r71-event"><div class="planning-history-r71-dot"></div><div class="planning-history-r71-body"><div class="planning-history-r71-head"><strong>${escapeHtml(eventLabel(row.type))}</strong><time>${escapeHtml(when(row.createdAt))}</time></div>${meta?`<p data-no-i18n>${escapeHtml(meta)}</p>`:''}<span>${escapeHtml(who)}</span></div></article>`}).join('')}</div>`;
    return `<section class="candidate-history-panel planning-history-r71"><div class="section-head"><div><h3>Histórico do candidato</h3><p>Ações e mudanças registradas neste processo.</p></div></div>${content}</section>`;
  }
  function renderHistory(p,rows,opts={}){
    state.managerPage='planning';
    state.managerPlanningPersonId=String(p.id);
    state.managerPlanningTab='history';
    state.managerPlanningLoading=false;
    state.managerPlanningBody=historyHtml(p,rows,opts);
    render();
  }
  async function openHistory(id){
    const p=typeof candidateById==='function'?candidateById(id):null;if(!p)return;
    const sameHistory=state.managerPage==='planning'&&String(state.managerPlanningPersonId||'')===String(p.id)&&state.managerPlanningTab==='history';
    /* Aba ativa: absolutamente nada acontece. */
    if(sameHistory)return;
    const previousTab=String(state.managerPlanningTab||'plan');
    state.adminHistoryCache=state.adminHistoryCache||{};
    let cached=state.adminHistoryCache[String(p.id)];
    if(!cached?.loadedAt){
      const browser=browserHistoryRead(p.id);
      if(browser){cached={items:browser.items,loadedAt:browser.loadedAt,cursor:null,hasMore:false,loading:false,error:''};state.adminHistoryCache[String(p.id)]=cached}
    }
    const cachedRows=mergeRows(p,Array.isArray(cached?.items)?cached.items:[]);
    const fresh=!!cached?.loadedAt&&Date.now()-Number(cached.loadedAt)<HISTORY_BROWSER_CACHE_MS;
    window.OleiroUI?.prepareTabTransition?.(previousTab,'history');
    renderHistory(p,cachedRows,{loading:!cached?.loadedAt});
    window.OleiroUI?.finishTabTransition?.();
    if(fresh)return;
    try{
      if(!window.OleiroServices?.history?.list){
        if(!cached?.loadedAt&&state.managerPlanningTab==='history')renderHistory(p,cachedRows);
        return
      }
      const result=await window.OleiroServices.history.list(p.id,{limit:50,cursor:null});
      const source=await resolveHistoryActors(result?.items||[]),rows=mergeRows(p,source);
      state.adminHistoryCache=state.adminHistoryCache||{};
      const loadedAt=Date.now();
      state.adminHistoryCache[String(p.id)]={items:source,cursor:result?.nextCursor||null,hasMore:!!result?.hasMore,loadedAt,loading:false,error:''};
      browserHistoryWrite(p.id,source,loadedAt);
      if(state.managerPage==='planning'&&String(state.managerPlanningPersonId)===String(p.id)&&state.managerPlanningTab==='history'){
        state.managerPlanningBody=historyHtml(p,rows,{});
        render();
      }
    }catch(error){
      console.error('Falha ao carregar histórico R71:',error);
      if(state.managerPage==='planning'&&String(state.managerPlanningPersonId)===String(p.id)&&state.managerPlanningTab==='history'){
        state.managerPlanningBody=historyHtml(p,cachedRows,{error:'Não foi possível carregar o histórico.'});
        render();
      }
    }
  }
  window.openPlanningHistoryR71=openHistory;
  window.OleiroUI=window.OleiroUI||{};
  window.OleiroUI.invalidateHistoryCache=id=>{if(!id)return;browserHistoryClear(id);if(state.adminHistoryCache)delete state.adminHistoryCache[String(id)]};
  const historyService=window.OleiroServices?.history;
  if(historyService?.append&&!historyService.append.__browserCacheWrapped){
    const baseAppend=historyService.append.bind(historyService);
    const wrapped=async function(applicationId,...args){const result=await baseAppend(applicationId,...args);window.OleiroUI?.invalidateHistoryCache?.(applicationId);return result};
    wrapped.__browserCacheWrapped=true;historyService.append=wrapped;
  }

  const baseOpenPerson=typeof window.openPerson==='function'?window.openPerson:null;
  if(baseOpenPerson){
    openPerson=async function(id,tab='plan'){
      if(tab==='history')return openHistory(id);
      return baseOpenPerson(id,tab);
    };
    window.openPerson=openPerson;
  }

  function normalizeAccessText(text){const value=String(text||'').trim();if(/ainda não/i.test(value))return 'Ainda não realizou acesso';if(/primeiro acesso|já realizado|realizado/i.test(value))return 'Primeiro acesso realizado';return value||'Status de acesso indisponível'}
  function postProcessAccount(){
    if(typeof state==='undefined'||state.managerPage!=='planning'||state.managerPlanningTab!=='account')return;
    const root=document.querySelector('.planning-detail-page .account-contact-card-r70');if(!root)return;
    [...root.querySelectorAll('.account-person-row')].forEach(row=>{
      if(row.classList.contains('account-person-inline-r71'))return;
      const detail=row.querySelector(':scope > div:last-child');
      const sections=detail?.querySelector('.account-person-sections-r70');
      if(!detail||!sections)return;
      detail.classList.add('account-person-main-r71');
      const emergency=sections.querySelector('.account-person-emergency-r70');
      const access=sections.querySelector('.account-access-status-r70 span')?.textContent||'';
      if(emergency){emergency.classList.remove('account-person-section-r70','account-person-emergency-r70');emergency.classList.add('account-person-emergency-inline-r71');row.appendChild(emergency)}
      const accessLine=document.createElement('span');accessLine.className='account-access-plain-r71';accessLine.textContent=normalizeAccessText(access);
      const gender=detail.querySelector('.account-person-gender');
      if(gender)gender.insertAdjacentElement('afterend',accessLine);else detail.appendChild(accessLine);
      sections.remove();row.classList.add('account-person-inline-r71');
    });
  }

  function rewriteHistoryButtons(){
    const p=typeof candidateById==='function'?candidateById(state.managerPlanningPersonId):null;if(!p)return;
    document.querySelectorAll('.planning-profile-tabs button,.person-history-tabs button').forEach(button=>{
      if(String(button.textContent||'').trim().toLowerCase()!=='histórico')return;
      button.dataset.r71HistoryTab='1';button.removeAttribute('onclick');
    });
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button[data-r71-history-tab],.planning-profile-tabs button,.person-history-tabs button');
    if(!button||String(button.textContent||'').trim().toLowerCase()!=='histórico')return;
    const p=typeof candidateById==='function'?candidateById(state.managerPlanningPersonId):null;if(!p)return;
    event.preventDefault();event.stopImmediatePropagation();openHistory(p.id);
  },true);

  const baseRenderManager=typeof window.renderManager==='function'?window.renderManager:null;
  if(baseRenderManager){
    renderManager=function(){const result=baseRenderManager();queueMicrotask(()=>{postProcessAccount();rewriteHistoryButtons()});requestAnimationFrame(()=>{postProcessAccount();rewriteHistoryButtons()});return result};
    window.renderManager=renderManager;render=function(){return renderManager()};window.render=render;
  }

  installStyles();
  requestAnimationFrame(()=>{postProcessAccount();rewriteHistoryButtons()});
})();
