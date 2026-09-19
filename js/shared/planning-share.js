/* Compartilhamento canônico de planejamento entre Portal e Gestão. */
(function planningShareModule(){
  if(window.OleiroPlanningShare)return;

  function installStyles(){
    if(document.getElementById('planningShareStyles'))return;
    const style=document.createElement('style');
    style.id='planningShareStyles';
    style.textContent=`
      .planning-share-bar{width:100%;margin:14px 0 2px}
      .planning-share-action{width:100%;min-height:54px;border:0;border-radius:16px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;padding:14px 18px;font:inherit;font-weight:800;font-size:.98rem;cursor:pointer;box-shadow:0 8px 20px rgba(35,77,57,.12);transition:transform .16s ease,opacity .16s ease}
      .planning-share-action i{font-size:1.2rem}
      .planning-share-action:active{transform:scale(.985)}
      .planning-share-action:disabled{opacity:.58;cursor:wait}
      .admin-planning-share-bar{margin-top:16px}
    `;
    document.head.appendChild(style);
  }
  function iso(value){if(!value)return '';if(typeof value==='string')return value.slice(0,10);if(typeof value?.toDate==='function')return value.toDate().toISOString().slice(0,10);const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10)}
  function locale(){return typeof currentLocale==='function'?currentLocale():'pt-BR'}
  function shortDate(value){const date=iso(value);if(!date)return '';try{return new Intl.DateTimeFormat(locale(),{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(date+'T12:00:00'))}catch{return date}}
  function weekday(value){const date=iso(value);if(!date)return '';try{return new Intl.DateTimeFormat(locale(),{weekday:'short'}).format(new Date(date+'T12:00:00')).replace('.','').toUpperCase()}catch{return ''}}
  function normalize(row){const activity=row?.activity||{};return {date:iso(row?.date),name:row?.activityName||activity.name||'Atividade',duration:Number(row?.duration||activity.duration)||0,period:typeof activityPeriodValue==='function'?activityPeriodValue(row||{},activity):(row?.period||activity.period||''),note:row?.notes||activity.notes||'',status:String(row?.status||''),reviewStatus:String(row?.reviewStatus||'')}}
  function buildText({heading,name,statusLabel,unit,start,end,sessions,labels={}}={}){
    const rows=(sessions||[]).map(normalize).filter(row=>row.date&&row.status!=='rejected'&&row.reviewStatus!=='rejected').sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name));
    if(!rows.length)return '';
    const tx={status:labels.status||'Status',unit:labels.unit||'Unidade',period:labels.period||'Período',observation:labels.observation||'Obs.'};
    const lines=[`*${heading||'Planejamento'} — ${name||'Voluntário'}*`];
    if(statusLabel)lines.push(`${tx.status}: ${statusLabel}`);
    if(unit)lines.push(`${tx.unit}: ${unit}`);
    if(start||end)lines.push(`${tx.period}: ${[shortDate(start),shortDate(end)].filter(Boolean).join(' – ')}`);
    lines.push('');
    let current='';
    rows.forEach(row=>{
      if(row.date!==current){current=row.date;lines.push(`*${weekday(row.date)} • ${shortDate(row.date)}*`)}
      const meta=[row.duration?`${row.duration} min`:'',row.period].filter(Boolean).join(' • ');
      lines.push(`• ${row.name}${meta?` (${meta})`:''}`);
      if(row.note)lines.push(`  ${tx.observation}: ${row.note}`);
    });
    return lines.join('\n').trim();
  }
  function reservePopup(){try{const popup=window.open('about:blank','_blank');if(popup)popup.opener=null;return popup}catch{return null}}
  function openWhatsApp(text,{popup=null}={}){if(!text)return false;const url=`https://wa.me/?text=${encodeURIComponent(text)}`;if(popup&&!popup.closed){popup.location.replace(url);return true}const opened=window.open(url,'_blank','noopener,noreferrer');if(!opened)location.href=url;return true}
  function closePopup(popup){try{if(popup&&!popup.closed)popup.close()}catch{}}
  installStyles();
  window.OleiroPlanningShare={buildText,openWhatsApp,reservePopup,closePopup};
})();
