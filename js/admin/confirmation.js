/* Exclusão completa via Firebase Admin no Google Cloud Shell.
   O navegador apenas gera o comando; nenhum dado é apagado diretamente pelo Admin. */
(function confirmDeleteVolunteer(){
  function candidateEmail(p){
    const direct=String(p?.email||'').trim();
    const list=Array.isArray(p?.participantEmails)?p.participantEmails.map(value=>String(value||'').trim()).filter(Boolean):[];
    return direct||list[0]||'';
  }
  function shellQuote(value){return "'" + String(value||'').replaceAll("'", "'\\''") + "'"}

  window.requestDeleteVolunteerApplication=function(encodedId){
    const id=decodeURIComponent(String(encodedId||'')),p=candidateById(id);if(!p)return;
    const email=candidateEmail(p);
    if(!email)return showToast('Este cadastro não possui e-mail disponível para gerar o comando de exclusão.');

    const command=`cd ~/CasaDoOleiro && git pull && cd functions && npm install && node tools/delete-volunteer.js ${shellQuote(email)}`;
    openModal(
      'Excluir cadastro pelo Cloud Shell',
      `O Admin não apagará nenhum dado de ${escapeHtml(p.name)} diretamente.`,
      `<div class="notice warning"><i class="fa-solid fa-terminal"></i><div><strong>A exclusão completa será feita pelo Firebase Admin.</strong><br>Copie o comando abaixo e execute no Google Cloud Shell. O utilitário mostra o cadastro encontrado e ainda exige que você digite EXCLUIR antes de remover Authentication, candidatura, perfil, atividades, sessões e histórico.</div></div><div class="field" style="margin-top:12px"><label for="deleteVolunteerCommand">Comando para o Cloud Shell</label><textarea id="deleteVolunteerCommand" class="textarea" readonly rows="4">${escapeHtml(command)}</textarea></div>`,
      `<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Fechar</button><button class="btn btn-primary" type="button" onclick="copyDeleteVolunteerCommand()"><i class="fa-regular fa-copy"></i>Copiar comando</button></div>`
    );
  };

  window.copyDeleteVolunteerCommand=async function(){
    const field=document.getElementById('deleteVolunteerCommand');if(!field)return;
    const value=String(field.value||'');
    try{
      await navigator.clipboard.writeText(value);
      showToast('Comando copiado.');
    }catch{
      field.focus();field.select();
      try{document.execCommand('copy');showToast('Comando copiado.')}catch{showToast('Selecione e copie o comando manualmente.')}
    }
  };
})();
