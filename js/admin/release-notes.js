/* Atualizações administrativas: mesma fonte de releases do Portal, com público explícito. */
(function adminReleaseNotes(){
  if(!location.pathname.includes('/admin/')||window.__OLEIRO_ADMIN_RELEASE_NOTES__)return;
  window.__OLEIRO_ADMIN_RELEASE_NOTES__=true;
  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let meta=null,releases=[],latest=null,loaded=false,loading=null,popupOpened=false;
  const audienceOf=release=>Array.isArray(release?.audience)&&release.audience.length?release.audience:['volunteer'];
  const uid=()=>String(state?.currentSession?.uid||'anon');
  const seenKey=()=>`oleiro.admin.release-notes.seen.v1:${uid()}`;
  const seen=()=>{try{return localStorage.getItem(seenKey())===String(latest?.id||'')}catch{return false}};
  const markSeen=()=>{try{localStorage.setItem(seenKey(),String(latest?.id||''))}catch{}};
  const dateLabel=value=>{if(!value)return '';const date=String(value).slice(0,10);const parsed=new Date(date+'T12:00:00');return Number.isNaN(parsed.getTime())?date:new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric'}).format(parsed)};
  const version=()=>String(latest?.version||meta?.build||'—');
  const itemHtml=item=>`<div class="admin-release-item"><span><i class="fa-solid ${esc(item.icon||'fa-check')}"></i></span><div><strong>${esc(item.title||'Atualização')}</strong><p>${esc(item.text||'')}</p></div></div>`;
  function installStyles(){
    if(document.getElementById('adminReleaseNotesStyles'))return;
    const style=document.createElement('style');style.id='adminReleaseNotesStyles';style.textContent=`
      .admin-account-release .release-info{display:grid;gap:7px}
      .admin-account-release .release-info p{margin:0;color:var(--muted);font-size:.62rem;line-height:1.45}
      .admin-account-release .release-info strong{color:var(--text)}
      .admin-release-details{display:inline-flex;align-items:center;gap:7px;width:max-content;border:0;background:none;padding:2px 0;color:var(--primary);font:inherit;font-size:.62rem;font-weight:700;cursor:pointer}
      .admin-release-modal{display:grid;gap:14px}
      .admin-release-intro{display:grid;grid-template-columns:46px minmax(0,1fr);gap:12px;align-items:start}
      .admin-release-icon{width:46px;height:46px;border-radius:14px;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center}
      .admin-release-intro small{display:block;margin-bottom:3px;color:var(--primary);font-size:.56rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
      .admin-release-intro small span{margin-left:5px;color:var(--muted);letter-spacing:0;text-transform:none}
      .admin-release-intro strong{display:block;font-size:.86rem;color:var(--text)}
      .admin-release-intro p{margin-top:4px;color:var(--muted);font-size:.65rem;line-height:1.45}
      .admin-release-items{display:grid;gap:8px}
      .admin-release-item{display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;align-items:start;padding:11px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}
      .admin-release-item>span{width:38px;height:38px;border-radius:11px;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center}
      .admin-release-item strong{display:block;font-size:.69rem;line-height:1.3}
      .admin-release-item p{margin-top:3px;color:var(--muted);font-size:.61rem;line-height:1.45}
      .admin-release-history{display:grid;gap:8px}
      .admin-release-history>strong{font-size:.7rem}
      .admin-release-history details{border:1px solid var(--border);border-radius:12px;padding:10px}
      .admin-release-history summary{cursor:pointer;font-size:.65rem;font-weight:700}
      .admin-release-history details>p{margin:7px 0;color:var(--muted);font-size:.61rem;line-height:1.4}
      @media(max-width:520px){.admin-release-modal{gap:12px}}
    `;document.head.appendChild(style);
  }
  function releaseInformationHtml(){
    if(!loaded)return '<div class="release-info"><p>Carregando informações da versão...</p></div>';
    const published=dateLabel(latest?.publishedAt||meta?.publishedAt);
    return `<div class="release-info">
      <p><strong>Versão:</strong> ${esc(version())}</p>
      <p><strong>Última atualização:</strong> ${esc(latest?.summary||'Informações da versão disponíveis.')}</p>
      ${published?`<p><strong>Publicado em:</strong> ${esc(published)}</p>`:''}
    </div>`;
  }
  function modalBody(){
    const items=Array.isArray(latest?.items)?latest.items:[];
    const history=releases.slice(1);
    return `<div class="admin-release-modal">
      <div class="admin-release-intro"><span class="admin-release-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></span><div><small>${esc(latest?.eyebrow||'Atualização do sistema')} <span>Versão ${esc(version())}</span></small><strong>${esc(latest?.title||'O que mudou?')}</strong><p>${esc(latest?.summary||'Confira as melhorias desta versão.')}</p></div></div>
      ${items.length?`<div class="admin-release-items">${items.map(itemHtml).join('')}</div>`: '<p>Esta versão contém melhorias técnicas e ajustes de estabilidade.</p>'}
      ${history.length?`<div class="admin-release-history"><strong>Atualizações anteriores</strong>${history.map(item=>`<details><summary>Versão ${esc(item.version||'')} · ${esc(item.title||'Atualização')}</summary><p>${esc(item.summary||'')}</p><div class="admin-release-items">${(Array.isArray(item.items)?item.items:[]).map(itemHtml).join('')}</div></details>`).join('')}</div>`:''}
    </div>`;
  }
  window.openAdminReleaseNotes=function(){
    if(!loaded||!latest)return;
    markSeen();
    const footer='<div class="release-notes-actions"><button class="btn btn-primary" type="button" onclick="closeModal()">Entendi</button></div>';
    openModal('O que mudou?','',modalBody(),footer);
    modalRoot?.querySelector?.('.modal')?.classList.add('modal-wide');
  };
  function maybeAnnounce(){
    if(popupOpened||!loaded||!latest||!audienceOf(latest).includes('admin')||!state?.currentSession?.uid||state.role!=='manager'||state.managerPage!=='home'||seen())return;
    popupOpened=true;
    setTimeout(()=>{if(state?.role==='manager'&&state?.managerPage==='home'&&!seen())window.openAdminReleaseNotes()},500);
  }
  async function load(){
    if(loading)return loading;
    loading=Promise.all([
      fetch('../release.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch('../release-notes.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
    ]).then(([releaseMeta,notes])=>{
      meta=releaseMeta||null;releases=Array.isArray(notes?.releases)?notes.releases:[];latest=releases[0]||null;loaded=true;
      if(typeof window.releaseInformationHtml==='function')window.releaseInformationHtml=releaseInformationHtml;
      else window.releaseInformationHtml=releaseInformationHtml;
      maybeAnnounce();return latest;
    }).finally(()=>{loading=null});
    return loading;
  }
  installStyles();
  window.releaseInformationHtml=releaseInformationHtml;
  load();
  let attempts=0;
  const waitForSession=()=>{if(state?.role==='manager'&&state?.currentSession?.uid){maybeAnnounce();return}if(++attempts<80)setTimeout(waitForSession,500)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitForSession,{once:true});else setTimeout(waitForSession,500);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(!loaded)load();maybeAnnounce()}});
})();