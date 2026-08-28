const readline=require('node:readline/promises');
const process=require('node:process');
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');

const PROJECT_ID=process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||'casadooleiro-35c4e';
initializeApp({credential:applicationDefault(),projectId:PROJECT_ID});
const auth=getAuth(),db=getFirestore();
const repair=process.argv.includes('--repair');
const emailArg=process.argv.slice(2).find(value=>!value.startsWith('--'))||'';
const normalize=value=>String(value||'').trim().toLowerCase();
const ok=label=>console.log(`✓ ${label}`),warn=label=>console.log(`⚠ ${label}`),bad=label=>console.log(`✗ ${label}`);

function expectedPlanningStatus(app,doc){
  if(doc.managerCreated===true)return app.status==='approved'?'confirmed':app.status==='rejected'?'rejected':'manager_confirmed';
  if(app.status==='meeting')return 'plan_approved';
  if(app.status==='approved')return doc.postApprovalProposal===true&&doc.reviewStatus!=='approved'?'proposed':'confirmed';
  if(app.status==='rejected')return 'rejected';
  if(['pending','analysis','adjustments'].includes(app.status))return 'proposed';
  return null;
}

async function main(){
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  try{
    const email=normalize(emailArg||await rl.question('E-mail do voluntário: '));if(!email||!email.includes('@'))throw new Error('Informe um e-mail válido.');
    let authUser;try{authUser=await auth.getUserByEmail(email)}catch(error){if(error?.code==='auth/user-not-found')throw new Error('Usuário não encontrado no Authentication.');throw error}
    const apps=await db.collection('applications').where('participantUids','array-contains',authUser.uid).limit(2).get();
    if(apps.empty)throw new Error('Authentication encontrado, mas nenhuma candidatura vinculada foi localizada.');
    if(apps.size>1)throw new Error('Mais de uma candidatura vinculada ao mesmo usuário. Auditoria interrompida para evitar ambiguidade.');
    const appDoc=apps.docs[0],applicationId=appDoc.id,app=appDoc.data()||{};
    const [userDoc,profileDoc,activitiesSnap,sessionsSnap]=await Promise.all([
      db.doc(`users/${authUser.uid}`).get(),db.doc(`volunteer_profiles/${authUser.uid}`).get(),
      db.collection('activities').where('applicationId','==',applicationId).get(),
      db.collection('activity_sessions').where('applicationId','==',applicationId).get()
    ]);
    const user=userDoc.data()||{},activities=activitiesSnap.docs.map(doc=>({id:doc.id,ref:doc.ref,...doc.data()})),sessions=sessionsSnap.docs.map(doc=>({id:doc.id,ref:doc.ref,...doc.data()}));
    const activityIds=new Set(activities.map(row=>String(row.id))),issues=[],repairs=[];

    console.log('\nCASA DO OLEIRO — AUDITORIA DE CADASTRO');
    console.log('=====================================');
    console.log(`E-mail: ${email}`);console.log(`UID: ${authUser.uid}`);console.log(`Candidatura: ${applicationId}`);console.log(`Status: ${app.status||'—'}`);console.log(`Unidade: ${app.unitName||app.unitId||'—'}`);console.log(`Atividades: ${activities.length}`);console.log(`Sessões: ${sessions.length}\n`);

    authUser?ok('Authentication encontrado'):bad('Authentication ausente');
    userDoc.exists?ok('users encontrado'):bad('users ausente');
    profileDoc.exists?ok('volunteer_profiles encontrado'):bad('volunteer_profiles ausente');
    appDoc.exists?ok('applications encontrada'):bad('applications ausente');

    if(!userDoc.exists)issues.push('Documento users ausente.');
    if(!profileDoc.exists)issues.push('Documento volunteer_profiles ausente.');
    if(userDoc.exists&&user.role!=='volunteer')issues.push(`users.role = ${user.role||'vazio'}; esperado volunteer.`);
    if(userDoc.exists&&app.active===true&&user.active!==true){issues.push('Candidatura ativa, mas users.active não está true.');repairs.push({label:'Ativar users',run:batch=>batch.update(userDoc.ref,{active:true,updatedAt:FieldValue.serverTimestamp()})})}
    if(userDoc.exists&&app.active===false&&user.active===true){issues.push('Candidatura inativa, mas users.active ainda está true.');repairs.push({label:'Inativar users',run:batch=>batch.update(userDoc.ref,{active:false,updatedAt:FieldValue.serverTimestamp()})})}
    if(userDoc.exists&&app.unitId&&Array.isArray(user.unitIds)&&!user.unitIds.includes(app.unitId)){issues.push(`users.unitIds não contém ${app.unitId}.`);repairs.push({label:'Sincronizar unidade do usuário',run:batch=>batch.update(userDoc.ref,{unitIds:FieldValue.arrayUnion(app.unitId),updatedAt:FieldValue.serverTimestamp()})})}

    if(Number(app.sessionCount||0)!==sessions.length){issues.push(`application.sessionCount = ${Number(app.sessionCount||0)}; sessões reais = ${sessions.length}.`);repairs.push({label:'Corrigir sessionCount',run:batch=>batch.update(appDoc.ref,{sessionCount:sessions.length,planningCountVersion:1,updatedAt:FieldValue.serverTimestamp()})})}
    if(Number(app.activityCount||0)!==activities.length){issues.push(`application.activityCount = ${Number(app.activityCount||0)}; atividades reais = ${activities.length}.`);repairs.push({label:'Corrigir activityCount',run:batch=>batch.update(appDoc.ref,{activityCount:activities.length,planningCountVersion:1,updatedAt:FieldValue.serverTimestamp()})})}

    sessions.forEach(session=>{
      if(!activityIds.has(String(session.activityId||'')))issues.push(`Sessão ${session.id} aponta para activityId inexistente ${session.activityId||'vazio'}.`);
      if(String(session.unitId||'')!==String(app.unitId||''))issues.push(`Sessão ${session.id} está na unidade ${session.unitId||'vazia'}, candidatura está em ${app.unitId||'vazia'}.`);
      const expected=expectedPlanningStatus(app,session);
      if(expected&&session.status!==expected&&!(app.status==='approved'&&session.status==='change_requested')){
        issues.push(`Sessão ${session.id}: status ${session.status||'vazio'}; esperado ${expected} para candidatura ${app.status}.`);
        if(['pending','adjustments'].includes(app.status)&&session.status==='rejected')repairs.push({label:`Reabrir sessão ${session.id}`,run:batch=>batch.update(session.ref,{status:session.managerCreated===true?'manager_confirmed':'proposed',rejectedAt:FieldValue.delete(),updatedAt:FieldValue.serverTimestamp()})});
      }
    });
    activities.forEach(activity=>{
      const expected=expectedPlanningStatus(app,activity);
      if(expected&&activity.status&&activity.status!==expected&&!(app.status==='approved'&&activity.status==='confirmed')){
        issues.push(`Atividade ${activity.id}: status ${activity.status}; esperado ${expected} para candidatura ${app.status}.`);
        if(['pending','adjustments'].includes(app.status)&&activity.status==='rejected')repairs.push({label:`Reabrir atividade ${activity.id}`,run:batch=>batch.update(activity.ref,{status:activity.managerCreated===true?'manager_confirmed':'proposed',rejectedAt:FieldValue.delete(),updatedAt:FieldValue.serverTimestamp()})});
      }
    });

    console.log('\nVALIDAÇÕES');
    if(!issues.length){ok('Nenhuma inconsistência estrutural encontrada.');return}
    issues.forEach(issue=>warn(issue));
    console.log(`\n${issues.length} inconsistência(s) encontrada(s).`);
    if(!repair){console.log('\nNenhum dado foi alterado. Para oferecer apenas reparos seguros reconhecidos, rode novamente com --repair.');return}
    if(!repairs.length){console.log('\nNão há reparo automático seguro para os problemas encontrados. Revise manualmente.');return}

    console.log('\nREPAROS SEGUROS PROPOSTOS');repairs.forEach((item,index)=>console.log(`${index+1}. ${item.label}`));
    const confirmation=String(await rl.question('\nDigite REPARAR para aplicar: ')).trim();if(confirmation!=='REPARAR'){console.log('Operação cancelada. Nenhum dado foi alterado.');return}
    const batch=db.batch();repairs.forEach(item=>item.run(batch));await batch.commit();console.log(`\n✓ ${repairs.length} reparo(s) aplicado(s). Rode a auditoria novamente para confirmar.`);
  }finally{rl.close()}
}

main().catch(error=>{console.error(`\nErro: ${error?.message||error}`);if(/credential|default credentials|Could not load/i.test(String(error?.message||'')))console.error('No primeiro uso do Cloud Shell: gcloud auth application-default login');process.exitCode=1});
