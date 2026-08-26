const OLEIRO_NOTIFICATION_VIEW_LIMIT=5;

function notificationUnreadCount(){return Math.min((state.notifications||[]).length,OLEIRO_NOTIFICATION_VIEW_LIMIT)}
function visibleNotifications(){return (state.notifications||[]).slice(0,OLEIRO_NOTIFICATION_VIEW_LIMIT)}
async function dismissNotification(id){
  try{
    if(state.role==='manager'&&window.OleiroServices?.attention?.markAdminAttentionRead)await window.OleiroServices.attention.markAdminAttentionRead(id);
    state.notifications=(state.notifications||[]).filter(n=>String(n.id)!==String(id));
    if(state.notifications.length)openNotifications();else closeModal();
    render();
  }catch(error){console.error(error);showToast('Não foi possível atualizar a notificação.')}
}
async function dismissVisibleNotifications(){
  const visible=visibleNotifications();
  try{
    if(state.role==='manager'&&window.OleiroServices?.attention?.markAdminAttentionRead){for(const n of visible)await window.OleiroServices.attention.markAdminAttentionRead(n.id)}
    const ids=new Set(visible.map(n=>String(n.id)));
    state.notifications=(state.notifications||[]).filter(n=>!ids.has(String(n.id)));
    if(state.notifications.length)openNotifications();else closeModal();
    render();
  }catch(error){console.error(error);showToast('Não foi possível atualizar as notificações.')}
}
function openNotifications(){
  const visible=visibleNotifications();
  const count=visible.length;
  const items=count?visible.map(n=>`<div class="notification-row is-unread"><div class="notification-icon"><i class="fa-regular fa-bell"></i></div><div class="notification-copy"><strong>${n.title}</strong><p>${n.text}</p></div><div class="notification-action"><button class="notification-read-btn" type="button" onclick="dismissNotification(${JSON.stringify(n.id)})">Marcar como lida</button></div></div>`).join(''):'<div class="empty"><i class="fa-regular fa-bell-slash"></i>Nenhuma notificação pendente.</div>';
  const subtitle=count?`${count} ${count===1?'pendente':'pendentes'}${state.notifications.length>count?' • mostrando as 5 mais recentes':''}`:'Tudo em dia';
  openModal('Atualizações',subtitle,`<div class="notification-list">${items}</div>${count>1?'<button class="btn btn-soft btn-block notifications-read-all" type="button" onclick="dismissVisibleNotifications()"><i class="fa-solid fa-check-double"></i>Marcar estas como lidas</button>':''}`);
  modalRoot.querySelector('.modal')?.classList.add('notifications-modal');
}

header=function(_subtitle,showBell=false){
  const unread=notificationUnreadCount();
  return `<header class="app-header simplified-header"><div class="brand-row"><div class="brand" role="button" tabindex="0" aria-label="Ir para a tela inicial" onclick="goHome()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goHome()}"><div class="brand-mark"><i class="fa-solid fa-seedling"></i></div><div class="brand-copy"><strong>Casa do Oleiro</strong></div></div><div class="header-actions">${showBell?`<button class="icon-btn notification-trigger" onclick="openNotifications()" aria-label="Atualizações"><i class="fa-regular fa-bell"></i>${unread?`<span class="notification-unread-dot" aria-label="${unread} pendentes"></span>`:''}</button>`:''}<button class="icon-btn language-button" onclick="openLanguageModal()" aria-label="Idioma"><span class="current-language-code">${typeof currentLanguageCode==='function'?currentLanguageCode():'PT'}</span></button><button class="icon-btn" onclick="toggleTheme()" aria-label="Tema"><i class="fa-solid ${state.theme==='dark'?'fa-sun':'fa-moon'}"></i></button></div></div></header>`;
};
