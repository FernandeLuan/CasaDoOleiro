/* Round 15 — confirmação destrutiva padronizada. */
(function confirmR15(){
  window.requestDeleteVolunteerApplication=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;
    openModal('Excluir cadastro definitivamente?',`Esta ação remove ${escapeHtml(p.name)} do portal e do Firebase Authentication.`,`<div class="notice danger"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Esta ação não pode ser desfeita.</strong><br>Atividades, sessões, perfil e acesso serão removidos.</div></div><div class="field" style="margin-top:12px"><label for="deleteVolunteerConfirm">Digite EXCLUIR para confirmar</label><input id="deleteVolunteerConfirm" class="input" autocomplete="off" placeholder="EXCLUIR" oninput="syncDeleteVolunteerConfirm()"></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">Cancelar</button><button id="deleteVolunteerConfirmButton" class="btn btn-danger" type="button" onclick="confirmDeleteVolunteerApplication('${encodeURIComponent(id)}')" disabled>Excluir definitivamente</button></div>`);
  };
})();
