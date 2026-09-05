/* R62 — massa complementar da homologação. Executa somente depois de prod-copy-no-login.js. */
(function enrichR62DemoData(){
  const db=window.OleiroDemoDB;
  if(!db||db.__massEnriched)return;
  db.__massEnriched=true;

  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const stayMonths=(start,end)=>{const out=[];if(!start||!end)return out;const d=new Date(`${start}T12:00:00`),last=new Date(`${end}T12:00:00`);d.setDate(1);last.setDate(1);while(d<=last){out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);d.setMonth(d.getMonth()+1)}return out};
  const makeApp=data=>{
    const a={active:true,planningCountVersion:1,participantCount:1,participantStatus:{},participantPhones:[],participantGenders:['male'],dayAdjustments:{},meetingStatus:'pending',meetingDuration:30,sessionCount:0,activityCount:0,...data};
    a.applicationId=a.id;
    a.name=(a.participantNames||[]).join(' + ')||a.name||'Voluntário';
    a.country=(a.participantCountries||[]).join(' / ')||a.country||'—';
    a.email=(a.participantEmails||[]).join(', ')||a.email||'';
    a.phone=(a.participantPhones||[]).join(' / ')||a.phone||'';
    a.unit=a.unitName||a.unitId||'—';
    a.from=String(a.stayStart||a.from||'').slice(0,10);a.to=String(a.stayEnd||a.to||'').slice(0,10);a.stayStart=a.from;a.stayEnd=a.to;
    a.pendingUntil=a.planningDeadlineAt||null;a.submitted=a.planningSubmittedAt||'—';a.sessions=Number(a.sessionCount||0);a.activities=Number(a.activityCount||0);a.inactive=a.active===false;a.profileHydrated=true;a.stayMonths=stayMonths(a.from,a.to);return a;
  };
  const addProfile=(uid,name,email,country='Brasil',language='pt',gender='male')=>{db.profiles[uid]={id:uid,name,fullName:name,email,phone:'+55 47 99999-0000',country,language,gender,emergencyContact:{name:'Contato de emergência',relationship:'Familiar',phone:'+55 47 98888-0000'}}};

  const extras=[
    makeApp({id:'camila',participantUids:['u-camila'],participantNames:['Camila Rocha'],participantEmails:['camila.demo@oleiro.test'],participantCountries:['Brasil'],participantPhones:['+55 47 99999-1101'],participantGenders:['female'],unitId:'rodeio',unitName:'Rodeio',status:'approved',stayStart:'2026-08-28',stayEnd:'2026-09-06',meetingStatus:'completed',finalDecision:'approved',sessionCount:9,activityCount:6}),
    makeApp({id:'gabriel',participantUids:['u-gabriel'],participantNames:['Gabriel Mendes'],participantEmails:['gabriel.demo@oleiro.test'],participantCountries:['Brasil'],participantPhones:['+55 47 99999-1102'],unitId:'rodeio',unitName:'Rodeio',status:'approved',stayStart:'2026-08-30',stayEnd:'2026-09-09',meetingStatus:'completed',finalDecision:'approved',sessionCount:8,activityCount:5}),
    makeApp({id:'valentina',participantUids:['u-valentina'],participantNames:['Valentina Morales'],participantEmails:['valentina.demo@oleiro.test'],participantCountries:['Argentina'],participantPhones:['+54 11 5555-1103'],participantGenders:['female'],unitId:'indaial',unitName:'Indaial',status:'approved',stayStart:'2026-09-01',stayEnd:'2026-09-12',meetingStatus:'completed',finalDecision:'approved',sessionCount:10,activityCount:7}),
    makeApp({id:'thiago',participantUids:['u-thiago'],participantNames:['Thiago Moreira'],participantEmails:['thiago.demo@oleiro.test'],participantCountries:['Brasil'],participantPhones:['+55 47 99999-1104'],unitId:'rodeio',unitName:'Rodeio',status:'approved',stayStart:'2026-09-03',stayEnd:'2026-09-17',meetingStatus:'completed',finalDecision:'approved',sessionCount:12,activityCount:8}),
    makeApp({id:'elena',participantUids:['u-elena'],participantNames:['Elena García'],participantEmails:['elena.demo@oleiro.test'],participantCountries:['Espanha'],participantPhones:['+34 600 000 105'],participantGenders:['female'],unitId:'indaial',unitName:'Indaial',status:'approved',stayStart:'2026-09-05',stayEnd:'2026-09-19',meetingStatus:'completed',finalDecision:'approved',sessionCount:10,activityCount:7}),
    makeApp({id:'matheus',participantUids:['u-matheus'],participantNames:['Matheus Nunes'],participantEmails:['matheus.demo@oleiro.test'],participantCountries:['Brasil'],participantPhones:['+55 47 99999-1106'],unitId:'rodeio',unitName:'Rodeio',status:'approved',stayStart:'2026-09-08',stayEnd:'2026-09-22',meetingStatus:'completed',finalDecision:'approved',sessionCount:11,activityCount:7}),
    makeApp({id:'julieta',participantUids:['u-julieta'],participantNames:['Julieta Álvarez'],participantEmails:['julieta.demo@oleiro.test'],participantCountries:['Uruguai'],participantPhones:['+598 99 000 107'],participantGenders:['female'],unitId:'indaial',unitName:'Indaial',status:'approved',stayStart:'2026-09-11',stayEnd:'2026-09-25',meetingStatus:'completed',finalDecision:'approved',sessionCount:9,activityCount:6}),
    makeApp({id:'enzo',participantUids:['u-enzo'],participantNames:['Enzo Ribeiro'],participantEmails:['enzo.demo@oleiro.test'],participantCountries:['Brasil'],participantPhones:['+55 47 99999-1108'],unitId:'rodeio',unitName:'Rodeio',status:'approved',stayStart:'2026-09-15',stayEnd:'2026-09-29',meetingStatus:'completed',finalDecision:'approved',sessionCount:9,activityCount:6}),
    makeApp({id:'isabela',participantUids:['u-isabela'],participantNames:['Isabela Martins'],participantEmails:['isabela.demo@oleiro.test'],participantCountries:['Brasil'],participantPhones:['+55 47 99999-1201'],participantGenders:['female'],unitId:'indaial',unitName:'Indaial',status:'analysis',stayStart:'2026-09-18',stayEnd:'2026-10-02',planningSubmittedAt:'2026-09-02T16:00:00Z',sessionCount:5,activityCount:4}),
    makeApp({id:'nicolas',participantUids:['u-nicolas'],participantNames:['Nicolás Torres'],participantEmails:['nicolas.demo@oleiro.test'],participantCountries:['Chile'],participantPhones:['+56 9 5555 1202'],unitId:'rodeio',unitName:'Rodeio',status:'analysis',stayStart:'2026-09-21',stayEnd:'2026-10-05',planningSubmittedAt:'2026-09-02T17:00:00Z',sessionCount:4,activityCount:3}),
    makeApp({id:'amanda',participantUids:['u-amanda'],participantNames:['Amanda Freitas'],participantEmails:['amanda.demo@oleiro.test'],participantCountries:['Brasil'],participantPhones:['+55 47 99999-1203'],participantGenders:['female'],unitId:'rodeio',unitName:'Rodeio',status:'adjustments',stayStart:'2026-09-24',stayEnd:'2026-10-08',planningSubmittedAt:'2026-09-01T12:00:00Z',planningDeadlineAt:'2026-09-09T23:59:00Z',dayAdjustments:{'2026-09-28':{status:'requested',note:'Redistribuir as atividades do período da tarde.'}},sessionCount:5,activityCount:4}),
    makeApp({id:'martin',participantUids:['u-martin'],participantNames:['Martín López'],participantEmails:['martin.demo@oleiro.test'],participantCountries:['Argentina'],participantPhones:['+54 11 5555 1204'],unitId:'indaial',unitName:'Indaial',status:'meeting',stayStart:'2026-09-26',stayEnd:'2026-10-10',meetingStatus:'scheduled',meetingDate:'2026-09-06',meetingTime:'10:30',sessionCount:5,activityCount:4}),
    makeApp({id:'beatriz',participantUids:['u-beatriz'],participantNames:['Beatriz Costa'],participantEmails:['beatriz.demo@oleiro.test'],participantCountries:['Portugal'],participantPhones:['+351 910 000 205'],participantGenders:['female'],unitId:'rodeio',unitName:'Rodeio',status:'pending',stayStart:'2026-10-01',stayEnd:'2026-10-15',planningDeadlineAt:'2026-09-08T23:59:00Z',sessionCount:0,activityCount:0})
  ];
  const existing=new Set(db.applications.map(a=>String(a.id)));extras.forEach(a=>{if(!existing.has(a.id))db.applications.push(a)});

  addProfile('u-camila','Camila Rocha','camila.demo@oleiro.test');
  addProfile('u-gabriel','Gabriel Mendes','gabriel.demo@oleiro.test');
  addProfile('u-valentina','Valentina Morales','valentina.demo@oleiro.test','Argentina','es','female');
  addProfile('u-thiago','Thiago Moreira','thiago.demo@oleiro.test');
  addProfile('u-elena','Elena García','elena.demo@oleiro.test','Espanha','es','female');
  addProfile('u-matheus','Matheus Nunes','matheus.demo@oleiro.test');
  addProfile('u-julieta','Julieta Álvarez','julieta.demo@oleiro.test','Uruguai','es','female');
  addProfile('u-enzo','Enzo Ribeiro','enzo.demo@oleiro.test');
  addProfile('u-isabela','Isabela Martins','isabela.demo@oleiro.test','Brasil','pt','female');
  addProfile('u-nicolas','Nicolás Torres','nicolas.demo@oleiro.test','Chile','es');
  addProfile('u-amanda','Amanda Freitas','amanda.demo@oleiro.test','Brasil','pt','female');
  addProfile('u-martin','Martín López','martin.demo@oleiro.test','Argentina','es');
  addProfile('u-beatriz','Beatriz Costa','beatriz.demo@oleiro.test','Portugal','pt','female');

  const approvedIds=['camila','gabriel','valentina','thiago','elena','matheus','julieta','enzo'];
  const activityNames=['Pilates e mobilidade','Idiomas e conversação','Música e expressão','Compostagem','Horta e jardinagem','Informática básica','Artes manuais','Culinária simples','Mercado de trabalho','Esporte e recreação','Consciência corporal','Organização de espaços'];
  const periods=['Manhã','Tarde','Noite'];
  const groups=['A','B','C','Livre'];
  const businessDays=[];let cursor=new Date('2026-09-02T12:00:00');while(businessDays.length<15){const day=cursor.getDay();if(day!==0&&day!==6)businessDays.push(cursor.toISOString().slice(0,10));cursor.setDate(cursor.getDate()+1)}
  const existingSessions=new Set(db.sessions.map(s=>String(s.id)));
  businessDays.forEach((date,dayIndex)=>{
    for(let slot=0;slot<3;slot++){
      const applicationId=approvedIds[(dayIndex+slot)%approvedIds.length];
      const app=db.applications.find(a=>a.id===applicationId);
      const id=`mass-${date}-${slot+1}`;
      if(existingSessions.has(`s-${id}`))continue;
      db.sessions.push({
        id:`s-${id}`,sessionId:`s-${id}`,applicationId,activityId:`a-${id}`,unitId:app?.unitId||'rodeio',date,
        activityName:activityNames[(dayIndex*3+slot)%activityNames.length],activityDescription:'Atividade demonstrativa para preencher a agenda da homologação.',
        duration:[60,90,60][slot],period:periods[slot],participation:'Livre',materials:'',notes:'',ownerName:app?.name||'Voluntário',
        status:'confirmed',groupId:groups[(dayIndex+slot)%groups.length],managerCreated:true,postApprovalProposal:false,reviewStatus:'',reviewNote:'',adminAdjustmentStatus:'',adminAdjustmentNote:'',createdByUid:app?.participantUids?.[0]||'demo'
      });
    }
  });

  // Garante que o dia atual do preview (02/09/2026) tenha conteúdo visível na Home.
  db.sessions.filter(s=>s.date==='2026-09-02').forEach(s=>{s.status='confirmed'});

  window.OleiroDemoDB=db;
})();
