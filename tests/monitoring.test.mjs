import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../js/shared/monitoring.js',import.meta.url),'utf8');
function setup({ready=true,enabled=true}={}){
  let now=0,script;
  const messages=[],errors=[],breadcrumbs=[];
  const scope={setTag(){},setExtras(){},setLevel(){},setFingerprint(){}};
  let sentryOptions=null;
  const window={OLEIRO_SENTRY_CONFIG:{enabled,dsn:'test'},addEventListener(){},Sentry:{
    init(options){sentryOptions=options},withScope(fn){fn(scope)},captureException(e){errors.push(e)},
    captureMessage(message,level){messages.push({message,level})},addBreadcrumb(b){breadcrumbs.push(b)}
  }};
  runInNewContext(source,{window,Date:{now:()=>now},console,URL,location:{href:'https://example.test/',pathname:'/'},
    document:{createElement(){return {}},head:{appendChild(s){script=s}}}});
  if(ready&&script)script.onload();
  return {api:window.OleiroMonitoring,messages,errors,breadcrumbs,time(n){now=n},ready(){script.onload()},sanitize(event){return sentryOptions.beforeSend(event)},sanitizeTransaction(event){return sentryOptions.beforeSendTransaction(event)},sanitizeSpan(span){return sentryOptions.beforeSendSpan(span)}};
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

test('Sentry removes personal data from exception strings, contexts, and request metadata',()=>{
  const s=setup();
  const clean=s.sanitize({
    user:{email:'ana@example.test',id:'private'},
    request:{url:'https://example.test/admin?email=ana%40example.test&token=private',headers:{authorization:'private'}},
    message:'Failure for ana@example.test at +55 (47) 99999-1234',
    exception:{values:[{type:'Error',value:'Contact ana@example.test / +55 47 99999-1234'}]},
    contexts:{profile:{name:'Ana',phone:'+55 47 99999-1234'},details:{email:'ana@example.test'}},
    breadcrumbs:[{message:'Called ana@example.test: +55 47 99999-1234',data:{contact:{phone:'+55 47 99999-1234'}}}],
    extra:{email:'ana@example.test'},
    tags:{role:'coordinator'}
  });
  assert.equal(clean.user,undefined);
  assert.equal(clean.request.url,'https://example.test/admin');
  assert.equal(clean.message,'Failure for [redacted-email] at [redacted-phone]');
  assert.equal(clean.exception.values[0].value,'Contact [redacted-email] / [redacted-phone]');
  assert.equal(clean.contexts.profile.name,'[redacted]');
  assert.equal(clean.contexts.profile.phone,'[redacted]');
  assert.equal(clean.contexts.details.email,'[redacted]');
  assert.equal(clean.breadcrumbs[0].message,'Called [redacted-email]: [redacted-phone]');
  assert.equal(clean.breadcrumbs[0].data.contact,'[redacted]');
  assert.equal(clean.extra.email,'[redacted]');
  assert.equal(clean.tags.role,'coordinator');
});

test('Sentry scrubs identifiers and trace URLs before sending transactions and spans',()=>{
  const s=setup();
  const transaction=s.sanitizeTransaction({
    transaction:'https://example.test/app?email=ana%40example.test&token=private',
    request:{url:'https://example.test/app?id=private'},
    tags:{applicationId:'app-private',userId:'user-private',activityId:'activity-private',createdByUid:'creator-private'},
    spans:[{description:'GET https://example.test/api?token=private',data:{url:'https://example.test/api?email=ana%40example.test',sessionId:'session-private',ownerUid:'owner-private'}}]
  });
  assert.equal(transaction.transaction,'https://example.test/app');
  assert.equal(transaction.request.url,'https://example.test/app');
  assert.equal(transaction.tags.applicationId,'[redacted]');
  assert.equal(transaction.tags.userId,'[redacted]');
  assert.equal(transaction.tags.activityId,'[redacted]');
  assert.equal(transaction.tags.createdByUid,'[redacted]');
  assert.equal(transaction.spans[0].data.ownerUid,'[redacted]');
  assert.equal(transaction.spans[0].description,'GET https://example.test/api');
  assert.equal(transaction.spans[0].data.url,'https://example.test/api');
  assert.equal(transaction.spans[0].data.sessionId,'[redacted]');
  const span=s.sanitizeSpan({description:'GET https://example.test/api?email=ana%40example.test',data:{applicationId:'app-private'}});
  assert.equal(span.description,'GET https://example.test/api');
  assert.equal(span.data.applicationId,'[redacted]');
});

test('preserves Sentry correlation identifiers while redacting application identifiers',()=>{
  const s=setup();
  const eventId='0123456789abcdef0123456789abcdef';
  const traceId='1234567890abcdef1234567890abcdef';
  const spanId='1234567890abcdef';
  const parentSpanId='abcdefabcdefabcd';
  const transaction=s.sanitizeTransaction({
    event_id:eventId,
    contexts:{trace:{trace_id:traceId,span_id:spanId,parent_span_id:parentSpanId}},
    tags:{applicationId:'app-private',userId:'user-private'},
    spans:[{span_id:spanId,trace_id:traceId,parent_span_id:parentSpanId,data:{sessionId:'session-private'}}]
  });
  assert.equal(transaction.event_id,eventId);
  assert.equal(transaction.contexts.trace.trace_id,traceId);
  assert.equal(transaction.contexts.trace.span_id,spanId);
  assert.equal(transaction.contexts.trace.parent_span_id,parentSpanId);
  assert.equal(transaction.spans[0].span_id,spanId);
  assert.equal(transaction.spans[0].trace_id,traceId);
  assert.equal(transaction.spans[0].parent_span_id,parentSpanId);
  assert.equal(transaction.tags.applicationId,'[redacted]');
  assert.equal(transaction.tags.userId,'[redacted]');
  assert.equal(transaction.spans[0].data.sessionId,'[redacted]');

  const span=s.sanitizeSpan({span_id:spanId,trace_id:traceId,parent_span_id:parentSpanId,data:{ownerUid:'owner-private'}});
  assert.equal(span.span_id,spanId);
  assert.equal(span.trace_id,traceId);
  assert.equal(span.parent_span_id,parentSpanId);
  assert.equal(span.data.ownerUid,'[redacted]');
});
