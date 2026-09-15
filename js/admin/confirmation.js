/* Confirmação destrutiva do cadastro.
   A exclusão completa usa Firebase Admin no utilitário do Cloud Shell; o navegador não
   tem permissão para remover outra conta do Firebase Authentication. */
(function confirmR15(){
  function candidateEmail(p){
    const direct=String(p?.email||'').trim();
    const list=Array.isArray(p?.participantEmails)?p.participantEmails.map(value=>String(value||'').trim()).filter(Boolean):[];
    return direct||list[0]||'';
  }
  function shellQuote(value){return "'" + String(value||'').replaceAll("'", "'\\''") + "'"}

  window.syncDeleteVolunteerConfirm=function(){
    const input=document.getElementById('deleteVolunteerConfirm'),button=document.getElementById('deleteVolunteerConfirmButton');
    if(!button)return;
    const valid=String(input?.value||'').trim()==='EXCLUIR';
    button.disabled=!valid;
    button.setAttribute('aria-disabled',String(!valid));
  };

  window.requestDeleteVolunteerApplication=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;
    openModal(
      'Excluir cadastro definitivamente?',
      `Esta ação remove ${escapeHtml(p.name)} do portal e do Firebase Authentication.`,
      `<div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Esta ação não pode ser desfeita.</strong><br>Atividades, sessões, perfil e acesso serão removidos.</div></div><div class="field" style="margin-top:12px"><label for="deleteVolunteerConfirm">Digite EXCLUIR para confirmar</label><input id="deleteVolunteerConfirm" class="input" autocomplete="off" placeholder="EXCLUIR" oninput="syncDeleteVolunteerConfirm()"></div>`,
      `<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancelar</button><button id="deleteVolunteerConfirmButton" class="btn btn-danger" type="button" onclick="confirmDeleteVolunteerApplication('${encodeURIComponent(id)}')" disabled>Continuar</button></div>`
    );
  };

  window.confirmDeleteVolunteerApplication=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;
    const email=candidateEmail(p);
    if(!email)return showToast('Este cadastro não possui e-mail disponível para a exclusão completa.');
    const command=`cd ~/CasaDoOleiro && git pull && cd functions && npm install && node tools/delete-volunteer.js ${shellQuote(email)}`;
    openModal(
      'Executar exclusão completa',
      'Por segurança, a exclusão definitiva é feita com Firebase Admin no Google Cloud Shell.',
      `<div class="notice"><i class="fa-solid fa-shield-halved"></i><div>O navegador não pode apagar outra conta do Firebase Authentication. Use o utilitário administrativo abaixo para remover Authentication, candidatura, perfil, atividades, sessões e histórico de uma só vez.</div></div><div class="field" style="margin-top:12px"><label for="deleteVolunteerCommand">Comando</label><textarea id="deleteVolunteerCommand" class="textarea" readonly rows="4">${escapeHtml(command)}</textarea></div><small>O utilitário ainda pedirá a confirmação literal EXCLUIR antes de apagar qualquer dado.</small>`,
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
