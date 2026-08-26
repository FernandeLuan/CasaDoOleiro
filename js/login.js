/* Login */
setLanguage=function(lang){const next=typeof normalizeOleiroLanguage==='function'?(normalizeOleiroLanguage(lang)||'pt'):lang;localStorage.setItem('oleiro-language',next);if(typeof closeLanguageModal==='function')closeLanguageModal();location.reload();};

let loginTransitionTimer=null;
function destinationFor(role){if(role==='manager')return 'admin/';if(role==='volunteer')return 'portal/';return 'inactive.html'}
function startLoginTransition(role){if(loginTransitionTimer)return;const overlay=document.getElementById('loginLoading');const button=document.getElementById('loginButton');if(button)button.disabled=true;if(overlay)overlay.hidden=false;loginTransitionTimer=setTimeout(()=>{location.href=destinationFor(role)},850)}
async function handleLogin(){
  const email=document.getElementById('email')?.value.trim()||'';
  const password=document.getElementById('password')?.value||'';
  if(!window.OleiroAuth||typeof window.OleiroAuth.signIn!=='function')return showLoginMessage('Autenticação indisponível. Atualize a página e tente novamente.');
  try{
    const session=await window.OleiroAuth.signIn({email,password});
    if(!session?.role)throw new Error('Sessão inválida.');
    return startLoginTransition(session.role);
  }catch(error){return showLoginMessage(error?.message||'Não foi possível entrar.')}
}
async function handleForgotPassword(){
  const email=document.getElementById('email')?.value.trim()||'';const button=document.getElementById('forgotPasswordButton');
  if(!email)return showLoginMessage('Informe seu e-mail para recuperar a senha.');
  if(!window.OleiroAuth||typeof window.OleiroAuth.sendPasswordReset!=='function')return showLoginMessage('Recuperação de senha indisponível. Atualize a página e tente novamente.');
  try{
    if(button)button.disabled=true;
    await window.OleiroAuth.sendPasswordReset(email);
    showLoginMessage('Se este e-mail estiver cadastrado, você receberá uma mensagem para definir uma nova senha.');
  }catch(error){showLoginMessage(error?.message||'Não foi possível enviar o e-mail de recuperação.')}finally{if(button)button.disabled=false}
}
function showLoginMessage(text){const el=document.getElementById('loginMessage');if(!el)return;el.textContent=typeof translateText==='function'?translateText(text):text;el.hidden=false}
