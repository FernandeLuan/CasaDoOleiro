/* R77 — cenários ricos de planejamento para homologação administrativa. */
(function enrichPlanningScenariosR77(){
  const db=window.OleiroDemoDB;
  if(!db||db.__planningScenariosR77)return;
  db.__planningScenariosR77=true;

  const findApp=id=>db.applications.find(app=>String(app.id)===String(id));
  const ensureSession=(key,applicationId,date,name,options={})=>{
    const id=`s-r77-${key}`;
    if(db.sessions.some(row=>String(row.id)===id))return;
    const app=findApp(applicationId);if(!app)return;
    const activityId=`a-r77-${key}`;
    const row={
      id,sessionId:id,applicationId,activityId,unitId:app.unitId||'rodeio',date,
      activityName:name,activityDescription:options.description||'Cenário de homologação para validar ações e estados do planejamento.',
      duration:Number(options.duration)||60,period:options.period||'Sem preferência',participation:options.participation||'Livre',
      materials:options.materials||'',notes:options.notes||'',ownerName:app.name||app.participantNames?.join(' + ')||'Voluntário',
      status:options.status||'confirmed',groupId:Object.prototype.hasOwnProperty.call(options,'groupId')?options.groupId:'Livre',
      managerCreated:options.managerCreated===true,postApprovalProposal:options.postApprovalProposal===true,
      reviewStatus:options.reviewStatus||'',reviewNote:options.reviewNote||'',adminAdjustmentStatus:options.adminAdjustmentStatus||'',
      adminAdjustmentNote:options.adminAdjustmentNote||'',createdByUid:app.participantUids?.[0]||'demo'
    };
    if(options.changeProposal)row.changeProposal={...options.changeProposal};
    if(options.changeNote)row.changeNote=options.changeNote;
    if(options.changeReviewStatus)row.changeReviewStatus=options.changeReviewStatus;
    if(options.changeReviewNote)row.changeReviewNote=options.changeReviewNote;
    db.sessions.push(row);
  };

  ensureSession('camila-pilates-confirmado','camila','2026-09-03','Pilates e mobilidade',{
    duration:60,period:'Manhã',groupId:'A',status:'confirmed',managerCreated:true,
    description:'Sessão já confirmada antes de qualquer nova sugestão do voluntário.'
  });
  ensureSession('camila-idiomas-nova','camila','2026-09-03','Idiomas e conversação',{
    duration:90,period:'Tarde',groupId:'Livre',status:'proposed',postApprovalProposal:true,reviewStatus:'analysis',
    notes:'Nova atividade sugerida pela voluntária após o planejamento já estar aprovado.',
    description:'Nova sugestão pós-aprovação. Deve oferecer Aprovar, Reajustar e Recusar.'
  });
  ensureSession('camila-musica-mudanca','camila','2026-09-03','Música e expressão',{
    duration:60,period:'Tarde',groupId:'B',status:'change_requested',changeReviewStatus:'analysis',
    changeNote:'Gostaria de fazer esta atividade à noite e aumentar a duração.',
    changeProposal:{date:'2026-09-03',period:'Noite',duration:90,activityName:'Música e expressão',participation:'Grupo B'},
    description:'Atividade existente com alteração solicitada. Deve oferecer Aprovar mudança.'
  });
  ensureSession('camila-compostagem-confirmada','camila','2026-09-04','Compostagem',{
    duration:90,period:'Manhã',groupId:'B',status:'confirmed',managerCreated:true,materials:'Resíduos orgânicos e ferramentas'
  });
  ensureSession('camila-organizacao-gestao','camila','2026-09-04','Organização de espaços',{
    duration:60,period:'Tarde',groupId:'C',status:'manager_confirmed',managerCreated:true,
    description:'Atividade criada e confirmada diretamente pela gestão.'
  });
  ensureSession('camila-fotografia-reajuste','camila','2026-09-04','Oficina de fotografia',{
    duration:120,period:'Tarde',groupId:'Livre',status:'proposed',postApprovalProposal:true,reviewStatus:'adjustments',
    reviewNote:'Reduzir para 60 minutos e detalhar os materiais necessários.',
    description:'Nova atividade pós-aprovação já devolvida para reajuste.'
  });

  ensureSession('gabriel-informatica-confirmada','gabriel','2026-09-07','Informática básica',{
    duration:90,period:'Manhã',groupId:'A',status:'confirmed',managerCreated:true
  });
  ensureSession('gabriel-mercado-nova','gabriel','2026-09-07','Mercado de trabalho',{
    duration:60,period:'Tarde',groupId:'Livre',status:'proposed',postApprovalProposal:true,reviewStatus:'analysis',
    description:'Nova atividade sugerida depois da aprovação da estadia.'
  });
  ensureSession('gabriel-esporte-aprovado','gabriel','2026-09-08','Esporte e recreação',{
    duration:60,period:'Tarde',groupId:'B',status:'plan_approved',
    description:'Estado intermediário já aprovado no planejamento; não deve exibir Confirmar novamente.'
  });

  ensureSession('valentina-artes-confirmada','valentina','2026-09-08','Artes manuais',{
    duration:90,period:'Manhã',groupId:'A',status:'confirmed',managerCreated:true
  });
  ensureSession('valentina-horta-mudanca','valentina','2026-09-08','Horta e jardinagem',{
    duration:60,period:'Tarde',groupId:'C',status:'change_requested',changeReviewStatus:'analysis',
    changeNote:'Prefiro realizar pela manhã.',changeProposal:{date:'2026-09-08',period:'Manhã',duration:60,activityName:'Horta e jardinagem',participation:'Grupo C'}
  });

  ensureSession('lr-idiomas-nova','lucas-rafael','2026-09-21','Idiomas e conversação',{
    duration:60,period:'Tarde',groupId:'Livre',status:'proposed',postApprovalProposal:true,reviewStatus:'analysis',
    description:'Nova atividade sugerida pelo casal após as atividades principais já estarem confirmadas.'
  });

  db.applications.forEach(app=>{
    const rows=db.sessions.filter(row=>String(row.applicationId)===String(app.id)&&row.status!=='rejected'&&row.reviewStatus!=='rejected');
    const activities=new Set(rows.map(row=>String(row.activityId||'')).filter(Boolean));
    app.sessionCount=rows.length;app.activityCount=activities.size;app.sessions=rows.length;app.activities=activities.size;
  });

  db.histories=db.histories||{};
  db.histories.camila=db.histories.camila||[];
  if(!db.histories.camila.some(row=>row.id==='h-r77-camila-proposal')){
    db.histories.camila.unshift(
      {id:'h-r77-camila-proposal',type:'activity_proposed',actorLabel:'Camila Rocha',metadata:{activity:'Idiomas e conversação'},createdAt:'2026-09-03T13:20:00Z'},
      {id:'h-r77-camila-change',type:'activity_change_requested',actorLabel:'Camila Rocha',metadata:{activity:'Música e expressão'},createdAt:'2026-09-03T13:10:00Z'}
    );
  }

  window.OleiroDemoDB=db;
})();

/* R82 — bootstrap determinístico: a própria massa R77 carrega as ações do Planejamento. */
(function loadPlanningActionsDirectR82(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_PLANNING_ACTIONS_DIRECT_R82__)return;
  window.__OLEIRO_PLANNING_ACTIONS_DIRECT_R82__=true;
  window.__OLEIRO_PREVIEW_BUILD__='R82';

  const current=document.currentScript?.src;
  if(!current)return;
  const base=new URL('../admin/',current);

  function stamp(attempt=0){
    const label=document.querySelector('[data-r62-test-access] span');
    if(label){label.textContent='Teste · R82 · trocar acesso';return}
    if(attempt<40)setTimeout(()=>stamp(attempt+1),100);
  }

  function load(src,dataKey,onload){
    const selector=`script[data-${dataKey}]`;
    if(document.querySelector(selector)){onload?.();return}
    const script=document.createElement('script');
    script.dataset[dataKey.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='true';
    script.async=false;
    script.src=new URL(src,base).href;
    if(onload)script.onload=onload;
    document.head.appendChild(script);
  }

  stamp();
  load('planning-day-actions-r76.js?v=20260903-r82','r82-r76',()=>{
    load('planning-day-actions-r78.js?v=20260903-r82','r82-r78',()=>{
      load('planning-activity-actions-r79.js?v=20260903-r82','r82-r79',()=>{
        stamp();
        requestAnimationFrame(()=>{
          const root=document.querySelector('.planning-person-agenda');
          if(root){const marker=document.createElement('span');marker.hidden=true;root.appendChild(marker);queueMicrotask(()=>marker.remove())}
        });
      });
    });
  });
})();
