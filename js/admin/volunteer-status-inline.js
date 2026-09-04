/* Status e prazo do voluntário na mesma linha da listagem administrativa. */
(function volunteerStatusInline(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_VOLUNTEER_STATUS_INLINE__)return;
  window.__OLEIRO_VOLUNTEER_STATUS_INLINE__=true;

  function installStyles(){
    if(document.getElementById('volunteerStatusInlineStyles'))return;
    const style=document.createElement('style');
    style.id='volunteerStatusInlineStyles';
    style.textContent=`
      .volunteer-name-status{display:flex;align-items:center;gap:8px;min-width:0;margin-bottom:2px}
      .volunteer-name-status>h3{margin:0;min-width:0}
      .volunteer-status-badges{display:flex;align-items:center;gap:7px;flex:0 0 auto;white-space:nowrap}
      .volunteer-status-badges .badge{margin:0;flex:0 0 auto}
      .volunteer-status-badges .candidate-deadline-mini{display:inline-flex!important;align-items:center;gap:4px;margin:0!important;color:var(--warning-text,#a56700);font-size:.62rem;line-height:1.2;font-weight:600;white-space:nowrap}
      .volunteer-status-badges .candidate-deadline-mini i{font-size:.58rem}
      @media(min-width:641px){
        .volunteer-list-page .volunteer-name-status,
        .planning-candidate-list .volunteer-name-status{flex-wrap:nowrap}
        .volunteer-list-page .volunteer-name-status>h3,
        .planning-candidate-list .volunteer-name-status>h3{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      }
      @media(max-width:640px){
        .volunteer-name-status{align-items:flex-start;flex-wrap:wrap;gap:6px}
        .volunteer-status-badges{gap:6px;flex-wrap:wrap}
        .volunteer-status-badges .badge{font-size:.62rem}
        .volunteer-status-badges .candidate-deadline-mini{font-size:.58rem}
      }
    `;
    document.head.appendChild(style);
  }

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const statusBadge=(label,type)=>typeof badge==='function'?badge(label,type):`<span class="badge ${esc(type||'')}">${esc(label||'Status')}</span>`;
  const actionArg=id=>typeof candidateActionArg==='function'?candidateActionArg(id):encodeURIComponent(String(id??''));

  personCompact=function(p){
    const meta=typeof candidateDeadlineMeta==='function'&&p?.status==='pending'?candidateDeadlineMeta(p):null;
    const status=typeof statusMeta==='function'?statusMeta(p?.status):[p?.status||'Status',''];
    const inactive=p?.inactive&&p?.status!=='rejected'?statusBadge('Inativo','danger'):'';
    const deadline=meta?`<span class="candidate-deadline-mini"><i class="fa-regular fa-clock"></i>${esc(meta.label)}</span>`:'';
    const period=p?.from&&p?.to&&typeof fmtDate==='function'?`${fmtDate(p.from,true)}–${fmtDate(p.to,true)}`:'Período não informado';
    const initials=String(p?.name||'V').split(/\s+/).filter(Boolean).map(part=>part[0]).slice(0,2).join('').toUpperCase();
    const id=actionArg(p?.id);
    return `<div class="list-item clickable" onclick="openPerson(decodeURIComponent('${id}'))"><div class="avatar">${esc(initials)}</div><div class="item-main"><div class="volunteer-name-status"><h3>${esc(p?.name||'Voluntário')}</h3><div class="volunteer-status-badges">${statusBadge(status?.[0]||'Status',status?.[1]||'')}${deadline}${inactive}</div></div><p>${esc(p?.country||'—')} • ${esc(p?.unit||p?.unitName||'—')} • ${esc(period)}</p></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);margin-top:11px"></i></div>`;
  };
  window.personCompact=personCompact;

  installStyles();
  if(typeof state!=='undefined'&&state.role==='manager'&&['volunteer','planning'].includes(state.managerPage)&&typeof render==='function')render();
})();
