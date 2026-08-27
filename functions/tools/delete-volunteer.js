const readline=require('node:readline/promises');
const process=require('node:process');
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore}=require('firebase-admin/firestore');

const PROJECT_ID=process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||'casadooleiro-35c4e';
initializeApp({credential:applicationDefault(),projectId:PROJECT_ID});
const auth=getAuth();
const db=getFirestore();

function normalizeEmail(value){return String(value||'').trim().toLowerCase()}
async function deleteRefs(refs){
  for(let i=0;i<refs.length;i+=400){
    const batch=db.batch();
    refs.slice(i,i+400).forEach(ref=>batch.delete(ref));
    await batch.commit();
  }
}

async function main(){
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  try{
    const fromArg=normalizeEmail(process.argv[2]);
    const email=fromArg||normalizeEmail(await rl.question('E-mail do cadastro que deseja excluir: '));
    if(!email||!email.includes('@'))throw new Error('Informe um e-mail válido.');

    let user;
    try{user=await auth.getUserByEmail(email)}catch(error){
      if(error?.code==='auth/user-not-found')throw new Error('Nenhum usuário encontrado no Authentication com esse e-mail.');
      throw error;
    }

    const applications=await db.collection('applications').where('participantUids','array-contains',user.uid).limit(2).get();
    if(applications.empty)throw new Error('Usuário encontrado no Authentication, mas nenhuma candidatura vinculada foi encontrada. Nenhum dado foi excluído.');
    if(applications.size>1)throw new Error('Mais de uma candidatura foi encontrada para esse usuário. Nenhum dado foi excluído; revise o cadastro manualmente.');

    const applicationDoc=applications.docs[0],app=applicationDoc.data()||{},applicationId=applicationDoc.id;
    const uids=[...new Set((app.participantUids||[]).map(String).filter(Boolean))];
    const names=Array.isArray(app.participantNames)?app.participantNames.filter(Boolean):[];
    const emails=Array.isArray(app.participantEmails)?app.participantEmails.filter(Boolean):[];
    const isCouple=uids.length>1||app.type==='couple';

    const [activities,sessions]=await Promise.all([
      db.collection('activities').where('applicationId','==',applicationId).get(),
      db.collection('activity_sessions').where('applicationId','==',applicationId).get()
    ]);

    console.log('\nCadastro encontrado');
    console.log('-------------------');
    console.log(`Nome: ${names.join(' + ')||email}`);
    console.log(`E-mail(s): ${emails.join(' + ')||email}`);
    console.log(`Unidade: ${app.unitName||app.unitId||'—'}`);
    console.log(`Período: ${app.stayStart||'—'} a ${app.stayEnd||'—'}`);
    console.log(`Tipo: ${isCouple?'Casal / dupla':'Individual'}`);
    console.log(`Atividades: ${activities.size}`);
    console.log(`Sessões: ${sessions.size}`);
    if(isCouple)console.log('\nATENÇÃO: esta candidatura é compartilhada. Os dois acessos serão excluídos.');

    console.log('\nSerão removidos: Authentication, users, volunteer_profiles, application, activities e activity_sessions.');
    const confirmation=String(await rl.question('Digite EXCLUIR para confirmar: ')).trim();
    if(confirmation!=='EXCLUIR'){
      console.log('Operação cancelada. Nenhum dado foi alterado.');
      return;
    }

    const refs=[
      ...activities.docs.map(doc=>doc.ref),
      ...sessions.docs.map(doc=>doc.ref),
      ...uids.map(uid=>db.doc(`volunteer_profiles/${uid}`)),
      ...uids.map(uid=>db.doc(`users/${uid}`)),
      applicationDoc.ref
    ];

    console.log('\nExcluindo dados do Firestore...');
    await deleteRefs(refs);

    console.log('Excluindo conta(s) do Authentication...');
    const result=await auth.deleteUsers(uids);
    if(result.failureCount){
      console.error(`Dados do Firestore excluídos, mas ${result.failureCount} conta(s) do Authentication não puderam ser removidas.`);
      result.errors.forEach(item=>console.error(item.error?.message||item.error));
      process.exitCode=2;
      return;
    }

    console.log('\n✓ Cadastro excluído completamente.');
    console.log(`  Participantes: ${uids.length}`);
    console.log(`  Atividades removidas: ${activities.size}`);
    console.log(`  Sessões removidas: ${sessions.size}`);
  }finally{rl.close()}
}

main().catch(error=>{
  console.error(`\nErro: ${error?.message||error}`);
  if(/credential|default credentials|Could not load/i.test(String(error?.message||''))){
    console.error('Se for a primeira execução no Cloud Shell, rode: gcloud auth application-default login');
  }
  process.exitCode=1;
});
