import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../js/shared/monitoring.js',import.meta.url),'utf8');
function setup({ready=true,enabled=true}={}){
  let now=0,script;
  const messages=[],errors=[],breadcrumbs=[];
  const scope={setTag(){},setExtras(){},setLevel(){},setFingerprint(){}};
  const window={OLEIRO_SENTRY_CONFIG:{enabled,dsn:'test'},addEventListener(){},Sentry:{
    init(){},withScope(fn){fn(scope)},captureException(e){errors.push(e)},
    captureMessage(message,level){messages.push({message,level})},addBreadcrumb(b){breadcrumbs.push(b)}
  }};
  runInNewContext(source,{window,Date:{now:()=>now},console,URL,location:{href:'https://example.test/',pathname:'/'},
    document:{createElement(){return {}},head:{appendChild(s){script=s}}}});
  if(ready&&script)script.onload();
  return {api:window.OleiroMonitoring,messages,errors,breadcrumbs,time(n){now=n},ready(){script.onload()}};
}
const query=(s,ms,name='applications/by-id')=>s.api.captureSlowQuery({name,ms,count:1});

test('repeated 1226ms reads remain breadcrumbs, including after severe latency',()=>{
  const s=setup();s.time(20000);
  for(let i=0;i<10;i++)query(s,1226);
  assert.equal(s.messages.length,0);assert.equal(s.errors.length,0);assert.equal(s.breadcrumbs.length,10);
  query(s,8000);s.time(400000);query(s,1226);
  assert.equal(s.messages.length,1);
});
test('sustained latency warns once, with a stable message and cooldown',()=>{
  const s=setup();s.time(20000);query(s,2600);query(s,2700);
  assert.equal(s.messages.length,0);query(s,2800);query(s,9000);
  assert.deepEqual(s.messages,[{message:'Slow Firestore query: applications/by-id',level:'warning'}]);
  assert.equal(s.errors.length,0);
  s.time(320000);query(s,8000);assert.equal(s.messages.length,2);
});
test('old occurrences expire and different queries do not share counts',()=>{
  const s=setup();s.time(20000);query(s,3000);query(s,3000);
  s.time(80000);query(s,3000);query(s,3000,'applications/list-page');
  assert.equal(s.messages.length,0);
});
test('startup samples do not accumulate, extreme startup stalls still warn',()=>{
  const s=setup();for(let i=0;i<5;i++)query(s,3000);
  s.time(11000);query(s,3000);assert.equal(s.messages.length,0);
  const severe=setup();query(severe,8000);assert.equal(severe.messages.length,1);
});
test('queued warnings flush and genuine service failures remain exceptions',()=>{
  const s=setup({ready:false});s.time(20000);query(s,8000);
  s.api.captureServiceError({code:'permission-denied',message:'denied'});
  assert.equal(s.messages.length,0);s.ready();
  assert.equal(s.messages.length,1);assert.equal(s.errors.length,1);
});
test('disabled monitoring and invalid durations do not emit',()=>{
  const disabled=setup({enabled:false});query(disabled,9000);assert.equal(disabled.messages.length,0);
  const s=setup();query(s,Infinity);query(s,NaN);assert.equal(s.messages.length,0);
});
