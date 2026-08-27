/* Round 19 — gênero, link do Worldpackers, destaque de pendências e acabamento do detalhe Admin. */
(function refinementsR19Admin(){
  function safe(value){return encodeURIComponent(String(value??''))}
  function httpUrl(value){try{const url=new URL(String(value||'').trim());return ['http:','https:'].includes(url.protocol)?url.toString():''}catch{return ''}}
  function genderLabel(value){return value==='female'?'Feminino':value==='male'?'Masculino':'Não informado'}
  function participantGender(p,index){const genders=Array.isArray(p?.participantGenders)?p.participantGenders:[];return genders[index]||(index===0?p?.gender:'')||''}

  /* Cadastro: gênero por participante e link administrativo do perfil no Worldpackers. */
  const baseCandidateParticipantFields=candidateParticipantFields;
  candidateParticipantFields=function(index,options={}){
    const n=Number(index),html=baseCandidateParticipantFields(index,options),marker=`<div class="field"><label for="ncLanguage${n}">`;
    const gender=`<div class="field"><label for="ncGender${n}">Gênero</label><select id="ncGender${n}" class="select" onchange="syncNewCandidateSubmit()"><option value="">Selecione</option><option value="female">Feminino</option><option value="male">Masculino</option></select></div>`;
    return html.includes(marker)?html.replace(marker,`${gender}${marker}`):html;
  };
  const baseCandidateFormParticipant=candidateFormParticipant;
  candidateFormParticipant=function(index){const row=baseCandidateFormParticipant(index);return {...row,gender:document.getElementById(`ncGender${index}`)?.value||''}};
  const baseSyncNewCandidateSubmit=syncNewCandidateSubmit;
  syncNewCandidateSubmit=function(){
    baseSyncNewCandidateSubmit();const button=document.getElementById('ncSubmit');if(!button)return;
    const type=document.getElementById('ncType')?.value||'individual',g1=document.getElementById('ncGender1')?.value||'',g2=document.getElementById('ncGender2')?.value||'';
    if(!g1||(type==='couple'&&!g2))button.disabled=true;
  };
  const baseOpenNewCandidate=openNewCandidate;
  openNewCandidate=function(){
    const result=baseOpenNewCandidate();const note=document.getElementById('ncNote')?.closest('.field');
    if(note&&!document.getElementById('ncRegistrationLink'))note.insertAdjacentHTML('beforebegin','<div class="field"><label for="ncRegistrationLink">Link do cadastro</label><input id="ncRegistrationLink" class="input" type="url" inputmode="url" autocomplete="url" placeholder="https://www.worldpackers.com/..."></div>');
    return result;
  };
  if(window.OleiroServices?.onboarding?.createCandidate&&!window.OleiroServices.onboarding.__r19Wrapped){
    const onboarding=window.OleiroServices.onboarding,baseCreate=onboarding.createCandidate.bind(onboarding);
    onboarding.createCandidate=function(payload){return baseCreate({...payload,registrationLink:document.getElementById('ncRegistrationLink')?.value.trim()||''})};
    onboarding.__r19Wrapped=true;
  }

  /* Ocupação: casal sempre cinza; individual usa o gênero gravado. */
  occupancyGender=function(p){
    if(p?.type==='couple'||Number(p?.participantCount)===2)return 'couple';
    const gender=p?.gender||(Array.isArray(p?.participantGenders)?p.participantGenders[0]:'');
    return gender==='male'?'male':gender==='female'?'female':'other';
  };
  window.openOccupancyDay=function(iso){
    const people=(state.occupancyCandidates||[]).filter(p=>p.status==='approved'&&!p.inactive&&p.from&&p.to&&p.from<=iso&&p.to>=iso),locale=typeof currentLocale==='function'?currentLocale():'pt-BR';
    const title=new Intl.DateTimeFormat(locale,{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${iso}T12:00:00`));
    const list=people.length?people.map(p=>`<div class="occupancy-person"><span class="occupancy-person-dot ${occupancyGender(p)}"></span><div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.country||'—')} • ${fmtDate(p.from,true)}–${fmtDate(p.to,true)}</small></div></div>`).join(''):'<div class="empty">Nenhum voluntário hospedado nesta data.</div>';
    openModal(title,'Voluntários hospedados',`<div class="occupancy-person-list">${list}</div>`,`<button class="btn btn-outline btn-block" type="button" onclick="closeModal()"><i class="fa-solid fa-arrow-left"></i>Voltar ao calendário</button>`);modalRoot.querySelector('.modal')?.classList.add('occupancy-modal');
  };

  /* Planejamento: o próprio dia recebe a mesma família visual da pendência. */
  const baseAdminPlanningDayCard=adminPlanningDayCard;
  adminPlanningDayCard=function(p,day){
    let html=baseAdminPlanningDayCard(p,day);const sessions=day?.sessions||[];
    const hasChange=sessions.some(session=>session.status==='change_requested');
    const hasProposal=sessions.some(session=>session.postApprovalProposal===true&&session.reviewStatus==='analysis');
    const tone=hasChange?'review-day-warning':hasProposal?'review-day-info':'';
    if(tone)html=html.replace('class="card planning-day-card','class="card planning-day-card '+tone);
    return html;
  };

  /* Conta: status ao lado do nome, link administrativo e edição de gênero sem consulta adicional. */
  const baseRenderPersonModal=renderPersonModal;
  renderPersonModal=function(p,tab='plan'){
    const result=baseRenderPersonModal(p,tab);if(!p)return result;const normalized=tab==='plan'?'plan':'account';
    if(normalized==='plan')modalRoot.querySelector('.person-plan-summary')?.remove();

    const title=modalRoot.querySelector('.modal-head h2');if(title&&!modalRoot.querySelector('.person-title-line')){
      const [label,type]=statusMeta(p.status),line=document.createElement('div');line.className='person-title-line';title.parentNode.insertBefore(line,title);line.appendChild(title);line.insertAdjacentHTML('beforeend',`<span class="badge ${type}">${escapeHtml(label)}</span>`);
    }
    if(normalized!=='account')return result;

    const statusLine=modalRoot.querySelector('.account-status-line');if(statusLine){const [label]=statusMeta(p.status),first=statusLine.querySelector('.badge');if(first&&(first.textContent||'').trim()===label)first.remove();if(!statusLine.children.length)statusLine.remove()}

    const contactCard=modalRoot.querySelector('.account-contact-card');if(contactCard){
      [...contactCard.querySelectorAll('.account-person-row')].forEach((row,index)=>{
        const detail=row.lastElementChild;if(!detail||detail.querySelector('.account-person-gender'))return;const gender=participantGender(p,index);
        detail.insertAdjacentHTML('beforeend',`<div class="account-person-gender"><span>Gênero: ${escapeHtml(genderLabel(gender))}</span><button class="account-inline-edit" type="button" onclick="openVolunteerGenderEditor('${safe(p.id)}',${index})">Editar</button></div>`);
      });
      if(!modalRoot.querySelector('.account-registration-card')){
        const link=httpUrl(p.registrationLink||''),card=document.createElement('div');card.className='card account-registration-card';
        card.innerHTML=`<div class="account-card-head"><div><span class="eyebrow">Link do cadastro</span>${link?`<a class="account-registration-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i>Abrir no Worldpackers</a>`:'<strong>Não informado</strong>'}</div><button class="btn btn-outline btn-xs" type="button" onclick="openRegistrationLinkEditor('${safe(p.id)}')"><i class="fa-solid fa-pen"></i>${link?'Editar':'Adicionar'}</button></div>`;
        contactCard.insertAdjacentElement('afterend',card);
      }
    }
    return result;
  };

  window.openVolunteerGenderEditor=function(encodedId,index){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;const current=participantGender(p,Number(index));
    openModal('Editar gênero','',`<div class="field"><label for="editVolunteerGender">Gênero</label><select id="editVolunteerGender" class="select"><option value="female" ${current==='female'?'selected':''}>Feminino</option><option value="male" ${current==='male'?'selected':''}>Masculino</option></select></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${escapeHtml(String(p.id))}'),'account')">Cancelar</button><button id="saveVolunteerGenderButton" class="btn btn-primary" type="button" onclick="saveVolunteerGender('${safe(p.id)}',${Number(index)})">Salvar</button></div>`);
  };
  window.saveVolunteerGender=async function(encodedId,index){
    const id=decodeURIComponent(encodedId),p=candidateById(id),gender=document.getElementById('editVolunteerGender')?.value||'',button=document.getElementById('saveVolunteerGenderButton');if(!p||!['male','female'].includes(gender))return showToast('Selecione o gênero.');
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...'}
    try{
      const context=await window.OleiroServices.firebase(),{firestore}=context.modules,count=Math.max(Number(p.participantCount)||1,(p.participantNames||[]).length,(p.participantUids||[]).length),genders=Array.from({length:count},(_,i)=>participantGender(p,i));genders[Number(index)]=gender;
      const batch=firestore.writeBatch(context.db),now=firestore.serverTimestamp(),appPatch={participantGenders:genders,updatedAt:now};if(count===1)appPatch.gender=gender;
      batch.update(firestore.doc(context.db,'applications',String(p.id)),appPatch);
      const uid=(p.participantUids||[])[Number(index)];if(uid)batch.set(firestore.doc(context.db,'volunteer_profiles',String(uid)),{gender,updatedAt:now},{merge:true});
      await batch.commit();p.participantGenders=genders;if(count===1)p.gender=gender;
      (state.occupancyCandidates||[]).forEach(row=>{if(String(row.id)===String(p.id)){row.participantGenders=[...genders];if(count===1)row.gender=gender}});state.occupancyScreenCache={};if(state.occupancyMonthCache)state.occupancyMonthCache={};
      renderPersonModal(p,'account');showToast('Gênero atualizado.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível atualizar o gênero.');if(button?.isConnected){button.disabled=false;button.textContent='Salvar'}}
  };

  window.openRegistrationLinkEditor=function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;
    openModal('Link do cadastro','',`<div class="field"><label for="editRegistrationLink">Worldpackers</label><input id="editRegistrationLink" class="input" type="url" inputmode="url" value="${escapeHtml(p.registrationLink||'')}" placeholder="https://www.worldpackers.com/..."></div>`,`<div class="confirm-actions"><button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById('${escapeHtml(String(p.id))}'),'account')">Cancelar</button><button id="saveRegistrationLinkButton" class="btn btn-primary" type="button" onclick="saveRegistrationLink('${safe(p.id)}')">Salvar</button></div>`);
  };
  window.saveRegistrationLink=async function(encodedId){
    const id=decodeURIComponent(encodedId),p=candidateById(id),raw=document.getElementById('editRegistrationLink')?.value.trim()||'',link=raw?httpUrl(raw):'',button=document.getElementById('saveRegistrationLinkButton');if(!p)return;if(raw&&!link)return showToast('Informe um link válido.');
    if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...'}
    try{await window.OleiroServices.applications.update(p.id,{registrationLink:link});p.registrationLink=link;renderPersonModal(p,'account');showToast('Link do cadastro atualizado.')}catch(error){console.error(error);showToast(error?.message||'Não foi possível atualizar o link.');if(button?.isConnected){button.disabled=false;button.textContent='Salvar'}}
  };

  window.candidateParticipantFields=candidateParticipantFields;window.candidateFormParticipant=candidateFormParticipant;window.syncNewCandidateSubmit=syncNewCandidateSubmit;window.openNewCandidate=openNewCandidate;window.occupancyGender=occupancyGender;window.adminPlanningDayCard=adminPlanningDayCard;window.renderPersonModal=renderPersonModal;
})();