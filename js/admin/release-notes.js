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
  const publishedAtLabel=value=>{
    if(!value)return '';
    const raw=String(value),hasTime=raw.length>10,date=new Date(hasTime?raw:`${raw.slice(0,10)}T12:00:00`);
    if(Number.isNaN(date.getTime()))return '';
    return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(date);
  };
  const version=()=>String(latest?.version||meta?.build||'—');
  const itemHtml=item=>`<div class="admin-release-item"><span><i class="fa-solid ${esc(item.icon||'fa-check')}"></i></span><div><strong>${esc(item.title||'Atualização')}</strong><p>${esc(item.text||'')}</p></div></div>`;
  function installStyles(){
    if(document.getElementById('adminReleaseNotesStyles'))return;
    const style=document.createElement('style');style.id='adminReleaseNotesStyles';style.textContent=`
      .admin-account-release .release-info{display:grid;gap:7px}
      .admin-account-release .admin-release-version-whatsnew{grid-column:1/-1;display:grid;gap:7px}
      .admin-account-release .admin-release-version-whatsnew>strong{font-size:.6rem;color:var(--text)}
      .admin-account-release .admin-release-items{display:grid;gap:7px}
      .admin-account-release .admin-release-item{padding:8px;border-radius:10px}
      .admin-account-release .admin-release-item>span{width:30px;height:30px;border-radius:9px}
      .admin-account-release .admin-release-item strong{font-size:.59rem}
      .admin-account-release .admin-release-item p{font-size:.54rem;line-height:1.4}
      .admin-account-release .release-info p{margin:0;color:var(--muted);font-size:.62rem;line-height:1.45}
      .admin-account-release .release-info strong{color:var(--text)}
      .admin-release-details{display:inline-flex;align-items:center;gap:7px;width:max-content;border:0;background:none;padding:2px 0;color:var(--primary);font:inherit;font-size:.62rem;font-weight:700;cursor:pointer}
      .admin-release-modal{display:grid;gap:14px}
      .admin-release-modal,.admin-release-modal p{font-family:var(--font-body)!important}
      .admin-release-modal p{margin:0;color:var(--text);font-size:.84rem;line-height:1.55;letter-spacing:0}
      .admin-release-modal p+p{margin-top:2px}
      .admin-release-modal p strong{font-family:var(--font-heading)!important;font-weight:700;color:var(--text)}
      .admin-release-intro{display:grid;grid-template-columns:46px minmax(0,1fr);gap:12px;align-items:start}
      .admin-release-icon{width:46px;height:46px;border-radius:14px;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center}
      .admin-release-intro small{display:block;margin-bottom:3px;color:var(--primary);font-size:.56rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
      .admin-release-intro small span{margin-left:5px;color:var(--muted);letter-spacing:0;text-transform:none}
      .admin-release-intro strong{display:block;font-size:.86rem;color:var(--text)}
      .admin-release-intro p{margin-top:4px;color:var(--muted);font-size:.65rem;line-height:1.45}
      .admin-release-whatsnew-title{font-size:.7rem;font-weight:800;color:var(--text)}
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
  let updatePromptOpen=false,updateCheckTimer=null;
  async function checkForNewBuild(){
    const currentBuild=window.OLEIRO_BUILD_META||meta;
    if(!currentBuild?.commit||updatePromptOpen||!state?.currentSession?.uid||document.visibilityState==='hidden')return;
    const demoProject=String(window.OLEIRO_FIREBASE_CONFIG?.projectId||'').startsWith('demo-');
    const localTestHost=['localhost','127.0.0.1'].includes(location.hostname);
    const previewBuild=window.OLEIRO_PREVIEW_ENABLED===true;
    const automatedBrowser=typeof navigator!=='undefined'&&navigator.webdriver===true;
    const emulatorSession=(()=>{try{return sessionStorage.getItem('oleiro-e2e')==='1'}catch{return false}})();
    if(demoProject||localTestHost||previewBuild||automatedBrowser||emulatorSession)return;
    try{
      const response=await fetch('../release.json',{cache:'no-store'});
      if(!response.ok)return;
      const latestBuild=await response.json();
      if(!latestBuild?.commit||latestBuild.commit===currentBuild.commit)return;
      if(modalRoot?.querySelector?.('.modal'))return;
      updatePromptOpen=true;
      openModal('Nova versão disponível','Salve suas alterações antes de atualizar.',`<div class="admin-release-modal"><p>Uma versão mais recente do Casa do Oleiro foi publicada. Salve qualquer informação que esteja editando e atualize o painel para receber as melhorias.</p><p><strong>Versão atual:</strong> ${esc(currentBuild.build||meta?.build||'—')}<br><strong>Nova versão:</strong> ${esc(latestBuild.build||'—')}</p></div>`,`<div class="release-notes-actions"><button class="btn btn-primary btn-block" type="button" onclick="window.location.reload()">Já salvei minhas alterações — atualizar agora</button></div>`);
    }catch(error){console.warn('Não foi possível verificar uma nova versão:',error)}
  }
  function startBuildPolling(){
    if(updateCheckTimer)return;
    updateCheckTimer=setInterval(checkForNewBuild,60000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkForNewBuild()});
  }

  function releaseInformationHtml(){
    if(!loaded)return '<div class="release-info"><p>Carregando informações da versão...</p></div>';
    const published=publishedAtLabel(meta?.publishedAt||latest?.publishedAt);
    const commit=String(meta?.commit||'').trim();
    const shortCommit=/^[a-f0-9]{7,40}$/i.test(commit)?commit.slice(0,7):'';
    const environment=String(meta?.environment||'').toLowerCase();
    const environmentLabel=environment==='production'?'Produção':environment==='homologation'?'Homologação':environment==='development'?'Desenvolvimento':'—';
    return `<div class="release-info">
      <p><strong>Versão:</strong> ${esc(version())}</p>
      <p><strong>Ambiente:</strong> ${esc(environmentLabel)}</p>
      ${published?`<p><strong>Publicado em:</strong> ${esc(published)}</p>`:''}
      ${shortCommit?`<p><strong>Commit:</strong> <code title="${esc(commit)}">${esc(shortCommit)}</code></p>`:''}
      <button class="admin-release-details" type="button" onclick="openAdminReleaseNotes()"><i class="fa-solid fa-wand-magic-sparkles"></i>Ver detalhes desta versão</button>
    </div>`;
  }
  function modalBody(){
    return `<div class="admin-release-modal">
      <div class="admin-release-items">${(Array.isArray(latest?.items)?latest.items:[]).map(itemHtml).join('')}</div>
    </div>`;
  }
  window.openAdminReleaseNotes=function(){
    if(!loaded||!latest)return;
    markSeen();
    const footer='<div class="release-notes-actions"><button class="btn btn-primary btn-block" type="button" onclick="closeModal()">Entendi</button></div>';
    openModal('O que mudou?','',modalBody(),footer);
    modalRoot?.querySelector?.('.modal')?.classList.add('modal-wide');
  };
  function maybeAnnounce(){
    const demoProject=String(window.OLEIRO_FIREBASE_CONFIG?.projectId||'').startsWith('demo-');
    const localTestHost=['localhost','127.0.0.1'].includes(location.hostname);
    const previewBuild=window.OLEIRO_PREVIEW_ENABLED===true;
    const automatedBrowser=typeof navigator!=='undefined'&&navigator.webdriver===true;
    const emulatorSession=(()=>{try{return sessionStorage.getItem('oleiro-e2e')==='1'}catch{return false}})();
    if(demoProject||localTestHost||previewBuild||automatedBrowser||emulatorSession)return;
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
      meta=releaseMeta||null;releases=Array.isArray(notes?.releases)?notes.releases:[];latest=releases[0]||null;loaded=true;startBuildPolling();
      window.releaseInformationHtml=releaseInformationHtml;
      maybeAnnounce();return latest;
    }).finally(()=>{loading=null});
    return loading;
  }
  installStyles();
  window.releaseInformationHtml=releaseInformationHtml;
  load();
  let attempts=0;
  const waitForSession=()=>{
    if(state?.role==='manager'&&state?.currentSession?.uid){
      if(state?.managerPage==='home')maybeAnnounce();
      checkForNewBuild();
      if(++attempts<120)setTimeout(waitForSession,250);
      return;
    }
    if(++attempts<120)setTimeout(waitForSession,250);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',waitForSession,{once:true});else setTimeout(waitForSession,500);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(!loaded)load();maybeAnnounce();checkForNewBuild()}});
})();
