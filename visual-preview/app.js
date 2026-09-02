(()=>{
  const data=window.OLEIRO_DEMO_DATA;
  const app=document.getElementById('app');
  const state={section:'candidates',query:'',status:'all',candidate:null,tab:'planning',openDay:'11/09',mode:'admin'};

  const icons={candidates:'◫',agenda:'▦',dashboard:'⌂',portal:'◎'};
  const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function shell(content){
    return `<div class="shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">O</div><div><strong>Casa do Oleiro</strong><small>Voluntariado</small></div></div>
        <nav class="nav">
          ${navButton('candidates','Voluntariado','◫')}
          ${navButton('agenda','Agenda','▦')}
          ${navButton('portal','Visão do voluntário','◎')}
        </nav>
        <div class="sidebar-spacer"></div>
        <div class="sidebar-card"><strong>Homologação visual R56</strong><p>Explore livremente. Todos os nomes, contatos e atividades desta versão são fictícios.</p></div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="breadcrumb"><span>Casa do Oleiro</span><b>›</b><strong>${state.section==='agenda'?'Agenda':state.section==='portal'?'Portal do voluntário':'Voluntariado'}</strong></div>
          <div class="top-actions"><button class="icon-btn" data-theme title="Tema">☼</button><button class="avatar-btn"><span class="mini-avatar">LF</span><span>Luan</span></button></div>
        </header>
        <div class="content">${content}</div>
      </main>
      <nav class="mobile-nav">
        ${mobileNav('candidates','Voluntariado','◫')}
        ${mobileNav('agenda','Agenda','▦')}
        ${mobileNav('portal','Portal','◎')}
        <button><span>☰</span>Mais</button>
      </nav>
    </div>`;
  }

  function navButton(key,label,icon){return `<button class="nav-button ${state.section===key?'active':''}" data-section="${key}"><span class="nav-icon">${icon}</span>${label}</button>`}
  function mobileNav(key,label,icon){return `<button class="${state.section===key?'active':''}" data-section="${key}"><span>${icon}</span>${label}</button>`}

  function render(){
    let content='';
    if(state.section==='agenda') content=agendaView();
    else if(state.section==='portal') content=portalView();
    else content=candidatesView();
    app.innerHTML=shell(content)+(state.candidate?workspaceView(state.candidate):'');
    bind();
  }

  function candidatesView(){
    const filtered=data.candidates.filter(c=>{
      const text=(c.name+' '+c.country+' '+c.unit).toLowerCase();
      return text.includes(state.query.toLowerCase())&&(state.status==='all'||c.status===state.status);
    });
    return `<section class="page-head"><div><p class="eyebrow">Gestão de voluntariado</p><h1>Candidatos e jornadas</h1><p>Acompanhe cada candidato do cadastro à conclusão da estadia, com planejamento, reunião e histórico no mesmo lugar.</p></div><button class="btn primary" data-new-candidate>＋ Novo candidato</button></section>
      <section class="stats-grid">
        ${stat('Candidatos ativos',data.stats.candidates,'em diferentes etapas')}
        ${stat('Reuniões',data.stats.meetings,'agendadas nesta semana')}
        ${stat('Pendências',data.stats.pending,'exigem ação da gestão')}
        ${stat('Aprovados',data.stats.approved,'com jornada confirmada')}
      </section>
      <div class="toolbar"><input class="search" data-search placeholder="Buscar por nome, país ou unidade" value="${esc(state.query)}"><select class="select" data-status-filter><option value="all">Todos os status</option>${['meeting','planning','review','adjustment','approved'].map(s=>`<option value="${s}" ${state.status===s?'selected':''}>${statusName(s)}</option>`).join('')}</select><button class="btn soft" data-clear>Limpar</button></div>
      <section class="panel"><div class="panel-head"><strong>Candidatos</strong><small>${filtered.length} registros de demonstração</small></div><div class="candidate-list">${filtered.map(candidateRow).join('')||'<div class="empty-day">Nenhum candidato encontrado com estes filtros.</div>'}</div></section>`;
  }

  function stat(label,value,detail){return `<article class="stat"><small>${label}</small><strong>${value}</strong><span>${detail}</span></article>`}
  function statusName(s){return ({meeting:'Reunião agendada',planning:'Planejamento pendente',review:'Em análise',adjustment:'Ajuste solicitado',approved:'Aprovados'})[s]||s}
  function candidateRow(c){return `<button class="candidate-row" data-candidate="${c.id}" style="border-left:0;border-right:0;border-top:0;background:transparent;width:100%;text-align:left">
    <div class="person-cell"><div class="avatar">${esc(c.initials)}</div><div><strong>${esc(c.name)}</strong><small>${esc(c.country)} · ${esc(c.language)}</small></div></div>
    <div class="meta-cell"><strong>${esc(c.unit)}</strong><small>Unidade</small></div>
    <div class="meta-cell"><strong>${esc(c.stay)}</strong><small>Estadia</small></div>
    <span class="status ${c.status}">${esc(c.statusLabel)}</span>
  </button>`}

  function agendaView(){return `<section class="page-head"><div><p class="eyebrow">Operação</p><h1>Agenda</h1><p>Reuniões, atividades e compromissos das unidades em uma leitura simples e operacional.</p></div><button class="btn primary" data-demo-toast="Novo compromisso seria aberto aqui.">＋ Novo compromisso</button></section>
    <section class="agenda-grid">${data.agenda.map(d=>`<article class="agenda-day"><div class="agenda-day-head"><strong>${d.date}</strong><small>${d.weekday}</small></div>${d.items.map(i=>`<div class="agenda-item"><strong>${esc(i[0])} · ${esc(i[1])}</strong><span>${esc(i[2])}</span></div>`).join('')}</article>`).join('')}</section>`}

  function portalView(){const c=data.candidates[0];return `<section class="portal-hero"><article class="welcome"><p class="eyebrow">Sua jornada na Casa do Oleiro</p><h1>Olá, Josias.</h1><p>Seu planejamento foi aprovado e a reunião já está marcada. Você ainda pode propor novas atividades para completar sua programação antes da chegada.</p></article><article class="journey-card"><h3>Jornada do voluntário</h3>${journey('Cadastro','Concluído',true)}${journey('Planejamento','Aprovado',true)}${journey('Reunião','03/09 · 19h',true,true)}${journey('Decisão final','Aguardando',false)}</article></section>
    <section class="portal-grid"><article class="portal-card"><h3>Próximas atividades</h3><p>Seu cronograma aprovado, organizado por dia e período.</p>${c.planning.slice(0,3).flatMap(d=>d.activities.slice(0,1).map(a=>`<div class="compact-activity"><strong>${esc(d.date)} · ${esc(a.title)}</strong><small>${esc(a.duration)} · ${esc(a.period)} · ${esc(a.group)}</small></div>`)).join('')}</article><article class="portal-card"><h3>Antes da reunião</h3><p>Se quiser ampliar sua contribuição, você pode replicar uma atividade aprovada ou adicionar uma nova proposta. A gestão revisará antes de incluí-la no cronograma.</p><button class="btn primary" data-candidate="josias">Abrir planejamento</button></article></section>`}
  function journey(title,detail,done,current=false){return `<div class="journey-step ${current?'current':''}"><span class="step-dot">${done?'✓':'·'}</span><div><strong>${title}</strong><small>${detail}</small></div></div>`}

  function workspaceView(c){return `<div class="workspace-backdrop" data-close-workspace><section class="workspace" onclick="event.stopPropagation()"><header class="workspace-head"><div><p class="eyebrow">Perfil do candidato</p><h2>${esc(c.name)}</h2><div class="workspace-meta"><span>${esc(c.country)}</span><span>•</span><span>${esc(c.unit)}</span><span>•</span><span>${esc(c.stay)}</span><span class="status ${c.status}">${esc(c.statusLabel)}</span></div></div><button class="close-btn" data-close-workspace>×</button></header><nav class="tabs">${tab('planning','Planejamento')}${tab('account','Conta')}${tab('history','Histórico')}</nav><div class="workspace-body">${workspaceTab(c)}</div></section></div>`}
  function tab(key,label){return `<button class="tab ${state.tab===key?'active':''}" data-tab="${key}">${label}</button>`}
  function workspaceTab(c){if(state.tab==='account') return accountTab(c);if(state.tab==='history') return historyTab(c);return planningTab(c)}

  function planningTab(c){if(!c.planning.length)return `<div class="empty-day">Este candidato de demonstração ainda não possui atividades detalhadas.<br><button class="btn primary" data-add-activity="new">＋ Adicionar atividade</button></div>`;return `<div class="planning-grid">${c.planning.map(d=>dayCard(c,d)).join('')}</div>`}
  function dayCard(c,d){const open=state.openDay===d.date;return `<article class="day-card ${open?'open':''}"><button class="day-summary" data-day="${d.date}"><div class="date-block"><div><strong>${esc(d.date.split('/')[0])}</strong><small>${esc(d.weekday.slice(0,3))}</small></div></div><div><h3>${esc(d.weekday)} · ${esc(d.date)}</h3><p>${d.activities.length?`${d.activities.length} ${d.activities.length===1?'atividade':'atividades'} confirmadas`:'Nenhuma atividade neste dia'}</p></div><div class="day-total"><strong>${esc(d.total)}</strong><small>Total</small></div></button><div class="day-content">${d.activities.length?d.activities.map(a=>activityCard(d,a)).join(''):`<div class="empty-day">Dia livre no cronograma.<br><button class="btn primary small" data-add-activity="${d.date}">＋ Adicionar atividade</button></div>`}</div></article>`}
  function activityCard(d,a){return `<article class="activity"><div class="activity-top"><div><h4>${esc(a.title)}</h4><div class="activity-meta"><span class="meta-pill">${esc(a.duration)}</span><span class="meta-pill">${esc(a.period)}</span><span class="meta-pill">${esc(a.group)}</span></div></div><span class="status approved">Planejamento aprovado</span></div><p>${esc(a.description)}</p><div class="activity-actions"><button class="btn soft small" data-replicate="${esc(a.title)}" data-date="${d.date}">⧉ Replicar atividade</button><button class="btn small" data-add-activity="${d.date}">＋ Adicionar atividade</button></div></article>`}
  function accountTab(c){return `<div class="account-grid"><article class="info-card"><h3>Contato</h3>${kv('E-mail',c.contact)}${kv('WhatsApp',c.phone)}${kv('Idioma',c.language)}</article><article class="info-card"><h3>Estadia</h3>${kv('Unidade',c.unit)}${kv('Período',c.stay)}${kv('País',c.country)}</article><article class="info-card full"><h3>Contexto informado</h3>${kv('Atividade atual',c.work)}${kv('Perfil','Voluntário de demonstração para homologação visual')}</article></div>`}
  function kv(k,v){return `<div class="kv"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`}
  function historyTab(c){return c.history.length?`<div class="history">${c.history.map(h=>`<div class="history-row"><time>${esc(h[0])}</time><p>${esc(h[1])}</p></div>`).join('')}</div>`:`<div class="empty-day">Nenhum histórico detalhado foi criado para este perfil fictício.</div>`}

  function bind(){
    document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{state.section=b.dataset.section;state.candidate=null;render()});
    const search=document.querySelector('[data-search]');if(search)search.oninput=e=>{state.query=e.target.value;render()};
    const filter=document.querySelector('[data-status-filter]');if(filter)filter.onchange=e=>{state.status=e.target.value;render()};
    const clear=document.querySelector('[data-clear]');if(clear)clear.onclick=()=>{state.query='';state.status='all';render()};
    document.querySelectorAll('[data-candidate]').forEach(b=>b.onclick=()=>{state.candidate=data.candidates.find(c=>c.id===b.dataset.candidate);state.tab='planning';state.openDay='11/09';render()});
    document.querySelectorAll('[data-close-workspace]').forEach(b=>b.onclick=()=>{state.candidate=null;render()});
    document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;render()});
    document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{state.openDay=state.openDay===b.dataset.day?'':b.dataset.day;render()});
    document.querySelectorAll('[data-new-candidate]').forEach(b=>b.onclick=()=>openCandidateModal());
    document.querySelectorAll('[data-add-activity]').forEach(b=>b.onclick=()=>openActivityModal({date:b.dataset.addActivity}));
    document.querySelectorAll('[data-replicate]').forEach(b=>b.onclick=()=>openActivityModal({date:b.dataset.date,title:b.dataset.replicate,replicate:true}));
    document.querySelectorAll('[data-demo-toast]').forEach(b=>b.onclick=()=>toast(b.dataset.demoToast));
  }

  function openCandidateModal(){document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" data-modal-backdrop><section class="modal" onclick="event.stopPropagation()"><header class="modal-head"><div><p class="eyebrow">Cadastro</p><h2>Novo candidato</h2><p>Layout desktop amplo; no celular o formulário volta para uma coluna.</p></div><button class="close-btn" data-close-modal>×</button></header><div class="form"><div class="segmented"><button class="segment active" data-kind="single">Individual</button><button class="segment" data-kind="couple">Dupla</button></div><div class="form-section"><h3>Participante 1</h3>${personFields('1')}</div><div class="form-section" data-participant-two hidden><h3>Participante 2</h3>${personFields('2')}</div><div class="form-section"><h3>Estadia</h3><div class="form-grid three"><div class="field"><label>Unidade</label><select class="input"><option>Rodeio</option><option>Indaial</option></select></div><div class="field"><label>Chegada</label><input class="input" type="date"></div><div class="field"><label>Saída</label><input class="input" type="date"></div><div class="field full"><label>Observação interna</label><textarea class="textarea" placeholder="Informação útil para a equipe"></textarea></div></div></div></div><footer class="modal-footer"><button class="btn" data-close-modal>Cancelar</button><button class="btn primary" data-save-demo>Criar candidato</button></footer></section></div>`);bindModal();}
  function personFields(n){return `<div class="form-grid"><div class="field"><label>Nome</label><input class="input" placeholder="Nome completo"></div><div class="field"><label>E-mail</label><input class="input" placeholder="nome@email.com"></div><div class="field"><label>WhatsApp</label><input class="input" placeholder="+55 47 99999-9999"></div><div class="field"><label>País</label><input class="input" placeholder="Brasil"></div><div class="field"><label>Idioma</label><select class="input"><option>Português</option><option>Español</option><option>English</option></select></div></div>`}

  function openActivityModal(opts={}){document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" data-modal-backdrop><section class="modal" onclick="event.stopPropagation()"><header class="modal-head"><div><p class="eyebrow">${opts.replicate?'Replicar atividade':'Planejamento'}</p><h2>${opts.replicate?'Replicar atividade':'Adicionar atividade'}</h2><p>${opts.replicate?'Os dados da atividade original já vêm preenchidos; a cópia é independente.':'Crie uma nova atividade sem reabrir o planejamento aprovado.'}</p></div><button class="close-btn" data-close-modal>×</button></header><div class="form"><div class="form-section"><div class="form-grid"><div class="field"><label>Dia</label><select class="input"><option>${esc(opts.date||'11/09')}</option><option>14/09</option><option>15/09</option><option>16/09</option><option>17/09</option><option>18/09</option></select></div><div class="field"><label>Atividade</label><input class="input" value="${esc(opts.title||'')}" placeholder="Nome da atividade"></div><div class="field"><label>Duração</label><input class="input" value="60" placeholder="minutos"></div><div class="field"><label>Período</label><select class="input"><option>Sem preferência</option><option selected>Manhã</option><option>Tarde</option><option>Noite</option></select></div><div class="field"><label>Turma / grupo</label><select class="input"><option>Grupo Livre</option><option>Turma A</option><option>Turma B</option></select></div><div class="field full"><label>Descrição</label><textarea class="textarea">${opts.replicate?'Descrição copiada da atividade original para você revisar antes de salvar.':''}</textarea></div></div></div></div><footer class="modal-footer"><button class="btn" data-close-modal>Cancelar</button><button class="btn primary" data-save-demo>${opts.replicate?'Criar réplica':'Adicionar atividade'}</button></footer></section></div>`);bindModal();}
  function bindModal(){document.querySelectorAll('[data-close-modal],[data-modal-backdrop]').forEach(el=>el.onclick=e=>{if(e.target===el||el.hasAttribute('data-close-modal'))el.closest('.modal-backdrop').remove()});document.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-kind]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const p2=document.querySelector('[data-participant-two]');p2.hidden=b.dataset.kind!=='couple'});document.querySelectorAll('[data-save-demo]').forEach(b=>b.onclick=()=>{b.closest('.modal-backdrop').remove();toast('Demonstração: ação simulada, nenhum dado foi gravado.')})}
  function toast(message){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),3000)}

  render();
})();
