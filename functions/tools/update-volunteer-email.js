const readline=require('node:readline/promises');
const process=require('node:process');
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');

const PROJECT_ID=process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||'casadooleiro-35c4e';
initializeApp({credential:applicationDefault(),projectId:PROJECT_ID});
const auth=getAuth();
const db=getFirestore();

function normalizeEmail(value){return String(value||'').trim().toLowerCase()}
function normalizeText(value){return String(value||'').trim()}
function searchTokens(names,emails,countries){
  const values=[...(names||[]),...(emails||[]),...(countries||[])].map(v=>normalizeText(v).toLocaleLowerCase('pt-BR')).filter(Boolean),tokens=new Set();
  values.forEach(value=>{value.split(/\s+/).filter(Boolean).forEach(part=>{for(let i=1;i<=Math.min(part.length,24);i++)tokens.add(part.slice(0,i))});tokens.add(value.slice(0,60))});
  return [...tokens].slice(0,200);
}
function accountAlreadyUsed(user){
  const created=Date.parse(user?.metadata?.creationTime||''),last=Date.parse(user?.metadata?.lastSignInTime||'');
  return Number.isFinite(created)&&Number.isFinite(last)&&last-created>120000;
}

async function main(){
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  try{
    const currentEmail=normalizeEmail(process.argv[2]||await rl.question('E-mail atual: '));
    const newEmail=normalizeEmail(process.argv[3]||await rl.question('Novo e-mail: '));
    if(!currentEmail.includes('@')||!newEmail.includes('@'))throw new Error('Informe e-mails válidos.');
    if(currentEmail===newEmail){console.log('Os e-mails são iguais. Nenhuma alteração necessária.');return}

    let user;
    try{user=await auth.getUserByEmail(currentEmail)}catch(error){if(error?.code==='auth/user-not-found')throw new Error('Conta não encontrada no Authentication.');throw error}
    try{await auth.getUserByEmail(newEmail);throw new Error('O novo e-mail já está vinculado a outra conta.')}catch(error){if(error?.message==='O novo e-mail já está vinculado a outra conta.')throw error;if(error?.code!=='auth/user-not-found')throw error}

    const applications=await db.collection('applications').where('participantUids','array-contains',user.uid).limit(2).get();
    if(applications.empty)throw new Error('Nenhuma candidatura vinculada a essa conta foi encontrada.');
    if(applications.size>1)throw new Error('Mais de uma candidatura foi encontrada. Revise manualmente antes de alterar o e-mail.');

    const applicationDoc=applications.docs[0],app=applicationDoc.data()||{},uids=(app.participantUids||[]).map(String),index=uids.indexOf(String(user.uid));
    if(index<0)throw new Error('A conta não pertence à candidatura encontrada.');
    const accessRef=db.doc(`users/${user.uid}`),accessSnapshot=await accessRef.get(),access=accessSnapshot.data()||{};
    if(!accessSnapshot.exists)throw new Error('Documento de acesso não encontrado.');
    if(access.firstPortalAccessAt||accountAlreadyUsed(user))throw new Error('O e-mail só pode ser alterado antes do primeiro acesso do voluntário.');

    const names=Array.isArray(app.participantNames)?app.participantNames:[],participantEmails=Array.isArray(app.participantEmails)?[...app.participantEmails]:[];
    while(participantEmails.length<uids.length)participantEmails.push('');
    participantEmails[index]=newEmail;

    console.log('\nAlteração encontrada');
    console.log('-------------------');
    console.log(`Voluntário: ${names[index]||user.displayName||'—'}`);
    console.log(`Atual: ${currentEmail}`);
    console.log(`Novo:  ${newEmail}`);
    console.log(`Candidatura: ${applicationDoc.id}`);
    const confirmation=String(await rl.question('\nDigite ALTERAR para confirmar: ')).trim();
    if(confirmation!=='ALTERAR'){console.log('Operação cancelada. Nenhum dado foi alterado.');return}

    await auth.updateUser(user.uid,{email:newEmail,emailVerified:false});
    try{
      const batch=db.batch(),now=FieldValue.serverTimestamp();
      batch.update(accessRef,{email:newEmail,updatedAt:now});
      batch.set(db.doc(`volunteer_profiles/${user.uid}`),{email:newEmail,updatedAt:now},{merge:true});
      batch.update(applicationDoc.ref,{participantEmails,searchTokens:searchTokens(app.participantNames,participantEmails,app.participantCountries),updatedAt:now});
      await batch.commit();
    }catch(error){
      try{await auth.updateUser(user.uid,{email:currentEmail})}catch(rollback){console.error('ATENÇÃO: falha ao restaurar o e-mail no Authentication:',rollback?.message||rollback)}
      throw error;
    }
    console.log('\n✓ E-mail atualizado no Authentication, users, volunteer_profiles e candidatura.');
  }finally{rl.close()}
}

main().catch(error=>{
  console.error(`\nErro: ${error?.message||error}`);
  if(/credential|default credentials|Could not load/i.test(String(error?.message||'')))console.error('No Cloud Shell, rode: gcloud auth application-default login');
  process.exitCode=1;
});
