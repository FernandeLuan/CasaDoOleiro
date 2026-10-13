/* Production error monitoring. The public Sentry DSN is injected at deploy time. */
(function initOleiroMonitoring(){
  const config=window.OLEIRO_SENTRY_CONFIG||{};
  const sdkUrl='https://browser.sentry-cdn.com/10.53.1/bundle.tracing.replay.min.js';
  const criticalCodes=new Set(['permission-denied','failed-precondition','unauthenticated','unavailable','resource-exhausted','internal','deadline-exceeded','aborted','data-loss']);
  const sensitiveKey=/(email|phone|password|passwd|token|authorization|cookie|contact|secret|name|messageText)/i;
  const sentryIdentifierKeys=new Set(['event_id','eventid','trace_id','traceid','span_id','spanid','parent_span_id','parentspanid','segment_id','segmentid','profile_id','profileid','transaction_id','transactionid']);
  function normalizedKey(key){return String(key||'').replace(/([a-z0-9])([A-Z])/g,'$1_$2').toLowerCase().replace(/[^a-z0-9]+/g,'_')}
  function isSentryIdentifierKey(key){return sentryIdentifierKeys.has(normalizedKey(key))}
  function identifierKey(key){
    const normalized=normalizedKey(key);
    if(sentryIdentifierKeys.has(normalized))return false;
    const tokens=normalized.split('_').filter(Boolean);
    return tokens.some(token=>['id','ids','uid','uids','uuid','uuids'].includes(token));
  }
  const emailPattern=/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const phonePattern=/(?:\+?\d[\d\s().-]{7,}\d)/g;
  const queue=[];
  const slowQuerySeen=new Map();
  const monitoringStartedAt=Date.now();
  const reported=typeof WeakSet==='function'?new WeakSet():null;
  let initialized=false;
  let loading=false;

  function codeOf(error){
    const raw=String(error?.code||'').toLowerCase();
    return raw.includes('/')?raw.split('/').pop():raw;
  }
  const identifierPathSegments=new Set(['applications','application','users','user','activities','activity','activity_sessions','activity-sessions','sessions','session','volunteer_profiles','volunteer-profiles','groups','group','history']);
  function cleanPath(pathname){
    const parts=String(pathname||'').split('/');
    for(let i=1;i<parts.length;i++){
      let previous=parts[i-1];
      try{previous=decodeURIComponent(previous)}catch{}
      if(identifierPathSegments.has(String(previous).toLowerCase())&&parts[i])parts[i]='[redacted-id]';
    }
    return parts.join('/').replace(emailPattern,'[redacted-email]').replace(phonePattern,'[redacted-phone]');
  }
  function cleanUrl(value){
    try{const url=new URL(String(value||''),location.href);return `${url.origin}${cleanPath(url.pathname)}`}
    catch{return cleanPath(String(value||'').split('?')[0].split('#')[0])}
  }
  function cleanText(value){
    const clean=String(value||'').replace(/https?:\/\/[^\s"'<>]+/gi,url=>cleanUrl(url))
      .replace(/(\/[^\s"'<>?#]+)[?#][^\s"'<>]*/g,'$1')
      .replace(/(\/(?:applications?|users?|activities?|activity_sessions|activity-sessions|sessions?|volunteer_profiles|volunteer-profiles|groups?|history)\/)[^/?#\s]+/gi,'$1[redacted-id]')
      .replace(emailPattern,'[redacted-email]').replace(phonePattern,'[redacted-phone]');
    return clean.length>500?`${clean.slice(0,500)}…`:clean;
  }
  function scrub(value,depth=0){
    if(depth>4)return '[truncated]';
    if(value===null||value===undefined||typeof value==='boolean'||typeof value==='number')return value;
    if(typeof value==='string')return cleanText(value);
    if(Array.isArray(value))return value.slice(0,20).map(item=>scrub(item,depth+1));
    if(typeof value==='object'){
      const out={};
      Object.entries(value).slice(0,40).forEach(([key,item])=>{
        if(sensitiveKey.test(key)||identifierKey(key))out[key]='[redacted]';
        else if(isSentryIdentifierKey(key))out[key]=item;
        else out[key]=scrub(item,depth+1);
      });
      return out;
    }
    return String(value);
  }
  function beforeSend(event){
    const clean=scrub(event);
    if(clean.user)delete clean.user;
    if(clean.request)clean.request={url:cleanUrl(clean.request.url||location.href)};
    return clean;
  }
  function beforeBreadcrumb(breadcrumb){
    const category=String(breadcrumb?.category||'');
    if(category.startsWith('ui.'))return null;
    return scrub(breadcrumb);
  }
  function baseTags(meta={}){
    const role=String(window.state?.currentSession?.user?.role||'anonymous');
    const path=location.pathname.includes('/admin/')?'admin':location.pathname.includes('/portal/')?'portal':'login';
    return {area:meta.area||path,action:meta.action||'runtime',firebaseCode:meta.firebaseCode||'',role};
  }
  function alreadyReported(error){
    if(!reported||!error||typeof error!=='object')return false;
    if(reported.has(error))return true;
    reported.add(error);return false;
  }
  function sendException(error,meta={}){
    if(!initialized||!window.Sentry?.captureException)return null;
    if(alreadyReported(error))return null;
    let eventId=null;
    window.Sentry.withScope(scope=>{
      const tags=baseTags(meta);Object.entries(tags).forEach(([key,value])=>value&&scope.setTag(key,String(value)));
      if(meta.status)scope.setTag('recordStatus',String(meta.status));
      if(meta.extra)scope.setExtras(scrub(meta.extra));
      if(meta.action==='slow_firestore_query'){
        scope.setLevel('warning');
        scope.setFingerprint(['firestore-slow-query',meta.extra.query]);
        eventId=window.Sentry.captureMessage(`Slow Firestore query: ${meta.extra.query}`,'warning');
        return;
      }
      eventId=window.Sentry.captureException(error instanceof Error?error:new Error(String(error||'Unknown error')));
    });
    return eventId;
  }
  function captureException(error,meta={}){
    if(!config.enabled||!config.dsn)return null;
    if(!initialized){queue.push({error,meta});if(queue.length>30)queue.shift();return null}
    return sendException(error,meta);
  }
  function captureServiceError(error,meta={}){
    const code=codeOf(error);
    const message=String(error?.message||'');
    const permissionMessage=/missing or insufficient permissions|permission[- ]denied/i.test(message);
    const level=criticalCodes.has(code)||permissionMessage?'critical':'application';
    return captureException(error,{...meta,firebaseCode:code||'',severity:level});
  }
  function flushQueue(){while(queue.length){const item=queue.shift();sendException(item.error,item.meta)}}
  function captureSlowQuery(row={}) {
    const durationMs=Number(row.ms)||0,name=String(row.name||'unknown');
    if(!config.enabled||!config.dsn||!Number.isFinite(durationMs)||durationMs<1200)return null;
    const now=Date.now(),coldStart=row.coldStart===true||(now-monitoringStartedAt<10000);
    if(initialized&&window.Sentry?.addBreadcrumb)window.Sentry.addBreadcrumb({category:'firestore.performance',message:name,level:durationMs>=4000?'warning':'info',data:{durationMs,count:Number(row.count)||0,coldStart}});
    // Mild latency remains diagnostic context; it never accumulates into an error.
    if(durationMs<2500)return null;
    // Keep startup latency out of recurrence counts, but surface extreme stalls.
    if(coldStart&&durationMs<8000)return null;
    const previous=slowQuerySeen.get(name);
    const recent=(previous?.recent||[]).filter(at=>now-at<60000);
    recent.push(now);
    const state={recent:recent.slice(-3),lastReported:previous?.lastReported??null};
    slowQuerySeen.set(name,state);
    if(durationMs<8000&&state.recent.length<3)return null;
    if(state.lastReported!==null&&now-state.lastReported<300000)return null;
    state.lastReported=now;
    return captureException(new Error(`Slow Firestore query: ${name}`),{area:'performance',action:'slow_firestore_query',extra:{query:name,durationMs,count:Number(row.count)||0,coldStart,seen:state.recent.length}});
  }
  function load(){
    if(loading||initialized||!config.enabled||!config.dsn)return;
    loading=true;
    const script=document.createElement('script');
    script.src=sdkUrl;script.crossOrigin='anonymous';script.referrerPolicy='origin';
    script.onload=()=>{
      try{
        const integrations=[];
        if(typeof window.Sentry.browserTracingIntegration==='function')integrations.push(window.Sentry.browserTracingIntegration());
        if(typeof window.Sentry.replayIntegration==='function')integrations.push(window.Sentry.replayIntegration({maskAllText:true,blockAllMedia:true,maskAllInputs:true}));
        window.Sentry.init({
          dsn:String(config.dsn),
          environment:String(config.environment||'production'),
          release:String(config.release||''),
          sendDefaultPii:false,
          integrations,
          tracesSampleRate:0.1,
          replaysSessionSampleRate:0,
          replaysOnErrorSampleRate:0.1,
          beforeSend,
          beforeSendTransaction:beforeSend,
          beforeSendSpan:span=>scrub(span),
          beforeBreadcrumb
        });
        initialized=true;flushQueue();
      }catch(error){console.warn('[Monitoring] Sentry init failed',error)}
    };
    script.onerror=()=>console.warn('[Monitoring] Sentry SDK unavailable');
    document.head.appendChild(script);
  }

  window.addEventListener('error',event=>{const target=event.target,resource=target&&(target.src||target.href);if(resource&&!event.error){captureException(new Error(`Asset failed to load: ${cleanUrl(resource)}`),{area:'browser',action:'asset_load_failed',extra:{tag:String(target.tagName||''),resource:cleanUrl(resource)}});return}if(!initialized&&event.error)captureException(event.error,{area:'browser',action:'unhandled_error'})},true);
  window.addEventListener('unhandledrejection',event=>{if(!initialized)captureException(event.reason instanceof Error?event.reason:new Error(String(event.reason||'Unhandled rejection')),{area:'browser',action:'unhandled_rejection'})});

  window.OleiroMonitoring={
    captureException,
    captureServiceError,
    captureSlowQuery,
    addBreadcrumb(message,data={}){if(initialized&&window.Sentry?.addBreadcrumb)window.Sentry.addBreadcrumb({category:'oleiro',message:String(message||''),level:'info',data:scrub(data)})},
    isEnabled(){return Boolean(config.enabled&&config.dsn)},
    sdkVersion:'10.53.1'
  };
  load();
})();
