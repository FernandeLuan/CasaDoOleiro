(()=>{
  function escapeAttr(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function emergencyFields(n){return `<div class="form-subsection"><div class="form-subsection-head"><strong>Contato de emergência</strong><span>Opcional</span></div><div class="form-grid three"><div class="field"><label for="emName${n}">Nome</label><input id="emName${n}" class="input"></div><div class="field"><label for="emRel${n}">Relação</label><input id="emRel${n}" class="input"></div><div class="field"><label for="emPhone${n}">WhatsApp / telefone</label><input id="emPhone${n}" class="input" type="tel"></div></div></div>`;}
  function participantTwo(){return `<div class="form-section" id="demoParticipant2" hidden><h3>Participante 2</h3><div class="form-grid"><div class="field"><label for="name2">Nome completo</label><input id="name2" class="input"></div><div class="field"><label for="email2">E-mail</label><input id="email2" class="input" type="email"></div><div class="field"><label for="phone2">WhatsApp</label><input id="phone2" class="input" type="tel"></div><div class="field"><label for="country2">País</label><input id="country2" class="input"></div><div class="field"><label for="language2">Idioma do e-mail</label><select id="language2" class="input"><option>Português</option><option>English</option><option>Español</option></select></div></div>${emergencyFields('2')}</div>`;}
  function enhanceAdminPlanning(){
    if(document.body.dataset.previewRole!=='admin')return;
    document.querySelectorAll('.workspace .activity').forEach(activity=>{
      if(activity.querySelector('.activity-actions'))return;
      const title=activity.querySelector('h4')?.textContent?.trim()||'Atividade';
      const day=activity.closest('.day-card')?.querySelector('[data-day]')?.dataset.day||'11/09';
      const actions=document.createElement('div');actions.className='activity-actions';
      actions.innerHTML=`<button class="btn soft small" data-replicate="${escapeAttr(title)}" data-date="${escapeAttr(day)}">⧉ Replicar atividade</button><button class="btn small" data-add-activity="${escapeAttr(day)}">＋ Adicionar atividade</button>`;
      activity.appendChild(actions);
    });
  }
  function enhanceCandidateForm(){
    if(document.body.dataset.previewRole!=='admin')return;
    const modal=[...document.querySelectorAll('.modal')].find(node=>node.querySelector('.modal-head h2')?.textContent.trim()==='Novo candidato');
    if(!modal||modal.dataset.r58Enhanced==='true')return;
    modal.dataset.r58Enhanced='true';
    const form=modal.querySelector('.form');const first=form?.querySelector('.form-section');if(!form||!first)return;
    first.insertAdjacentHTML('beforebegin',`<div class="form-section candidate-type-section"><h3>Tipo da candidatura</h3><div class="candidate-type-switch" role="group" aria-label="Tipo da candidatura"><button class="candidate-type-option active" type="button" data-kind="single"><span>1</span><strong>Individual</strong></button><button class="candidate-type-option" type="button" data-kind="couple"><span>2</span><strong>Dupla</strong></button></div></div>`);
    const grid=first.querySelector('.form-grid');if(grid&&!first.querySelector('#language1'))grid.insertAdjacentHTML('beforeend','<div class="field"><label for="language1">Idioma do e-mail</label><select id="language1" class="input"><option>Português</option><option>English</option><option>Español</option></select></div>');
    first.insertAdjacentHTML('afterend',participantTwo());
  }
  function enhance(){enhanceAdminPlanning();enhanceCandidateForm();}
  function closeOverlay(){const root=document.getElementById('overlayRoot');if(root)root.innerHTML='';}
  document.addEventListener('click',event=>{
    const kind=event.target.closest('[data-kind]');
    if(kind){event.preventDefault();const modal=kind.closest('.modal');modal?.querySelectorAll('[data-kind]').forEach(btn=>btn.classList.toggle('active',btn===kind));const second=modal?.querySelector('#demoParticipant2');if(second)second.hidden=kind.dataset.kind!=='couple';return;}
    const closeButton=event.target.closest('button[data-close-overlay],.close-btn[data-close-overlay]');
    const backdropClick=event.target.matches('.workspace-backdrop[data-close-overlay],.modal-backdrop[data-close-overlay]');
    if(closeButton||backdropClick){event.preventDefault();event.stopImmediatePropagation();closeOverlay();}
  },true);
  const observer=new MutationObserver(enhance);observer.observe(document.documentElement,{childList:true,subtree:true});enhance();
})();
