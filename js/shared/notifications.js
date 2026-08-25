const OLEIRO_DISMISSED_NOTIFICATIONS_KEY='oleiro-dismissed-notifications-v2';
const OLEIRO_MAX_DISMISSED_NOTIFICATIONS=80;

function dismissedNotificationIds(){
  try{return new Set(JSON.parse(localStorage.getItem(OLEIRO_DISMISSED_NOTIFICATIONS_KEY)||'[]'))}catch{return new Set()}
}
function persistDismissedNotifications(ids){
  const bounded=[...ids].slice(-OLEIRO_MAX_DISMISSED_NOTIFICATIONS);
  localStorage.setItem(OLEIRO_DISMISSED_NOTIFICATIONS_KEY,JSON.stringify(bounded));
}
function pruneDismissedNotifications(){
  const dismissed=dismissedNotificationIds();
  state.notifications=state.notifications.filter(n=>!dismissed.has(n.id));
}
function notificationUnreadCount(){pruneDismissedNotifications();return state.notifications.length}
function dismissNotification(id){
  const dismissed=dismissedNotificationIds();
  dismissed.add(id);
  persistDismissedNotifications(dismissed);
  state.notifications=state.notifications.filter(n=>n.id!==id);
  render();
  openNotifications();
}
function dismissAllNotifications(){
  const dismissed=dismissedNotificationIds();
  state.notifications.forEach(n=>dismissed.add(n.id));
  persistDismissedNotifications(dismissed);
  state.notifications=[];
  render();
  openNotifications();
}
function openNotifications(){
  pruneDismissedNotifications();
  const count=state.notifications.length;
  const items=count?state.notifications.map(n=>`<div class="notification-row is-unread"><div class="notification-icon"><i class="fa-regular fa-bell"></i></div><div class="notification-copy"><strong>${n.title}</strong><p>${n.text}</p></div><div class="notification-action"><button class="notification-read-btn" type="button" onclick="dismissNotification(${n.id})">Marcar como lida</button></div></div>`).join(''):'<div class="empty"><i class="fa-regular fa-bell-slash"></i>Nenhuma notificação pendente.</div>';
  openModal('Atualizações',count?`${count} ${count===1?'pendente':'pendentes'}`:'Tudo em dia',`<div class="notification-list">${items}</div>${count>1?'<button class="btn btn-soft btn-block notifications-read-all" type="button" onclick="dismissAllNotifications()"><i class="fa-solid fa-check-double"></i>Marcar todas como lidas</button>':''}`);
  modalRoot.querySelector('.modal')?.classList.add('notifications-modal');
}

pruneDismissedNotifications();
header=function(_subtitle,showBell=false){
  const unread=notificationUnreadCount();
  return `<header class="app-header simplified-header"><div class="brand-row"><div class="brand" role="button" tabindex="0" aria-label="Ir para a tela inicial" onclick="goHome()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goHome()}"><div class="brand-mark"><i class="fa-solid fa-seedling"></i></div><div class="brand-copy"><strong>Casa do Oleiro</strong></div></div><div class="header-actions">${showBell?`<button class="icon-btn notification-trigger" onclick="openNotifications()" aria-label="Atualizações"><i class="fa-regular fa-bell"></i>${unread?`<span class="notification-unread-dot" aria-label="${unread} pendentes"></span>`:''}</button>`:''}<button class="icon-btn language-button" onclick="openLanguageModal()" aria-label="Idioma"><span class="current-language-code">${typeof currentLanguageCode==='function'?currentLanguageCode():'PT'}</span></button><button class="icon-btn" onclick="toggleTheme()" aria-label="Tema"><i class="fa-solid ${state.theme==='dark'?'fa-sun':'fa-moon'}"></i></button></div></div></header>`;
};
