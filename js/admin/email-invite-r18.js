/* Round 18 — ao corrigir e-mail antes do primeiro acesso, reenviar o convite de senha. */
(function emailInviteR18(){
  window.saveVolunteerEmail=async function(encodedApplicationId,encodedUid){
    const applicationId=decodeURIComponent(encodedApplicationId),uid=decodeURIComponent(encodedUid),p=candidateById(applicationId),email=document.getElementById('adminVolunteerEmail')?.value.trim().toLowerCase()||'',button=document.getElementById('adminVolunteerEmailSave');
    if(!p||!email||!email.includes('@'))return showToast('Informe um e-mail válido.');
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...'}
    try{
      const cache=state.participantAccessCache?.[String(p.id)]||{},language=cache[String(uid)]?.language||'pt';
      const result=await window.OleiroServices.adminAccess.updateVolunteerEmail({applicationId,uid,email});
      const index=(p.participantUids||[]).map(String).indexOf(String(uid));p.participantEmails=Array.isArray(p.participantEmails)?[...p.participantEmails]:[];if(index>=0)p.participantEmails[index]=result?.email||email;p.email=p.participantEmails.filter(Boolean).join(', ');
      cache[uid]={...(cache[uid]||{}),email:result?.email||email};state.participantAccessCache[String(p.id)]=cache;
      let inviteSent=true;try{await window.OleiroServices.adminAccess.sendPasswordSetup(result?.email||email,language)}catch(error){inviteSent=false;console.error('E-mail alterado, mas o novo convite não foi enviado:',error)}
      renderPersonModal(p,'account');showToast(inviteSent?'E-mail atualizado e novo convite enviado.':'E-mail atualizado, mas o convite não foi enviado. Use “Esqueci minha senha” para reenviar.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível atualizar o e-mail.');if(button?.isConnected){button.disabled=false;button.textContent='Salvar e-mail'}}
  };
})();
