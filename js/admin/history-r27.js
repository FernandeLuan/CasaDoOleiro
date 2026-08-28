/* Round 27 — terceira aba do perfil: Planejamento | Conta | Histórico.
   O histórico é lazy: nenhuma leitura ocorre até o Admin abrir a aba. */
(function adminHistoryR27(){
  if(typeof renderPersonModal!=='function'||typeof openPerson!=='function')return;
  const CACHE_MS=60*1000,PAGE_SIZE=20;
  state.adminHistoryCache=state.adminHistoryCache||{};
  const baseRenderPersonModal=renderPersonModal,baseOpenPerson=openPerson;
  const tx=(key,fallback)=>typeof t==='function'?t(key):fallback;
  const safe=value=>encodeURIComponent(String(value??''));

  function roleLabel(role){const value=String(role||'').toLowerCase();if(value==='coordinator')return tx('role.coordinator','Coordenador');if(value==='volunteer')return tx('role.volunteer','Voluntário');if(value==='system')return 'Sistema';return tx('role.admin','Administrador')}
  function eventLabel(type){return tx(`history.${String(type||'')}`,String(type||'Evento').replaceAll('_',' '))}
  function asDate(value){if(!value)return null;if(typeof value.toDate==='function')return value.toDate();const parsed=new Date(value);return Number.isNaN(parsed.getTime())?null:parsed}
  function when(value){const date=asDate(value);if(!date)return '—';const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';return new Intl.DateTimeFormat(locale,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(date)}
  function metadataLine(row){const m=row?.metadata||{};switch(row.type){
    case 'meeting_scheduled':return [m.date,m.time].filter(Boolean).join(' • ');
    case 'adjustment_requested':return m.date?`Data: ${m.date}`:'';
    case 'stay_dates_changed':return m.stayStart&&m.stayEnd?`${m.stayStart} → ${m.stayEnd}`:'';
    case 'activity_created':case 'activity_updated':return m.activityName||'';
    case 'post_proposal_reviewed':return m.decision?`Decisão: ${m.decision}`:'';
    default:return '';
  }}
  function legacyEvents(p){
    const rows=[];const push=(type,date)=>{if(date)rows.push({id:`legacy-${type}`,type,createdAt:date,actorRole:'system',actorLabel:'Registro anterior',metadata:{},legacy:true})};
    push('candidate_created',p.createdAt);push('planning_submitted',p.planningSubmittedAt);push('planning_approved',p.planningApprovedAt);
    push('meeting_scheduled',p.meetingScheduledAt);push('meeting_completed',p.meetingCompletedAt);
    if(p.finalDecisionAt)push(p.finalDecision==='approved'?'candidate_approved':'candidate_rejected',p.finalDecisionAt);
    return rows;
  }
  function mergedRows(p,entry){
    const persisted=entry?.items||[],types=new Set(persisted.map(row=>row.type));
    return [...persisted,...legacyEvents(p).filter(row=>!types.has(row.type))].sort((a,b)=>(asDate(b.createdAt)?.getTime()||0)-(asDate(a.createdAt)?.getTime()||0));
  }
  function tabs(p,tab){const id=safe(p.id);return `<div class="person-refactor-tabs person-history-tabs"><button class="${tab==='plan'?'active':''}" type="button" onclick="openPerson(decodeURIComponent('${id}'),'plan')"><i class="fa-regular fa-calendar-check"></i>Planejamento</button><button class="${tab==='account'?'active':''}" type="button" onclick="openPerson(decodeURIComponent('${id}'),'account')"><i class="fa-regular fa-user"></i>Conta</button><button class="${tab==='history'?'active':''}" type="button" onclick="openPerson(decodeURIComponent('${id}'),'history')"><i class="fa-solid fa-clock-rotate-left"></i>${escapeHtml(tx('history.tab','Histórico'))}</button></div>`}
  function historyContent(p){
    const entry=state.adminHistoryCache[String(p.id)]||{},rows=mergedRows(p,entry);
    if(entry.loading&&!rows.length)return `<div class="history-state"><i class="fa-solid fa-circle-notch fa-spin"></i>${escapeHtml(tx('history.loading','Carregando histórico...'))}</div>`;
    if(entry.error&&!rows.length)return `<div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div>${escapeHtml(tx('history.error','Não foi possível carregar o histórico.'))}</div></div>`;
    if(!rows.length&&entry.loadedAt)return `<div class="history-state"><i class="fa-regular fa-clock"></i>${escapeHtml(tx('history.empty','Nenhum evento registrado ainda.'))}</div>`;
    const list=rows.map(row=>{const meta=metadataLine(row),actor=String(row.actorLabel||'').trim(),who=actor?`${actor} • ${roleLabel(row.actorRole)}`:roleLabel(row.actorRole);return `<article class="history-event"><div class="history-event-dot"></div><div class="history-event-body"><div class="history-event-head"><strong>${escapeHtml(eventLabel(row.type))}</strong><time>${escapeHtml(when(row.createdAt))}</time></div>${meta?`<p data-no-i18n>${escapeHtml(meta)}</p>`:''}<span>${escapeHtml(who)}</span></div></article>`}).join('');
    const more=entry.hasMore?`<button class="btn btn-soft btn-block history-load-more" type="button" onclick="loadMoreCandidateHistory('${safe(p.id)}')" ${entry.loading?'disabled':''}><i class="fa-solid ${entry.loading?'fa-circle-notch fa-spin':'fa-chevron-down'}"></i>${escapeHtml(tx('history.more','Carregar mais eventos'))}</button>`:'';
    return `<div class="history-list">${list}</div>${more}`;
  }
  function renderHistory(p){
    const body=`${tabs(p,'history')}<section class="candidate-history-panel"><div class="section-head"><div><h3>${escapeHtml(tx('history.title','Histórico do candidato'))}</h3><p>${escapeHtml(tx('history.subtitle','Ações e mudanças registradas neste processo.'))}</p></div></div>${historyContent(p)}</section>`;
    openModal(p.name,`${escapeHtml(p.country||'—')} • ${escapeHtml(p.unit||p.unitName||'—')}`,body);modalRoot.dataset.personId=String(p.id);modalRoot.dataset.personTab='history';modalRoot.querySelector('.modal')?.classList.add('person-modal','person-refactor-modal','person-history-modal');
  }
  function injectHistoryTab(p,tab){
    const root=modalRoot.querySelector('.person-refactor-tabs');if(!root||root.querySelector('[data-history-tab]'))return;
    const button=document.createElement('button');button.type='button';button.dataset.historyTab='1';button.className=tab==='history'?'active':'';button.innerHTML=`<i class="fa-solid fa-clock-rotate-left"></i>${escapeHtml(tx('history.tab','Histórico'))}`;button.onclick=()=>openPerson(String(p.id),'history');root.append(button);
  }
  async function hydrate(p,{append=false,force=false}={}){
    const key=String(p.id),entry=state.adminHistoryCache[key]||{items:[],cursor:null,hasMore:false,loadedAt:0,loading:false,error:''};
    if(entry.loading)return;if(!append&&!force&&entry.loadedAt&&Date.now()-entry.loadedAt<CACHE_MS)return;
    entry.loading=true;entry.error='';state.adminHistoryCache[key]=entry;renderHistory(p);
    try{
      const result=await window.OleiroServices.history.list(p.id,{limit:PAGE_SIZE,cursor:append?entry.cursor:null});
      const byId=new Map((append?entry.items:[]).map(row=>[String(row.id),row]));(result.items||[]).forEach(row=>byId.set(String(row.id),row));
      entry.items=[...byId.values()];entry.cursor=result.nextCursor||null;entry.hasMore=!!result.hasMore;entry.loadedAt=Date.now();
    }catch(error){console.error('Falha ao carregar histórico:',error);entry.error=error?.message||'history-error'}finally{entry.loading=false;if(modalRoot.dataset.personId===key&&modalRoot.dataset.personTab==='history')renderHistory(p)}
  }

  renderPersonModal=function(p,tab='plan'){
    if(tab==='history'){renderHistory(p);return}
    const result=baseRenderPersonModal(p,tab);injectHistoryTab(p,tab);return result;
  };
  openPerson=async function(id,tab='plan'){
    if(tab!=='history'){const result=await baseOpenPerson(id,tab);const p=candidateById(id);if(p)injectHistoryTab(p,tab);return result}
    const p=candidateById(id);if(!p)return;renderHistory(p);await hydrate(p);
  };
  window.loadMoreCandidateHistory=async function(encodedId){const id=decodeURIComponent(encodedId),p=candidateById(id);if(p)await hydrate(p,{append:true,force:true})};
  window.renderPersonModal=renderPersonModal;window.openPerson=openPerson;
})();
