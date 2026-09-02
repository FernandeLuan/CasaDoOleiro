(()=>{
  const demoContacts={
    'Josias Almeida':{name:'Marcos Almeida',relationship:'Irmão',phone:'+55 47 99999-0199'},
    'Maria Fernanda de Oliveira Albuquerque':{name:'Lucía Albuquerque',relationship:'Mãe',phone:'+54 11 5555-0198'},
    'Leonardo Martins':{name:'Paula Martins',relationship:'Irmã',phone:'+55 48 99999-0197'},
    'Anna Schneider':{name:'Thomas Schneider',relationship:'Pai',phone:'+49 151 0000-0196'},
    'Lucas & Rafael':{name:'Fernanda Souza',relationship:'Amiga do casal',phone:'+55 47 99999-0195'},
    'Sofía Ramírez':{name:'Camila Ramírez',relationship:'Irmã',phone:'+56 9 0000-0194'}
  };

  function emergencyFields(index){
    const n=String(index||1);
    return `<div class="emergency-fields">
      <div class="emergency-field-head"><strong>Contato de emergência</strong><span>Opcional</span></div>
      <p class="emergency-note">Se informado, nome e telefone devem ser preenchidos.</p>
      <div class="form-grid three emergency-form-grid">
        <div class="field"><label for="demoEmergencyName${n}">Nome</label><input id="demoEmergencyName${n}" class="input" autocomplete="off" placeholder="Nome do contato"></div>
        <div class="field"><label for="demoEmergencyRelationship${n}">Relação</label><input id="demoEmergencyRelationship${n}" class="input" autocomplete="off" placeholder="Ex.: mãe, irmão, amigo"></div>
        <div class="field"><label for="demoEmergencyPhone${n}">WhatsApp / telefone</label><input id="demoEmergencyPhone${n}" class="input" type="tel" autocomplete="off" placeholder="+55 47 99999-9999"></div>
      </div>
    </div>`;
  }

  function enhanceCandidateModal(){
    const modal=[...document.querySelectorAll('.modal')].find(node=>node.querySelector('.modal-head h2')?.textContent.trim()==='Novo candidato');
    if(!modal)return;
    modal.querySelectorAll('.form-section').forEach(section=>{
      const title=section.querySelector(':scope > h3')?.textContent.trim()||'';
      if(!title.startsWith('Participante')||section.querySelector('.emergency-fields'))return;
      const index=title.match(/(\d+)/)?.[1]||'1';
      section.insertAdjacentHTML('beforeend',emergencyFields(index));
    });
  }

  function enhanceAccount(){
    const workspace=document.querySelector('.workspace');
    if(!workspace)return;
    const active=workspace.querySelector('.tab.active')?.textContent.trim();
    if(active!=='Conta')return;
    const grid=workspace.querySelector('.account-grid');
    if(!grid||grid.querySelector('.account-emergency-demo'))return;
    const candidateName=workspace.querySelector('.workspace-head h2')?.textContent.trim()||'';
    const contact=demoContacts[candidateName]||{name:'Contato não informado',relationship:'—',phone:'—'};
    const card=document.createElement('article');
    card.className='info-card full account-emergency-demo emergency-demo-card';
    card.innerHTML=`<h3>Contato de emergência</h3>
      <p class="emergency-note">Informação cadastrada pelo voluntário para uso da equipe quando necessário.</p>
      <div class="kv"><span>Nome</span><strong>${escapeText(contact.name)}</strong></div>
      <div class="kv"><span>Relação</span><strong>${escapeText(contact.relationship)}</strong></div>
      <div class="kv"><span>Telefone</span><strong>${escapeText(contact.phone)}</strong></div>`;
    grid.appendChild(card);
  }

  function escapeText(value){
    return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }

  let queued=false;
  function enhance(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      enhanceCandidateModal();
      enhanceAccount();
    });
  }

  const observer=new MutationObserver(enhance);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',enhance,{passive:true});
  enhance();
})();
