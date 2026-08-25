function choosePrototype(role,mode){
  localStorage.setItem('oleiro-role',role);
  if(mode)localStorage.setItem('oleiro-volunteer-mode',mode);
  if(role==='manager') location.href='admin/';
  else if(role==='volunteer') location.href='portal/';
  else location.href='inactive.html';
}
function prototypeLogin(){
  const email=document.getElementById('email').value.trim();
  const password=document.getElementById('password').value;
  if(!email||!password)return showLoginMessage('Informe e-mail e senha.');
  showLoginMessage('Autenticação real será conectada após a validação das telas.');
}
function showLoginMessage(text){const el=document.getElementById('loginMessage');el.textContent=typeof translateText==='function'?translateText(text):text;el.hidden=false}