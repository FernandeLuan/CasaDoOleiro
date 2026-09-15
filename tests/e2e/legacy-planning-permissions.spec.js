import {test,expect} from '@playwright/test';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore,Timestamp} from 'firebase-admin/firestore';
import {seedEmulators} from './seed.mjs';

// Admin SDK is used only to prepare fixtures; assertions use a candidate ID token.
test('Firestore enforces legacy planning edits, authorship and approval boundaries',async()=>{
  test.setTimeout(90000);
  await seedEmulators();
  const app=initializeApp({projectId:'demo-casadooleiro'},'legacy-rules-'+Date.now());
  const db=getFirestore(app);
  const authHost=process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const dbHost=process.env.FIRESTORE_EMULATOR_HOST;
  expect(authHost).toMatch(/^(127\.0\.0\.1|localhost):/);
  expect(dbHost).toMatch(/^(127\.0\.0\.1|localhost):/);
  const response=await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'voluntario@oleiro.test',password:'Volunteer123!',returnSecureToken:true})});
  expect(response.ok).toBeTruthy();
  const {idToken}=await response.json();
  const url=`http://${dbHost}/v1/projects/demo-casadooleiro/databases/(default)/documents/activity_sessions/legacy-rules`;
  const mutate=(method,fields)=>fetch(url+(method==='PATCH'?'?'+Object.keys(fields).map(key=>'updateMask.fieldPaths='+key).join('&'):''),{method,headers:{Authorization:`Bearer ${idToken}`,'Content-Type':'application/json'},...(fields?{body:JSON.stringify({fields})}:{})});
  const base={applicationId:'e2e-application',activityId:'e2e-candidate-activity',unitId:'rodeio',date:'2026-09-15',groupId:null,activityName:'Legacy'};
  try{
    for(const applicationStatus of ['pending','analysis','adjustments','approved']){
      await db.doc('applications/e2e-application').update({status:applicationStatus,planningDeadlineAt:Timestamp.fromDate(new Date(Date.now()+86400000))});
      for(const status of ['proposed','plan_approved','confirmed']){
        for(const ownership of [{},{createdByUid:'e2e-volunteer'},{createdByUid:'e2e-admin'},{managerCreated:true}]){
          await db.doc('activity_sessions/legacy-rules').set({...base,status,...ownership});
          const allowed=applicationStatus!=='approved'&&!ownership.managerCreated&&ownership.createdByUid!=='e2e-admin';
          const label=JSON.stringify({applicationStatus,status,ownership});
          const edit=await mutate('PATCH',{activityName:{stringValue:'Edited'},date:{stringValue:'2026-09-16'}});
          expect(edit.status,label+' edit/move').toBe(allowed?200:403);
          const escalate=await mutate('PATCH',{status:{stringValue:'manager_confirmed'}});
          expect(escalate.status,label+' cannot promote status').toBe(403);
          const reassign=await mutate('PATCH',{applicationId:{stringValue:'e2e-approved-application'}});
          expect(reassign.status,label+' cannot change application').toBe(403);
          const remove=await mutate('DELETE');
          expect(remove.status,label+' delete').toBe(allowed?200:403);
        }
      }
    }
    await db.doc('applications/e2e-application').update({status:'analysis',planningDeadlineAt:null});
    await db.doc('activity_sessions/legacy-rules').set({...base,status:'plan_approved'});
    expect((await mutate('PATCH',{date:{stringValue:'2026-09-16'}})).status).toBe(200);
    await db.doc('users/e2e-volunteer').update({active:false});
    expect((await mutate('PATCH',{date:{stringValue:'2026-09-17'}})).status).toBe(403);
  }finally{await deleteApp(app)}
});


test('activity assistant cannot promote application lifecycle',async()=>{
  test.setTimeout(60000);
  await seedEmulators();
  const app=initializeApp({projectId:'demo-casadooleiro'},'assistant-rules-'+Date.now());
  const db=getFirestore(app);
  const authHost=process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const dbHost=process.env.FIRESTORE_EMULATOR_HOST;
  const response=await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'assistant@oleiro.test',password:'Assistant123!',returnSecureToken:true})});
  expect(response.ok).toBeTruthy();
  const {idToken}=await response.json();
  try{
    await db.doc('applications/e2e-application').update({status:'analysis',active:true});
    const url=`http://${dbHost}/v1/projects/demo-casadooleiro/databases/(default)/documents/applications/e2e-application?updateMask.fieldPaths=status`;
    const promote=await fetch(url,{method:'PATCH',headers:{Authorization:`Bearer ${idToken}`,'Content-Type':'application/json'},body:JSON.stringify({fields:{status:{stringValue:'approved'}}})});
    expect(promote.status).toBe(403);
  }finally{await deleteApp(app)}
});
