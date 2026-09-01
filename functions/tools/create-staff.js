const process=require('node:process');
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');

const PROJECT_ID=process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||'casadooleiro-35c4e';
initializeApp({credential:applicationDefault(),projectId:PROJECT_ID});
const auth=getAuth(),db=getFirestore();

function arg(name){const index=process.argv.indexOf(`--${name}`);return index>=0?String(process.argv[index+1]||'').trim():''}
function normalize(value){return String(value||'').trim().toLowerCase()}

async function resolveUnit(value){
  const wanted=normalize(value);if(!wanted)throw new Error('Informe --unit com o nome ou ID da unidade.');
  const snap=await db.collection('units').get();
  const matches=snap.docs.filter(doc=>{
    const data=doc.data()||{};
    return [doc.id,data.name,data.label,data.code].map(normalize).filter(Boolean).includes(wanted);
  });
  if(matches.length!==1)throw new Error(matches.length?'Unidade ambígua. Informe o ID exato.':'Unidade não encontrada no Firestore.');
  return {id:matches[0].id,...matches[0].data()};
}

async function main(){
  const email=normalize(arg('email')),name=String(arg('name')||'').trim(),role=normalize(arg('role')||'activity_assistant'),unitArg=arg('unit');
  if(!email||!email.includes('@'))throw new Error('Informe --email válido.');
  if(!name)throw new Error('Informe --name.');
  if(role!=='activity_assistant')throw new Error('Este utilitário cria somente o papel seguro activity_assistant.');
  const unit=await resolveUnit(unitArg);

  let user,created=false;
  try{user=await auth.getUserByEmail(email)}catch(error){
    if(error?.code!=='auth/user-not-found')throw error;
    user=await auth.createUser({email,displayName:name,emailVerified:false,disabled:false});created=true;
  }

  const ref=db.doc(`users/${user.uid}`),existing=await ref.get();
  if(existing.exists){
    const data=existing.data()||{};
    if(data.role&&data.role!=='activity_assistant')throw new Error(`O e-mail já possui papel ${data.role}. Operação cancelada para não sobrescrever permissões.`);
  }

  await ref.set({
    email,
    name,
    role:'activity_assistant',
    active:true,
    unitIds:[String(unit.id)],
    updatedAt:FieldValue.serverTimestamp(),
    ...(existing.exists?{}:{createdAt:FieldValue.serverTimestamp()})
  },{merge:true});
  if(user.displayName!==name)await auth.updateUser(user.uid,{displayName:name,disabled:false});

  console.log('\nCASA DO OLEIRO — ACESSO DE ASSISTENTE');
  console.log('=====================================');
  console.log(`E-mail: ${email}`);
  console.log(`Nome: ${name}`);
  console.log(`Papel: activity_assistant`);
  console.log(`Unidade: ${unit.name||unit.label||unit.id} (${unit.id})`);
  console.log(`UID: ${user.uid}`);
  console.log(created?'Conta criada no Firebase Authentication.':'Conta existente reutilizada com segurança.');
  console.log('\nA assistente pode usar “Esqueci minha senha” na tela de login para definir a senha.');
}

main().catch(error=>{console.error(`\nErro: ${error?.message||error}`);if(/credential|default credentials|Could not load/i.test(String(error?.message||'')))console.error('No primeiro uso do Cloud Shell: gcloud auth application-default login');process.exitCode=1});