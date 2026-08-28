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
    const approved=await auth.createUser({uid:'e2e-approved',email:'approved@oleiro.test',password:'Approved123!',displayName:'Aprovado E2E'});
    const indaial=await auth.createUser({uid:'e2e-indaial',email:'indaial@oleiro.test',password:'Indaial123!',displayName:'Indaial E2E'});
    const assistant=await auth.createUser({uid:'e2e-assistant',email:'assistant@oleiro.test',password:'Assistant123!',displayName:'Assistente Rodeio E2E'});
    const now=Timestamp.now(),deadline=Timestamp.fromDate(new Date(Date.now()+7*86400000));

    const batch=db.batch();
    batch.set(db.doc(`users/${admin.uid}`),{role:'admin',active:true,language:'pt',unitIds:['rodeio','indaial'],email:admin.email,createdAt:now,updatedAt:now});
    batch.set(db.doc(`users/${volunteer.uid}`),{role:'volunteer',active:true,language:'pt',unitIds:['rodeio'],email:volunteer.email,firstPortalAccessAt:now,createdAt:now,updatedAt:now});
    batch.set(db.doc(`users/${approved.uid}`),{role:'volunteer',active:true,language:'pt',unitIds:['rodeio'],email:approved.email,firstPortalAccessAt:now,createdAt:now,updatedAt:now});
    batch.set(db.doc(`users/${indaial.uid}`),{role:'volunteer',active:true,language:'pt',unitIds:['indaial'],email:indaial.email,firstPortalAccessAt:now,createdAt:now,updatedAt:now});
    batch.set(db.doc(`users/${assistant.uid}`),{role:'activity_assistant',active:true,language:'pt',unitIds:['rodeio'],email:assistant.email,createdAt:now,updatedAt:now});

    batch.set(db.doc('units/rodeio'),{name:'Rodeio',active:true,acceptingVolunteers:true,createdAt:now,updatedAt:now});
    batch.set(db.doc('units/indaial'),{name:'Indaial',active:false,acceptingVolunteers:false,createdAt:now,updatedAt:now});

    batch.set(db.doc(`volunteer_profiles/${volunteer.uid}`),{name:'Voluntário E2E',fullName:'Voluntário E2E',email:volunteer.email,phone:'',country:'Brasil',nationality:'Brasil',language:'pt',gender:'male',createdAt:now,updatedAt:now});
    batch.set(db.doc(`volunteer_profiles/${approved.uid}`),{name:'Aprovado E2E',fullName:'Aprovado E2E',email:approved.email,phone:'',country:'Brasil',nationality:'Brasil',language:'pt',gender:'female',createdAt:now,updatedAt:now});
    batch.set(db.doc(`volunteer_profiles/${indaial.uid}`),{name:'Indaial E2E',fullName:'Indaial E2E',email:indaial.email,phone:'',country:'Brasil',nationality:'Brasil',language:'pt',gender:'male',createdAt:now,updatedAt:now});

    batch.set(db.doc('applications/e2e-application'),{
      type:'individual',participantUids:[volunteer.uid],participantNames:['Voluntário E2E'],participantEmails:[volunteer.email],participantCountries:['Brasil'],participantPhones:[''],participantGenders:['male'],participantCount:1,participantStatus:{[volunteer.uid]:'active'},
      unitId:'rodeio',unitName:'Rodeio',status:'pending',active:true,stayStart:'2026-09-14',stayEnd:'2026-09-18',stayMonths:['2026-09'],planningDeadlineAt:deadline,planningSubmittedAt:null,activityCount:1,sessionCount:1,planningCountVersion:1,source:'e2e',searchTokens:['v','vo','vol','volu','volun','volunt','volunta','voluntar','voluntari','voluntário','e','e2','e2e'],createdAt:now,updatedAt:now
    });
    batch.set(db.doc('activities/e2e-candidate-activity'),{
      applicationId:'e2e-application',ownerName:'Voluntário E2E',name:'Oficina candidato E2E',description:'Descrição candidato',duration:60,participation:'Livre',materials:'Papel',notes:'Observação candidato',period:'Tarde',time:'15:15',createdByUid:volunteer.uid,createdAt:now,updatedAt:now
    });
    batch.set(db.doc('activity_sessions/e2e-candidate-session'),{
      applicationId:'e2e-application',activityId:'e2e-candidate-activity',unitId:'rodeio',date:'2026-09-15',activityName:'Oficina candidato E2E',activityDescription:'Descrição candidato',participation:'Livre',materials:'Papel',notes:'Observação candidato',ownerName:'Voluntário E2E',time:'15:15',period:'Tarde',duration:60,status:'proposed',groupId:null,createdByUid:volunteer.uid,createdAt:now,updatedAt:now
    });

    batch.set(db.doc('applications/e2e-approved-application'),{
      type:'individual',participantUids:[approved.uid],participantNames:['Aprovado E2E'],participantEmails:[approved.email],participantCountries:['Brasil'],participantPhones:[''],participantGenders:['female'],participantCount:1,participantStatus:{[approved.uid]:'active'},
      unitId:'rodeio',unitName:'Rodeio',status:'approved',active:true,stayStart:'2026-09-21',stayEnd:'2026-09-25',stayMonths:['2026-09'],planningDeadlineAt:null,planningSubmittedAt:now,activityCount:1,sessionCount:1,planningCountVersion:1,source:'e2e',searchTokens:['a','ap','apr','apro','aprov','aprova','aprova','aprovado','e','e2','e2e'],createdAt:now,updatedAt:now
    });
    batch.set(db.doc('activities/e2e-approved-activity'),{
      applicationId:'e2e-approved-application',ownerName:'Aprovado E2E',name:'Atividade confirmada E2E',description:'Descrição aprovada',duration:60,participation:'Livre',materials:'Bola',notes:'Observação aprovada',period:'Manhã',time:'09:00',status:'confirmed',createdByUid:approved.uid,createdAt:now,updatedAt:now
    });
    batch.set(db.doc('activity_sessions/e2e-approved-session'),{
      applicationId:'e2e-approved-application',activityId:'e2e-approved-activity',unitId:'rodeio',date:'2026-09-22',activityName:'Atividade confirmada E2E',activityDescription:'Descrição aprovada',participation:'Livre',materials:'Bola',notes:'Observação aprovada',ownerName:'Aprovado E2E',time:'09:00',period:'Manhã',duration:60,status:'confirmed',groupId:'Livre',createdByUid:approved.uid,confirmedAt:now,createdAt:now,updatedAt:now
    });

    batch.set(db.doc('applications/e2e-indaial-application'),{
      type:'individual',participantUids:[indaial.uid],participantNames:['Indaial E2E'],participantEmails:[indaial.email],participantCountries:['Brasil'],participantPhones:[''],participantGenders:['male'],participantCount:1,participantStatus:{[indaial.uid]:'active'},
      unitId:'indaial',unitName:'Indaial',status:'approved',active:true,stayStart:'2026-09-21',stayEnd:'2026-09-25',stayMonths:['2026-09'],planningDeadlineAt:null,planningSubmittedAt:now,activityCount:0,sessionCount:0,planningCountVersion:1,source:'e2e',searchTokens:['i','in','ind','inda','indai','indaia','indaial','e','e2','e2e'],createdAt:now,updatedAt:now
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
