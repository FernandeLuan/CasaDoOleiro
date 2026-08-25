let loginTransitionTimer=null;

function destinationFor(role){
  if(role==='manager')return 'admin/';
  if(role==='volunteer')return 'portal/';
  return 'inactive.html';
}
function startLoginTransition(role='manager',mode=null){
  if(loginTransitionTimer)return;
  localStorage.setItem('oleiro-role',role);
  if(mode)localStorage.setItem('oleiro-volunteer-mode',mode);
  const overlay=document.getElementById('loginLoading');
  const button=document.getElementById('loginButton');
  if(button)button.disabled=true;
  if(overlay)overlay.hidden=false;
  loginTransitionTimer=setTimeout(()=>{location.href=destinationFor(role)},1050);
}
function choosePrototype(role,mode){startLoginTransition(role,mode)}
function prototypeLogin(){
  const role=localStorage.getItem('oleiro-role')||'manager';
  const mode=role==='volunteer'?(localStorage.getItem('oleiro-volunteer-mode')||'candidate'):null;
  startLoginTransition(role,mode);
}
function showLoginMessage(text){const el=document.getElementById('loginMessage');if(!el)return;el.textContent=typeof translateText==='function'?translateText(text):text;el.hidden=false}
