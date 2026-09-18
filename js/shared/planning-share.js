/* Compartilhamento canônico de planejamento entre Portal e Gestão. */
(function planningShareModule(){
  if(window.OleiroPlanningShare)return;

  function installStyles(){
    if(document.getElementById('planningShareStyles'))return;
    const style=document.createElement('style');
    style.id='planningShareStyles';
    style.textContent=`
      .portal-plan-toolbar{display:flex;justify-content:flex-end;min-height:40px;margin:0 0 8px}
      .planning-share-section-head{align-items:flex-start}
      .planning-overflow-button{width:40px;height:40px;flex:0 0 40px;border:1px solid var(--border);border-radius:13px;background:var(--surface);color:var(--muted);display:grid;place-items:center;font-size:.88rem;cursor:pointer;box-shadow:0 2px 10px rgba(30,48,38,.035)}
      .planning-overflow-button:active{transform:scale(.97)}
      .plan-title-actions{display:flex;align-items:center;gap:9px}
      .planning-share-menu .menu-link{cursor:pointer}
      .planning-share-menu .menu-link>span>strong{display:block;font-size:.73rem}
      .planning-profile-actions{grid-column:2;grid-row:1;display:flex;align-items:flex-start;gap:8px;margin-left:auto}
      .planning-profile-actions .planning-close-button{grid-column:auto;grid-row:auto;margin:0}
      .planning-profile-actions .planning-overflow-button{width:48px;height:48px;flex:0 0 48px;border-radius:16px;color:var(--text);font-size:1rem;box-shadow:none}
      @media(max-width:640px){.planning-profile-actions{gap:6px}.planning-profile-actions .planning-overflow-button,.planning-profile-actions .planning-close-button{width:44px;height:44px;flex-basis:44px;border-radius:14px}}
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
