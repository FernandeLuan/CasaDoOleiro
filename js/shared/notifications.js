const OLEIRO_READ_NOTIFICATIONS_KEY='oleiro-read-notifications-v1';
function readNotificationIds(){
  try{return new Set(JSON.parse(localStorage.getItem(OLEIRO_READ_NOTIFICATIONS_KEY)||'[]'))}catch{return new Set()}
}
function persistReadNotifications(ids){localStorage.setItem(OLEIRO_READ_NOTIFICATIONS_KEY,JSON.stringify([...ids]))}
function hydrateNotificationReads(){
  const read=readNotificationIds();
  state.notifications.forEach(n=>{n.unread=!read.has(n.id)});
}
function notificationUnreadCount(){return state.notifications.filter(n=>n.unread).length}
function markNotificationRead(id){
  const read=readNotificationIds();read.add(id);persistReadNotifications(read);hydrateNotificationReads();render();openNotifications();
}
function markAllNotificationsRead(){
  const read=readNotificationIds();state.notifications.forEach(n=>read.add(n.id));persistReadNotifications(read);hydrateNotificationReads();render();openNotifications();
}
function openNotifications(){
  hydrateNotificationReads();
  const unread=notificationUnreadCount();
  const items=state.notifications.map(n=>`<div class="notification-row ${n.unread?'is-unread':'is-read'}"><div class="notification-icon"><i class="fa-regular fa-bell"></i></div><div class="notification-copy"><strong>${n.title}</strong><p>${n.text}</p></div><div class="notification-action">${n.unread?`<button class="notification-read-btn" type="button" onclick="markNotificationRead(${n.id})">Marcar como lida</button>`:'<span class="notification-read-state"><i class="fa-solid fa-check"></i>Lida</span>'}</div></div>`).join('');
  openModal('Atualizações',unread?`${unread} ${unread===1?'não lida':'não lidas'}`:'Tudo em dia',`<div class="notification-list">${items||'<div class="empty">Nenhuma atualização.</div>'}</div>${unread?'<button class="btn btn-soft btn-block notifications-read-all" type="button" onclick="markAllNotificationsRead()"><i class="fa-solid fa-check-double"></i>Marcar todas como lidas</button>':''}`);
  modalRoot.querySelector('.modal')?.classList.add('notifications-modal');
}

hydrateNotificationReads();
header=function(_subtitle,showBell=false){
  const unread=notificationUnreadCount();
  return `<header class="app-header simplified-header"><div class="brand-row"><div class="brand" role="button" tabindex="0" aria-label="Ir para a tela inicial" onclick="goHome()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goHome()}"><div class="brand-mark"><i class="fa-solid fa-seedling"></i></div><div class="brand-copy"><strong>Casa do Oleiro</strong></div></div><div class="header-actions">${showBell?`<button class="icon-btn notification-trigger" onclick="openNotifications()" aria-label="Atualizações"><i class="fa-regular fa-bell"></i>${unread?`<span class="notification-unread-dot" aria-label="${unread} não lidas"></span>`:''}</button>`:''}<button class="icon-btn language-button" onclick="openLanguageModal()" aria-label="Idioma"><span class="current-language-code">${typeof currentLanguageCode==='function'?currentLanguageCode():'PT'}</span></button><button class="icon-btn" onclick="toggleTheme()" aria-label="Tema"><i class="fa-solid ${state.theme==='dark'?'fa-sun':'fa-moon'}"></i></button></div></div></header>`;
};
