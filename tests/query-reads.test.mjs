import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

function setup(){
  const reads=[],pending=[];
  const context={configured:true,db:{},auth:{currentUser:{uid:'manager'}},modules:{firestore:{
    doc(db,collection,id){return {collection,id}},
    getDoc(ref){reads.push(ref);return new Promise((resolve,reject)=>pending.push({ref,resolve,reject}))},
    async updateDoc(){},serverTimestamp(){return 1}
  }}};
  const window={OleiroFirebase:{ready:Promise.resolve(context)}};
  for(const file of ['service-core','application-service','volunteer-profile-service']){
    runInNewContext(readFileSync(new URL('../js/services/'+file+'.js',import.meta.url),'utf8'),{window,console});
  }
  return {context,services:window.OleiroServices,window,reads,pending};
}
async function tick(){for(let i=0;i<20;i++)await Promise.resolve()}
function resolve(row,data={}){row.resolve({id:row.ref.id,exists:()=>data!==null,data:()=>data,metadata:{fromCache:false}})}

test('concurrent application reads use one getDoc and one metric; later refresh reads again',async()=>{
  const s=setup();const a=s.services.applications.getById('a',{enrichProfiles:false});
  const b=s.services.applications.getById('a',{enrichProfiles:false});await tick();
  assert.equal(s.reads.length,1);resolve(s.pending[0],{status:'pending'});
  assert.equal((await a).status,'pending');assert.equal((await b).status,'pending');
  assert.equal(s.window.OleiroQueryMetrics.length,1);
  await s.services.applications.update('a',{status:'approved'});
  const c=s.services.applications.getById('a',{enrichProfiles:false});await tick();
  assert.equal(s.reads.length,2);resolve(s.pending[1],{status:'approved'});assert.equal((await c).status,'approved');
});
test('missing and failed reads are not retained; failure propagates and retry succeeds',async()=>{
  const s=setup();const first=s.services.applications.getById('a');await tick();resolve(s.pending[0],null);assert.equal(await first,null);
  const second=s.services.applications.getById('a');const rejected=assert.rejects(second,/offline/);await tick();s.pending[1].reject(new Error('offline'));await rejected;
  const retry=s.services.applications.getById('a');await tick();resolve(s.pending[2],{});assert.equal((await retry).id,'a');assert.equal(s.reads.length,3);
});
test('different documents and authenticated users do not share outstanding reads',async()=>{
  const s=setup(),read=id=>s.services.readDocument(s.context,'applications',id,'test');
  const a=read('a'),b=read('b');s.context.auth.currentUser={uid:'another'};const c=read('a');await tick();
  assert.equal(s.reads.length,3);s.pending.forEach(row=>resolve(row));await Promise.all([a,b,c]);
});
test('application enrichment reuses profiles already requested by contact widgets',async()=>{
  const s=setup();const contacts=s.services.profiles.getByIds(['u','u']);
  const app=s.services.applications.getById('a');await tick();
  resolve(s.pending.find(row=>row.ref.collection==='applications'),{participantUids:['u','u']});await tick();
  assert.equal(s.reads.filter(row=>row.collection==='volunteer_profiles').length,1);
  resolve(s.pending.find(row=>row.ref.collection==='volunteer_profiles'),{phone:'123'});
  await contacts;assert.equal((await app).phone,'123');
  await s.services.profiles.getByIds(['u']);assert.equal(s.reads.length,2);
});
test('emergency-only updates do not create an incomplete cached profile',async()=>{
  const s=setup();await s.services.profiles.updateEmergencyContact('u',{name:'Contact',phone:'123'});
  const profiles=s.services.profiles.getByIds(['u']);await tick();assert.equal(s.reads.length,1);
  resolve(s.pending[0],{phone:'456'});assert.equal((await profiles)[0].phone,'456');
});
