function escapeHtml(value){return String(value??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt',"'":'&#39;','"':'&quot;'}[c]))}
function fmtDate(iso,short=false){if(!iso)return '—';const d=new Date(iso+'T12:00:00');const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';return new Intl.DateTimeFormat(locale,short?{day:'2-digit',month:'2-digit'}:{day:'2-digit',month:'short'}).format(d).replace('.','')}
function dayName(iso){const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';return new Intl.DateTimeFormat(locale,{weekday:'short'}).format(new Date(iso+'T12:00:00')).replace('.','').toUpperCase()}
function longDate(iso){const d=new Date(iso+'T12:00:00');const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';const text=new Intl.DateTimeFormat(locale,{weekday:'long',day:'2-digit',month:'long'}).format(d);return text.charAt(0).toUpperCase()+text.slice(1)}
function statusMeta(s){return {pending:['Planejamento pendente','warning'],analysis:['Em análise','info'],adjustments:['Ajustes solicitados','warning'],meeting:['Planejamento aprovado','info'],approved:['Aprovado','success'],rejected:['Rejeitado','danger'],proposed:['Proposta','warning'],manager_confirmed:['Confirmada','success'],plan_approved:['Planejamento aprovado','info'],confirmed:['Confirmada','success'],change:['Mudança solicitada','warning'],change_requested:['Mudança solicitada','warning']}[s]||[s,'']}
function badge(label,type=''){return `<span class="badge ${type}">${label}</span>`}
function addDays(iso,days){const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function dateRange(start,count){return Array.from({length:count},(_,i)=>addDays(start,i))}
function agendaRangeLabel(start){const end=addDays(start,6);return `${fmtDate(start)} – ${fmtDate(end)}`}
function activityPeriodMeta(value,legacyTime=''){
  const raw=String(value||'').trim(),key=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(['manha','morning','manana'].includes(key))return {value:'Manhã',rank:0};
  if(['tarde','afternoon'].includes(key))return {value:'Tarde',rank:1};
  if(['noite','night','evening','noche'].includes(key))return {value:'Noite',rank:2};
  if(['sem preferencia','no preference','sin preferencia'].includes(key))return {value:'Sem preferência',rank:3};
  const hour=Number(String(legacyTime||'').match(/^(\d{1,2}):/)?.[1]);
  if(Number.isFinite(hour))return hour<12?{value:'Manhã',rank:0}:hour<18?{value:'Tarde',rank:1}:{value:'Noite',rank:2};
  return {value:'Sem preferência',rank:3};
}
function activityPeriodValue(row={},activity={}){return activityPeriodMeta(row?.period||activity?.period,row?.time||activity?.time).value}
function activityScheduleCompare(a={},b={}){
  const activityA=a.activity||a,activityB=b.activity||b,dateCompare=String(a.date||'').localeCompare(String(b.date||''));if(dateCompare)return dateCompare;
  const periodCompare=activityPeriodMeta(a.period||activityA.period,a.time||activityA.time).rank-activityPeriodMeta(b.period||activityB.period,b.time||activityB.time).rank;if(periodCompare)return periodCompare;
  const nameA=a.activityName||activityA.name||'',nameB=b.activityName||activityB.name||'',nameCompare=String(nameA).localeCompare(String(nameB),typeof currentLocale==='function'?currentLocale():'pt-BR',{sensitivity:'base'});if(nameCompare)return nameCompare;
  return String(a.groupId||a.group||a.id||'').localeCompare(String(b.groupId||b.group||b.id||''));
}
function getSessions(date,_volunteerOnly=false){
  const rows=(state.sessions||[]).filter(s=>String(s.date)===String(date)).map(session=>{const stored=session.activity||(state.activities||[]).find(a=>String(a.id)===String(session.activityId))||{},period=activityPeriodValue(session,stored),activity={...stored,id:session.activityId||stored.id,name:session.activityName||stored.name||'Atividade',description:session.activityDescription||stored.description||'',duration:Number(session.duration||stored.duration||60),participation:session.participation||stored.participation||'Livre',materials:session.materials||stored.materials||'',notes:session.notes||stored.notes||'',period,time:session.time||stored.time||'',owner:session.ownerName||stored.ownerName||stored.owner||'Voluntário'};return {sessionId:session.id,activity,date:session.date,status:session.status||'proposed',group:session.groupId||'A definir',raw:session}});
  if(rows.length)return rows.sort(activityScheduleCompare);
  const fallback=[];(state.activities||[]).forEach(a=>(a.dates||[]).forEach(d=>{if(d===date)fallback.push({sessionId:null,activity:{...a,period:activityPeriodValue(a)},date:d,status:state.sessionStatus?.[`${a.id}-${d}`]||'proposed',group:state.sessionGroups?.[`${a.id}-${d}`]||'A definir'})}));return fallback.sort(activityScheduleCompare);
}
