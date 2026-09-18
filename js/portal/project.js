/* Área Projeto/Legado do voluntário. */
(function legacyProjectPortal(){
  const categories=['Sustentabilidade','Estrutura','Educação','Saúde e bem-estar','Cultura e lazer','Organização','Comunicação','Tecnologia','Outro'];
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'');
  const tx=(key,params={})=>typeof t==='function'?t(key,params):String(key||'');
  /* Homologação: mantém os avisos visíveis para facilitar validação visual.
     Remover/desativar antes de promover esta branch para produção. */
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
  function legacyProgressDate(value){
    if(!value)return '';
    try{
      const date=new Date(value);
      if(Number.isNaN(date.getTime()))return '';
      return new Intl.DateTimeFormat('pt-BR',{
        day:'2-digit',
        month:'short',
        year:'numeric',
        hour:'2-digit',
        minute:'2-digit'
      }).format(date).replace('.', '');
    }catch{return ''}
  }
  function legacyProgressEntries(p){
    return Array.isArray(p?.progressEntries)?p.progressEntries.filter(item=>item&&String(item.text||'').trim()):[];
  }
  function legacyTimeline(p){
    const rows=[];
    if(p?.startedAt)rows.push({
      id:'started',
      type:'start',
      at:p.startedAt,
      title:'Execução iniciada',
      text:'O projeto começou a sair do papel.'
    });
    legacyProgressEntries(p).forEach((item,index)=>rows.push({
      id:item.id||('progress-'+index),
      type:'progress',
      at:item.at||item.createdAt||p?.updatedAt,
      title:'Atualização de progresso',
      text:String(item.text||'').trim()
    }));
    if(p?.completedAt)rows.push({
      id:'completed',
      type:'complete',
      at:p.completedAt,
      title:'Legado concluído',
      text:'Resultado final registrado e legado concluído.'
    });
    return rows.sort((a,b)=>new Date(b.at||0)-new Date(a.at||0));
  }
  function legacyTimelineRowsHtml(p){
    const rows=legacyTimeline(p);
    const icon=type=>type==='start'?'fa-play':type==='complete'?'fa-flag-checkered':'fa-message';
    return rows.length?rows.map(item=>`<article class="legacy-project-timeline-item ${esc(item.type)}">
      <span class="legacy-project-timeline-icon"><i class="fa-solid ${icon(item.type)}"></i></span>
      <div class="legacy-project-timeline-content">
        <div class="legacy-project-timeline-meta"><strong>${esc(item.title)}</strong><time>${esc(legacyProgressDate(item.at))}</time></div>
        <p>${esc(item.text)}</p>
      </div>
    </article>`).join(''):`<div class="legacy-project-timeline-empty"><i class="fa-regular fa-clock"></i><span>As atualizações do projeto aparecerão aqui.</span></div>`;
  }
  function legacyTrackingHtml(p){
    return `<section class="legacy-project-tracking">
      <div class="legacy-project-tracking-head">
        <div>
          <span class="eyebrow">Acompanhamento</span>
          <h2>Acompanhar execução</h2>
          <p>Registre os avanços do projeto enquanto ele acontece.</p>
        </div>
      </div>
      <div class="legacy-project-timeline">${legacyTimelineRowsHtml(p)}</div>
    </section>`;
  }
  function legacyCompletedHistoryHtml(p){
    const count=legacyTimeline(p).length;
    return `<details class="legacy-completed-history">
      <summary>
        <span class="legacy-completed-history-icon"><i class="fa-solid fa-clock-rotate-left"></i></span>
        <span class="legacy-completed-history-copy">
          <small>Sua história</small>
          <strong>Relembre sua jornada</strong>
          <span>${count} ${count===1?'momento registrado':'momentos registrados'}</span>
        </span>
        <i class="fa-solid fa-chevron-down project-ui-expand-chevron" aria-hidden="true"></i>
      </summary>
      <div class="legacy-completed-history-body">
        <div class="legacy-project-timeline">${legacyTimelineRowsHtml(p)}</div>
      </div>
    </details>`;
  }

  function legacyCompletionIso(value){
    if(!value)return '';
    if(typeof value==='string')return value.slice(0,10);
    if(typeof value?.toDate==='function')return value.toDate().toISOString().slice(0,10);
    const date=new Date(value);
    return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10);
  }
  function legacyCompletionDate(value){
    const iso=legacyCompletionIso(value);
    if(!iso)return '';
    try{
      return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(iso+'T12:00:00')).replace('.','');
    }catch{return iso}
  }
  function legacyCompletionDays(start,end){
    const from=legacyCompletionIso(start),to=legacyCompletionIso(end);
    if(!from||!to)return null;
    const a=new Date(from+'T12:00:00'),b=new Date(to+'T12:00:00');
    if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())||b<a)return null;
    return Math.round((b-a)/86400000)+1;
  }
  function legacyCompletionVolunteerName(){
    const session=state.currentSession||{},profile=session.profile||{},application=state.currentApplication||{};
    return profile.name||profile.fullName||(Array.isArray(application.participantNames)?application.participantNames[0]:'')||'';
  }
  function legacyCompletionVisual(){
    return `<div class="legacy-visual legacy-visual-farewell">
      <span class="legacy-farewell-sprout"><i class="fa-solid fa-seedling"></i></span>
      <span class="legacy-farewell-heart"><i class="fa-solid fa-heart"></i></span>
      <span class="legacy-farewell-stars"><i class="fa-solid fa-sparkles"></i></span>
      <span class="legacy-farewell-path"></span>
    </div>`;
  }
  function legacyCompletionPage(p){
    const application=state.currentApplication||{};
    const fullName=legacyCompletionVolunteerName(),firstName=String(fullName||'').trim().split(/\s+/)[0]||'';
    const start=application.stayStart||application.from||'';
    const end=application.stayEnd||application.to||p.completedAt||'';
    const startLabel=legacyCompletionDate(start);
    const endLabel=legacyCompletionDate(end);
    const days=legacyCompletionDays(start,end);
    const unit=application.unitName||p.unitName||String(application.unitId||p.unitId||'').replace(/^./,c=>c.toUpperCase());
    const progressCount=legacyProgressEntries(p).length;
    const resultText=String(p.result||p.expectedResult||p.description||'').trim();
    const title=firstName?`Foi muito bom ter você conosco, ${esc(firstName)} 💚`:'Foi muito bom ter você conosco 💚';

    const staySentence=startLabel
      ?`Você chegou em <strong>${esc(startLabel)}</strong>${days?` e permaneceu <strong>${days} ${days===1?'dia':'dias'}</strong> conosco`:''}${unit?` em <strong>${esc(unit)}</strong>`:''}.`
      :'Obrigado por fazer parte dessa experiência com a Casa do Oleiro.';

    const journeySentence=progressCount
      ?`Ao longo dessa jornada, acompanhamos <strong>${progressCount} ${progressCount===1?'atualização':'atualizações'}</strong> do seu legado até ele ganhar forma.`
      :'Ao longo dessa jornada, vimos seu legado ganhar forma e deixar uma marca na comunidade.';

    return `<section class="section legacy-page legacy-completion-page">
      <div class="legacy-completion-onboarding">
        <div class="legacy-onboarding-body legacy-completion-body">
          ${legacyCompletionVisual()}
          <span class="eyebrow">Jornada concluída</span>
          <h1>${title}</h1>
          <p>${staySentence} ${journeySentence}</p>

          <div class="legacy-completion-facts">
            ${startLabel?`<div><small>Chegada</small><strong>${esc(startLabel)}</strong></div>`:''}
            ${days?`<div><small>Tempo conosco</small><strong>${days} ${days===1?'dia':'dias'}</strong></div>`:''}
            ${endLabel?`<div><small>Até</small><strong>${esc(endLabel)}</strong></div>`:''}
          </div>

          <div class="legacy-completion-project">
            <span class="legacy-completion-project-icon"><i class="fa-solid fa-seedling"></i></span>
            <div>
              <small>O legado que você deixou</small>
              <h2>${esc(p.title||'Projeto Legado')}</h2>
              ${resultText?`<p>${esc(resultText)}</p>`:''}
            </div>
          </div>

          ${p.completedAt?`<span class="legacy-completion-finished"><i class="fa-solid fa-circle-check"></i> Legado concluído em ${esc(legacyCompletionDate(p.completedAt))}</span>`:''}
        </div>

        <div class="legacy-completion-recap">
          ${legacyCompletedHistoryHtml(p)}
        </div>
      </div>
    </section>`;
  }

  function statusPage(p){
    if(p?.status==='completed')return legacyCompletionPage(p);
    const [label,tone]=statusMeta(p.status);
    const editable=['draft','adjustments'].includes(p.status);
    const canStart=p.status==='approved';
    const inProgress=p.status==='in_progress';
    const completed=false;
    const expandHero=inProgress||completed;
    const row=(icon,labelText,value)=>`<article class="legacy-project-story-row"><span><i class="fa-solid ${icon}"></i></span><div><small>${esc(labelText)}</small><p>${esc(value||'—')}</p></div></article>`;
    const storyRows=`<div class="legacy-project-story-list">
      ${row('fa-wand-magic-sparkles','O legado',p.description)}
      ${row('fa-heart','Por que importa',p.why)}
      ${row('fa-flag-checkered','Resultado esperado',p.expectedResult)}
      ${p.materials?row('fa-toolbox','Materiais / apoio',p.materials):''}
    </div>`;
    const drive=p.driveUrl?`<a class="legacy-project-drive-v5" href="${esc(p.driveUrl)}" target="_blank" rel="noopener noreferrer"><span><i class="fa-brands fa-google-drive"></i></span><div><strong>Google Drive</strong><small>Fotos, vídeos e documentos do projeto</small></div><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`:'';
    const result=p.result?`<section class="legacy-project-outcome-v6">
      <span class="legacy-project-outcome-icon"><i class="fa-solid fa-heart"></i></span>
      <div>
        <small>O que ficou para a comunidade</small>
        <h2>${esc(p.result)}</h2>
        <p>Este é o resultado final registrado pelo voluntário.</p>
        ${p.completedAt?`<span class="legacy-project-outcome-date"><i class="fa-solid fa-circle-check"></i>Concluído em ${esc(legacyProgressDate(p.completedAt))}</span>`:''}
      </div>
    </section>`:'';

    const heroSummary=`
      <div class="legacy-status-hero-top">
        <span class="legacy-status-kicker">Projeto Legado</span>
        <span class="legacy-status-hero-summary-side">
          <span class="legacy-status-chip ${tone}">${esc(label)}</span>
          ${expandHero?'<i class="fa-solid fa-chevron-down legacy-status-hero-chevron project-ui-expand-chevron" aria-hidden="true"></i>':''}
        </span>
      </div>
      <h1>${esc(p.title||'Meu projeto')}</h1>
      <p>${esc(p.category||'Projeto da comunidade')}</p>
      ${p.status==='adjustments'&&p.reviewNote?`<button class="legacy-status-review-link" type="button" onclick="event.preventDefault();event.stopPropagation();openLegacyProjectAdjustmentNotice()"><i class="fa-solid fa-message"></i>Ver orientação da equipe</button>`:''}`;

    const hero=expandHero
      ?`<details class="project-ui-expandable legacy-status-project-expandable">
          <summary class="legacy-status-hero-v5 legacy-status-hero-summary">${heroSummary}</summary>
          <div class="legacy-status-hero-expanded">
            <div class="legacy-status-hero-expanded-head"><span>Projeto original</span></div>
            ${storyRows}
            ${drive}
          </div>
        </details>`
      :`<section class="legacy-status-hero-v5">${heroSummary}</section>`;

    const currentStory=`<section class="legacy-project-story legacy-project-story-secondary">
      <div class="legacy-project-story-head">
        <span class="eyebrow">Seu projeto</span>
        <h2>O que você está construindo</h2>
      </div>
      ${storyRows}
      ${drive}
    </section>`;

    let content='';
    if(completed){
      content=`${result}${legacyCompletedHistoryHtml(p)}`;
    }else if(inProgress){
      content=legacyTrackingHtml(p);
    }else{
      content=currentStory;
    }

    return `<section class="section legacy-page legacy-status-v5 ${completed?'is-completed':inProgress?'is-in-progress':''}">
      ${hero}

      ${content}

      ${completed?'':`<div class="legacy-project-actions ${editable?'legacy-project-actions-pair':''} ${inProgress?'legacy-project-actions-execution':''}">
        ${editable?`<button class="btn btn-outline" type="button" onclick="openLegacyProjectForm()"><i class="fa-solid fa-pen"></i>Editar</button><button class="btn btn-primary" type="button" onclick="submitLegacyProject()"><i class="fa-solid fa-paper-plane"></i>${p.status==='adjustments'?'Reenviar':'Enviar para análise'}</button>`:''}
        ${canStart?'<button class="btn btn-primary" type="button" onclick="startLegacyProject()"><i class="fa-solid fa-play"></i>Começar execução</button>':''}
        ${inProgress?'<button class="btn btn-outline" type="button" onclick="openLegacyProgressUpdate()"><i class="fa-solid fa-message"></i>Comentar andamento</button><button class="btn btn-primary" type="button" onclick="openLegacyCompletion()"><i class="fa-solid fa-flag-checkered"></i>Concluir legado</button>':''}
      </div>
      <button class="legacy-how-link legacy-status-how" type="button" onclick="replayProjectOnboarding()"><i class="fa-regular fa-circle-question"></i>Como funciona?</button>`}
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
    const p=project();
    if(state.volunteerMode==='approved'&&p?.status==='completed')return statusPage(p);
    if(!window.OleiroProjects?.onboardingDone?.())return onboardingPage();
    if(state.volunteerMode!=='approved')return candidatePreviewPage();
    return p?statusPage(p):emptyPage();
  };

  window.projectOnboardingNext=function(){
    const step=Number(state.projectOnboardingStep)||0;
    if(step<3){state.projectOnboardingStep=step+1;render();return}
    window.OleiroProjects?.completeOnboarding?.();state.projectOnboardingStep=0;render();
    if(state.volunteerMode==='approved'&&!project())setTimeout(()=>openLegacyProjectForm(),0);
  };
  window.projectOnboardingBack=function(){
    const step=Number(state.projectOnboardingStep)||0;
    if(step>0){state.projectOnboardingStep=step-1;render();return}
    navigateVolunteer('home');
  };
  window.replayProjectOnboarding=function(){
    const p=project();
    if(p?.status==='completed')return showToast('Este legado já foi concluído e está fechado para alterações.');
    window.OleiroProjects?.resetOnboarding?.();state.projectOnboardingStep=0;render();
  };

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
    const row=(icon,label,value)=>`<article class="legacy-wizard-summary-row"><span class="legacy-wizard-summary-icon"><i class="${icon}"></i></span><div><small>${esc(label)}</small><p>${esc(value||tx('project.wizard.review.empty'))}</p></div></article>`;
    return `<div class="legacy-project-wizard legacy-wizard-review">${legacyWizardProgress()}<div class="legacy-wizard-copy"><h3>${esc(tx('project.wizard.review.title'))}</h3><p>${esc(tx('project.wizard.review.helper'))}</p></div><div class="legacy-wizard-summary">
      ${row('fa-solid fa-heading',tx('project.wizard.review.name'),draft.title)}
      ${row('fa-solid fa-layer-group',tx('project.wizard.review.category'),draft.category)}
      ${row('fa-solid fa-wand-magic-sparkles',tx('project.wizard.review.description'),draft.description)}
      ${row('fa-solid fa-heart',tx('project.wizard.review.why'),draft.why)}
      ${row('fa-solid fa-flag-checkered',tx('project.wizard.review.result'),draft.expectedResult)}
      ${row('fa-solid fa-toolbox',tx('project.wizard.review.materials'),draft.materials)}
      ${row('fa-solid fa-people-group',tx('project.wizard.review.continuity'),continuity)}
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
    const modal=modalRoot.querySelector('.project-wizard-modal'),backdrop=modalRoot.querySelector('.modal-backdrop');
    if(!modal||!backdrop)return;
    const vv=window.visualViewport;
    const layoutHeight=Math.round(window.innerHeight||vv?.height||720);
    const height=Math.max(300,Math.round(vv?.height||layoutHeight));
    const offsetTop=Math.max(0,Math.round(vv?.offsetTop||0));
    const keyboardOpen=!!vv&&(layoutHeight-height)>150;
    modal.style.setProperty('--modal-viewport-height',height+'px');
    modal.classList.toggle('modal-keyboard-open',keyboardOpen);
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
    const modal=modalRoot.querySelector('.modal');modal?.classList.add('modal-wide','project-wizard-modal');
    
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
    const current=project();
    if(current&&!['draft','adjustments'].includes(current.status))return showToast(current.status==='completed'?'Este legado já foi concluído e não pode mais ser editado.':'Este projeto já avançou de etapa e não pode mais ser editado.');
    const p=current||{};
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
    if(old&&!['draft','adjustments'].includes(old.status))return showToast(old.status==='completed'?'Este legado já foi concluído e não pode mais ser editado.':'Este projeto já avançou de etapa e não pode mais ser editado.');
    window.OleiroProjects.saveOwn({title,category,description,why,expectedResult,materials,driveUrl,allowContinuation,status:old?.status==='adjustments'?'adjustments':'draft'});
    legacyProjectWizardDraft=null;legacyProjectWizardStep=0;
    legacyProjectWizardViewportCleanup?.();
    closeModal();render();showToast(tx('project.wizard.saved'));
  };
  window.submitLegacyProject=function(){
    const p=project();if(!p||!['draft','adjustments'].includes(p.status))return;
    window.OleiroProjects.saveOwn({status:'analysis',submittedAt:new Date().toISOString(),reviewNote:''});render();showToast('Projeto enviado para análise.');
  };
  window.startLegacyProject=function(){
    const current=project();if(!current||current.status!=='approved')return;
    window.OleiroProjects.saveOwn({status:'in_progress',startedAt:current.startedAt||new Date().toISOString()});
    render();
    showToast('Execução iniciada. Agora você pode registrar o progresso por aqui.');
  };
  window.openLegacyProgressUpdate=function(){
    const p=project();if(!p||p.status!=='in_progress')return;
    const body=`<div class="legacy-progress-modal">
      <div class="field">
        <label for="legacyProgressText">O que aconteceu no projeto?</label>
        <textarea id="legacyProgressText" class="textarea" maxlength="700" placeholder="Ex.: hoje montamos a estrutura da composteira e separamos os primeiros materiais."></textarea>
        <small>Esse comentário entra no histórico com a data e a hora.</small>
      </div>
    </div>`;
    openModal('Comentar progresso','Registre um avanço, uma etapa concluída ou algo importante da execução.',body,'<button class="btn btn-primary btn-block" type="button" onclick="saveLegacyProgressUpdate()"><i class="fa-solid fa-plus"></i>Adicionar ao histórico</button>');
    setTimeout(()=>document.getElementById('legacyProgressText')?.focus(),80);
  };
  window.saveLegacyProgressUpdate=function(){
    const p=project();if(!p||p.status!=='in_progress')return;
    const text=document.getElementById('legacyProgressText')?.value.trim()||'';
    if(!text)return showToast('Escreva uma atualização do progresso.');
    const at=new Date().toISOString();
    const progressEntries=[...legacyProgressEntries(p),{id:'progress-'+Date.now(),text,at}];
    window.OleiroProjects.saveOwn({progressEntries});
    closeModal();
    render();
    showToast('Progresso adicionado ao histórico.');
  };
  window.openLegacyCompletion=function(){
    const p=project();if(!p||p.status!=='in_progress')return;
    const body=`<div class="form-grid"><div class="field"><label for="legacyFinalResult">O que ficou para a comunidade?</label><textarea id="legacyFinalResult" class="textarea" maxlength="900" placeholder="Conte o que foi entregue e como a comunidade pode usar ou cuidar disso.">${esc(p.result||'')}</textarea></div><div class="field"><label for="legacyFinalDrive">Pasta pública do Google Drive <span class="legacy-optional">recomendado</span></label><input id="legacyFinalDrive" class="input" value="${esc(p.driveUrl||'')}" placeholder="https://drive.google.com/drive/folders/..."><small>Coloque fotos e vídeos do antes, durante e depois.</small></div><label class="check-card"><input id="legacyDrivePublic" type="checkbox"><span>Confirmei que qualquer pessoa com o link consegue visualizar a pasta</span></label></div>`;
    openModal('Concluir meu legado','Registre o resultado para que ele continue vivo na memória da Casa.',body,'<button class="btn btn-primary btn-block" type="button" onclick="completeLegacyProject()">Concluir projeto</button>');
  };
  window.completeLegacyProject=function(){
    const current=project();if(!current||current.status!=='in_progress')return;
    const result=document.getElementById('legacyFinalResult')?.value.trim()||'',driveUrl=document.getElementById('legacyFinalDrive')?.value.trim()||'',confirmed=!!document.getElementById('legacyDrivePublic')?.checked;
    if(!result)return showToast('Conte o que ficou para a comunidade.');
    if(driveUrl&&!validDrive(driveUrl))return showToast('Use um link válido do Google Drive.');
    if(driveUrl&&!confirmed)return showToast('Confirme que o link do Drive está público.');
    window.OleiroProjects.saveOwn({status:'completed',result,driveUrl,completedAt:new Date().toISOString()});closeModal();render();showToast('Seu legado foi concluído. Obrigado por deixar algo para a comunidade.');
  };
  window.dismissLegacyProjectAdjustmentNotice=function(){
    const card=document.querySelector('[data-project-adjustment-update="1"]');
    if(card){
      card.classList.add('is-leaving');
      setTimeout(()=>card.remove(),220);
    }
  };

  window.openLegacyProjectAdjustmentNotice=function(){
    const p=project();if(!p||p.status!=='adjustments')return;
    document.querySelector('[data-project-adjustment-update="1"]')?.classList.add('is-leaving');
    setTimeout(()=>document.querySelector('[data-project-adjustment-update="1"]')?.remove(),180);
    const body=`<div class="legacy-adjustment-modal"><span class="legacy-adjustment-modal-icon"><i class="fa-solid fa-pen-to-square"></i></span><div><small>${esc(tx('project.adjustment.modalEyebrow'))}</small><strong>${esc(tx('project.adjustment.modalTitle2'))}</strong><p>${esc(p.reviewNote||'Abra o projeto para conferir o que precisa ser revisto.')}</p></div></div>`;
    const footer=`<div class="legacy-adjustment-modal-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">${esc(tx('project.adjustment.close'))}</button><button class="btn btn-primary" type="button" onclick="closeModal();navigateVolunteer('project');setTimeout(()=>openLegacyProjectForm(),80)"><i class="fa-solid fa-pen"></i>${esc(tx('project.adjustment.edit'))}</button></div>`;
    openModal(tx('project.adjustment.modalTitle'),'',body,footer);
    modalRoot.querySelector('.modal')?.classList.add('modal-compact');
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