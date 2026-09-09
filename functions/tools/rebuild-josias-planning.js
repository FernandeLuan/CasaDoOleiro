const readline=require('node:readline/promises');
const process=require('node:process');
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');

const PROJECT_ID=process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||'casadooleiro-35c4e';
initializeApp({credential:applicationDefault(),projectId:PROJECT_ID});
const auth=getAuth(),db=getFirestore();

const APPLY=process.argv.includes('--apply');
const emailArg=process.argv.slice(2).find(value=>!value.startsWith('--'))||'';
const normalize=value=>String(value||'').trim().toLowerCase();

const STAY_START='2026-09-11';
const STAY_END='2026-09-29';

const PLAN=[
  {date:'2026-09-14',name:'Introdução ao Pilates',duration:60,count:3},
  {date:'2026-09-15',name:'Idiomas',duration:60,count:1},
  {date:'2026-09-15',name:'Pilates',duration:60,count:1},
  {date:'2026-09-16',name:'Música',duration:60,count:1},
  {date:'2026-09-16',name:'Idiomas',duration:60,count:1},
  {date:'2026-09-17',name:'Mercado de Trabalho',duration:60,count:3},
  {date:'2026-09-18',name:'Idiomas',duration:60,count:1},
  {date:'2026-09-18',name:'Compostagem',duration:90,count:1},
  {date:'2026-09-21',name:'Consciência Corporal',duration:60,count:3},
  {date:'2026-09-21',name:'Jogos',duration:60,count:1},
  {date:'2026-09-22',name:'Idiomas',duration:60,count:1},
  {date:'2026-09-22',name:'Pilates',duration:60,count:1},
  {date:'2026-09-23',name:'Música',duration:60,count:1},
  {date:'2026-09-23',name:'Mercado de Trabalho',duration:60,count:1},
  {date:'2026-09-24',name:'Pilates',duration:60,count:1},
  {date:'2026-09-24',name:'Música',duration:60,count:1},
  {date:'2026-09-25',name:'Idiomas',duration:60,count:1},
  {date:'2026-09-25',name:'Compostagem',duration:90,count:1},
  {date:'2026-09-28',name:'Mercado de Trabalho',duration:90,count:1},
  {date:'2026-09-28',name:'Encerramento e Feedback',duration:90,count:1},
];

function expandedPlan(){
  return PLAN.flatMap(item=>Array.from({length:item.count},()=>({...item,count:undefined})));
}

function expectedStatus(app){
  if(app.status==='approved')return 'confirmed';
  if(app.status==='meeting')return 'plan_approved';
  if(app.status==='rejected')return 'rejected';
  return 'proposed';
}

function fmtDate(value){return String(value||'').slice(0,10)||'—'}

async function main(){
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  try{
    const email=normalize(emailArg||await rl.question('E-mail do Josias: '));
    if(!email||!email.includes('@'))throw new Error('Informe um e-mail válido.');

    let authUser;
    try{authUser=await auth.getUserByEmail(email)}
    catch(error){if(error?.code==='auth/user-not-found')throw new Error('Usuário não encontrado no Firebase Authentication.');throw error}

    const apps=await db.collection('applications').where('participantUids','array-contains',authUser.uid).limit(2).get();
    if(apps.empty)throw new Error('Nenhuma candidatura vinculada a esse usuário.');
    if(apps.size>1)throw new Error('Mais de uma candidatura encontrada. Operação cancelada para evitar ambiguidade.');

    const appDoc=apps.docs[0],applicationId=appDoc.id,app=appDoc.data()||{};
    const profileDoc=await db.doc(`volunteer_profiles/${authUser.uid}`).get();
    const profile=profileDoc.data()||{};
    const participantName=String(profile.name||profile.fullName||app.participantNames?.[0]||authUser.displayName||'').trim();
    if(!normalize(participantName).includes('josias')&&!normalize((app.participantNames||[]).join(' ')).includes('josias')){
      throw new Error(`O usuário localizado não parece ser Josias (nome encontrado: ${participantName||'não informado'}).`);
    }

    const [activitiesSnap,sessionsSnap]=await Promise.all([
      db.collection('activities').where('applicationId','==',applicationId).get(),
      db.collection('activity_sessions').where('applicationId','==',applicationId).get(),
    ]);

    const activities=activitiesSnap.docs.map(doc=>({id:doc.id,...doc.data()}));
    const sessions=sessionsSnap.docs.map(doc=>({id:doc.id,...doc.data()})).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.activityName||'').localeCompare(String(b.activityName||'')));
    const target=expandedPlan();

    console.log('\nCASA DO OLEIRO — RECONSTRUÇÃO DO PLANEJAMENTO DO JOSIAS');
    console.log('========================================================');
    console.log(`Projeto: ${PROJECT_ID}`);
    console.log(`E-mail: ${email}`);
    console.log(`Nome: ${participantName||'Josias'}`);
    console.log(`Candidatura: ${applicationId}`);
    console.log(`Unidade: ${app.unitName||app.unitId||'—'}`);
    console.log(`Status da candidatura: ${app.status||'—'}`);
    console.log(`Estadia atual: ${fmtDate(app.stayStart)} a ${fmtDate(app.stayEnd)}`);
    console.log(`Estadia desejada: ${STAY_START} a ${STAY_END}`);
    console.log(`Atividades atuais: ${activities.length}`);
    console.log(`Sessões atuais: ${sessions.length}`);
    console.log(`Sessões finais: ${target.length}`);

    console.log('\nDE — SESSÕES ATUAIS');
    if(!sessions.length)console.log('  (nenhuma sessão atual)');
    sessions.forEach((row,index)=>console.log(`${String(index+1).padStart(2,'0')}. ${fmtDate(row.date)} | ${row.activityName||row.name||'Atividade'} | ${Number(row.duration)||60} min | id=${row.id}`));

    console.log('\nPARA — PLANEJAMENTO FINAL');
    target.forEach((row,index)=>console.log(`${String(index+1).padStart(2,'0')}. ${row.date} | ${row.name} | ${row.duration} min`));
    console.log(`\n29/09/2026: sem atividade.`);

    const totalMinutes=target.reduce((sum,row)=>sum+row.duration,0);
    console.log(`Carga final: ${target.length} sessões / ${totalMinutes} minutos (${(totalMinutes/60).toFixed(1)} h).`);

    if(!APPLY){
      console.log('\nSIMULAÇÃO CONCLUÍDA — nenhum dado foi alterado.');
      console.log(`Para aplicar exatamente este planejamento, rode novamente com --apply.`);
      return;
    }

    console.log('\nATENÇÃO: a aplicação substituirá TODAS as activities e activity_sessions desta candidatura pelo planejamento acima.');
    const confirmation=String(await rl.question('Digite JOSIAS 14-28 para confirmar: ')).trim();
    if(confirmation!=='JOSIAS 14-28'){
      console.log('Operação cancelada. Nenhum dado foi alterado.');
      return;
    }

    const unitId=String(app.unitId||'');
    if(!unitId)throw new Error('A candidatura não possui unitId. Operação cancelada.');
    const ownerName=participantName||String(app.participantNames?.[0]||'Josias');
    const status=expectedStatus(app);
    const now=FieldValue.serverTimestamp();

    let batch=db.batch(),ops=0;
    const commits=[];
    async function flush(){if(!ops)return;commits.push(batch.commit());await commits[commits.length-1];batch=db.batch();ops=0}
    async function addOp(fn){fn(batch);ops++;if(ops>=450)await flush()}

    for(const doc of sessionsSnap.docs)await addOp(b=>b.delete(doc.ref));
    for(const doc of activitiesSnap.docs)await addOp(b=>b.delete(doc.ref));

    for(const row of target){
      const activityRef=db.collection('activities').doc();
      const sessionRef=db.collection('activity_sessions').doc();
      const base={
        applicationId:String(applicationId),
        ownerName,
        description:'',
        participation:'Livre',
        materials:'',
        notes:'',
        period:'Sem preferência',
        duration:row.duration,
        createdByUid:String(authUser.uid),
      };
      await addOp(b=>b.set(activityRef,{...base,name:row.name,status,createdAt:now,updatedAt:now}));
      await addOp(b=>b.set(sessionRef,{
        ...base,
        activityId:activityRef.id,
        unitId,
        date:row.date,
        activityName:row.name,
        activityDescription:'',
        status,
        groupId:null,
        ...(status==='confirmed'?{confirmedAt:now}:{}),
        createdAt:now,
        updatedAt:now,
      }));
    }

    await addOp(b=>b.update(appDoc.ref,{
      stayStart:STAY_START,
      stayEnd:STAY_END,
      stayMonths:['2026-09'],
      sessionCount:target.length,
      activityCount:target.length,
      planningCountVersion:1,
      updatedAt:now,
    }));
    await flush();

    const [verifyActivities,verifySessions,verifyApp]=await Promise.all([
      db.collection('activities').where('applicationId','==',applicationId).get(),
      db.collection('activity_sessions').where('applicationId','==',applicationId).get(),
      appDoc.ref.get(),
    ]);
    const verifyRows=verifySessions.docs.map(doc=>doc.data()).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.activityName||'').localeCompare(String(b.activityName||'')));
    const invalidDate=verifyRows.find(row=>String(row.date||'')<'2026-09-14'||String(row.date||'')>'2026-09-28');
    const appAfter=verifyApp.data()||{};
    if(verifySessions.size!==target.length||verifyActivities.size!==target.length||invalidDate||Number(appAfter.sessionCount)!==target.length||Number(appAfter.activityCount)!==target.length){
      throw new Error(`Gravação concluída, mas a verificação final encontrou divergência. activities=${verifyActivities.size}, sessions=${verifySessions.size}, sessionCount=${appAfter.sessionCount}, activityCount=${appAfter.activityCount}${invalidDate?`, data fora do intervalo=${invalidDate.date}`:''}.`);
    }

    console.log('\n✓ PLANEJAMENTO ATUALIZADO COM SUCESSO.');
    console.log(`✓ ${verifyActivities.size} activities e ${verifySessions.size} activity_sessions.`);
    console.log(`✓ Estadia: ${STAY_START} a ${STAY_END}.`);
    console.log('✓ Sessões somente entre 14/09/2026 e 28/09/2026.');
    console.log('✓ 29/09/2026 permanece sem atividade.');
    console.log('✓ Contadores da application sincronizados.');
  }finally{rl.close()}
}

main().catch(error=>{
  console.error(`\nErro: ${error?.message||error}`);
  if(/credential|default credentials|Could not load/i.test(String(error?.message||'')))console.error('No primeiro uso do Cloud Shell, autentique as credenciais de aplicação do Google Cloud.');
  process.exitCode=1;
});
