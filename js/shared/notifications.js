const OLEIRO_DISMISSED_NOTIFICATIONS_KEY='oleiro-dismissed-notifications-v2';
const OLEIRO_MAX_DISMISSED_NOTIFICATIONS=80;
const OLEIRO_NOTIFICATION_VIEW_LIMIT=5;

function dismissedNotificationIds(){
  try{return new Set(JSON.parse(localStorage.getItem(OLEIRO_DISMISSED_NOTIFICATIONS_KEY)||'[]').map(String))}catch{return new Set()}
}
function persistDismissedNotifications(ids){
  const bounded=[...ids].slice(-OLEIRO_MAX_DISMISSED_NOTIFICATIONS);
  localStorage.setItem(OLEIRO_DISMISSED_NOTIFICATIONS_KEY,JSON.stringify(bounded));
}
function pruneDismissedNotifications(){
  const dismissed=dismissedNotificationIds();
  state.notifications=state.notifications.filter(n=>!dismissed.has(String(n.id)));
}
function notificationUnreadCount(){pruneDismissedNotifications();return Math.min(state.notifications.length,OLEIRO_NOTIFICATION_VIEW_LIMIT)}
function visibleNotifications(){pruneDismissedNotifications();return state.notifications.slice(0,OLEIRO_NOTIFICATION_VIEW_LIMIT)}
function dismissNotification(id){
  const dismissed=dismissedNotificationIds();
  dismissed.add(String(id));
  persistDismissedNotifications(dismissed);
  state.notifications=state.notifications.filter(n=>String(n.id)!==String(id));
  if(state.notifications.length)openNotifications();
  else closeModal();
  render();
}
function dismissVisibleNotifications(){
  const visible=visibleNotifications();
  const dismissed=dismissedNotificationIds();
  visible.forEach(n=>dismissed.add(String(n.id)));
  persistDismissedNotifications(dismissed);
  const ids=new Set(visible.map(n=>String(n.id)));
  state.notifications=state.notifications.filter(n=>!ids.has(String(n.id)));
  if(state.notifications.length)openNotifications();
  else closeModal();
  render();
}
function openNotifications(){
  const visible=visibleNotifications();
  const count=visible.length;
  const items=count?visible.map(n=>`<div class="notification-row is-unread"><div class="notification-icon"><i class="fa-regular fa-bell"></i></div><div class="notification-copy"><strong>${n.title}</strong><p>${n.text}</p></div><div class="notification-action"><button class="notification-read-btn" type="button" onclick="dismissNotification(${JSON.stringify(n.id)})">Marcar como lida</button></div></div>`).join(''):'<div class="empty"><i class="fa-regular fa-bell-slash"></i>Nenhuma notificação pendente.</div>';
  const subtitle=count?`${count} ${count===1?'pendente':'pendentes'}${state.notifications.length>count?' • mostrando as 5 mais recentes':''}`:'Tudo em dia';
  openModal('Atualizações',subtitle,`<div class="notification-list">${items}</div>${count>1?'<button class="btn btn-soft btn-block notifications-read-all" type="button" onclick="dismissVisibleNotifications()"><i class="fa-solid fa-check-double"></i>Marcar estas como lidas</button>':''}`);
  modalRoot.querySelector('.modal')?.classList.add('notifications-modal');
}

pruneDismissedNotifications();
header=function(_subtitle,showBell=false){
  const unread=notificationUnreadCount();
  return `<header class="app-header simplified-header"><div class="brand-row"><div class="brand" role="button" tabindex="0" aria-label="Ir para a tela inicial" onclick="goHome()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goHome()}"><div class="brand-mark"><i class="fa-solid fa-seedling"></i></div><div class="brand-copy"><strong>Casa do Oleiro</strong></div></div><div class="header-actions">${showBell?`<button class="icon-btn notification-trigger" onclick="openNotifications()" aria-label="Atualizações"><i class="fa-regular fa-bell"></i>${unread?`<span class="notification-unread-dot" aria-label="${unread} pendentes"></span>`:''}</button>`:''}<button class="icon-btn language-button" onclick="openLanguageModal()" aria-label="Idioma"><span class="current-language-code">${typeof currentLanguageCode==='function'?currentLanguageCode():'PT'}</span></button><button class="icon-btn" onclick="toggleTheme()" aria-label="Tema"><i class="fa-solid ${state.theme==='dark'?'fa-sun':'fa-moon'}"></i></button></div></div></header>`;
};
