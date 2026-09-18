/* Área Projeto/Legado do voluntário. */
(function legacyProjectPortal(){
  const categories=['Sustentabilidade','Estrutura','Educação','Saúde e bem-estar','Cultura e lazer','Organização','Comunicação','Tecnologia','Outro'];
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'');
  const tx=(key,params={})=>typeof t==='function'?t(key,params):String(key||'');
  let legacyProjectWizardStep=0;
  let legacyProjectWizardDraft=null;
  let legacyProjectWizardViewportCleanup=null;


  function statusMeta(status){
    return {
      draft:['Rascunho',''],
      analysis:['Em análise','info'],
      adjustments:['Ajustes solicitados','warning'],
      approved:['Aprovado','success'],
      in_progress:['Em execução','primary'],
      completed:['Legado concluído','success']
    }[status]||['Rascunho',''];
  }
  function project(){return window.OleiroProjects?.getOwn?.()||null}
  function ownerName(){
    const p=state.currentSession?.profile||{},a=state.currentApplication||{};
    return p.name||p.fullName||(Array.isArray(a.participantNames)?a.participantNames[0]:null)||'Voluntário';
  }
  function ideaCard(icon,title,text){
    return `<article class="legacy-idea-card"><span><i class="fa-solid ${icon}"></i></span><div><strong>${esc(title)}</strong><p>${esc(text)}</p></div></article>`;
  }
  function onboardingIllustration(step){
    if(step===0)return '<div class="legacy-visual legacy-visual-heart"><span class="legacy-sun"></span><i class="fa-solid fa-house-chimney"></i><span class="legacy-path"></span><span class="legacy-person one"><i class="fa-solid fa-person"></i></span><span class="legacy-heart"><i class="fa-solid fa-heart"></i></span></div>';
    if(step===1)return '<div class="legacy-visual legacy-visual-ideas"><span><i class="fa-solid fa-seedling"></i></span><span><i class="fa-solid fa-recycle"></i></span><span><i class="fa-solid fa-book-open"></i></span><span><i class="fa-solid fa-hammer"></i></span><span><i class="fa-solid fa-futbol"></i></span></div>';
    if(step===2)return '<div class="legacy-visual legacy-visual-find"><span class="legacy-search"><i class="fa-solid fa-magnifying-glass"></i></span><span class="legacy-sprout"><i class="fa-solid fa-seedling"></i></span><span class="legacy-bulb"><i class="fa-regular fa-lightbulb"></i></span></div>';
    return '<div class="legacy-visual legacy-visual-grow"><span class="legacy-hand left"><i class="fa-solid fa-hand-holding-heart"></i></span><span class="legacy-tree"><i class="fa-solid fa-tree"></i></span><span class="legacy-hand right"><i class="fa-solid fa-hands-holding-circle"></i></span></div>';
  }
  function onboardingPage(){
    const step=Math.max(0,Math.min(3,Number(state.projectOnboardingStep)||0));
    const slides=[
      [tx('project.onboarding.1.title'),tx('project.onboarding.1.body')],
      [tx('project.onboarding.2.title'),tx('project.onboarding.2.body')],
      [tx('project.onboarding.3.title'),tx('project.onboarding.3.body')],
      [tx('project.onboarding.4.title'),tx('project.onboarding.4.body')]
    ];
    const [title,text]=slides[step];
    return `<section class="legacy-onboarding">
      <div class="legacy-onboarding-body">
        ${onboardingIllustration(step)}
        <h1>${esc(title)}</h1><p>${esc(text)}</p>
      </div>
      <div class="legacy-onboarding-footer"><span>${esc(tx('project.onboarding.swipe'))}</span><div class="legacy-dots">${slides.map((_,i)=>`<i class="${i===step?'active':''}"></i>`).join('')}</div><button class="btn btn-primary btn-block legacy-next" type="button" onclick="projectOnboardingNext()">${esc(step===3?tx('project.onboarding.create'):tx('project.onboarding.next'))}</button></div>
    </section>`;
  }
  function emptyPage(){
    const ideas=[
      ['fa-leaf','project.idea.sustainability.title','project.idea.sustainability.body'],
      ['fa-hammer','project.idea.improvements.title','project.idea.improvements.body'],
      ['fa-people-group','project.idea.community.title','project.idea.community.body'],
      ['fa-laptop-code','project.idea.technology.title','project.idea.technology.body']
    ];
    return `<section class="section legacy-page legacy-empty-v3">
      <section class="legacy-empty-home-hero">
        <span class="legacy-empty-home-kicker">${esc(tx('project.name'))}</span>
        <h1>${esc(tx('project.empty.heroTitle'))}</h1>
        <p>${esc(tx('project.empty.heroBody'))}</p>
        <button class="legacy-empty-home-action" type="button" onclick="openLegacyProjectForm()"><i class="fa-solid fa-plus"></i>${esc(tx('project.empty.create'))}</button>
      </section>

      <section class="legacy-empty-inspiration">
        <div class="legacy-empty-inspiration-head">
          <h2>${esc(tx('project.empty.inspirationEyebrow'))}</h2>
        </div>
        <div class="legacy-empty-idea-grid">
          ${ideas.map(([icon,titleKey,bodyKey])=>ideaCard(icon,tx(titleKey),tx(bodyKey))).join('')}
        </div>
      </section>

      <button class="legacy-how-link legacy-empty-replay" type="button" onclick="replayProjectOnboarding()"><i class="fa-regular fa-circle-question"></i>${esc(tx('project.empty.replay'))}</button>
    </section>`;
  }
  function statusPage(p){
    const [label,tone]=statusMeta(p.status);
    const editable=['draft','adjustments'].includes(p.status);
    const canStart=p.status==='approved',canFinish=p.status==='in_progress';
    return `<section class="section legacy-page">
      <div class="legacy-project-head"><div><span class="eyebrow">Seu legado</span><h1>${esc(p.title||'Meu projeto')}</h1><p>${esc(p.category||'Projeto da comunidade')}</p></div><span class="badge ${tone}">${esc(label)}</span></div>
      ${p.status==='adjustments'&&p.reviewNote?`<div class="notice warning"><i class="fa-solid fa-pen-to-square"></i><div><strong>A equipe pediu um ajuste</strong><br>${esc(p.reviewNote)}</div></div>`:''}
      <div class="legacy-project-summary">
        <article><small>O legado</small><p>${esc(p.description||'—')}</p></article>
        <article><small>Por que importa</small><p>${esc(p.why||'—')}</p></article>
        <article><small>Resultado esperado</small><p>${esc(p.expectedResult||'—')}</p></article>
        ${p.materials?`<article><small>Materiais / apoio</small><p>${esc(p.materials)}</p></article>`:''}
      </div>
      ${p.driveUrl?`<a class="legacy-drive-card" href="${esc(p.driveUrl)}" target="_blank" rel="noopener noreferrer"><span><i class="fa-brands fa-google-drive"></i></span><div><strong>Registros no Google Drive</strong><small>Fotos, vídeos ou documentos do projeto</small></div><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`:''}
      ${p.result?`<div class="legacy-result-card"><span><i class="fa-solid fa-heart"></i></span><div><small>O que ficou para a comunidade</small><p>${esc(p.result)}</p></div></div>`:''}
      <div class="legacy-project-actions">
        ${editable?`<button class="btn btn-outline" type="button" onclick="openLegacyProjectForm()"><i class="fa-solid fa-pen"></i>Editar</button><button class="btn btn-primary" type="button" onclick="submitLegacyProject()"><i class="fa-solid fa-paper-plane"></i>${p.status==='adjustments'?'Reenviar':'Enviar para análise'}</button>`:''}
        ${canStart?'<button class="btn btn-primary" type="button" onclick="startLegacyProject()"><i class="fa-solid fa-play"></i>Começar execução</button>':''}
        ${canFinish?'<button class="btn btn-primary" type="button" onclick="openLegacyCompletion()"><i class="fa-solid fa-flag-checkered"></i>Concluir meu legado</button>':''}
      </div>
      <button class="legacy-how-link" type="button" onclick="replayProjectOnboarding()"><i class="fa-regular fa-circle-question"></i>Como funciona?</button>
    </section>`;
  }

  function candidatePreviewPage(){
    const ideas=[
      ['fa-leaf','project.idea.sustainability.title','project.idea.sustainability.body'],
      ['fa-hammer','project.idea.improvements.title','project.idea.improvements.body'],
      ['fa-people-group','project.idea.community.title','project.idea.community.body'],
      ['fa-laptop-code','project.idea.technology.title','project.idea.technology.body']
    ];
    return `<section class="section legacy-page legacy-candidate-preview-v2">
      <div class="legacy-candidate-hero-v2">
        <span class="legacy-candidate-kicker">${esc(tx('project.name'))}</span>
        <h1>${esc(tx('project.candidate.heroTitle'))}</h1>
        <p>${esc(tx('project.candidate.heroBody'))}</p>
      </div>

      <div class="legacy-candidate-flow legacy-candidate-flow-minimal">
        <div class="legacy-candidate-steps">
          <article class="is-current"><span>1</span><small>${esc(tx('project.candidate.now'))}</small><strong>${esc(tx('project.candidate.know'))}</strong></article>
          <article><span>2</span><small>${esc(tx('project.candidate.afterApproval'))}</small><strong>${esc(tx('project.candidate.create'))}</strong></article>
          <article><span>3</span><small>${esc(tx('project.candidate.duringStay'))}</small><strong>${esc(tx('project.candidate.realize'))}</strong></article>
        </div>
      </div>

      <div class="legacy-candidate-possibilities legacy-candidate-possibilities-v3">
        <div class="legacy-candidate-possibilities-head">
          <span class="eyebrow">${esc(tx('project.candidate.ideasEyebrow'))}</span>
          <h2>${esc(tx('project.candidate.ideasTitle'))}</h2>
          <p>${esc(tx('project.candidate.ideasSubtitle'))}</p>
        </div>
        <div class="legacy-candidate-idea-cards">
          ${ideas.map(([icon,titleKey,bodyKey])=>`<article class="legacy-candidate-idea-card"><span><i class="fa-solid ${icon}"></i></span><div><strong>${esc(tx(titleKey))}</strong><p>${esc(tx(bodyKey))}</p></div></article>`).join('')}
        </div>
      </div>

      <button class="legacy-how-link legacy-candidate-how-v2" type="button" onclick="replayProjectOnboarding()"><i class="fa-regular fa-circle-question"></i>${esc(tx('project.candidate.replay'))}</button>
    </section>`;
  }

  window.volunteerProject=function(){
    if(!window.OleiroProjects?.onboardingDone?.())return onboardingPage();
    if(state.volunteerMode!=='approved')return candidatePreviewPage();
    const p=project();return p?statusPage(p):emptyPage();
  };

  window.projectOnboardingNext=function(){
    const step=Number(state.projectOnboardingStep)||0;
    if(step<3){state.projectOnboardingStep=step+1;render();return}
    window.OleiroProjects?.completeOnboarding?.();state.projectOnboardingStep=0;render();
    if(state.volunteerMode==='approved')setTimeout(()=>openLegacyProjectForm(),0);
  };
  window.projectOnboardingBack=function(){
    const step=Number(state.projectOnboardingStep)||0;
    if(step>0){state.projectOnboardingStep=step-1;render();return}
    navigateVolunteer('home');
  };
  window.replayProjectOnboarding=function(){window.OleiroProjects?.resetOnboarding?.();state.projectOnboardingStep=0;render()};

  function legacyWizardValue(value){return String(value??'')}
  function legacyWizardProgress(){
    const total=8,current=Math.min(total,legacyProjectWizardStep+1),activeStep=Math.min(total-1,legacyProjectWizardStep);
    return `<div class="legacy-wizard-progress" aria-label="${esc(tx('project.wizard.progress',{current,total}))}">${Array.from({length:total},(_,index)=>`<i class="${index<=activeStep?'active':''}"></i>`).join('')}</div>`;
  }
  function legacyWizardQuestion(title,helper,content){
    return `<div class="legacy-project-wizard">${legacyWizardProgress()}<div class="legacy-wizard-copy"><h3>${esc(title)}</h3>${helper?`<p>${esc(helper)}</p>`:''}</div><div class="legacy-wizard-control">${content}</div></div>`;
  }
  function legacyWizardSummary(){
    const draft=legacyProjectWizardDraft||{},continuity=draft.allowContinuation!==false?tx('project.wizard.continuity.yes'):tx('project.wizard.continuity.no');
    const row=(icon,label,value)=>`<article class="legacy-wizard-summary-row"><span class="legacy-wizard-summary-icon"><i class="fa-solid ${icon}"></i></span><div><small>${esc(label)}</small><p>${esc(value||tx('project.wizard.review.empty'))}</p></div></article>`;
    return `<div class="legacy-project-wizard legacy-wizard-review">${legacyWizardProgress()}<div class="legacy-wizard-copy"><h3>${esc(tx('project.wizard.review.title'))}</h3><p>${esc(tx('project.wizard.review.helper'))}</p></div><div class="legacy-wizard-summary">
      ${row('fa-heading',tx('project.wizard.review.name'),draft.title)}
      ${row('fa-layer-group',tx('project.wizard.review.category'),draft.category)}
      ${row('fa-wand-magic-sparkles',tx('project.wizard.review.description'),draft.description)}
      ${row('fa-heart',tx('project.wizard.review.why'),draft.why)}
      ${row('fa-flag-checkered',tx('project.wizard.review.result'),draft.expectedResult)}
      ${row('fa-toolbox',tx('project.wizard.review.materials'),draft.materials)}
      ${row('fa-people-group',tx('project.wizard.review.continuity'),continuity)}
      ${row('fa-brands fa-google-drive',tx('project.wizard.review.drive'),draft.driveUrl)}
    </div></div>`;
  }
  function legacyWizardBody(){
    const draft=legacyProjectWizardDraft||{};
    if(legacyProjectWizardStep===8)return legacyWizardSummary();
    if(legacyProjectWizardStep===0)return legacyWizardQuestion(
      tx('project.wizard.name.question'),
      tx('project.wizard.name.helper'),
      `<input id="legacyWizardTitle" class="input legacy-wizard-input" maxlength="90" value="${esc(draft.title||'')}" placeholder="${esc(tx('project.wizard.name.placeholder'))}" autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();legacyProjectWizardNext()}">`
    );
    if(legacyProjectWizardStep===1)return legacyWizardQuestion(
      tx('project.wizard.category.question'),
      tx('project.wizard.category.helper'),
      `<div class="legacy-wizard-category-grid">${categories.map(category=>`<button class="legacy-wizard-choice ${draft.category===category?'active':''}" type="button" onclick="selectLegacyWizardCategory('${encodeURIComponent(category)}')">${esc(category)}</button>`).join('')}</div>`
    );
    if(legacyProjectWizardStep===2)return legacyWizardQuestion(
      tx('project.wizard.description.question'),
      tx('project.wizard.description.helper'),
      `<textarea id="legacyWizardDescription" class="textarea legacy-wizard-textarea" maxlength="900" placeholder="${esc(tx('project.wizard.description.placeholder'))}">${esc(draft.description||'')}</textarea>`
    );
    if(legacyProjectWizardStep===3)return legacyWizardQuestion(
      tx('project.wizard.why.question'),
      tx('project.wizard.why.helper'),
      `<textarea id="legacyWizardWhy" class="textarea legacy-wizard-textarea" maxlength="700" placeholder="${esc(tx('project.wizard.why.placeholder'))}">${esc(draft.why||'')}</textarea>`
    );
    if(legacyProjectWizardStep===4)return legacyWizardQuestion(
      tx('project.wizard.result.question'),
      tx('project.wizard.result.helper'),
      `<textarea id="legacyWizardResult" class="textarea legacy-wizard-textarea" maxlength="600" placeholder="${esc(tx('project.wizard.result.placeholder'))}">${esc(draft.expectedResult||'')}</textarea>`
    );
    if(legacyProjectWizardStep===5)return legacyWizardQuestion(
      tx('project.wizard.materials.question'),
      tx('project.wizard.materials.helper'),
      `<textarea id="legacyWizardMaterials" class="textarea legacy-wizard-textarea" maxlength="500" placeholder="${esc(tx('project.wizard.materials.placeholder'))}">${esc(draft.materials||'')}</textarea>`
    );
    if(legacyProjectWizardStep===6)return legacyWizardQuestion(
      tx('project.wizard.continuity.question'),
      tx('project.wizard.continuity.helper'),
      `<div class="legacy-wizard-binary"><button class="legacy-wizard-binary-option ${draft.allowContinuation!==false?'active':''}" type="button" onclick="selectLegacyWizardContinuity(true)"><span><i class="fa-solid fa-people-group"></i></span><div><strong>${esc(tx('project.wizard.continuity.yes'))}</strong><small>${esc(tx('project.wizard.continuity.yesHint'))}</small></div></button><button class="legacy-wizard-binary-option ${draft.allowContinuation===false?'active':''}" type="button" onclick="selectLegacyWizardContinuity(false)"><span><i class="fa-solid fa-flag-checkered"></i></span><div><strong>${esc(tx('project.wizard.continuity.no'))}</strong><small>${esc(tx('project.wizard.continuity.noHint'))}</small></div></button></div>`
    );
    return legacyWizardQuestion(
      tx('project.wizard.drive.question'),
      tx('project.wizard.drive.helper'),
      `<div class="legacy-wizard-drive"><input id="legacyWizardDrive" class="input legacy-wizard-input" value="${esc(draft.driveUrl||'')}" placeholder="${esc(tx('project.wizard.drive.placeholder'))}" inputmode="url" autocomplete="url"><div class="legacy-wizard-tip"><i class="fa-brands fa-google-drive"></i><span>${esc(tx('project.wizard.drive.tip'))}</span></div></div>`
    );
  }
  function captureLegacyWizardStep(){
    if(!legacyProjectWizardDraft)legacyProjectWizardDraft={};
    const draft=legacyProjectWizardDraft;
    if(legacyProjectWizardStep===0)draft.title=document.getElementById('legacyWizardTitle')?.value.trim()||draft.title||'';
    if(legacyProjectWizardStep===2)draft.description=document.getElementById('legacyWizardDescription')?.value.trim()||draft.description||'';
    if(legacyProjectWizardStep===3)draft.why=document.getElementById('legacyWizardWhy')?.value.trim()||draft.why||'';
    if(legacyProjectWizardStep===4)draft.expectedResult=document.getElementById('legacyWizardResult')?.value.trim()||draft.expectedResult||'';
    if(legacyProjectWizardStep===5)draft.materials=document.getElementById('legacyWizardMaterials')?.value.trim()||'';
    if(legacyProjectWizardStep===7)draft.driveUrl=document.getElementById('legacyWizardDrive')?.value.trim()||'';
    return draft;
  }
  function validateLegacyWizardStep(){
    const draft=captureLegacyWizardStep();
    if(legacyProjectWizardStep===0&&!draft.title)return showToast(tx('project.wizard.required')),false;
    if(legacyProjectWizardStep===1&&!draft.category)return showToast(tx('project.wizard.category.required')),false;
    if(legacyProjectWizardStep===2&&!draft.description)return showToast(tx('project.wizard.required')),false;
    if(legacyProjectWizardStep===3&&!draft.why)return showToast(tx('project.wizard.required')),false;
    if(legacyProjectWizardStep===4&&!draft.expectedResult)return showToast(tx('project.wizard.required')),false;
    if(legacyProjectWizardStep===7&&!validDrive(draft.driveUrl))return showToast(tx('project.wizard.drive.invalid')),false;
    return true;
  }
  function syncLegacyWizardViewport(){
    const modal=modalRoot.querySelector('.legacy-project-wizard-modal'),backdrop=modalRoot.querySelector('.modal-backdrop');
    if(!modal||!backdrop)return;
    const vv=window.visualViewport;
    const layoutHeight=Math.round(window.innerHeight||vv?.height||720);
    const height=Math.max(300,Math.round(vv?.height||layoutHeight));
    const offsetTop=Math.max(0,Math.round(vv?.offsetTop||0));
    const keyboardOpen=!!vv&&(layoutHeight-height)>150;
    modal.style.setProperty('--legacy-vv-height',height+'px');
    modal.classList.toggle('legacy-keyboard-open',keyboardOpen);
    backdrop.style.height=height+'px';
    backdrop.style.top=offsetTop+'px';
    backdrop.style.bottom='auto';
    if(keyboardOpen){
      /* No iOS o teclado reduz o visualViewport. Ancorar o wizard no limite
         inferior desse viewport evita o "buraco" entre o modal e o teclado. */
      backdrop.style.setProperty('align-items','flex-end','important');
      backdrop.style.setProperty('padding-top','6px','important');
      backdrop.style.setProperty('padding-bottom','6px','important');
    }else{
      backdrop.style.removeProperty('align-items');
      backdrop.style.removeProperty('padding-top');
      backdrop.style.removeProperty('padding-bottom');
    }
  }
  function keepLegacyWizardFieldVisible(target){
    if(!target)return;
    const body=target.closest('.modal-body');
    const reveal=()=>{
      if(!target.isConnected||!body)return;
      const bodyRect=body.getBoundingClientRect(),targetRect=target.getBoundingClientRect(),safeTop=bodyRect.top+8,safeBottom=bodyRect.bottom-10;
      if(targetRect.bottom>safeBottom)body.scrollTop+=targetRect.bottom-safeBottom;
      if(targetRect.top<safeTop)body.scrollTop-=safeTop-targetRect.top;
    };
    requestAnimationFrame(reveal);
    setTimeout(reveal,90);
    setTimeout(reveal,220);
    setTimeout(reveal,420);
  }
  function bindLegacyWizardViewport(){
    legacyProjectWizardViewportCleanup?.();
    const vv=window.visualViewport;
    const onViewport=()=>{
      syncLegacyWizardViewport();
      const active=document.activeElement;
      if(active?.classList?.contains('legacy-wizard-input')||active?.classList?.contains('legacy-wizard-textarea'))keepLegacyWizardFieldVisible(active);
    };
    const onFocus=event=>{
      const target=event.target;
      if(target?.classList?.contains('legacy-wizard-input')||target?.classList?.contains('legacy-wizard-textarea'))keepLegacyWizardFieldVisible(target);
    };
    vv?.addEventListener('resize',onViewport);
    vv?.addEventListener('scroll',onViewport);
    modalRoot.addEventListener('focusin',onFocus);
    legacyProjectWizardViewportCleanup=()=>{
      vv?.removeEventListener('resize',onViewport);
      vv?.removeEventListener('scroll',onViewport);
      modalRoot.removeEventListener('focusin',onFocus);
      legacyProjectWizardViewportCleanup=null;
    };
    onViewport();
  }
  function renderLegacyProjectWizard(){
    legacyProjectWizardViewportCleanup?.();
    const editing=!!project()?.id,total=8,current=Math.min(total,legacyProjectWizardStep+1),reviewing=legacyProjectWizardStep===8;
    const footer=`<div class="legacy-wizard-actions">${legacyProjectWizardStep>0?`<button class="btn btn-outline" type="button" onclick="legacyProjectWizardBack()"><i class="fa-solid fa-arrow-left"></i>${esc(tx('project.wizard.back'))}</button>`:`<button class="btn btn-outline" type="button" onclick="closeModal()">${esc(tx('common.cancel'))}</button>`}<button class="btn btn-primary" type="button" onclick="legacyProjectWizardNext()">${esc(reviewing?tx('project.wizard.save'):tx('project.wizard.next'))}${reviewing?'<i class="fa-solid fa-check"></i>':'<i class="fa-solid fa-arrow-right"></i>'}</button></div>`;
    openModal(
      esc(tx(editing?'project.wizard.editTitle':'project.wizard.createTitle')),
      esc(reviewing?tx('project.wizard.review.subtitle'):tx('project.wizard.progress',{current,total})),
      legacyWizardBody(),
      footer
    );
    const modal=modalRoot.querySelector('.modal');modal?.classList.add('legacy-project-wizard-modal');
    if(reviewing)modal?.classList.add('legacy-project-wizard-review-modal');
    bindLegacyWizardViewport();
    requestAnimationFrame(()=>{
      const target=modalRoot.querySelector('.legacy-wizard-input,.legacy-wizard-textarea');
      if(target&&legacyProjectWizardStep!==7&&legacyProjectWizardStep!==8){
        target.focus({preventScroll:true});
        keepLegacyWizardFieldVisible(target);
      }
    });
  }
  window.openLegacyProjectForm=function(){
    const p=project()||{};
    legacyProjectWizardStep=0;
    legacyProjectWizardDraft={
      title:legacyWizardValue(p.title),
      category:legacyWizardValue(p.category),
      description:legacyWizardValue(p.description),
      why:legacyWizardValue(p.why),
      expectedResult:legacyWizardValue(p.expectedResult),
      materials:legacyWizardValue(p.materials),
      allowContinuation:p.allowContinuation!==false,
      driveUrl:legacyWizardValue(p.driveUrl)
    };
    renderLegacyProjectWizard();
  };
  window.selectLegacyWizardCategory=function(encoded){
    if(!legacyProjectWizardDraft)return;
    legacyProjectWizardDraft.category=decodeURIComponent(String(encoded||''));
    renderLegacyProjectWizard();
  };
  window.selectLegacyWizardContinuity=function(value){
    if(!legacyProjectWizardDraft)return;
    legacyProjectWizardDraft.allowContinuation=!!value;
    renderLegacyProjectWizard();
  };
  window.legacyProjectWizardBack=function(){
    captureLegacyWizardStep();
    if(legacyProjectWizardStep<=0)return closeModal();
    legacyProjectWizardStep-=1;renderLegacyProjectWizard();
  };
  window.legacyProjectWizardNext=function(){
    if(legacyProjectWizardStep===8){window.saveLegacyProjectDraft();return}
    if(!validateLegacyWizardStep())return;
    if(legacyProjectWizardStep<7){legacyProjectWizardStep+=1;renderLegacyProjectWizard();return}
    legacyProjectWizardStep=8;renderLegacyProjectWizard();
  };

  function validDrive(url){if(!url)return true;try{const host=new URL(url).hostname.toLowerCase();return host==='drive.google.com'||host.endsWith('.drive.google.com')||host==='docs.google.com'}catch{return false}}
  window.saveLegacyProjectDraft=function(){
    const draft=captureLegacyWizardStep(),{title,category,description,why,expectedResult,materials,driveUrl}=draft,allowContinuation=draft.allowContinuation!==false;
    if(!title||!category||!description||!why||!expectedResult)return showToast(tx('project.wizard.required'));
    if(!validDrive(driveUrl))return showToast(tx('project.wizard.drive.invalid'));
    const old=project();
    window.OleiroProjects.saveOwn({title,category,description,why,expectedResult,materials,driveUrl,allowContinuation,status:old?.status==='adjustments'?'adjustments':'draft'});
    legacyProjectWizardDraft=null;legacyProjectWizardStep=0;
    legacyProjectWizardViewportCleanup?.();
    closeModal();render();showToast(tx('project.wizard.saved'));
  };
  window.submitLegacyProject=function(){
    const p=project();if(!p)return;
    window.OleiroProjects.saveOwn({status:'analysis',submittedAt:new Date().toISOString(),reviewNote:''});render();showToast('Projeto enviado para análise.');
  };
  window.startLegacyProject=function(){window.OleiroProjects.saveOwn({status:'in_progress',startedAt:new Date().toISOString()});render();showToast('Projeto marcado como em execução.')};
  window.openLegacyCompletion=function(){
    const p=project()||{};
    const body=`<div class="form-grid"><div class="field"><label for="legacyFinalResult">O que ficou para a comunidade?</label><textarea id="legacyFinalResult" class="textarea" maxlength="900" placeholder="Conte o que foi entregue e como a comunidade pode usar ou cuidar disso.">${esc(p.result||'')}</textarea></div><div class="field"><label for="legacyFinalDrive">Pasta pública do Google Drive <span class="legacy-optional">recomendado</span></label><input id="legacyFinalDrive" class="input" value="${esc(p.driveUrl||'')}" placeholder="https://drive.google.com/drive/folders/..."><small>Coloque fotos e vídeos do antes, durante e depois.</small></div><label class="check-card"><input id="legacyDrivePublic" type="checkbox"><span>Confirmei que qualquer pessoa com o link consegue visualizar a pasta</span></label></div>`;
    openModal('Concluir meu legado','Registre o resultado para que ele continue vivo na memória da Casa.',body,'<button class="btn btn-primary btn-block" type="button" onclick="completeLegacyProject()">Concluir projeto</button>');
  };
  window.completeLegacyProject=function(){
    const result=document.getElementById('legacyFinalResult')?.value.trim()||'',driveUrl=document.getElementById('legacyFinalDrive')?.value.trim()||'',confirmed=!!document.getElementById('legacyDrivePublic')?.checked;
    if(!result)return showToast('Conte o que ficou para a comunidade.');
    if(driveUrl&&!validDrive(driveUrl))return showToast('Use um link válido do Google Drive.');
    if(driveUrl&&!confirmed)return showToast('Confirme que o link do Drive está público.');
    window.OleiroProjects.saveOwn({status:'completed',result,driveUrl,completedAt:new Date().toISOString()});closeModal();render();showToast('Seu legado foi concluído. Obrigado por deixar algo para a comunidade.');
  };
  window.skipLegacyProjectPrompt=function(){
    window.dismissPortalProjectHighlight?.();
    openModal(
      tx('project.skip.title'),
      '',
      `<div class="legacy-skip-message"><span class="legacy-skip-icon"><i class="fa-solid fa-seedling"></i></span><div><strong>${esc(tx('project.skip.available'))}</strong><p>${esc(tx('project.skip.body'))}</p></div></div>`,
      `<div class="legacy-skip-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">${esc(tx('common.close'))}</button><button class="btn btn-primary" type="button" onclick="closeModal();navigateVolunteer('project')">${esc(tx('project.skip.go'))}</button></div>`
    );
  };

  window.legacyProjectHomeNoticeHtml=function(){
    if(state.volunteerMode!=='approved')return '';
    const p=project(),done=p?.status==='completed';
    if(done)return '';
    const label=p?tx('project.home.continue'):tx('project.home.know');
    return `<section class="legacy-home-callout legacy-home-callout-glow" data-project-highlight="1"><span class="legacy-home-callout-icon"><i class="fa-solid fa-seedling"></i></span><div class="legacy-home-callout-copy"><strong>${esc(tx('project.name'))}</strong><p>${esc(p?tx('project.home.existingBody'):tx('project.home.newBody'))}</p></div><div class="legacy-home-callout-actions"><button class="btn btn-outline" type="button" onclick="skipLegacyProjectPrompt()">${esc(tx('project.home.notNow'))}</button><button class="btn btn-primary" type="button" onclick="openPortalProjectHighlight()">${esc(label)}</button></div></section>`;
  };

  let legacyProjectSwipeStart=null;
  document.addEventListener('touchstart',event=>{
    if(!event.target.closest?.('.legacy-onboarding'))return;
    legacyProjectSwipeStart=event.changedTouches?.[0]?.clientX??null;
  },{passive:true});
  document.addEventListener('touchend',event=>{
    if(legacyProjectSwipeStart==null||!event.target.closest?.('.legacy-onboarding')){legacyProjectSwipeStart=null;return}
    const end=event.changedTouches?.[0]?.clientX??legacyProjectSwipeStart,diff=end-legacyProjectSwipeStart;
    legacyProjectSwipeStart=null;
    if(Math.abs(diff)<55)return;
    if(diff<0)window.projectOnboardingNext?.();else window.projectOnboardingBack?.();
  },{passive:true});
})();