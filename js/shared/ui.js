function showToast(msg){toastEl.textContent=msg;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),2200)}

function toggleTheme(){state.theme=state.theme==='dark'?'light':'dark';localStorage.setItem('oleiro-theme',state.theme);document.documentElement.classList.toggle('dark',state.theme==='dark');render()}

function goHome(){
  if(state.role==='manager'){state.managerPage='home'}
  else if(state.role==='volunteer'){state.volunteerPage='home'}
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}

function header(subtitle, showBell=false){
  return `<header class="app-header"><div class="brand-row"><div class="brand" role="button" tabindex="0" aria-label="Ir para a tela inicial" onclick="goHome()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goHome()}"><div class="brand-mark"><i class="fa-solid fa-seedling"></i></div><div class="brand-copy"><strong>Casa do Oleiro</strong><span>${subtitle}</span></div></div><div style="display:flex;gap:7px">${showBell?`<button class="icon-btn" onclick="openNotifications()"><i class="fa-regular fa-bell"></i></button>`:''}<button class="icon-btn" onclick="toggleTheme()"><i class="fa-solid ${state.theme==='dark'?'fa-sun':'fa-moon'}"></i></button></div></div></header>`;
}

function managerNav(){
  const items=[['home','fa-house','Início'],['volunteer','fa-users','Voluntariado'],['agenda','fa-calendar-days','Agenda'],['groups','fa-people-group','Grupos'],['menu','fa-bars','Menu']];
  return `<nav class="bottom-nav">${items.map(([id,ic,tx])=>`<button class="nav-btn ${state.managerPage===id?'active':''}" onclick="state.managerPage='${id}';render()"><i class="fa-solid ${ic}"></i><span>${tx}</span></button>`).join('')}</nav>`;
}

function volunteerNav(){
  const approved=state.volunteerMode==='approved';
  const items=approved?[["home","fa-house","Início"],["plan","fa-calendar-plus","Planejamento"],["agenda","fa-calendar-check","Agenda"],["stay","fa-location-dot","Estadia"],["menu","fa-bars","Menu"]]:[["home","fa-house","Início"],["plan","fa-calendar-plus","Planejamento"],["stay","fa-location-dot","Estadia"],["info","fa-circle-info","Informações"],["menu","fa-bars","Menu"]];
  return `<nav class="bottom-nav">${items.map(([id,ic,tx])=>`<button class="nav-btn ${state.volunteerPage===id?'active':''}" onclick="state.volunteerPage='${id}';render()"><i class="fa-solid ${ic}"></i><span>${tx}</span></button>`).join('')}</nav>`;
}

function menuLink(icon,title,desc,action){return `<button class="menu-link" onclick="${action}"><i class="fa-solid ${icon}"></i><span>${title}<small>${desc}</small></span><i class="fa-solid fa-chevron-right" style="color:var(--muted)"></i></button>`}

function openModal(title,subtitle,body,footer=''){
  modalRoot.innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><div><h2>${title}</h2>${subtitle?`<p>${subtitle}</p>`:''}</div><button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button></div>${body}${footer}</div></div>`;
}

function closeModal(){modalRoot.innerHTML=''}

function infoAccordion(){return `<div class="info-accordion"><details><summary>Como chegar <i class="fa-solid fa-chevron-down"></i></summary><p>A unidade fica em Rodeio/SC. Antes da chegada, confirme com a equipe o melhor transporte e o horário previsto. Dependendo do horário pode haver possibilidade de apoio na chegada.</p></details><details><summary>Acomodação <i class="fa-solid fa-chevron-down"></i></summary><p>Homens utilizam quartos e banheiros compartilhados. Mulheres ficam em quarto e banheiro separados. Wi-Fi, cozinha e lavanderia estão disponíveis.</p></details><details><summary>Refeições <i class="fa-solid fa-chevron-down"></i></summary><p>Todas as refeições são oferecidas na unidade de Rodeio. Avise previamente caso possua alguma restrição alimentar importante.</p></details><details><summary>Rotina da comunidade <i class="fa-solid fa-chevron-down"></i></summary><p>A rotina começa às 06:00 e possui momentos de atividades práticas, reuniões, refeições e atividades noturnas. Ela é flexível devido aos atendimentos terapêuticos e profissionais.</p></details><details><summary>Princípios e religião <i class="fa-solid fa-chevron-down"></i></summary><p>A Casa possui princípios cristãos e momentos de oração. O voluntário não precisa ser cristão nem participar das atividades religiosas.</p></details><details><summary>Convivência e segurança <i class="fa-solid fa-chevron-down"></i></summary><p>Álcool, drogas e cigarros são proibidos. Fotos e vídeos dos acolhidos exigem autorização prévia. Voluntários não exercem funções clínicas, medicamentosas ou terapêuticas.</p></details></div>`}

function logout(){localStorage.removeItem('oleiro-role');location.href=document.body.dataset.root||'../index.html'}


function openNotifications(){openModal('Atualizações','Mudanças e pendências recentes',`<div class="list">${state.notifications.map(n=>`<div class="list-item"><div class="metric-icon"><i class="fa-regular fa-bell"></i></div><div class="item-main"><h3>${n.title}</h3><p>${n.text}</p></div></div>`).join('')}</div>`)}
