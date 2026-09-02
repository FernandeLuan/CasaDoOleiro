/* R59 — refinamento visual sobre as funções reais. Não altera regras de negócio. */
(function redesignR59(){
  function safe(value){return typeof escapeHtml==='function'?escapeHtml(value):String(value??'')}
  function installAdmin(){
    if(typeof window.personCompact!=='function'&&typeof personCompact!=='function')return;
    const statusInfo=p=>{try{return statusMeta(p.status)}catch{return [p.status||'—','']}};
    window.personCompact=personCompact=function(p){
      const [label,type]=statusInfo(p),meta=p.status==='pending'&&typeof candidateDeadlineMeta==='function'?candidateDeadlineMeta(p):null;
      const inactive=p.inactive&&p.status!=='rejected'&&typeof badge==='function'?badge('Inativo','danger'):'';
      const statusBadge=typeof badge==='function'?badge(label,type):`<span class="badge">${safe(label)}</span>`;
      const period=p.from&&p.to&&typeof fmtDate==='function'?`${fmtDate(p.from,true)} – ${fmtDate(p.to,true)}`:'Período não informado';
      const id=typeof candidateActionArg==='function'?candidateActionArg(p.id):encodeURIComponent(String(p.id));
      const initials=String(p.name||'V').split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase();
      return `<article class="r59-candidate-row" role="button" tabindex="0" onclick="openPerson(decodeURIComponent('${id}'))" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openPerson(decodeURIComponent('${id}'))}">
        <div class="r59-person"><div class="avatar">${safe(initials)}</div><div class="r59-person-copy"><strong>${safe(p.name||'Voluntário')}</strong><span>${safe(p.country||'—')}${p.type==='couple'?' • Dupla':''}</span></div></div>
        <div class="r59-cell r59-unit"><strong>${safe(p.unit||p.unitName||p.unitId||'—')}</strong><small>Unidade</small></div>
        <div class="r59-cell r59-stay"><strong>${safe(period)}</strong><small>Estadia</small>${meta?`<small>${safe(meta.label)}</small>`:''}</div>
        <div class="r59-status-cell"><div class="item-meta">${statusBadge}${inactive}</div></div>
        <i class="fa-solid fa-chevron-right r59-row-chevron" aria-hidden="true"></i>
      </article>`;
    };
    window.candidateListHtml=candidateListHtml=function(list){
      if(state.candidateLoading&&!list.length)return `<div class="empty compact-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando voluntários...</div>`;
      if(!list.length)return `<div class="empty"><i class="fa-regular fa-folder-open"></i>Nenhum perfil encontrado com esses filtros.</div>`;
      const rows=list.map(personCompact).join('');
      const more=state.candidateHasMore?`<button class="btn btn-soft btn-block candidate-load-more" type="button" onclick="loadMoreCandidates()" ${state.candidateLoading?'disabled':''}><i class="fa-solid ${state.candidateLoading?'fa-circle-notch fa-spin':'fa-chevron-down'}"></i>${state.candidateLoading?'Carregando...':'Ver mais 10'}</button>`:'';
      return `<div class="r59-candidate-table"><div class="r59-candidate-table-head"><span>Voluntário</span><span>Unidade</span><span>Estadia</span><span>Status</span><span></span></div>${rows}</div>${more}`;
    };
    if(typeof managerVolunteers==='function'){
      const base=managerVolunteers;
      window.managerVolunteers=managerVolunteers=function(){
        let html=base();
        const marker='<section class="section volunteer-list-page compact-page-top">';
        const head='<div class="section-title r59-page-heading"><div><span class="eyebrow">Gestão de pessoas</span><h2>Voluntariado</h2><p class="compact-hint">Acompanhe candidatos, planejamentos, reuniões e voluntários aprovados.</p></div></div>';
        if(html.includes(marker))html=html.replace(marker,marker+head);
        return html;
      };
    }
  }
  function installShared(){
    document.documentElement.classList.add('redesign-r59');
  }
  function install(){installShared();try{installAdmin()}catch(error){console.warn('R59 admin visual patch:',error)}if(typeof render==='function')try{render()}catch{}
  }
  if(document.readyState==='loading')setTimeout(install,0);else install();
})();
