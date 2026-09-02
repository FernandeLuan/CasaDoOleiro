const GOOGLE_SCOPE='https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform';
const GOOGLE_TOKEN_URL='https://oauth2.googleapis.com/token';
const FIRESTORE_API='https://firestore.googleapis.com/v1';
const RESEND_API='https://api.resend.com/emails';
const SUPPORTED_TYPES=new Set([
  'planning_submitted','planning_resent','adjustment_requested','planning_approved',
  'meeting_scheduled','candidate_approved','candidate_rejected','candidate_reactivated',
  'activity_created','activity_updated','post_proposal_reviewed'
]);
const MANAGEMENT_TYPES=new Set(['planning_submitted','planning_resent']);
const CANDIDATE_TYPES=new Set([
  'adjustment_requested','planning_approved','meeting_scheduled','candidate_approved',
  'candidate_rejected','candidate_reactivated','post_proposal_reviewed'
]);
let tokenCache={token:'',expiresAt:0};

export function normalizeMode(value){
  const mode=String(value||'off').trim().toLowerCase();
  return ['off','test','production'].includes(mode)?mode:'off';
}
function text(value){return String(value??'').trim()}
function csv(value){return [...new Set(text(value).split(/[;,\n]/).map(v=>v.trim().toLowerCase()).filter(v=>/^\S+@\S+\.\S+$/.test(v)))]}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function appName(app={}){const names=Array.isArray(app.participantNames)?app.participantNames.filter(Boolean):[];return text(names.join(' + ')||app.name||'voluntário(a)')}
function unitLabel(app={}){const raw=text(app.unitName||app.unitId||'');return raw?raw.charAt(0).toUpperCase()+raw.slice(1):'Casa do Oleiro'}
function isoDate(value){if(!value)return '';const d=new Date(value);return Number.isNaN(d.getTime())?text(value).slice(0,10):d.toISOString().slice(0,10)}
function brDate(value){const iso=isoDate(value);if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return text(value);const [y,m,d]=iso.split('-');return `${d}/${m}/${y}`}
function metadata(event={}){return event.metadata&&typeof event.metadata==='object'&&!Array.isArray(event.metadata)?event.metadata:{}}

export function notificationPlan(event={},app={}){
  const type=text(event.type),meta=metadata(event);
  if(!SUPPORTED_TYPES.has(type))return null;
  if(MANAGEMENT_TYPES.has(type))return {audience:'management'};
  if(CANDIDATE_TYPES.has(type))return {audience:'candidate'};
  if(type==='activity_created'&&text(app.status)==='approved')return {audience:'management',reason:'post_approval_activity'};
  if(type==='activity_updated'&&text(app.status)==='approved'&&meta.reviewRequest===true)return {audience:'management',reason:'post_approval_change'};
  return null;
}

function managementCopy(type,event,app){
  const name=appName(app),unit=unitLabel(app),meta=metadata(event);
  if(type==='planning_submitted')return {subject:`Planejamento enviado | ${name}`,lead:`${name} enviou o planejamento para análise.`,detail:`Unidade: ${unit}.`};
  if(type==='planning_resent')return {subject:`Planejamento reenviado | ${name}`,lead:`${name} reenviou o planejamento após ajustes.`,detail:`Unidade: ${unit}.`};
  if(type==='activity_created')return {subject:`Nova atividade pós-aprovação | ${name}`,lead:`${name} propôs uma nova atividade após a aprovação.`,detail:`Revise a proposta no painel de gestão (${unit}).`};
  if(type==='activity_updated')return {subject:`Alteração pós-aprovação | ${name}`,lead:`${name} enviou uma alteração de atividade para análise.`,detail:`Sessão: ${text(meta.sessionId)||'não informada'}. Unidade: ${unit}.`};
  return {subject:`Atualização do voluntariado | ${name}`,lead:`Há uma nova atualização de ${name}.`,detail:`Unidade: ${unit}.`};
}
function candidateCopy(type,event,app){
  const name=appName(app),meta=metadata(event),date=brDate(meta.date),time=text(meta.time),decision=text(meta.decision);
  const common={subject:'Casa do Oleiro | Atualização do voluntariado / Volunteer update / Actualización'};
  if(type==='adjustment_requested')return {...common,pt:`Olá, ${name}. A equipe solicitou um ajuste no seu planejamento${date?` referente a ${date}`:''}. Acesse o portal para revisar e reenviar.`,en:`Hello, ${name}. The team requested an adjustment to your planning${date?` for ${date}`:''}. Open the portal to review and resubmit it.`,es:`Hola, ${name}. El equipo solicitó un ajuste en tu planificación${date?` para ${date}`:''}. Accede al portal para revisarla y reenviarla.`};
  if(type==='planning_approved')return {...common,pt:`Olá, ${name}. Seu planejamento foi aprovado. Acompanhe o portal para as próximas etapas.`,en:`Hello, ${name}. Your planning has been approved. Check the portal for the next steps.`,es:`Hola, ${name}. Tu planificación fue aprobada. Consulta el portal para las próximas etapas.`};
  if(type==='meeting_scheduled')return {...common,pt:`Olá, ${name}. Sua reunião foi agendada${date?` para ${date}`:''}${time?` às ${time}`:''}. Consulte o portal para os detalhes e o link.`,en:`Hello, ${name}. Your meeting has been scheduled${date?` for ${date}`:''}${time?` at ${time}`:''}. Check the portal for details and the link.`,es:`Hola, ${name}. Tu reunión fue programada${date?` para ${date}`:''}${time?` a las ${time}`:''}. Consulta el portal para ver los detalles y el enlace.`};
  if(type==='candidate_approved')return {...common,pt:`Olá, ${name}. Sua participação foi aprovada. Consulte o portal para acompanhar sua estadia e atividades.`,en:`Hello, ${name}. Your participation has been approved. Check the portal for your stay and activities.`,es:`Hola, ${name}. Tu participación fue aprobada. Consulta el portal para acompañar tu estadía y actividades.`};
  if(type==='candidate_rejected')return {...common,pt:`Olá, ${name}. Houve uma atualização na decisão da sua candidatura. Consulte o portal para verificar o status atual.`,en:`Hello, ${name}. There has been an update to your application decision. Check the portal for the current status.`,es:`Hola, ${name}. Hubo una actualización en la decisión de tu candidatura. Consulta el portal para ver el estado actual.`};
  if(type==='candidate_reactivated')return {...common,pt:`Olá, ${name}. Seu perfil foi reativado e o planejamento está novamente disponível para edição.`,en:`Hello, ${name}. Your profile has been reactivated and planning is available for editing again.`,es:`Hola, ${name}. Tu perfil fue reactivado y la planificación está nuevamente disponible para editar.`};
  if(type==='post_proposal_reviewed'){
    const status=decision==='approve'?'aprovada / approved / aprobada':decision==='adjustments'?'devolvida para ajustes / returned for adjustments / devuelta para ajustes':'recusada / rejected / rechazada';
    return {...common,pt:`Olá, ${name}. Sua proposta de alteração de atividade foi ${status}. Consulte o portal para os detalhes.`,en:`Hello, ${name}. Your activity change proposal was ${status}. Check the portal for details.`,es:`Hola, ${name}. Tu propuesta de cambio de actividad fue ${status}. Consulta el portal para ver los detalles.`};
  }
  return {...common,pt:`Olá, ${name}. Há uma nova atualização no seu processo de voluntariado. Consulte o portal.`,en:`Hello, ${name}. There is a new update in your volunteer process. Check the portal.`,es:`Hola, ${name}. Hay una nueva actualización en tu proceso de voluntariado. Consulta el portal.`};
}

export function renderMessage(event={},app={},audience='candidate'){
  const type=text(event.type);
  if(audience==='management'){
    const copy=managementCopy(type,event,app),subject=copy.subject;
    const html=`<div style="font-family:Arial,sans-serif;line-height:1.55;color:#1f2937"><h2 style="margin:0 0 12px">Casa do Oleiro</h2><p>${escapeHtml(copy.lead)}</p><p>${escapeHtml(copy.detail)}</p><p><strong>Ação:</strong> abra o painel de gestão para revisar o item pendente.</p><p style="color:#6b7280;font-size:13px">Mensagem automática do Portal de Voluntariado.</p></div>`;
    const plain=`Casa do Oleiro\n\n${copy.lead}\n${copy.detail}\n\nAção: abra o painel de gestão para revisar o item pendente.\n`;
    return {subject,html,text:plain};
  }
  const copy=candidateCopy(type,event,app),sections=[['Português',copy.pt],['English',copy.en],['Español',copy.es]];
  const html=`<div style="font-family:Arial,sans-serif;line-height:1.55;color:#1f2937"><h2 style="margin:0 0 12px">Casa do Oleiro</h2>${sections.map(([label,body])=>`<h3 style="margin:20px 0 6px">${label}</h3><p>${escapeHtml(body)}</p>`).join('')}<p style="color:#6b7280;font-size:13px">Mensagem automática do Portal de Voluntariado.</p></div>`;
  const plain=sections.map(([label,body])=>`${label}\n${body}`).join('\n\n');
  return {subject:copy.subject,html,text:`Casa do Oleiro\n\n${plain}\n`};
}

export function resolveRecipients(mode,audience,app={},env={}){
  if(mode==='test')return csv(env.TEST_EMAIL).slice(0,1);
  if(audience==='management')return csv(env.MANAGEMENT_EMAILS);
  const list=Array.isArray(app.participantEmails)?app.participantEmails:[];
  return [...new Set([...list.map(v=>text(v).toLowerCase()),...csv(app.email)].filter(v=>/^\S+@\S+\.\S+$/.test(v)))];
}

function base64UrlBytes(bytes){let binary='';for(const b of new Uint8Array(bytes))binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function base64UrlText(value){return base64UrlBytes(new TextEncoder().encode(value))}
function pemBytes(pem){const clean=text(pem).replace(/\\n/g,'\n').replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');const binary=atob(clean);const out=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out.buffer}
async function googleAccessToken(env){
  if(tokenCache.token&&Date.now()<tokenCache.expiresAt-60000)return tokenCache.token;
  const email=text(env.GOOGLE_CLIENT_EMAIL),privateKey=text(env.GOOGLE_PRIVATE_KEY);if(!email||!privateKey)throw new Error('GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY não configurados.');
  const now=Math.floor(Date.now()/1000),header=base64UrlText(JSON.stringify({alg:'RS256',typ:'JWT'})),payload=base64UrlText(JSON.stringify({iss:email,scope:GOOGLE_SCOPE,aud:GOOGLE_TOKEN_URL,iat:now,exp:now+3600})),unsigned=`${header}.${payload}`;
  const key=await crypto.subtle.importKey('pkcs8',pemBytes(privateKey),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned)),assertion=`${unsigned}.${base64UrlBytes(signature)}`;
  const body=new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion});
  const response=await fetch(GOOGLE_TOKEN_URL,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
  if(!response.ok)throw new Error(`OAuth Google falhou (${response.status}): ${await response.text()}`);
  const data=await response.json();tokenCache={token:data.access_token,expiresAt:Date.now()+(Number(data.expires_in)||3600)*1000};return tokenCache.token;
}
function decodeValue(value){
  if(!value||typeof value!=='object')return null;
  if('stringValue'in value)return value.stringValue;if('integerValue'in value)return Number(value.integerValue);if('doubleValue'in value)return Number(value.doubleValue);if('booleanValue'in value)return value.booleanValue;if('timestampValue'in value)return value.timestampValue;if('nullValue'in value)return null;
  if('arrayValue'in value)return (value.arrayValue.values||[]).map(decodeValue);
  if('mapValue'in value){const out={};for(const [k,v] of Object.entries(value.mapValue.fields||{}))out[k]=decodeValue(v);return out}
  return null;
}
function decodeDoc(document){const out={};for(const [k,v] of Object.entries(document?.fields||{}))out[k]=decodeValue(v);return {...out,_name:document?.name||'',_createTime:document?.createTime||'',_updateTime:document?.updateTime||''}}
function encodeValue(value){
  if(value===null||value===undefined)return {nullValue:null};if(value instanceof Date)return {timestampValue:value.toISOString()};if(Array.isArray(value))return {arrayValue:{values:value.map(encodeValue)}};
  if(typeof value==='boolean')return {booleanValue:value};if(typeof value==='number')return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};if(typeof value==='object'){const fields={};for(const [k,v] of Object.entries(value))fields[k]=encodeValue(v);return {mapValue:{fields}}}
  return {stringValue:String(value)};
}
function fields(obj){const out={};for(const [k,v] of Object.entries(obj))out[k]=encodeValue(v);return {fields:out}}
function project(env){const id=text(env.FIREBASE_PROJECT_ID);if(!id)throw new Error('FIREBASE_PROJECT_ID não configurado.');return id}
async function googleFetch(env,url,options={}){const token=await googleAccessToken(env),response=await fetch(url,{...options,headers:{authorization:`Bearer ${token}`,'content-type':'application/json',...(options.headers||{})}});return response}
function docUrl(env,path){return `${FIRESTORE_API}/projects/${encodeURIComponent(project(env))}/databases/(default)/documents/${path.split('/').map(encodeURIComponent).join('/')}`}
async function getDoc(env,path){const response=await googleFetch(env,docUrl(env,path));if(response.status===404)return null;if(!response.ok)throw new Error(`Firestore GET ${path} falhou (${response.status}): ${await response.text()}`);return decodeDoc(await response.json())}
async function recentEvents(env){
  const start=text(env.NOTIFICATION_START_AT);if(!start||Number.isNaN(Date.parse(start)))throw new Error('NOTIFICATION_START_AT deve ser um ISO timestamp válido.');
  const limit=Math.max(1,Math.min(Number(env.BATCH_SIZE)||100,500));
  const url=`${FIRESTORE_API}/projects/${encodeURIComponent(project(env))}/databases/(default)/documents:runQuery`;
  const body={structuredQuery:{from:[{collectionId:'history',allDescendants:true}],where:{fieldFilter:{field:{fieldPath:'createdAt'},op:'GREATER_THAN_OR_EQUAL',value:{timestampValue:new Date(start).toISOString()}}},orderBy:[{field:{fieldPath:'createdAt'},direction:'DESCENDING'}],limit}};
  const response=await googleFetch(env,url,{method:'POST',body:JSON.stringify(body)});if(!response.ok)throw new Error(`Firestore history query falhou (${response.status}): ${await response.text()}`);
  const rows=await response.json();return rows.filter(r=>r.document).map(r=>decodeDoc(r.document));
}
function eventIdentity(event){const parts=text(event._name).split('/documents/')[1]?.split('/')||[];const appIndex=parts.lastIndexOf('applications'),historyIndex=parts.lastIndexOf('history');if(appIndex<0||historyIndex<0)return null;return {applicationId:parts[appIndex+1],eventId:parts[historyIndex+1],path:parts.join('/')}}
function deliveryId(identity){return base64UrlText(identity.path).slice(0,1200)}
async function createClaim(env,id,event,identity,mode){
  const existing=await getDoc(env,`notification_deliveries/${id}`);if(existing){if(['sent','tested','skipped'].includes(text(existing.status)))return {claimed:false,existing};const claimedAt=Date.parse(existing.claimedAt||0);if(text(existing.status)==='processing'&&Number.isFinite(claimedAt)&&Date.now()-claimedAt<300000)return {claimed:false,existing};}
  const now=new Date().toISOString(),payload={status:'processing',mode,eventType:text(event.type),applicationId:identity.applicationId,sourceEventPath:identity.path,claimedAt:now,updatedAt:now,attempts:Number(existing?.attempts||0)+1};
  if(!existing){
    const url=`${FIRESTORE_API}/projects/${encodeURIComponent(project(env))}/databases/(default)/documents/notification_deliveries?documentId=${encodeURIComponent(id)}`,response=await googleFetch(env,url,{method:'POST',body:JSON.stringify(fields(payload))});
    if(response.status===409)return {claimed:false,existing:await getDoc(env,`notification_deliveries/${id}`)};if(!response.ok)throw new Error(`Falha ao criar claim (${response.status}): ${await response.text()}`);return {claimed:true,existing:null};
  }
  const response=await googleFetch(env,docUrl(env,`notification_deliveries/${id}`),{method:'PATCH',body:JSON.stringify(fields(payload))});if(!response.ok)throw new Error(`Falha ao renovar claim (${response.status}): ${await response.text()}`);return {claimed:true,existing};
}
async function finishDelivery(env,id,patch){const response=await googleFetch(env,docUrl(env,`notification_deliveries/${id}`),{method:'PATCH',body:JSON.stringify(fields({...patch,updatedAt:new Date().toISOString()}))});if(!response.ok)throw new Error(`Falha ao atualizar delivery (${response.status}): ${await response.text()}`)}
async function sendResend(env,{to,subject,html,text:plain,idempotencyKey}){const key=text(env.RESEND_API_KEY),from=text(env.EMAIL_FROM);if(!key||!from)throw new Error('RESEND_API_KEY/EMAIL_FROM não configurados.');const response=await fetch(RESEND_API,{method:'POST',headers:{authorization:`Bearer ${key}`,'content-type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify({from,to:[to],subject,html,text:plain})});if(!response.ok)throw new Error(`Resend falhou (${response.status}): ${await response.text()}`);return response.json()}
async function processEvent(env,event,mode,appCache){
  const identity=eventIdentity(event);if(!identity)return {status:'ignored',reason:'invalid_path'};
  let app=appCache.get(identity.applicationId);if(!app){app=await getDoc(env,`applications/${identity.applicationId}`);appCache.set(identity.applicationId,app)}if(!app)return {status:'ignored',reason:'missing_application'};
  const plan=notificationPlan(event,app);if(!plan)return {status:'ignored',reason:'unsupported_for_state'};
  const id=deliveryId(identity),claim=await createClaim(env,id,event,identity,mode);if(!claim.claimed)return {status:'already_processed'};
  try{
    const recipients=resolveRecipients(mode,plan.audience,app,env);if(!recipients.length)throw new Error(plan.audience==='management'?'MANAGEMENT_EMAILS não configurado.':'E-mail do participante não encontrado.');
    const message=renderMessage(event,app,plan.audience),ids=[];
    for(let i=0;i<recipients.length;i++){const result=await sendResend(env,{to:recipients[i],...message,idempotencyKey:`${id}/${i}`});ids.push(text(result?.id))}
    await finishDelivery(env,id,{status:mode==='test'?'tested':'sent',mode,recipientCount:recipients.length,providerIds:ids,sentAt:new Date().toISOString(),lastError:''});return {status:mode==='test'?'tested':'sent',type:event.type,recipientCount:recipients.length};
  }catch(error){await finishDelivery(env,id,{status:'failed',mode,lastError:String(error?.message||error).slice(0,1500),failedAt:new Date().toISOString()});throw error}
}
export async function runDispatcher(env){
  const mode=normalizeMode(env.EMAIL_MODE);if(mode==='off')return {mode,processed:0,sent:0,tested:0,failed:0,ignored:0,message:'Envio desativado.'};
  if(mode==='test'&&!csv(env.TEST_EMAIL).length)throw new Error('TEST_EMAIL é obrigatório em EMAIL_MODE=test.');
  const events=await recentEvents(env),appCache=new Map(),summary={mode,scanned:events.length,processed:0,sent:0,tested:0,failed:0,ignored:0,alreadyProcessed:0,errors:[]};
  for(const event of events){if(!SUPPORTED_TYPES.has(text(event.type))){summary.ignored++;continue}try{const result=await processEvent(env,event,mode,appCache);summary.processed++;if(result.status==='sent')summary.sent++;else if(result.status==='tested')summary.tested++;else if(result.status==='already_processed')summary.alreadyProcessed++;else summary.ignored++;}catch(error){summary.failed++;summary.errors.push(String(error?.message||error).slice(0,300))}}
  return summary;
}
function json(data,status=200){return new Response(JSON.stringify(data,null,2),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
export default {
  async fetch(request,env){const url=new URL(request.url);if(request.method==='GET'&&url.pathname==='/health')return json({ok:true,mode:normalizeMode(env.EMAIL_MODE)});if(request.method==='POST'&&url.pathname==='/run'){const expected=text(env.ADMIN_TOKEN),got=text(request.headers.get('authorization')).replace(/^Bearer\s+/i,'');if(!expected||got!==expected)return json({ok:false,error:'unauthorized'},401);try{return json({ok:true,...await runDispatcher(env)})}catch(error){return json({ok:false,error:String(error?.message||error)},500)}}return json({ok:false,error:'not_found'},404)},
  async scheduled(_controller,env,ctx){ctx.waitUntil(runDispatcher(env).then(result=>console.log('email-dispatcher',JSON.stringify(result))).catch(error=>console.error('email-dispatcher',error)))}
};
