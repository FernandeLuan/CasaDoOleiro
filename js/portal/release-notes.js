/* Destaques e novidades do Portal.
   Prioridade da Home:
   1) Projeto Legado, enquanto o usuário ainda não interagiu com o convite;
   2) atualização vigente, enquanto ainda não foi vista/dispensada.
   Para divulgar uma nova versão, altere ANNOUNCEMENT.id e o conteúdo abaixo.
   Deploys técnicos sozinhos NÃO reexibem o card. */
(function portalReleaseNotes(){
  if(!/\/portal\//.test(location.pathname))return;
  if(window.__OLEIRO_PORTAL_RELEASE_NOTES__)return;
  window.__OLEIRO_PORTAL_RELEASE_NOTES__=true;

  const ALWAYS_SHOW_HOME_NOTICES=true; // homologação: manter avisos sempre visíveis para teste
  const PROJECT_PROMPT_ID='2026-09-projeto-legado-intro-v1';
  const ANNOUNCEMENT={
    id:'2026-09-portal-projeto-legado-v2',
    eyebrow:'Nova atualização',
    title:'Tem novidade por aqui ✨',
    summary:'Deixamos o portal mais simples e adicionamos novas formas de acompanhar sua experiência.',
    items:[
      {icon:'fa-seedling',title:'Projeto Legado',text:'Conheça a proposta e acesse a nova área Projeto pelo menu.'},
      {icon:'fa-user',title:'Conta mais organizada',text:'Idioma, aparência e contato de emergência ficaram reunidos em um só lugar.'},
      {icon:'fa-compass',title:'Navegação mais simples',text:'Projeto, Conta e Informações da Casa agora estão mais fáceis de encontrar.'}
    ],
    ctaLabel:'Experimentar Projeto',
    ctaPage:'project'
  };

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let releaseMeta=null;
  let metaPromise=null;

  function uid(){return String(state?.currentSession?.uid||'anon')}
  function releaseSeenKey(){return `oleiro.portal.release-notes.seen.v1:${uid()}`}
  function projectSeenKey(){return `oleiro.portal.project-highlight.seen.v1:${uid()}`}
  function releaseSeen(){if(ALWAYS_SHOW_HOME_NOTICES)return false;try{return localStorage.getItem(releaseSeenKey())===ANNOUNCEMENT.id}catch{return false}}
  function projectSeen(){if(ALWAYS_SHOW_HOME_NOTICES)return false;try{return localStorage.getItem(projectSeenKey())===PROJECT_PROMPT_ID}catch{return false}}
  function markReleaseSeen(){if(ALWAYS_SHOW_HOME_NOTICES)return;try{localStorage.setItem(releaseSeenKey(),ANNOUNCEMENT.id)}catch{}}
  function markProjectSeen(){if(ALWAYS_SHOW_HOME_NOTICES)return;try{localStorage.setItem(projectSeenKey(),PROJECT_PROMPT_ID)}catch{}}

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
  function releaseCardHtml(){
    if(releaseSeen())return '';
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
  function stripProjectHighlight(html){
    return String(html||'').replace(/<section(?=[^>]*data-project-highlight="1")[^>]*>[\s\S]*?<\/section>/,'');
  }
  function insertAfterHero(html,card){
    if(!card)return html;
    const heroEnd=html.indexOf('</section>');
    return heroEnd>=0?html.slice(0,heroEnd+10)+card+html.slice(heroEnd+10):card+html;
  }
  function insertAfterExistingNotice(html,card){
    if(!card)return html;
    for(const marker of ['data-project-adjustment-update="1"','data-project-highlight="1"']){
      const markerAt=html.indexOf(marker);
      if(markerAt<0)continue;
      const sectionStart=html.lastIndexOf('<section',markerAt);
      const sectionEnd=html.indexOf('</section>',markerAt);
      if(sectionStart>=0&&sectionEnd>=0)return html.slice(0,sectionEnd+10)+card+html.slice(sectionEnd+10);
    }
    return insertAfterHero(html,card);
  }
  function showNextHighlightAfterProject(card){
    const next=releaseCardHtml();
    if(!card)return;
    card.classList.add('is-leaving');
    setTimeout(()=>{
      if(!card.isConnected)return;
      if(next){
        card.outerHTML=next;
        updateMetaLabels();
      }else card.remove();
    },210);
  }

  window.dismissPortalProjectHighlight=function(){
    markProjectSeen();
    showNextHighlightAfterProject(document.querySelector('[data-project-highlight="1"]'));
  };
  window.openPortalProjectHighlight=function(){
    markProjectSeen();
    const card=document.querySelector('[data-project-highlight="1"]');
    if(card)card.classList.add('is-leaving');
    setTimeout(()=>navigateVolunteer('project'),card?150:0);
  };

  window.dismissPortalReleaseAnnouncement=function(){
    markReleaseSeen();
    const card=document.querySelector('[data-release-announcement]');
    if(card){
      card.classList.add('is-leaving');
      setTimeout(()=>card.remove(),220);
    }
  };

  window.openPortalReleaseNotes=function(){
    markReleaseSeen();
    const card=document.querySelector('[data-release-announcement]');
    if(card){
      card.classList.add('is-leaving');
      setTimeout(()=>card.remove(),180);
    }
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

  const baseNavigateVolunteer=typeof window.navigateVolunteer==='function'?window.navigateVolunteer:null;
  if(baseNavigateVolunteer){
    window.navigateVolunteer=navigateVolunteer=function(page){
      if(String(page)==='project')markProjectSeen();
      return baseNavigateVolunteer(page);
    };
  }

  const baseVolunteerHome=typeof window.volunteerHome==='function'?window.volunteerHome:null;
  if(baseVolunteerHome){
    window.volunteerHome=volunteerHome=function(){
      let html=baseVolunteerHome();
      const card=releaseCardHtml();

      /* Durante a homologação mostramos simultaneamente todos os avisos relevantes.
         Assim o ajuste do projeto, o convite do Projeto Legado e a novidade da versão
         podem ser revisados repetidamente sem limpar localStorage. */
      if(ALWAYS_SHOW_HOME_NOTICES){
        if(card&&!html.includes('data-release-announcement'))html=insertAfterExistingNotice(html,card);
        return html;
      }

      if(html.includes('data-project-adjustment-update="1"'))return html;
      const hasProject=html.includes('data-project-highlight="1"');
      if(hasProject&&!projectSeen())return html;
      if(hasProject)html=stripProjectHighlight(html);
      if(!card||html.includes('data-release-announcement'))return html;
      return insertAfterHero(html,card);
    };
  }

  const baseVolunteerInfo=typeof window.volunteerInfo==='function'?window.volunteerInfo:null;
  if(baseVolunteerInfo){
    window.volunteerInfo=volunteerInfo=function(){
      const html=baseVolunteerInfo();
      if(html.includes('release-history-card'))return html;
      const card=`<div class="card release-history-card">
        <div class="release-history-copy"><span class="release-history-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></span><div><small>Novidades da versão</small><strong>${esc(ANNOUNCEMENT.title)}</strong><p>Veja novamente o que mudou nesta atualização.</p><span data-release-meta hidden></span></div></div>
        <button class="btn btn-soft" type="button" onclick="openPortalReleaseNotes()">Ver novidades</button>
      </div>`;
      return html.replace(/<\/section>\s*$/,`${card}</section>`);
    };
  }

  const loadMetaWhenIdle=()=>loadReleaseMeta();
  if(typeof requestIdleCallback==='function')requestIdleCallback(loadMetaWhenIdle,{timeout:1800});
  else setTimeout(loadMetaWhenIdle,900);
})();