import {after, beforeEach, test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertFails, assertSucceeds, initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch} from 'firebase/firestore';

const projectId='demo-casadooleiro';
const [emulatorHost,emulatorPort='8080']=String(process.env.FIRESTORE_EMULATOR_HOST||'127.0.0.1:8080').split(':');
const testEnv=await initializeTestEnvironment({
  projectId,
  firestore:{host:emulatorHost,port:Number(emulatorPort),rules:readFileSync(new URL('../../firestore.rules',import.meta.url),'utf8')}
});

const dbFor=uid=>testEnv.authenticatedContext(uid).firestore();
const docRef=(db,path,id)=>doc(db,path,id);

async function seed(){
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    const rows=[
      ['users/coordinator-rodeio',{role:'coordinator',active:true,unitIds:['rodeio']}],
      ['users/coordinator-indaial',{role:'coordinator',active:true,unitIds:['indaial']}],
      ['users/admin',{role:'admin',active:true,unitIds:['rodeio','indaial']}],
      ['users/volunteer-rodeio',{role:'volunteer',active:true,unitIds:['rodeio']}],
      ['users/volunteer-indaial',{role:'volunteer',active:true,unitIds:['indaial']}],
      ['users/assistant-rodeio',{role:'activity_assistant',active:true,unitIds:['rodeio']}],
      ['units/rodeio',{name:'Rodeio',active:true}],
      ['units/indaial',{name:'Indaial',active:true}],
      ['volunteer_profiles/volunteer-rodeio',{name:'Volunteer R',email:'volunteer-r@example.test'}],
      ['volunteer_profiles/volunteer-indaial',{name:'Volunteer I',email:'volunteer-i@example.test'}],
      ['applications/application-rodeio',{unitId:'rodeio',participantUids:['volunteer-rodeio'],active:true,status:'approved'}],
      ['applications/application-indaial',{unitId:'indaial',participantUids:['volunteer-indaial'],active:true,status:'approved'}],
      ['activities/activity-rodeio',{applicationId:'application-rodeio',name:'Activity R'}],
      ['activities/activity-indaial',{applicationId:'application-indaial',name:'Activity I'}],
      ['activity_sessions/session-rodeio',{applicationId:'application-rodeio',activityId:'activity-rodeio',unitId:'rodeio',status:'confirmed'}],
      ['activity_sessions/session-rodeio-legacy',{applicationId:'application-rodeio',activityId:'activity-rodeio',status:'confirmed'}],
      ['activity_sessions/session-indaial',{applicationId:'application-indaial',activityId:'activity-indaial',unitId:'indaial',status:'confirmed'}],
      ['groups/group-rodeio',{unitId:'rodeio',code:'A'}],
      ['groups/group-indaial',{unitId:'indaial',code:'B'}]
    ];
    for(const [path,data] of rows)await setDoc(doc(db,path),data);
  });
}

beforeEach(seed);
after(()=>testEnv.cleanup());

test('coordinators can read only users, profiles and applications in their units',async()=>{
  const db=dbFor('coordinator-rodeio');
  await assertSucceeds(getDoc(docRef(db,'users','volunteer-rodeio')));
  await assertFails(getDoc(docRef(db,'users','volunteer-indaial')));
  await assertSucceeds(getDoc(docRef(db,'volunteer_profiles','volunteer-rodeio')));
  await assertFails(getDoc(docRef(db,'volunteer_profiles','volunteer-indaial')));
  await assertSucceeds(getDoc(docRef(db,'applications','application-rodeio')));
  await assertFails(getDoc(docRef(db,'applications','application-indaial')));
});

test('coordinator collection queries must prove the unit scope',async()=>{
  const db=dbFor('coordinator-rodeio');
  const local=await getDocs(query(collection(db,'applications'),where('unitId','==','rodeio')));
  assert.deepEqual(local.docs.map(row=>row.id),['application-rodeio']);
  await assertFails(getDocs(collection(db,'applications')));
  await assertFails(getDocs(query(collection(db,'applications'),where('unitId','in',['rodeio','indaial']))));
});

test('coordinators can query planning records through a local application',async()=>{
  const db=dbFor('coordinator-rodeio');
  const sessions=await getDocs(query(collection(db,'activity_sessions'),where('applicationId','==','application-rodeio')));
  assert.deepEqual(sessions.docs.map(row=>row.id).sort(),['session-rodeio','session-rodeio-legacy']);
  const activities=await getDocs(query(collection(db,'activities'),where('applicationId','==','application-rodeio')));
  assert.deepEqual(activities.docs.map(row=>row.id),['activity-rodeio']);
  await assertFails(getDocs(collection(db,'activity_sessions')));
});

test('coordinator planning schedule queries can filter by assigned session unit',async()=>{
  const db=dbFor('coordinator-rodeio');
  const sessions=await getDocs(query(collection(db,'activity_sessions'),where('unitId','==','rodeio')));
  assert.deepEqual(sessions.docs.map(row=>row.id),['session-rodeio']);
});

test('coordinators can create and update users only within their unit without changing role or unit scope',async()=>{
  const db=dbFor('coordinator-rodeio');
  await assertSucceeds(setDoc(docRef(db,'users','new-volunteer'),{role:'volunteer',active:true,unitIds:['rodeio']}));
  await assertFails(setDoc(docRef(db,'users','foreign-volunteer'),{role:'volunteer',active:true,unitIds:['indaial']}));
  await assertSucceeds(updateDoc(docRef(db,'users','volunteer-rodeio'),{active:false}));
  await assertFails(updateDoc(docRef(db,'users','volunteer-rodeio'),{unitIds:['indaial']}));
  await assertFails(updateDoc(docRef(db,'users','volunteer-rodeio'),{role:'admin'}));
  await assertFails(updateDoc(docRef(db,'users','volunteer-indaial'),{active:false}));
  await assertSucceeds(deleteDoc(docRef(db,'users','volunteer-rodeio')));
  await assertFails(deleteDoc(docRef(db,'users','volunteer-indaial')));
});

test('coordinators can onboard same-unit volunteers in one atomic write only',async()=>{
  const db=dbFor('coordinator-rodeio');
  const batch=writeBatch(db);
  batch.set(docRef(db,'users','onboarded-volunteer'),{role:'volunteer',active:true,unitIds:['rodeio']});
  batch.set(docRef(db,'volunteer_profiles','onboarded-volunteer'),{name:'New volunteer'});
  batch.set(docRef(db,'applications','onboarded-application'),{unitId:'rodeio',participantUids:['onboarded-volunteer'],active:true,status:'pending'});
  await assertSucceeds(batch.commit());

  const crossUnit=writeBatch(db);
  crossUnit.set(docRef(db,'users','foreign-onboarded-volunteer'),{role:'volunteer',active:true,unitIds:['indaial']});
  crossUnit.set(docRef(db,'volunteer_profiles','foreign-onboarded-volunteer'),{name:'Foreign volunteer'});
  crossUnit.set(docRef(db,'applications','foreign-onboarded-application'),{unitId:'indaial',participantUids:['foreign-onboarded-volunteer'],active:true,status:'pending'});
  await assertFails(crossUnit.commit());
});

test('coordinators cannot create, move or delete applications outside their unit',async()=>{
  const db=dbFor('coordinator-rodeio');
  await assertSucceeds(setDoc(docRef(db,'applications','new-local-application'),{unitId:'rodeio',participantUids:['volunteer-rodeio'],active:true,status:'pending'}));
  await assertFails(setDoc(docRef(db,'applications','new-foreign-application'),{unitId:'indaial',participantUids:['volunteer-indaial'],active:true,status:'pending'}));
  await assertFails(setDoc(docRef(db,'applications','wrong-participant-application'),{unitId:'rodeio',participantUids:['volunteer-indaial'],active:true,status:'pending'}));
  await assertSucceeds(updateDoc(docRef(db,'applications','application-rodeio'),{status:'analysis'}));
  await assertFails(updateDoc(docRef(db,'applications','application-rodeio'),{unitId:'indaial'}));
  await assertFails(updateDoc(docRef(db,'applications','application-indaial'),{status:'rejected'}));
  await assertSucceeds(deleteDoc(docRef(db,'applications','application-rodeio')));
  await assertFails(deleteDoc(docRef(db,'applications','application-indaial')));
});

test('coordinators can manage activities only through same-unit applications',async()=>{
  const db=dbFor('coordinator-rodeio');
  await assertSucceeds(getDoc(docRef(db,'activities','activity-rodeio')));
  await assertFails(getDoc(docRef(db,'activities','activity-indaial')));
  await assertSucceeds(setDoc(docRef(db,'activities','new-local-activity'),{applicationId:'application-rodeio',name:'Local'}));
  await assertFails(setDoc(docRef(db,'activities','new-foreign-activity'),{applicationId:'application-indaial',name:'Foreign'}));
  await assertSucceeds(updateDoc(docRef(db,'activities','activity-rodeio'),{name:'Updated'}));
  await assertFails(updateDoc(docRef(db,'activities','activity-rodeio'),{applicationId:'application-indaial'}));
  await assertFails(updateDoc(docRef(db,'activities','activity-indaial'),{name:'Unauthorized'}));
  await assertSucceeds(deleteDoc(docRef(db,'activities','activity-rodeio')));
  await assertFails(deleteDoc(docRef(db,'activities','activity-indaial')));
});

test('coordinators cannot cross units or change a session unit or application link',async()=>{
  const db=dbFor('coordinator-rodeio');
  await assertSucceeds(getDoc(docRef(db,'activity_sessions','session-rodeio')));
  await assertSucceeds(getDoc(docRef(db,'activity_sessions','session-rodeio-legacy')));
  await assertFails(getDoc(docRef(db,'activity_sessions','session-indaial')));
  await assertSucceeds(setDoc(docRef(db,'activity_sessions','new-local-session'),{applicationId:'application-rodeio',activityId:'activity-rodeio',unitId:'rodeio',status:'confirmed'}));
  await assertFails(setDoc(docRef(db,'activity_sessions','new-foreign-session'),{applicationId:'application-indaial',activityId:'activity-indaial',unitId:'indaial',status:'confirmed'}));
  await assertFails(setDoc(docRef(db,'activity_sessions','forged-session'),{applicationId:'application-rodeio',activityId:'activity-rodeio',unitId:'indaial',status:'confirmed'}));
  await assertSucceeds(updateDoc(docRef(db,'activity_sessions','session-rodeio'),{status:'proposed'}));
  await assertFails(updateDoc(docRef(db,'activity_sessions','session-rodeio'),{unitId:'indaial'}));
  await assertFails(updateDoc(docRef(db,'activity_sessions','session-rodeio'),{applicationId:'application-indaial'}));
  await assertSucceeds(updateDoc(docRef(db,'activity_sessions','session-rodeio-legacy'),{unitId:'rodeio'}));
  await assertFails(updateDoc(docRef(db,'activity_sessions','session-rodeio-legacy'),{unitId:'indaial'}));
  await assertFails(updateDoc(docRef(db,'activity_sessions','session-indaial'),{status:'proposed'}));
  await assertSucceeds(deleteDoc(docRef(db,'activity_sessions','session-rodeio')));
  await assertFails(deleteDoc(docRef(db,'activity_sessions','session-indaial')));
});

test('coordinators can manage groups and unit settings only in their units',async()=>{
  const db=dbFor('coordinator-rodeio');
  await assertSucceeds(getDoc(docRef(db,'groups','group-rodeio')));
  await assertFails(getDoc(docRef(db,'groups','group-indaial')));
  await assertSucceeds(setDoc(docRef(db,'groups','new-local-group'),{unitId:'rodeio',code:'C'}));
  await assertFails(setDoc(docRef(db,'groups','new-foreign-group'),{unitId:'indaial',code:'D'}));
  await assertSucceeds(updateDoc(docRef(db,'groups','group-rodeio'),{code:'C'}));
  await assertFails(updateDoc(docRef(db,'groups','group-rodeio'),{unitId:'indaial'}));
  await assertFails(deleteDoc(docRef(db,'groups','group-indaial')));
  await assertSucceeds(updateDoc(docRef(db,'units','rodeio'),{name:'Rodeio unit'}));
  await assertFails(updateDoc(docRef(db,'units','indaial'),{name:'Changed by Rodeio'}));
  await assertFails(setDoc(docRef(db,'units','new-unit'),{name:'New unit'}));
  await assertFails(deleteDoc(docRef(db,'units','rodeio')));
});

test('activity assistants remain limited to their assigned unit',async()=>{
  const db=dbFor('assistant-rodeio');
  await assertSucceeds(getDoc(docRef(db,'applications','application-rodeio')));
  await assertFails(getDoc(docRef(db,'applications','application-indaial')));
  await assertSucceeds(getDoc(docRef(db,'groups','group-rodeio')));
  await assertFails(getDoc(docRef(db,'groups','group-indaial')));
});

test('administrators retain global access across both units',async()=>{
  const db=dbFor('admin');
  await assertSucceeds(getDoc(docRef(db,'applications','application-indaial')));
  await assertSucceeds(getDoc(docRef(db,'activities','activity-indaial')));
  await assertSucceeds(getDoc(docRef(db,'activity_sessions','session-indaial')));
  await assertSucceeds(getDoc(docRef(db,'activity_sessions','session-rodeio-legacy')));
  await assertSucceeds(getDoc(docRef(db,'groups','group-indaial')));
  await assertSucceeds(getDoc(docRef(db,'volunteer_profiles','volunteer-indaial')));
  await assertSucceeds(updateDoc(docRef(db,'applications','application-rodeio'),{unitId:'indaial'}));
});

test('participants can edit a requested session adjustment and resubmit the plan',async()=>{
  await testEnv.withSecurityRulesDisabled(async context=>{
    const db=context.firestore(),now=Timestamp.now();
    await updateDoc(docRef(db,'applications','application-rodeio'),{status:'adjustments',active:true,planningDeadlineAt:Timestamp.fromDate(new Date(Date.now()+86_400_000))});
    await updateDoc(docRef(db,'activity_sessions','session-rodeio'),{status:'proposed',adminAdjustmentStatus:'requested',adminAdjustmentRequestedAt:now,adminAdjustmentSubmittedAt:null});
  });

  const db=dbFor('volunteer-rodeio');
  await assertSucceeds(updateDoc(docRef(db,'activity_sessions','session-rodeio'),{period:'Noite',updatedAt:serverTimestamp()}));
  await testEnv.withSecurityRulesDisabled(async context=>{
    await setDoc(docRef(context.firestore(),'activity_sessions','session-manager-created'),{
      applicationId:'application-rodeio',activityId:'activity-rodeio',unitId:'rodeio',status:'confirmed',
      managerCreated:true,adminAdjustmentStatus:'requested',period:'Tarde'
    });
  });
  await assertFails(updateDoc(docRef(db,'activity_sessions','session-manager-created'),{period:'Noite',updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(docRef(db,'activity_sessions','session-rodeio'),{adminAdjustmentStatus:'analysis',adminAdjustmentSubmittedAt:serverTimestamp(),updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(docRef(db,'applications','application-rodeio'),{status:'analysis',planningSubmittedAt:serverTimestamp(),updatedAt:serverTimestamp()}));
});
