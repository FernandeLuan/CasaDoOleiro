const {setGlobalOptions}=require('firebase-functions/v2');
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');

initializeApp();
setGlobalOptions({region:'southamerica-east1',maxInstances:10});

const db=getFirestore();
const auth=getAuth();

function normalizeEmail(value){return String(value||'').trim().toLowerCase()}
function normalizeText(value){return String(value||'').trim()}
function searchTokens(names,emails,countries){
  const values=[...(names||[]),...(emails||[]),...(countries||[])].map(v=>normalizeText(v).toLocaleLowerCase('pt-BR')).filter(Boolean);
  const tokens=new Set();
  values.forEach(value=>{
    value.split(/\s+/).filter(Boolean).forEach(part=>{for(let i=1;i<=Math.min(part.length,24);i++)tokens.add(part.slice(0,i))});
    tokens.add(value.slice(0,60));
  });
  return [...tokens].slice(0,200);
}
function legacyAccountAlreadyUsed(user){
  const created=Date.parse(user?.metadata?.creationTime||''),last=Date.parse(user?.metadata?.lastSignInTime||'');
  return Number.isFinite(created)&&Number.isFinite(last)&&last-created>120000;
}
async function requireManager(request){
  const uid=request.auth?.uid;if(!uid)throw new HttpsError('unauthenticated','Faça login novamente.');
  const snapshot=await db.doc(`users/${uid}`).get();const data=snapshot.data()||{};
  if(!snapshot.exists||data.active!==true||!['admin','coordinator'].includes(data.role))throw new HttpsError('permission-denied','Permissão administrativa necessária.');
  return {uid,data};
}
async function deleteRefs(refs){
  for(let i=0;i<refs.length;i+=400){const batch=db.batch();refs.slice(i,i+400).forEach(ref=>batch.delete(ref));await batch.commit()}
}

exports.adminUpdateVolunteerEmail=onCall(async request=>{
  await requireManager(request);
  const applicationId=normalizeText(request.data?.applicationId),uid=normalizeText(request.data?.uid),email=normalizeEmail(request.data?.email);
  if(!applicationId||!uid||!email||!email.includes('@'))throw new HttpsError('invalid-argument','Informe um e-mail válido.');
  const appRef=db.doc(`applications/${applicationId}`),userRef=db.doc(`users/${uid}`),profileRef=db.doc(`volunteer_profiles/${uid}`);
  const [appSnapshot,userSnapshot]=await Promise.all([appRef.get(),userRef.get()]);
  if(!appSnapshot.exists)throw new HttpsError('not-found','Candidatura não encontrada.');
  const app=appSnapshot.data()||{},uids=Array.isArray(app.participantUids)?app.participantUids.map(String):[];
  const index=uids.indexOf(uid);if(index<0)throw new HttpsError('failed-precondition','O usuário não pertence a esta candidatura.');
  const access=userSnapshot.data()||{};if(!userSnapshot.exists)throw new HttpsError('not-found','Documento de acesso não encontrado.');
  if(access.firstPortalAccessAt)throw new HttpsError('failed-precondition','O e-mail só pode ser alterado antes do primeiro acesso.');
  let oldAuthUser=null;
  try{oldAuthUser=await auth.getUser(uid)}catch{throw new HttpsError('not-found','Conta de autenticação não encontrada.')}
  if(legacyAccountAlreadyUsed(oldAuthUser))throw new HttpsError('failed-precondition','O e-mail só pode ser alterado antes do primeiro acesso.');
  const oldEmail=normalizeEmail(oldAuthUser.email||access.email||'');
  if(oldEmail===email)return {email};
  try{await auth.updateUser(uid,{email,emailVerified:false})}
  catch(error){if(error?.code==='auth/email-already-exists')throw new HttpsError('already-exists','Este e-mail já está em uso.');throw new HttpsError('internal','Não foi possível atualizar o e-mail no Authentication.')}
  try{
    const participantEmails=Array.isArray(app.participantEmails)?[...app.participantEmails]:[];while(participantEmails.length<uids.length)participantEmails.push('');participantEmails[index]=email;
    const batch=db.batch(),now=FieldValue.serverTimestamp();
    batch.update(userRef,{email,updatedAt:now});
    batch.set(profileRef,{email,updatedAt:now},{merge:true});
    batch.update(appRef,{participantEmails,searchTokens:searchTokens(app.participantNames,participantEmails,app.participantCountries),updatedAt:now});
    await batch.commit();
    return {email,participantEmails};
  }catch(error){
    if(oldEmail){try{await auth.updateUser(uid,{email:oldEmail})}catch(rollbackError){console.error('Falha ao restaurar e-mail após erro no Firestore:',rollbackError)}}
    console.error(error);throw new HttpsError('internal','Não foi possível sincronizar o novo e-mail.');
  }
});

exports.adminDeleteVolunteerApplication=onCall(async request=>{
  await requireManager(request);
  const applicationId=normalizeText(request.data?.applicationId);if(!applicationId)throw new HttpsError('invalid-argument','Candidatura inválida.');
  const appRef=db.doc(`applications/${applicationId}`),appSnapshot=await appRef.get();if(!appSnapshot.exists)throw new HttpsError('not-found','Candidatura não encontrada.');
  const app=appSnapshot.data()||{},uids=[...new Set((Array.isArray(app.participantUids)?app.participantUids:[]).map(String).filter(Boolean))];
  const [activitiesSnapshot,sessionsSnapshot]=await Promise.all([
    db.collection('activities').where('applicationId','==',applicationId).get(),
    db.collection('activity_sessions').where('applicationId','==',applicationId).get()
  ]);
  const refs=[...activitiesSnapshot.docs.map(doc=>doc.ref),...sessionsSnapshot.docs.map(doc=>doc.ref),...uids.map(uid=>db.doc(`volunteer_profiles/${uid}`)),...uids.map(uid=>db.doc(`users/${uid}`)),appRef];
  await deleteRefs(refs);
  let authFailures=[];
  if(uids.length){
    try{const result=await auth.deleteUsers(uids);authFailures=result.errors||[]}
    catch(error){console.error('Falha ao excluir usuários do Authentication:',error);authFailures=[{index:-1,error:{message:error?.message||'Falha no Authentication'}}]}
  }
  if(authFailures.length){console.error('Usuários não removidos do Authentication:',authFailures);throw new HttpsError('internal','Os dados foram removidos, mas uma conta do Authentication não pôde ser excluída. Revise o Firebase Authentication.')}
  return {deletedParticipants:uids.length,deletedActivities:activitiesSnapshot.size,deletedSessions:sessionsSnapshot.size};
});
