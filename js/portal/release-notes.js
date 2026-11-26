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

  const ALWAYS_SHOW_HOME_NOTICES=false; // produção: respeitar a dispensa do usuário e só reexibir quando ANNOUNCEMENT.id mudar
  let ANNOUNCEMENT={
    id:'2026-09-portal-projeto-legado-v3',
    eyebrow:'Nova atualização',
    title:'Tem novidade por aqui ✨',
    summary:'Deixamos o portal mais simples e adicionamos novas formas de acompanhar sua experiência.',
    homeSlides:[
      {title:'Tem novidade por aqui ✨',summary:'Deixamos o portal mais simples e adicionamos novas formas de acompanhar sua experiência.'},
      {title:'Projeto Legado',summary:'Conheça a proposta e acesse a nova área Projeto pelo menu.'},
      {title:'Tudo mais simples de encontrar',summary:'Conta, Projeto e Informações da Casa ficaram mais organizados e fáceis de acessar.'}
    ],
    items:[
      {icon:'fa-seedling',title:'Projeto Legado',text:'Conheça a proposta e acesse a nova área Projeto pelo menu.'},
      {icon:'fa-user',title:'Conta mais organizada',text:'Idioma, aparência e contato de emergência ficaram reunidos em um só lugar.'},
      {icon:'fa-compass',title:'Navegação mais simples',text:'Projeto, Conta e Informações da Casa agora estão mais fáceis de encontrar.'}
    ],
    ctaLabel:'Experimentar Projeto',
    ctaPage:'project'
  };

  const esc=value=>typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let RELEASE_HISTORY=[];
  let releaseMeta=null;
  let metaPromise=null;
  let homeSlideIndex=0;
  let pendingReleasePopupId=null;
  let releaseDismissedInSession=false;
  let releaseDismissedInSessionId=null;
  const hiddenHomeNoticeIds=new Set();
  let homeNoticeRefreshAt=0;
  let homeNoticeRefreshPromise=null;

  function uid(){return String(state?.currentSession?.uid||'anon')}
  function releaseSeenKey(){return `oleiro.portal.release-notes.seen.v1:${uid()}`}
  function releaseSeen(){if(ALWAYS_SHOW_HOME_NOTICES)return false;if(releaseDismissedInSession&&releaseDismissedInSessionId===ANNOUNCEMENT.id)return true;try{return localStorage.getItem(releaseSeenKey())===ANNOUNCEMENT.id}catch{return false}}
  function markReleaseSeen(){if(ALWAYS_SHOW_HOME_NOTICES)return;releaseDismissedInSession=true;releaseDismissedInSessionId=ANNOUNCEMENT.id;try{localStorage.setItem(releaseSeenKey(),ANNOUNCEMENT.id)}catch{}}
  function maybeOpenPendingReleasePopup(){
    const pendingId=pendingReleasePopupId;
    if(!pendingId||pendingId!==ANNOUNCEMENT.id)return;
    const demoProject=String(window.OLEIRO_FIREBASE_CONFIG?.projectId||'').startsWith('demo-');
    const localTestHost=['localhost','127.0.0.1'].includes(location.hostname);
    const previewBuild=window.OLEIRO_PREVIEW_ENABLED===true;
    const automatedBrowser=typeof navigator!=='undefined'&&navigator.webdriver===true;
    const emulatorSession=(()=>{try{return sessionStorage.getItem('oleiro-e2e')==='1'}catch{return false}})();
    if(demoProject||localTestHost||previewBuild||automatedBrowser||emulatorSession){pendingReleasePopupId=null;return}
    if(state?.volunteerPage!=='home')return;
    if(releaseSeen()){pendingReleasePopupId=null;return}
    pendingReleasePopupId=null;
    setTimeout(()=>{
      if(state?.volunteerPage==='home'&&ANNOUNCEMENT.id===pendingId&&!releaseSeen())window.openPortalReleaseNotes?.();
      else if(state?.volunteerPage!=='home'&&ANNOUNCEMENT.id===pendingId)pendingReleasePopupId=pendingId;
    },420);
  }
  function dismissedHomeNoticeKey(){return `oleiro.portal.home-notices.dismissed.v1:${uid()}`}
  let dismissedHomeNoticesUid='';
  function ensureDismissedHomeNotices(){
    const currentUid=uid();
    if(currentUid===dismissedHomeNoticesUid)return;
    hiddenHomeNoticeIds.clear();
    dismissedHomeNoticesUid=currentUid;
    try{const ids=JSON.parse(localStorage.getItem(dismissedHomeNoticeKey())||'[]');if(Array.isArray(ids))ids.slice(-100).forEach(id=>hiddenHomeNoticeIds.add(String(id)))}catch{}
  }
  function hideHomeNotice(id){
    if(!id)return;
    ensureDismissedHomeNotices();
    hiddenHomeNoticeIds.add(id);
    try{localStorage.setItem(dismissedHomeNoticeKey(),JSON.stringify([...hiddenHomeNoticeIds].slice(-100)))}catch{}
  }

  function metaLabel(){
    const build=String(ANNOUNCEMENT.version||releaseMeta?.build||'').trim();
    return build?`Versão ${build}`:'';
  }
  function updateMetaLabels(){
    const label=metaLabel();
    document.querySelectorAll('[data-release-meta]').forEach(node=>{
      const enabled=node.dataset.releaseMetaEnabled!=='0';
      node.textContent=label;
      node.hidden=!label||!enabled;
    });
    document.querySelectorAll('[data-release-latest-version]').forEach(node=>node.textContent=(label.startsWith('Versão ')?label.slice(7):label)||'—');
    document.querySelectorAll('[data-release-latest-summary]').forEach(node=>node.textContent=ANNOUNCEMENT.summary||'Nenhuma descrição disponível.');
  }
  async function loadReleaseMeta(){
    if(releaseMeta)return releaseMeta;
    if(metaPromise)return metaPromise;
    const previousId=ANNOUNCEMENT.id;
    metaPromise=Promise.all([
      fetch('../release.json',{cache:'no-store'}).then(response=>response.ok?response.json():null).catch(()=>null),
      fetch('../release-notes.json',{cache:'no-store'}).then(response=>response.ok?response.json():null).catch(()=>null)
    ])
      .then(([meta,notes])=>{
        releaseMeta=meta||null;
        RELEASE_HISTORY=Array.isArray(notes?.releases)?notes.releases.filter(release=>!Array.isArray(release?.audience)||!release.audience.length||release.audience.includes('volunteer')):[];
        const latest=RELEASE_HISTORY[0];
        if(latest){
          ANNOUNCEMENT={...ANNOUNCEMENT,...latest};
          ANNOUNCEMENT.homeSlides=Array.isArray(latest.homeSlides)&&latest.homeSlides.length?latest.homeSlides:[{title:latest.title,summary:latest.summary}];
          ANNOUNCEMENT.items=Array.isArray(latest.items)?latest.items:[];
        }
        updateMetaLabels();
        if(previousId!==ANNOUNCEMENT.id){
          pendingReleasePopupId=ANNOUNCEMENT.id;
          if(state?.volunteerPage==='home'&&typeof render==='function')render();
          maybeOpenPendingReleasePopup();
        }
        return releaseMeta;
      })
      .catch(()=>null)
      .finally(()=>{metaPromise=null});
    return metaPromise;
  }

  function itemHtml(item){
    return `<div class="release-note-item"><span><i class="fa-solid ${esc(item.icon)}"></i></span><div><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p></div></div>`;
  }
  function rawSession(value){return value?.raw||value||{}}
  function fmtNoticeDate(value){
    const date=String(value||'').slice(0,10);
    if(!date)return '';
    try{
      if(typeof fmtDate==='function')return fmtDate(date,true);
      return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date(date+'T12:00:00'));
    }catch{return date}
  }
  function currentProjectAdjustmentSlide(){
    if(state.volunteerMode!=='approved')return null;
    const project=window.OleiroProjects?.getOwn?.()||null;
    if(!project||project.status!=='adjustments'||!String(project.reviewNote||'').trim())return null;
    const token=[project.id||'',project.reviewedAt||project.updatedAt||'',project.reviewNote||''].join('|');
    const id='project-adjustment:'+token;
    if(hiddenHomeNoticeIds.has(id))return null;
    return {
      id,
      type:'project_adjustment',
      tone:'warning',
      icon:'fa-pen-to-square',
      eyebrow:'Novidade no seu projeto',
      title:'A equipe pediu um ajuste',
      summary:'Há uma nova orientação para o Projeto Legado.',
      ctaLabel:'Ver atualização',
      showMeta:false
    };
  }
  function activityAdjustmentSlides(){
    const slides=[],seenIds=new Set(),seenDates=new Set(),page=state.volunteerMode==='approved'?'agenda':'plan';
    const pushSlide=slide=>{
      if(!slide?.id||hiddenHomeNoticeIds.has(slide.id)||seenIds.has(slide.id))return;
      seenIds.add(slide.id);
      slides.push(slide);
    };
    const dayAdjustments=state.currentApplication?.dayAdjustments;
    if(dayAdjustments&&typeof dayAdjustments==='object'){
      Object.entries(dayAdjustments).forEach(([date,item])=>{
        if(!item||String(item?.status||'requested')==='resolved')return;
        const note=String(item?.note||'').trim();
        const id='day-adjustment:'+date+':'+note;
        seenDates.add(String(date));
        pushSlide({
          id,
          type:'day_adjustment',
          tone:'warning',
          icon:'fa-calendar-day',
          eyebrow:'Ajuste em uma atividade',
          title:'A equipe pediu um ajuste',
          summary:note||('Há uma orientação nova para '+fmtNoticeDate(date)+'.'),
          ctaLabel:'Ver ajuste',
          page,
          date:String(date),
          note,
          showMeta:false
        });
      });
    }

    const rows=state.sessions||[];
    rows.forEach(row=>{
      const raw=rawSession(row),activity=row?.activity||{};
      const date=String(row?.date||raw.date||'').slice(0,10);
      const activityId=String(row?.activityId||raw.activityId||activity.id||'');
      const sessionId=String(row?.sessionId||row?.id||raw.id||raw.sessionId||activityId||date||'activity');
      const name=String(activity.name||row?.activityName||raw.activityName||'atividade').trim();

      if(raw.adminAdjustmentStatus==='requested'){
        const note=String(raw.adminAdjustmentNote||'').trim();
        const stamp=String(raw.adminAdjustmentRequestedAt?.seconds||raw.adminAdjustmentRequestedAt||'');
        pushSlide({
          id:'session-adjustment:'+sessionId+':'+stamp+':'+note,
          type:'activity_adjustment',
          tone:'warning',
          icon:'fa-list-check',
          eyebrow:'Ajuste em uma atividade',
          title:'A equipe pediu um ajuste em '+name,
          summary:note||(date?'Confira a orientação referente a '+fmtNoticeDate(date)+'.':'Confira a orientação da equipe para esta atividade.'),
          ctaLabel:'Ver ajuste',
          page,
          date,
          note,
          sessionId,
          activityId,
          showMeta:false
        });
      }

      if(raw.postApprovalProposal===true&&raw.reviewStatus==='adjustments'){
        const note=String(raw.reviewNote||'').trim();
        const stamp=String(raw.reviewedAt?.seconds||raw.reviewedAt||'');
        pushSlide({
          id:'proposal-readjust:'+activityId+':'+stamp+':'+note,
          type:'activity_adjustment',
          tone:'warning',
          icon:'fa-list-check',
          eyebrow:'Ajuste em uma atividade',
          title:'A equipe pediu um reajuste em '+name,
          summary:note||(date?'Confira a orientação referente a '+fmtNoticeDate(date)+'.':'Confira a orientação da equipe para esta atividade.'),
          ctaLabel:'Ver ajuste',
          page,
          date,
          note,
          sessionId,
          activityId,
          showMeta:false
        });
      }

      if(raw.status==='change_requested'&&raw.changeReviewStatus==='adjustments'){
        const note=String(raw.changeReviewNote||raw.changeReviewRequestNote||'').trim();
        const stamp=String(raw.changeReviewedAt?.seconds||raw.changeReviewedAt||'');
        pushSlide({
          id:'change-readjust:'+sessionId+':'+stamp+':'+note,
          type:'activity_adjustment',
          tone:'warning',
          icon:'fa-arrows-rotate',
          eyebrow:'Ajuste em uma atividade',
          title:'A equipe pediu um reajuste em '+name,
          summary:note||(date?'Confira a orientação referente a '+fmtNoticeDate(date)+'.':'Confira a orientação da equipe para esta atividade.'),
          ctaLabel:'Ver ajuste',
          page,
          date,
          note,
          sessionId,
          activityId,
          showMeta:false
        });
      }
    });

    return slides;
  }

  async function refreshHomeNoticeData(force=false){
    const application=state.currentApplication;
    const loader=typeof window.hydrateVolunteerPlanning==='function'?window.hydrateVolunteerPlanning:(typeof hydrateVolunteerPlanning==='function'?hydrateVolunteerPlanning:null);
    if(!application?.id||!loader)return;
    const now=Date.now();
    if(!force&&now-homeNoticeRefreshAt<6000)return;
    if(homeNoticeRefreshPromise)return homeNoticeRefreshPromise;
    homeNoticeRefreshAt=now;
    homeNoticeRefreshPromise=Promise.resolve(loader(application,{force:true}))
      .then(()=>{if(state.volunteerPage==='home'&&typeof render==='function')render()})
      .catch(error=>console.warn('Não foi possível atualizar os avisos da Home:',error))
      .finally(()=>{homeNoticeRefreshPromise=null});
    return homeNoticeRefreshPromise;
  }
  function releaseSlides(){
    const slides=Array.isArray(ANNOUNCEMENT.homeSlides)?ANNOUNCEMENT.homeSlides.filter(Boolean):[];
    const source=slides.length?slides:[{title:ANNOUNCEMENT.title,summary:ANNOUNCEMENT.summary}];
    return source.map((slide,index)=>({
      id:'release:'+ANNOUNCEMENT.id+':'+index,
      type:'release',
      tone:'',
      icon:'fa-wand-magic-sparkles',
      eyebrow:ANNOUNCEMENT.eyebrow,
      title:slide.title,
      summary:slide.summary,
      ctaLabel:'Ver novidades',
      showMeta:true
    })).filter(slide=>!hiddenHomeNoticeIds.has(slide.id));
  }
  function homeSlides(){
    ensureDismissedHomeNotices();
    const slides=[];
    const projectSlide=currentProjectAdjustmentSlide();
    if(projectSlide)slides.push(projectSlide);
    slides.push(...activityAdjustmentSlides());
    return slides;
  }
  function homeSlide(){
    const slides=homeSlides();
    if(!slides.length)return null;
    homeSlideIndex=Math.max(0,Math.min(homeSlideIndex,slides.length-1));
    return slides[homeSlideIndex]||slides[0];
  }
  function insertAfterHero(html,card){
    if(!card)return html;
    const heroEnd=html.indexOf('</section>');
    return heroEnd>=0?html.slice(0,heroEnd+10)+card+html.slice(heroEnd+10):card+html;
  }
  function releaseCarouselNavHtml(){
    const slides=homeSlides(),total=slides.length;
    if(!total)return '';
    const first=homeSlideIndex===0,last=homeSlideIndex===total-1;
    return `<div class="notice-carousel-pager release-announcement-pager" aria-label="Navegação das novidades">
      <strong class="notice-carousel-counter release-announcement-counter">${homeSlideIndex+1}/${total}</strong>
      <div class="notice-carousel-nav release-announcement-nav">
        <button type="button" class="notice-carousel-arrow release-announcement-arrow ${first?'is-disabled':''}" onclick="portalReleasePrev(event)" aria-label="Novidade anterior" ${first?'disabled aria-disabled="true"':''}><i class="fa-solid fa-arrow-left"></i></button>
        <button type="button" class="notice-carousel-arrow release-announcement-arrow ${last?'is-disabled':''}" onclick="portalReleaseNext(event)" aria-label="Próxima novidade" ${last?'disabled aria-disabled="true"':''}><i class="fa-solid fa-arrow-right"></i></button>
      </div>
    </div>`;
  }
  function releaseCardHtml(){
    const slide=homeSlide();
    if(!slide)return '';
    return `<section class="notice-carousel-card release-announcement-card" data-notice-carousel="portal-home" data-release-announcement data-release-slide="${homeSlideIndex}">
      <div class="notice-carousel-top release-announcement-top">
        <span class="notice-carousel-icon release-announcement-spark" data-release-slide-icon><i class="fa-solid ${esc(slide.icon||'fa-wand-magic-sparkles')}"></i></span>
        <div class="notice-carousel-copy release-announcement-copy">
          <div class="notice-carousel-meta release-announcement-meta"><span data-release-slide-eyebrow>${esc(slide.eyebrow||ANNOUNCEMENT.eyebrow)}</span><small data-release-meta data-release-meta-enabled="${slide.showMeta?'1':'0'}" ${slide.showMeta?'':'hidden'}></small></div>
          <strong data-notice-title data-release-slide-title>${esc(slide.title||'')}</strong>
          <p data-notice-summary data-release-slide-summary>${esc(slide.summary||'')}</p>
        </div>
        ${releaseCarouselNavHtml()}
      </div>
      <div class="notice-carousel-actions release-announcement-actions">
        <button class="btn btn-outline" type="button" onclick="dismissPortalHomeNotice()">Agora não</button>
        <button class="btn btn-primary" type="button" data-release-slide-cta onclick="openPortalHomeNotice()">${esc(slide.ctaLabel||'Ver novidades')}</button>
      </div>
    </section>`;
  }
  function renderReleaseSlide(direction){
    const card=document.querySelector('[data-release-announcement]');
    if(!card)return;
    const slide=homeSlide();
    if(!slide){card.remove();return}
    card.dataset.releaseSlide=String(homeSlideIndex);
    card.classList.remove('is-slide-next','is-slide-prev');
    void card.offsetWidth;
    card.classList.add(direction==='prev'?'is-slide-prev':'is-slide-next');
    const title=card.querySelector('[data-release-slide-title]');
    const summary=card.querySelector('[data-release-slide-summary]');
    const eyebrow=card.querySelector('[data-release-slide-eyebrow]');
    const icon=card.querySelector('[data-release-slide-icon] i');
    const cta=card.querySelector('[data-release-slide-cta]');
    const meta=card.querySelector('[data-release-meta]');
    const pager=card.querySelector('.release-announcement-pager');
    if(title)title.textContent=slide.title||'';
    if(summary)summary.textContent=slide.summary||'';
    if(eyebrow)eyebrow.textContent=slide.eyebrow||ANNOUNCEMENT.eyebrow;
    if(icon)icon.className='fa-solid '+(slide.icon||'fa-wand-magic-sparkles');
    if(cta)cta.textContent=slide.ctaLabel||'Ver novidades';
    if(meta){
      meta.dataset.releaseMetaEnabled=slide.showMeta?'1':'0';
      meta.hidden=!slide.showMeta;
      updateMetaLabels();
    }
    if(pager)pager.outerHTML=releaseCarouselNavHtml();
    else{
      const top=card.querySelector('.release-announcement-top');
      if(top)top.insertAdjacentHTML('beforeend',releaseCarouselNavHtml());
    }
  }
  window.portalReleasePrev=function(event){
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if(homeSlideIndex<=0)return;
    homeSlideIndex-=1;
    renderReleaseSlide('prev');
  };
  window.portalReleaseNext=function(event){
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if(homeSlideIndex>=homeSlides().length-1)return;
    homeSlideIndex+=1;
    renderReleaseSlide('next');
  };

  document.addEventListener('oleiro:notice-swipe',event=>{
    if(event.detail?.source!=='portal-home')return;
    if(event.detail.direction==='next')window.portalReleaseNext?.();
    else if(event.detail.direction==='prev')window.portalReleasePrev?.();
  });

  window.dismissPortalHomeNotice=function(){
    const slide=homeSlide();
    if(!slide)return;
    if(slide.type==='project_adjustment'){
      hideHomeNotice(slide.id);
      window.dismissLegacyProjectAdjustmentNotice?.();
    }else if(slide.type==='day_adjustment'||slide.type==='activity_adjustment'){
      hideHomeNotice(slide.id);
    }else{
      markReleaseSeen();
      releaseSlides().forEach(item=>hideHomeNotice(item.id));
    }
    const slides=homeSlides();
    if(!slides.length){
      const card=document.querySelector('[data-release-announcement]');
      if(card){card.classList.add('is-leaving');setTimeout(()=>card.remove(),220)}
      return;
    }
    homeSlideIndex=Math.min(homeSlideIndex,slides.length-1);
    renderReleaseSlide('next');
  };

  window.openPortalHomeNotice=function(){
    const slide=homeSlide();
    if(!slide)return;
    if(slide.type==='project_adjustment'){
      hideHomeNotice(slide.id);
      renderReleaseSlide('next');
      return window.openLegacyProjectAdjustmentNotice?.();
    }
    if(slide.type==='day_adjustment'){
      navigateVolunteer(slide.page||'plan');
      setTimeout(()=>window.openVolunteerDayAdjustment?.(slide.date),120);
      return;
    }
    if(slide.type==='activity_adjustment'){
      if(slide.note){
        const body=`<div class="notice warning"><i class="fa-solid fa-circle-info"></i><div><strong>${esc(slide.title||'Ajuste solicitado')}</strong><br><span data-no-i18n>${esc(slide.note)}</span></div></div>`;
        const footer=`<div class="release-notes-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Fechar</button><button class="btn btn-primary" type="button" onclick="closeModal();navigateVolunteer('${esc(slide.page||'plan')}');${slide.date?`setTimeout(()=>window.scrollToVolunteerDay?.('${esc(slide.date)}'),120)`:''}"><i class="fa-solid fa-arrow-right"></i>Ir para atividade</button></div>`;
        openModal('Ajuste solicitado','Orientação da equipe',body,footer);
        return;
      }
      navigateVolunteer(slide.page||'plan');
      if(slide.date)setTimeout(()=>window.scrollToVolunteerDay?.(slide.date),120);
      return;
    }
    return window.openPortalReleaseNotes?.();
  };

  window.dismissPortalReleaseAnnouncement=function(){
    pendingReleasePopupId=null;
    markReleaseSeen();
    const card=document.querySelector('[data-release-announcement]');
    if(card){
      card.classList.add('is-leaving');
      setTimeout(()=>card.remove(),220);
    }
  };

  window.openPortalReleaseNotes=function(){
    pendingReleasePopupId=null;
    markReleaseSeen();
    releaseSlides().forEach(item=>hiddenHomeNoticeIds.add(item.id));
    const card=document.querySelector('[data-release-announcement]');
    const remaining=homeSlides();
    if(card){
      if(remaining.length){
        homeSlideIndex=0;
        renderReleaseSlide('prev');
      }else{
        card.classList.add('is-leaving');
        setTimeout(()=>card.remove(),180);
      }
    }
    const body=`<div class="release-notes-modal">
      <div class="release-notes-modal-intro">
        <span class="release-notes-modal-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
        <div><small>${esc(ANNOUNCEMENT.eyebrow)} <span data-release-meta></span></small><strong>${esc(ANNOUNCEMENT.title)}</strong><p>${esc(ANNOUNCEMENT.summary)}</p></div>
      </div>
    </div>`;
    const footer=`<div class="release-notes-actions"><button class="btn btn-primary btn-block" type="button" onclick="closeModal()">Entendi</button></div>`;
    openModal('O que mudou?','',body,footer);
    modalRoot.querySelector('.modal')?.classList.add('modal-wide');
    updateMetaLabels();
  };

  const baseNavigateVolunteer=typeof window.navigateVolunteer==='function'?window.navigateVolunteer:null;
  if(baseNavigateVolunteer){
    window.navigateVolunteer=navigateVolunteer=function(page){
      const result=baseNavigateVolunteer(page);
      if(String(page)==='home')setTimeout(()=>{refreshHomeNoticeData();maybeOpenPendingReleasePopup()},60);
      return result;
    };
  }

  const baseVolunteerHome=typeof window.volunteerHome==='function'?window.volunteerHome:null;
  if(baseVolunteerHome){
    window.volunteerHome=volunteerHome=function(){
      let html=baseVolunteerHome();
      const card=releaseCardHtml();
      if(!card||html.includes('data-release-announcement'))return html;
      return insertAfterHero(html,card);
    };
  }

  if(typeof window.releaseInformationHtml==='function'){
    window.releaseInformationHtml=function(){
      const version=ANNOUNCEMENT.version||releaseMeta?.build||'—';
      const published=fmtNoticeDate(ANNOUNCEMENT.publishedAt||releaseMeta?.publishedAt);
      return `<div class="release-info release-info-latest">
        <p><strong>Versão:</strong> <span data-release-latest-version>${esc(version)}</span></p>
        <p><strong>Última atualização:</strong> <span data-release-latest-summary>${esc(ANNOUNCEMENT.summary||'Nenhuma descrição disponível.')}</span></p>
        ${published?`<small>Publicado em ${esc(published)}</small>`:''}
        <button class="info-action-link" type="button" onclick="openPortalReleaseNotes()"><i class="fa-solid fa-wand-magic-sparkles"></i>Ver detalhes</button>
      </div>`;
    };
  }

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&state.volunteerPage==='home')setTimeout(()=>refreshHomeNoticeData(),80);
  });
  window.addEventListener('focus',()=>{
    if(state.volunteerPage==='home')setTimeout(()=>refreshHomeNoticeData(),80);
  });

  const loadMetaWhenIdle=()=>loadReleaseMeta();
  if(typeof requestIdleCallback==='function')requestIdleCallback(loadMetaWhenIdle,{timeout:1800});
  else setTimeout(loadMetaWhenIdle,900);
})();