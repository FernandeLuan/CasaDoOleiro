/* Card de novidades do portal.
   Para publicar uma nova comunicação:
   1) altere ANNOUNCEMENT.id;
   2) atualize título, resumo, itens e CTA.
   O card aparece uma única vez por anúncio para cada usuário/dispositivo.
   O número técnico do deploy continua vindo de /release.json. */
(function portalReleaseNotes(){
  if(!/\/portal\//.test(location.pathname))return;
  if(window.__OLEIRO_PORTAL_RELEASE_NOTES__)return;
  window.__OLEIRO_PORTAL_RELEASE_NOTES__=true;

  const ANNOUNCEMENT={
    id:'2026-09-portal-legado-conta',
    eyebrow:'Nova atualização',
    title:'Tem novidade por aqui ✨',
    summary:'Deixamos o portal mais simples e adicionamos novas formas de acompanhar sua experiência.',
    items:[
      {icon:'fa-seedling',title:'Projeto de legado',text:'Conheça a proposta e acesse a nova área Projeto pelo menu.'},
      {icon:'fa-user',title:'Conta mais organizada',text:'Idioma, aparência e contato de emergência ficaram reunidos em um só lugar.'},
      {icon:'fa-compass',title:'Navegação mais simples',text:'Projeto, Conta e Informações da Casa agora estão mais fáceis de encontrar.'}
    ],
    ctaLabel:'Experimentar Projeto',
    ctaPage:'project'
  };

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let releaseMeta=null;
  let metaPromise=null;

  function userKey(){
    const uid=String(state?.currentSession?.uid||'anon');
    return `oleiro.portal.release-notes.seen.v1:${uid}`;
  }
  function seen(){
    try{return localStorage.getItem(userKey())===ANNOUNCEMENT.id}catch{return false}
  }
  function markSeen(){
    try{localStorage.setItem(userKey(),ANNOUNCEMENT.id)}catch{}
  }
  function metaLabel(){
    const build=String(releaseMeta?.build||'').trim();
    return build?`Versão ${build}`:'';
  }
  function updateMetaLabels(){
    const label=metaLabel();
    document.querySelectorAll('[data-release-meta]').forEach(node=>{
      node.textContent=label;
      node.hidden=!label;
    });
  }
  async function loadReleaseMeta(){
    if(releaseMeta)return releaseMeta;
    if(metaPromise)return metaPromise;
    metaPromise=fetch('../release.json',{cache:'no-store'})
      .then(response=>response.ok?response.json():null)
      .then(meta=>{releaseMeta=meta||null;updateMetaLabels();return releaseMeta})
      .catch(()=>null)
      .finally(()=>{metaPromise=null});
    return metaPromise;
  }

  function itemHtml(item){
    return `<div class="release-note-item"><span><i class="fa-solid ${esc(item.icon)}"></i></span><div><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p></div></div>`;
  }
  function cardHtml(){
    if(seen())return '';
    return `<section class="release-announcement-card" data-release-announcement>
      <div class="release-announcement-top">
        <span class="release-announcement-spark"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
        <div class="release-announcement-copy">
          <div class="release-announcement-meta"><span>${esc(ANNOUNCEMENT.eyebrow)}</span><small data-release-meta hidden></small></div>
          <strong>${esc(ANNOUNCEMENT.title)}</strong>
          <p>${esc(ANNOUNCEMENT.summary)}</p>
        </div>
      </div>
      <div class="release-announcement-actions">
        <button class="btn btn-outline" type="button" onclick="dismissPortalReleaseAnnouncement()">Agora não</button>
        <button class="btn btn-primary" type="button" onclick="openPortalReleaseNotes()">Ver novidades</button>
      </div>
    </section>`;
  }

  window.dismissPortalReleaseAnnouncement=function(){
    markSeen();
    const card=document.querySelector('[data-release-announcement]');
    if(card){
      card.classList.add('is-leaving');
      setTimeout(()=>card.remove(),220);
    }
  };

  window.openPortalReleaseNotes=function(){
    markSeen();
    document.querySelector('[data-release-announcement]')?.remove();
    const body=`<div class="release-notes-modal">
      <div class="release-notes-modal-intro">
        <span class="release-notes-modal-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
        <div><small>${esc(ANNOUNCEMENT.eyebrow)} <span data-release-meta></span></small><strong>${esc(ANNOUNCEMENT.title)}</strong><p>${esc(ANNOUNCEMENT.summary)}</p></div>
      </div>
      <div class="release-notes-list">${ANNOUNCEMENT.items.map(itemHtml).join('')}</div>
    </div>`;
    const footer=`<div class="release-notes-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Fechar</button><button class="btn btn-primary" type="button" onclick="closeModal();navigateVolunteer('${ANNOUNCEMENT.ctaPage}')"><i class="fa-solid fa-seedling"></i>${esc(ANNOUNCEMENT.ctaLabel)}</button></div>`;
    openModal('O que mudou?','',body,footer);
    modalRoot.querySelector('.modal')?.classList.add('release-notes-modal-shell');
    updateMetaLabels();
  };

  const baseVolunteerHome=typeof window.volunteerHome==='function'?window.volunteerHome:null;
  if(baseVolunteerHome){
    window.volunteerHome=volunteerHome=function(){
      let html=baseVolunteerHome();
      const card=cardHtml();
      if(!card||html.includes('data-release-announcement'))return html;
      const heroEnd=html.indexOf('</section>');
      return heroEnd>=0?html.slice(0,heroEnd+10)+card+html.slice(heroEnd+10):card+html;
    };
  }

  loadReleaseMeta();

  if(state?.role==='volunteer'&&typeof render==='function')render();
})();