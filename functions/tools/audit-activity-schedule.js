const admin=require('firebase-admin');

if(!admin.apps.length)admin.initializeApp();
const db=admin.firestore();
const allowedPeriods=new Set(['Sem preferência','Manhã','Tarde','Noite']);

function text(value){return String(value??'').trim()}
function periodFromTime(value){
  const hour=Number(text(value).match(/^(\d{1,2}):/)?.[1]);
  if(!Number.isFinite(hour))return 'Sem preferência';
  return hour<12?'Manhã':hour<18?'Tarde':'Noite';
}
function inspectNestedTimes(value,path='',out=[]){
  if(!value||typeof value!=='object')return out;
  if(!Array.isArray(value)&&Object.prototype.hasOwnProperty.call(value,'time')&&text(value.time))out.push(path?`${path}.time`:'time');
  Object.entries(value).forEach(([key,item])=>{if(key==='time')return;if(item&&typeof item==='object')inspectNestedTimes(item,path?`${path}.${key}`:key,out)});
  return out;
}

async function main(){
  const json=process.argv.includes('--json'),strict=process.argv.includes('--strict');
  const [activitiesSnapshot,sessionsSnapshot]=await Promise.all([
    db.collection('activities').get(),
    db.collection('activity_sessions').get()
  ]);
  const anomalies=[],collisionKeys=new Map();
  function inspect(collection,doc){
    const data=doc.data()||{},time=text(data.time),period=text(data.period),effective=period||periodFromTime(time),nested=inspectNestedTimes(data);
    if(time)anomalies.push({type:'legacy_time',collection,id:doc.id,time,period:period||null,derivedPeriod:periodFromTime(time)});
    if(!period)anomalies.push({type:'missing_period',collection,id:doc.id,effectivePeriod:effective});
    else if(!allowedPeriods.has(period))anomalies.push({type:'invalid_period',collection,id:doc.id,period});
    if(time&&period&&allowedPeriods.has(period)&&period!=='Sem preferência'&&period!==periodFromTime(time))anomalies.push({type:'period_time_mismatch',collection,id:doc.id,time,period,derivedPeriod:periodFromTime(time)});
    nested.filter(path=>path!=='time').forEach(path=>anomalies.push({type:'nested_legacy_time',collection,id:doc.id,path}));
    if(collection==='activity_sessions'){
      const key=[text(data.applicationId),text(data.date),effective,text(data.groupId)||text(data.participation)||''].join('|');
      const rows=collisionKeys.get(key)||[];rows.push(doc.id);collisionKeys.set(key,rows);
    }
  }
  activitiesSnapshot.forEach(doc=>inspect('activities',doc));
  sessionsSnapshot.forEach(doc=>inspect('activity_sessions',doc));
  collisionKeys.forEach((ids,key)=>{if(ids.length>1)anomalies.push({type:'possible_session_collision',key,ids})});
  const summary={
    generatedAt:new Date().toISOString(),
    readOnly:true,
    documents:{activities:activitiesSnapshot.size,activitySessions:sessionsSnapshot.size},
    counts:anomalies.reduce((acc,row)=>(acc[row.type]=(acc[row.type]||0)+1,acc),{}),
    anomalies
  };
  if(json)console.log(JSON.stringify(summary,null,2));
  else{
    console.log('Auditoria de períodos das atividades (somente leitura)');
    console.log(`Atividades: ${summary.documents.activities}`);
    console.log(`Sessões: ${summary.documents.activitySessions}`);
    Object.entries(summary.counts).forEach(([type,count])=>console.log(`${type}: ${count}`));
    if(!anomalies.length)console.log('Nenhuma inconsistência encontrada.');
    else console.log('Use --json para ver os documentos afetados.');
  }
  if(strict&&anomalies.length)process.exitCode=2;
}

main().catch(error=>{console.error(`Erro na auditoria: ${error?.message||error}`);process.exitCode=1});
