/* Área Projeto/Legado do voluntário. */
(function legacyProjectPortal(){
  const categories=['Sustentabilidade','Estrutura','Educação','Saúde e bem-estar','Cultura e lazer','Organização','Comunicação','Tecnologia','Outro'];
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'');

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
      ['Deixe algo que continua.','Sua experiência pode virar uma contribuição que permaneça na Casa depois da sua partida.'],
      ['O que é deixar um legado?','Pode ser uma horta, oficina, melhoria, material ou ideia simples que outras pessoas possam continuar.'],
      ['Encontre uma ideia.','Observe a Casa, converse com as pessoas e pense onde suas habilidades podem ajudar.'],
      ['Qual será o seu legado?','Crie algo útil, possível e que possa continuar crescendo depois da sua estadia.']
    ];
    const [title,text]=slides[step];
    return `<section class="legacy-onboarding">
      <div class="legacy-onboarding-body">
        ${onboardingIllustration(step)}
        <h1>${esc(title)}</h1><p>${esc(text)}</p>
      </div>
      <div class="legacy-onboarding-footer"><span>Deslize para conhecer</span><div class="legacy-dots">${slides.map((_,i)=>`<i class="${i===step?'active':''}"></i>`).join('')}</div><button class="btn btn-primary btn-block legacy-next" type="button" onclick="projectOnboardingNext()">${step===3?'Quero criar meu projeto':'Próximo'}</button></div>
    </section>`;
  }
  function emptyPage(){
    return `<section class="section legacy-page">
      <div class="legacy-page-title"><span class="eyebrow">Seu legado</span><h1>O que você vai deixar para a comunidade?</h1><p>Transforme uma ideia, habilidade ou necessidade da Casa em algo que continue fazendo diferença depois da sua estadia.</p></div>
      <div class="legacy-start-card"><div><span class="legacy-start-icon"><i class="fa-solid fa-seedling"></i></span><h2>Comece observando ao seu redor</h2><p>Seu projeto pode nascer de uma necessidade simples. Ele deve ser possível de realizar, útil para a comunidade e deixar uma contribuição concreta ou reutilizável.</p></div><button class="btn btn-primary" type="button" onclick="openLegacyProjectForm()"><i class="fa-solid fa-plus"></i>Criar meu projeto</button></div>
      <div class="section-head legacy-inspire-head"><div><h2>Inspire-se</h2><p>Algumas formas de deixar um legado.</p></div></div>
      <div class="legacy-idea-grid">
        ${ideaCard('fa-leaf','Sustentabilidade','Horta, composteira, plantio, reaproveitamento ou separação de resíduos.')}
        ${ideaCard('fa-hammer','Melhorias','Organização de espaços, pequenos reparos, sinalização ou estrutura.')}
        ${ideaCard('fa-people-group','Comunidade','Oficinas, esporte, cultura, dinâmicas ou atividades que possam continuar.')}
        ${ideaCard('fa-book-open','Conhecimento','Manuais, materiais educativos, aulas ou processos documentados.')}
        ${ideaCard('fa-laptop-code','Tecnologia','Planilhas, sistemas, automações ou soluções de comunicação.')}
      </div>
      <button class="legacy-how-link" type="button" onclick="replayProjectOnboarding()"><i class="fa-regular fa-circle-question"></i>Rever como funciona</button>
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
    return `<section class="section legacy-page legacy-candidate-preview-v2">
      <div class="legacy-candidate-hero-v2">
        <span class="legacy-candidate-kicker">Projeto Legado</span>
        <h1>Uma ideia sua pode continuar aqui.</h1>
        <p>Conheça possibilidades agora e crie seu projeto quando sua candidatura for aprovada.</p>
      </div>

      <div class="legacy-candidate-flow">
        <div class="legacy-candidate-flow-head">
          <div><span class="eyebrow">Como funciona</span><strong>Da ideia à realização</strong></div>
          <small><i class="fa-solid fa-lock"></i> criação após aprovação</small>
        </div>
        <div class="legacy-candidate-steps">
          <article class="is-current"><span>1</span><small>Agora</small><strong>Conheça</strong></article>
          <article><span>2</span><small>Após aprovação</small><strong>Crie</strong></article>
          <article><span>3</span><small>Na estadia</small><strong>Realize</strong></article>
        </div>
      </div>

      <div class="legacy-candidate-ideas-head">
        <span class="eyebrow">Possibilidades</span>
        <h2>O que pode virar um legado?</h2>
      </div>

      <div class="legacy-candidate-idea-grid-v2">
        <article class="legacy-candidate-idea-v2"><span><i class="fa-solid fa-leaf"></i></span><div><strong>Sustentabilidade</strong><p>Horta, composteira ou reaproveitamento.</p></div></article>
        <article class="legacy-candidate-idea-v2"><span><i class="fa-solid fa-hammer"></i></span><div><strong>Melhorias</strong><p>Organização, espaços e pequenos reparos.</p></div></article>
        <article class="legacy-candidate-idea-v2"><span><i class="fa-solid fa-people-group"></i></span><div><strong>Comunidade</strong><p>Oficinas, esporte ou cultura.</p></div></article>
        <article class="legacy-candidate-idea-v2"><span><i class="fa-solid fa-laptop-code"></i></span><div><strong>Tecnologia</strong><p>Sistemas, materiais ou automações.</p></div></article>
      </div>

      <button class="legacy-how-link legacy-candidate-how-v2" type="button" onclick="replayProjectOnboarding()"><i class="fa-regular fa-circle-question"></i>Rever apresentação</button>
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

  window.openLegacyProjectForm=function(){
    const p=project()||{};
    const options=categories.map(c=>`<option value="${esc(c)}" ${p.category===c?'selected':''}>${esc(c)}</option>`).join('');
    const body=`<div class="form-grid legacy-project-form">
      <div class="field"><label for="legacyTitle">Nome do projeto</label><input id="legacyTitle" class="input" maxlength="90" value="${esc(p.title||'')}" placeholder="Ex.: Composteira comunitária"></div>
      <div class="field"><label for="legacyCategory">Categoria</label><select id="legacyCategory" class="select"><option value="">Selecione</option>${options}</select></div>
      <div class="field"><label for="legacyDescription">O que você pretende deixar como legado?</label><textarea id="legacyDescription" class="textarea" maxlength="900" placeholder="Conte de forma simples o que você quer criar, melhorar ou organizar.">${esc(p.description||'')}</textarea></div>
      <div class="field"><label for="legacyWhy">Por que isso é importante para a comunidade?</label><textarea id="legacyWhy" class="textarea" maxlength="700" placeholder="Que necessidade isso atende ou que diferença pode fazer?">${esc(p.why||'')}</textarea></div>
      <div class="field"><label for="legacyResult">Qual resultado você espera entregar?</label><textarea id="legacyResult" class="textarea" maxlength="600" placeholder="Ex.: composteira montada, identificada e com instruções de uso.">${esc(p.expectedResult||'')}</textarea></div>
      <div class="field"><label for="legacyMaterials">Materiais ou apoio necessários <span class="legacy-optional">opcional</span></label><textarea id="legacyMaterials" class="textarea" maxlength="500" placeholder="Liste ferramentas, materiais ou ajuda que você acredita precisar.">${esc(p.materials||'')}</textarea></div>
      <div class="field"><label class="check-card legacy-continuity"><input id="legacyContinuity" type="checkbox" ${p.allowContinuation!==false?'checked':''}><span>Este projeto pode ser continuado por futuros voluntários</span></label></div>
      <div class="field"><label for="legacyDrive">Pasta pública do Google Drive <span class="legacy-optional">opcional</span></label><input id="legacyDrive" class="input" value="${esc(p.driveUrl||'')}" placeholder="https://drive.google.com/drive/folders/..."><small>Use uma pasta configurada como “Qualquer pessoa com o link pode visualizar”.</small></div>
    </div>`;
    const footer='<button class="btn btn-outline" type="button" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" type="button" onclick="saveLegacyProjectDraft()">Salvar projeto</button>';
    openModal(p.id?'Editar projeto':'Criar meu projeto','Seu legado pode começar pequeno. O importante é que ele seja útil e possível de realizar.',body,footer);
    modalRoot.querySelector('.modal')?.classList.add('legacy-project-modal');
  };
  function validDrive(url){if(!url)return true;try{const host=new URL(url).hostname.toLowerCase();return host==='drive.google.com'||host.endsWith('.drive.google.com')||host==='docs.google.com'}catch{return false}}
  window.saveLegacyProjectDraft=function(){
    const title=document.getElementById('legacyTitle')?.value.trim()||'',category=document.getElementById('legacyCategory')?.value||'',description=document.getElementById('legacyDescription')?.value.trim()||'',why=document.getElementById('legacyWhy')?.value.trim()||'',expectedResult=document.getElementById('legacyResult')?.value.trim()||'',materials=document.getElementById('legacyMaterials')?.value.trim()||'',driveUrl=document.getElementById('legacyDrive')?.value.trim()||'',allowContinuation=!!document.getElementById('legacyContinuity')?.checked;
    if(!title||!category||!description||!why||!expectedResult)return showToast('Preencha os campos principais do projeto.');
    if(!validDrive(driveUrl))return showToast('Use um link válido do Google Drive.');
    const old=project();
    window.OleiroProjects.saveOwn({title,category,description,why,expectedResult,materials,driveUrl,allowContinuation,status:old?.status==='adjustments'?'adjustments':'draft'});
    closeModal();render();showToast('Projeto salvo.');
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
      'Você pode conhecer depois',
      '',
      '<div class="legacy-skip-message"><span class="legacy-skip-icon"><i class="fa-solid fa-seedling"></i></span><div><strong>O Projeto continua disponível para você.</strong><p>Quando quiser saber mais, abra a aba <b>Projeto</b> no menu inferior. Você poderá conhecer a proposta e continuar de onde parou.</p></div></div>',
      '<div class="legacy-skip-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Fechar</button><button class="btn btn-primary" type="button" onclick="closeModal();navigateVolunteer(\'project\')">Ir para Projeto</button></div>'
    );
  };

  window.legacyProjectHomeNoticeHtml=function(){
    if(state.volunteerMode!=='approved')return '';
    const p=project(),done=p?.status==='completed';
    if(done)return '';
    const label=p?'Continuar':'Conhecer';
    return `<section class="legacy-home-callout legacy-home-callout-glow" data-project-highlight="1"><span class="legacy-home-callout-icon"><i class="fa-solid fa-seedling"></i></span><div class="legacy-home-callout-copy"><strong>Projeto Legado</strong><p>${p?'Seu projeto ainda faz parte da sua jornada.':'Descubra como sua passagem pode deixar algo útil para a comunidade.'}</p></div><div class="legacy-home-callout-actions"><button class="btn btn-outline" type="button" onclick="skipLegacyProjectPrompt()">Agora não</button><button class="btn btn-primary" type="button" onclick="openPortalProjectHighlight()">${label}</button></div></section>`;
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