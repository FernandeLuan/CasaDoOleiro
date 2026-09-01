const admin=require('firebase-admin');
if(!admin.apps.length)admin.initializeApp();
const auth=admin.auth(),db=admin.firestore();
const [emailArg,unitArg,nameArg]=process.argv.slice(2);
const email=String(emailArg||'').trim().toLowerCase();
const unitId=String(unitArg||'').trim().toLowerCase();
const name=String(nameArg||'').trim();
if(!email||!unitId)throw new Error('Uso: npm run admin:staff -- EMAIL UNIDADE "NOME"');
if(!['rodeio','indaial'].includes(unitId))throw new Error('Unidade inválida. Use rodeio ou indaial.');
(async()=>{
  let user;
  try{user=await auth.getUserByEmail(email)}catch(error){if(error.code!=='auth/user-not-found')throw error;user=await auth.createUser({email,displayName:name||undefined,disabled:false})}
  const ref=db.doc(`users/${user.uid}`),existing=await ref.get(),now=admin.firestore.FieldValue.serverTimestamp();
  await ref.set({email,displayName:name||user.displayName||'',role:'activity_assistant',active:true,unitIds:[unitId],language:'pt',updatedAt:now,...(!existing.exists?{createdAt:now}:{})},{merge:true});
  const link=await auth.generatePasswordResetLink(email);
  console.log(`Assistente configurada: ${email} -> ${unitId}`);
  console.log('Envie este link diretamente à pessoa para definir a senha:');
  console.log(link);
})().catch(error=>{console.error(error);process.exitCode=1});
