function fmtDate(iso, short=false){
  if(!iso)return '—';
  const d = new Date(iso+'T12:00:00');
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
  return new Intl.DateTimeFormat(locale, short?{day:'2-digit',month:'2-digit'}:{day:'2-digit',month:'short'}).format(d).replace('.','');
}

function dayName(iso){
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
  return new Intl.DateTimeFormat(locale,{weekday:'short'}).format(new Date(iso+'T12:00:00')).replace('.','').toUpperCase();
}

function longDate(iso){
  const d=new Date(iso+'T12:00:00');
  const locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
  const text=new Intl.DateTimeFormat(locale,{weekday:'long',day:'2-digit',month:'long'}).format(d);
  return text.charAt(0).toUpperCase()+text.slice(1)
}

function statusMeta(s){
  return {
    pending:['Planejamento pendente','warning'], analysis:['Em análise','info'], adjustments:['Ajustes solicitados','warning'], approved:['Aprovado','success'], rejected:['Rejeitado','danger'],
    proposed:['Proposta','warning'], confirmed:['Confirmada','success'], change:['Alteração pendente','warning'], change_requested:['Alteração pendente','warning'], conflict:['Conflito','danger']
  }[s] || [s,''];
}

function badge(label,type=''){return `<span class="badge ${type}">${label}</span>`}

function addDays(iso,days){const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}

function dateRange(start,count){return Array.from({length:count},(_,i)=>addDays(start,i))}

function agendaRangeLabel(start){const end=addDays(start,6);return `${fmtDate(start)} – ${fmtDate(end)}`}

function getSessions(date,_volunteerOnly=false){
  const out=[];
  state.activities.forEach(a=>{
    (a.dates||[]).forEach(d=>{
      if(d!==date)return;
      const session=(state.sessions||[]).find(s=>String(s.activityId)===String(a.id)&&String(s.date)===String(d));
      out.push({sessionId:session?.id||null,activity:a,date:d,status:session?.status||state.sessionStatus[`${a.id}-${d}`]||'proposed',group:session?.groupId||state.sessionGroups[`${a.id}-${d}`]||'A definir'});
    });
  });
  return out.sort((a,b)=>String(a.activity.time||'').localeCompare(String(b.activity.time||''))||String(a.activity.name||'').localeCompare(String(b.activity.name||''),'pt-BR'))
}
