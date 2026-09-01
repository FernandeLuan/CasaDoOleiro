/* Production observability. The public Sentry DSN is injected only into the deployed artifact. */
(function initOleiroMonitoring(){
  const config=window.OLEIRO_SENTRY_CONFIG||{};
  const sdkUrl='https://browser.sentry-cdn.com/10.53.1/bundle.min.js';
  const criticalCodes=new Set([
    'permission-denied','failed-precondition','unauthenticated','unavailable','resource-exhausted',
    'internal','deadline-exceeded','aborted','data-loss','unknown','cancelled','oleiro/index-not-ready'
  ]);
  const sensitiveKey=/(email|phone|password|passwd|token|authorization|cookie|contact|secret|participant|messageText|createdByUid|actorUid|applicationId|activityId|sessionId)/i;
  const queue=[];
  const reported=typeof WeakSet==='function'?new WeakSet():null;
  const slowQueryReportedAt=new Map();
  const SLOW_QUERY_BREADCRUMB_MS=900;
  const SLOW_QUERY_ISSUE_MS=2500;
  const SLOW_QUERY_THROTTLE_MS=5*60*1000;
  let initialized=false;
  let loading=false;

  function codeOf(error){
    const raw=String(error?.code||'').toLowerCase();
    if(raw.startsWith('oleiro/'))return raw;
    return raw.includes('/')?raw.split('/').pop():raw;
  }
  function cleanUrl(value){
    try{const url=new URL(String(value||''),location.href);return `${url.origin}${url.pathname}`}
    catch{return String(value||'').split('?')[0].split('#')[0]}
  }
  function scrub(value,depth=0){
    if(depth>4)return '[truncated]';
    if(value===null||value===undefined||typeof value==='boolean'||typeof value==='number')return value;
    if(typeof value==='string'){
      if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return '[redacted-email]';
      return value.length>500?`${value.slice(0,500)}…`:value;
    }
    if(Array.isArray(value))return value.slice(0,20).map(item=>scrub(item,depth+1));
    if(typeof value==='object'){
      const out={};
      Object.entries(value).slice(0,40).forEach(([key,item])=>{out[key]=sensitiveKey.test(key)?'[redacted]':scrub(item,depth+1)});
      return out;
    }
    return String(value);
  }
  function beforeSend(event){
    if(event.user)delete event.user;
    if(event.request)event.request={url:cleanUrl(event.request.url||location.href)};
    if(event.extra)event.extra=scrub(event.extra);
    if(event.tags)event.tags=scrub(event.tags);
    return event;
  }
  function beforeSendTransaction(event){
    if(event.user)delete event.user;
    if(event.request)event.request={url:cleanUrl(event.request.url||location.href)};
    if(event.transaction)event.transaction=String(event.transaction).split('?')[0].split('#')[0];
    if(event.contexts)event.contexts=scrub(event.contexts);
    if(event.tags)event.tags=scrub(event.tags);
    return event;
  }
  function beforeBreadcrumb(breadcrumb){
    const category=String(breadcrumb?.category||'');
    if(category.startsWith('ui.'))return null;
    const next={...breadcrumb};
    if(next.data&&typeof next.data==='object'){
      next.data=scrub(next.data);
      if(next.data.url)next.data.url=cleanUrl(next.data.url);
    }
    if(next.message)next.message=scrub(next.message);
    return next;
  }
  function routeArea(){return location.pathname.includes('/admin/')?'admin':location.pathname.includes('/portal/')?'portal':'login'}
  function baseTags(meta={}){
    const role=String(window.state?.currentSession?.user?.role||'anonymous');
    return {area:meta.area||routeArea(),action:meta.action||'runtime',firebaseCode:meta.firebaseCode||'',role};
  }
  function alreadyReported(error){
    if(!reported||!error||typeof error!=='object')return false;
    if(reported.has(error))return true;
    reported.add(error);return false;
  }
  function applyScope(scope,meta={}){
    const tags=baseTags(meta);Object.entries(tags).forEach(([key,value])=>value&&scope.setTag(key,String(value)));
    if(meta.status)scope.setTag('recordStatus',String(meta.status));
    if(meta.extra)scope.setExtras(scrub(meta.extra));
    const fingerprint=meta.fingerprint||[tags.area||'runtime',tags.action||'runtime',tags.firebaseCode||'error'];
    if(Array.isArray(fingerprint)&&fingerprint.some(Boolean))scope.setFingerprint(fingerprint.map(String));
  }
  function sendException(error,meta={}){
    if(!initialized||!window.Sentry?.captureException)return null;
    if(alreadyReported(error))return null;
    let eventId=null;
    window.Sentry.withScope(scope=>{
      applyScope(scope,meta);
      eventId=window.Sentry.captureException(error instanceof Error?error:new Error(String(error||'Unknown error')));
    });
    return eventId;
  }
  function captureException(error,meta={}){
    if(!config.enabled||!config.dsn)return null;
    if(!initialized){queue.push({kind:'exception',error,meta});if(queue.length>50)queue.shift();return null}
    return sendException(error,meta);
  }
  function captureMessage(message,meta={}){
    if(!config.enabled||!config.dsn)return null;
    if(!initialized){queue.push({kind:'message',message:String(message||''),meta});if(queue.length>50)queue.shift();return null}
    if(!window.Sentry?.captureMessage)return null;
    let eventId=null;window.Sentry.withScope(scope=>{applyScope(scope,meta);eventId=window.Sentry.captureMessage(String(message||'Observability event'),'warning')});return eventId;
  }
  function captureServiceError(error,meta={}){
    const code=codeOf(error),message=String(error?.message||'');
    const permissionMessage=/missing or insufficient permissions|permission[- ]denied/i.test(message);
    const unexpected=error instanceof TypeError||error instanceof ReferenceError||error instanceof SyntaxError||/index-not-ready/i.test(code);
    if(!criticalCodes.has(code)&&!permissionMessage&&!unexpected)return null;
    return captureException(error,{...meta,firebaseCode:code||(permissionMessage?'permission-denied':'unexpected')});
  }
  function recordQueryMetric(row={}){
    const name=String(row.name||'firestore/query'),ms=Math.max(0,Number(row.ms)||0),count=Math.max(0,Number(row.count)||0);
    const data={query:name,ms,count,...scrub(row.meta||{})};
    if(initialized&&window.Sentry?.addBreadcrumb){
      window.Sentry.addBreadcrumb({category:'firestore.query',message:name,level:ms>=SLOW_QUERY_BREADCRUMB_MS?'warning':'info',data});
    }
    try{
      if(initialized&&window.Sentry?.metrics?.distribution)window.Sentry.metrics.distribution('oleiro.firestore.query_ms',ms,{unit:'millisecond',attributes:{query:name,area:routeArea()}});
      if(initialized&&window.Sentry?.metrics?.count)window.Sentry.metrics.count('oleiro.firestore.documents',count,{attributes:{query:name,area:routeArea()}});
    }catch{}
    if(ms<SLOW_QUERY_ISSUE_MS)return;
    const previous=slowQueryReportedAt.get(name)||0;if(Date.now()-previous<SLOW_QUERY_THROTTLE_MS)return;
    slowQueryReportedAt.set(name,Date.now());
    captureMessage(`Slow Firestore query: ${name}`,{area:'performance',action:'slow_firestore_query',extra:data,fingerprint:['slow-firestore-query',name]});
  }
  function resourceFailure(event){
    const target=event?.target;if(!target||target===window)return;
    const source=target.currentSrc||target.src||target.href;if(!source)return;
    captureMessage('Browser resource failed to load',{area:'browser',action:'resource_load_error',extra:{tag:String(target.tagName||''),url:cleanUrl(source)},fingerprint:['resource-load-error',String(target.tagName||'resource'),cleanUrl(source)]});
  }
  function flushQueue(){while(queue.length){const item=queue.shift();if(item.kind==='message')captureMessage(item.message,item.meta);else sendException(item.error,item.meta)}}
  function load(){
    if(loading||initialized||!config.enabled||!config.dsn)return;
    loading=true;
    const script=document.createElement('script');
    script.src=sdkUrl;script.crossOrigin='anonymous';script.referrerPolicy='origin';
    script.onload=()=>{
      try{
        const integrations=[];
        if(typeof window.Sentry?.browserTracingIntegration==='function')integrations.push(window.Sentry.browserTracingIntegration({tracePropagationTargets:[location.origin]}));
        window.Sentry.init({
          dsn:String(config.dsn),
          environment:String(config.environment||'production'),
          release:String(config.release||''),
          sendDefaultPii:false,
          integrations,
          tracesSampleRate:0.10,
          maxBreadcrumbs:80,
          beforeSend,
          beforeSendTransaction,
          beforeBreadcrumb
        });
        initialized=true;flushQueue();
      }catch(error){console.warn('[Monitoring] Sentry init failed',error)}
    };
    script.onerror=()=>console.warn('[Monitoring] Sentry SDK unavailable');
    document.head.appendChild(script);
  }

  window.addEventListener('error',event=>{resourceFailure(event);if(!initialized&&event.error)captureException(event.error,{area:'browser',action:'unhandled_error'})},true);
  window.addEventListener('unhandledrejection',event=>{if(!initialized)captureException(event.reason instanceof Error?event.reason:new Error(String(event.reason||'Unhandled rejection')),{area:'browser',action:'unhandled_rejection'})});

  window.OleiroMonitoring={
    captureException,
    captureMessage,
    captureServiceError,
    recordQueryMetric,
    addBreadcrumb(message,data={}){if(initialized&&window.Sentry?.addBreadcrumb)window.Sentry.addBreadcrumb({category:'oleiro',message:String(message||''),level:'info',data:scrub(data)})},
    isEnabled(){return Boolean(config.enabled&&config.dsn)},
    sdkVersion:'10.53.1',
    privacyMode:'no-default-pii-no-replay'
  };
  load();
})();