import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,Timestamp} from 'firebase-admin/firestore';
import {pathToFileURL} from 'node:url';

const projectId='demo-casadooleiro';
process.env.GCLOUD_PROJECT=projectId;
process.env.FIRESTORE_EMULATOR_HOST=process.env.FIRESTORE_EMULATOR_HOST||'127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST=process.env.FIREBASE_AUTH_EMULATOR_HOST||'127.0.0.1:9099';

async function clearEmulators(){
  const [firestoreResponse,authResponse]=await Promise.all([
    fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`,{method:'DELETE'}),
    fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${projectId}/accounts`,{method:'DELETE'})
  ]);
  if(!firestoreResponse.ok)throw new Error(`Firestore emulator reset failed: ${firestoreResponse.status}`);
  if(!authResponse.ok)throw new Error(`Auth emulator reset failed: ${authResponse.status}`);
}

export async function seedEmulators(){
  await clearEmulators();
  const app=initializeApp({projectId},`e2e-seed-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  try{
    const auth=getAuth(app),db=getFirestore(app);
    const admin=await auth.createUser({uid:'e2e-admin',email:'admin@oleiro.test',password:'Admin123!',displayName:'Administrador E2E'});
    const volunteer=await auth.createUser({uid:'e2e-volunteer',email:'voluntario@oleiro.test',password:'Volunteer123!',displayName:'Voluntário E2E'});
    const now=Timestamp.now(),deadline=Timestamp.fromDate(new Date(Date.now()+7*86400000));

    const batch=db.batch();
    batch.set(db.doc(`users/${admin.uid}`),{role:'admin',active:true,language:'pt',unitIds:['rodeio','indaial'],email:admin.email,createdAt:now,updatedAt:now});
    batch.set(db.doc(`users/${volunteer.uid}`),{role:'volunteer',active:true,language:'pt',unitIds:['rodeio'],email:volunteer.email,firstPortalAccessAt:now,createdAt:now,updatedAt:now});
    batch.set(db.doc('units/rodeio'),{name:'Rodeio',active:true,acceptingVolunteers:true,createdAt:now,updatedAt:now});
    batch.set(db.doc('units/indaial'),{name:'Indaial',active:false,acceptingVolunteers:false,createdAt:now,updatedAt:now});
    batch.set(db.doc(`volunteer_profiles/${volunteer.uid}`),{name:'Voluntário E2E',fullName:'Voluntário E2E',email:volunteer.email,phone:'',country:'Brasil',nationality:'Brasil',language:'pt',gender:'male',createdAt:now,updatedAt:now});
    batch.set(db.doc('applications/e2e-application'),{
      type:'individual',participantUids:[volunteer.uid],participantNames:['Voluntário E2E'],participantEmails:[volunteer.email],participantCountries:['Brasil'],participantPhones:[''],participantGenders:['male'],participantCount:1,participantStatus:{[volunteer.uid]:'active'},
      unitId:'rodeio',unitName:'Rodeio',status:'pending',active:true,stayStart:'2026-09-14',stayEnd:'2026-09-18',stayMonths:['2026-09'],planningDeadlineAt:deadline,planningSubmittedAt:null,activityCount:0,sessionCount:0,source:'e2e',searchTokens:['v','vo','vol','volu','volun','volunt','volunta','voluntar','voluntari','voluntário','e','e2','e2e'],createdAt:now,updatedAt:now
    });
    await batch.commit();
  }finally{
    await deleteApp(app);
  }
}

const directEntry=process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url;
if(directEntry){
  await seedEmulators();
  console.log('E2E emulator seed ready.');
}
