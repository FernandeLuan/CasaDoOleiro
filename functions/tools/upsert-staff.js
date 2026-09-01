const admin=require('firebase-admin');
if(!admin.apps.length)admin.initializeApp();
const auth=admin.auth(),db=admin.firestore();
const [emailArg,secondArg,thirdArg]=process.argv.slice(2);
const email=String(emailArg||'').trim().toLowerCase();
const legacyUnit=String(secondArg||'').trim().toLowerCase();
const usedLegacySyntax=['rodeio','indaial'].includes(legacyUnit);
const name=String(usedLegacySyntax?thirdArg:secondArg||'').trim();
if(!email)throw new Error('Uso: npm run admin:staff -- EMAIL "NOME"');
(async()=>{
  let user;
  try{user=await auth.getUserByEmail(email)}catch(error){if(error.code!=='auth/user-not-found')throw error;user=await auth.createUser({email,displayName:name||undefined,disabled:false})}
  const ref=db.doc(`users/${user.uid}`),existing=await ref.get(),now=admin.firestore.FieldValue.serverTimestamp();
  await ref.set({email,displayName:name||user.displayName||'',role:'admin',active:true,unitIds:['rodeio','indaial'],language:'pt',updatedAt:now,...(!existing.exists?{createdAt:now}:{})},{merge:true});
  const link=await auth.generatePasswordResetLink(email);
  console.log(`Administrador configurado: ${email}`);
  if(usedLegacySyntax)console.log(`Observação: a unidade "${legacyUnit}" foi ignorada porque contas da equipe agora recebem acesso administrativo completo.`);
  console.log('Se a pessoa ainda não definiu a senha, envie este link diretamente a ela:');
  console.log(link);
})().catch(error=>{console.error(error);process.exitCode=1});
