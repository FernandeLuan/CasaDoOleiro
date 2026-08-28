/* Optional emergency contact: one source of truth in volunteer_profiles, loaded only when Account is opened. */
(function adminEmergencyContact(){
  const loadPromises=new Map();
  const text=key=>typeof t==='function'?t(key):key;
  const safe=value=>encodeURIComponent(String(value??''));
  const contactValue=(index,field)=>document.getElementById(`ncEmergency${field}${index}`)?.value.trim()||'';
  const normalizedContact=value=>window.OleiroServices?.profiles?.normalizeEmergencyContact?.(value)||{name:String(value?.name||'').trim(),relationship:String(value?.relationship||'').trim(),phone:String(value?.phone||'').trim()};
  const hasContact=value=>{const row=normalizedContact(value);return !!(row.name||row.relationship||row.phone)};

  const baseCandidateParticipantFields=candidateParticipantFields;
  candidateParticipantFields=function(index,options={}){
    const n=Number(index),html=baseCandidateParticipantFields(index,options);
    const emergency=`<div class="field"><label>${escapeHtml(text('emergency.title'))} <small>(${escapeHtml(text('emergency.optional'))})</small></label><small>${escapeHtml(text('emergency.subtitle'))}</small></div><div class="field"><label for="ncEmergencyName${n}">${escapeHtml(text('emergency.name'))}</label><input id="ncEmergencyName${n}" class="input" autocomplete="off" placeholder="${escapeHtml(text('emergency.namePlaceholder'))}" oninput="syncNewCandidateSubmit()"></div><div class="field-row"><div class="field"><label for="ncEmergencyRelationship${n}">${escapeHtml(text('emergency.relationship'))}</label><input id="ncEmergencyRelationship${n}" class="input" autocomplete="off" placeholder="${escapeHtml(text('emergency.relationshipPlaceholder'))}" oninput="syncNewCandidateSubmit()"></div><div class="field"><label for="ncEmergencyPhone${n}">${escapeHtml(text('emergency.phone'))}</label><input id="ncEmergencyPhone${n}" class="input" type="tel" autocomplete="off" placeholder="${escapeHtml(text('emergency.phonePlaceholder'))}" oninput="syncNewCandidateSubmit()"></div></div>`;
    const marker='</select></div></div></div>',at=html.lastIndexOf(marker);
    return at>=0?`${html.slice(0,at)}</select></div>${emergency}</div></div>`:html;
  };

  const baseCandidateFormParticipant=candidateFormParticipant;
  candidateFormParticipant=function(index){
    const row=baseCandidateFormParticipant(index);return {...row,emergencyContact:{name:contactValue(index,'Name'),relationship:contactValue(index,'Relationship'),phone:contactValue(index,'Phone')}};
  };

  const baseSyncNewCandidateSubmit=syncNewCandidateSubmit;
  syncNewCandidateSubmit=function(){
    baseSyncNewCandidateSubmit();const button=document.getElementById('ncSubmit');if(!button)return;
    const type=document.getElementById('ncType')?.value||'individual';for(const index of type==='couple'?[1,2]:[1]){const row=candidateFormParticipant(index).emergencyContact;if(hasContact(row)&&(!row.name||!row.phone)){button.disabled=true;break}}
  };

  function participantName(p,index){return (Array.isArray(p?.participantNames)?p.participantNames[index]:null)||p?.participantProfiles?.[index]?.name||p?.name||`Participante ${index+1}`}
  function participantContact(p,index){return normalizedContact(p?.participantProfiles?.[index]?.emergencyContact)}
  function contactSummary(row){if(!hasContact(row))return `<span>${escapeHtml(text('emergency.none'))}</span>`;const parts=[row.name,row.relationship,row.phone].filter(Boolean);return `<strong>${escapeHtml(parts[0]||text('emergency.none'))}</strong>${parts.slice(1).map(value=>`<span>${escapeHtml(value)}</span>`).join('')}`}

  async function ensureProfiles(p){
    if(!p?.id||p.emergencyProfilesLoaded)return p?.participantProfiles||[];const key=String(p.id);if(loadPromises.has(key))return loadPromises.get(key);
    const uids=(p.participantUids||[]).map(String).filter(Boolean);if(!uids.length){p.participantProfiles=[];p.emergencyProfilesLoaded=true;return []}
    p.emergencyProfilesLoading=true;
    const promise=window.OleiroServices.profiles.getByIds(uids).then(rows=>{p.participantProfiles=rows;p.emergencyProfilesLoaded=true;p.emergencyProfilesLoading=false;return rows}).catch(error=>{p.emergencyProfilesLoading=false;console.error('Falha ao carregar contatos de emergência:',error);throw error}).finally(()=>loadPromises.delete(key));
    loadPromises.set(key,promise);return promise;
  }

  function emergencyCard(p){
    const count=Math.max(Number(p?.participantCount)||1,(p?.participantUids||[]).length,(p?.participantNames||[]).length);
    if(!p.emergencyProfilesLoaded)return `<div class="card account-emergency-card"><div class="account-card-head"><div><span class="eyebrow">${escapeHtml(text('emergency.title'))}</span><strong>${escapeHtml(text('emergency.loading'))}</strong></div></div></div>`;
    const rows=Array.from({length:count},(_,index)=>{const contact=participantContact(p,index);return `<div class="account-person-row emergency-person-row"><span class="account-person-icon"><i class="fa-solid fa-phone-volume"></i></span><div><small>${escapeHtml(participantName(p,index))}</small>${contactSummary(contact)}</div><button class="account-inline-edit" type="button" onclick="openVolunteerEmergencyEditor('${safe(p.id)}',${index})">${escapeHtml(hasContact(contact)?text('emergency.edit'):text('emergency.add'))}</button></div>`}).join('');
    return `<div class="card account-emergency-card"><div class="account-card-head"><div><span class="eyebrow">${escapeHtml(text('emergency.title'))}</span><small>${escapeHtml(text('emergency.subtitle'))}</small></div></div>${rows}</div>`;
  }

  const baseRenderPersonModal=renderPersonModal;
  renderPersonModal=function(p,tab='plan'){
    const result=baseRenderPersonModal(p,tab);const normalized=tab==='plan'?'plan':tab;if(!p||normalized!=='account')return result;
    if(!modalRoot.querySelector('.account-emergency-card')){
      const contactCard=modalRoot.querySelector('.account-contact-card'),registration=modalRoot.querySelector('.account-registration-card'),holder=document.createElement('div');holder.innerHTML=emergencyCard(p);const card=holder.firstElementChild;
      if(contactCard)contactCard.insertAdjacentElement('afterend',card);else if(registration)registration.insertAdjacentElement('beforebegin',card);else modalRoot.querySelector('.modal')?.appendChild(card);
    }
    if(!p.emergencyProfilesLoaded&&!p.emergencyProfilesLoading&&window.OleiroServices?.profiles?.getByIds){ensureProfiles(p).then(()=>{if(modalRoot.dataset.personId===String(p.id)&&(modalRoot.dataset.personTab||tab)==='account')renderPersonModal(p,'account')}).catch(()=>{if(modalRoot.dataset.personId===String(p.id))showToast(text('emergency.error'))})}
    return result;
  };

  window.openVolunteerEmergencyEditor=function(encodedId,index){
    const id=decodeURIComponent(encodedId),p=candidateById(id);if(!p)return;const i=Number(index),row=participantContact(p,i),has=hasContact(row),name=participantName(p,i);
    const body=`<div class="form-grid"><div class="field"><label for="editEmergencyName">${escapeHtml(text('emergency.name'))}</label><input id="editEmergencyName" class="input" value="${escapeHtml(row.name)}" placeholder="${escapeHtml(text('emergency.namePlaceholder'))}"></div><div class="field"><label for="editEmergencyRelationship">${escapeHtml(text('emergency.relationship'))}</label><input id="editEmergencyRelationship" class="input" value="${escapeHtml(row.relationship)}" placeholder="${escapeHtml(text('emergency.relationshipPlaceholder'))}"></div><div class="field"><label for="editEmergencyPhone">${escapeHtml(text('emergency.phone'))}</label><input id="editEmergencyPhone" class="input" type="tel" value="${escapeHtml(row.phone)}" placeholder="${escapeHtml(text('emergency.phonePlaceholder'))}"></div></div>`;
    const footer=`<div class="confirm-actions">${has?`<button class="btn btn-danger-soft" type="button" onclick="clearVolunteerEmergencyContact('${safe(p.id)}',${i})">${escapeHtml(text('emergency.clear'))}</button>`:''}<button class="btn btn-outline" type="button" onclick="renderPersonModal(candidateById(decodeURIComponent('${safe(p.id)}')),'account')">${escapeHtml(typeof t==='function'?t('common.cancel'):'Cancelar')}</button><button id="saveEmergencyContactButton" class="btn btn-primary" type="button" onclick="saveVolunteerEmergencyContact('${safe(p.id)}',${i})">${escapeHtml(text('emergency.save'))}</button></div>`;
    openModal(text('emergency.title'),name,body,footer);
  };

  window.saveVolunteerEmergencyContact=async function(encodedId,index){
    const id=decodeURIComponent(encodedId),p=candidateById(id),i=Number(index),uid=(p?.participantUids||[])[i],button=document.getElementById('saveEmergencyContactButton');if(!p||!uid)return showToast(text('emergency.error'));
    const row={name:document.getElementById('editEmergencyName')?.value.trim()||'',relationship:document.getElementById('editEmergencyRelationship')?.value.trim()||'',phone:document.getElementById('editEmergencyPhone')?.value.trim()||''};if(hasContact(row)&&(!row.name||!row.phone))return showToast(text('emergency.required'));
    if(button){button.disabled=true;button.innerHTML=`<i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(typeof t==='function'?t('action.saving'):'Salvando...')}`}
    try{const saved=await window.OleiroServices.profiles.updateEmergencyContact(uid,row);p.participantProfiles=p.participantProfiles||[];p.participantProfiles[i]={...(p.participantProfiles[i]||{}),id:String(uid),emergencyContact:saved};p.emergencyProfilesLoaded=true;renderPersonModal(p,'account');showToast(text('emergency.saved'))}catch(error){console.error(error);showToast(error?.message||text('emergency.error'));if(button?.isConnected){button.disabled=false;button.textContent=text('emergency.save')}}
  };

  window.clearVolunteerEmergencyContact=async function(encodedId,index){
    const id=decodeURIComponent(encodedId),p=candidateById(id),i=Number(index),uid=(p?.participantUids||[])[i];if(!p||!uid)return;
    try{const saved=await window.OleiroServices.profiles.updateEmergencyContact(uid,{name:'',relationship:'',phone:''});p.participantProfiles=p.participantProfiles||[];p.participantProfiles[i]={...(p.participantProfiles[i]||{}),id:String(uid),emergencyContact:saved};p.emergencyProfilesLoaded=true;renderPersonModal(p,'account');showToast(text('emergency.saved'))}catch(error){console.error(error);showToast(error?.message||text('emergency.error'))}
  };

  window.candidateParticipantFields=candidateParticipantFields;window.candidateFormParticipant=candidateFormParticipant;window.syncNewCandidateSubmit=syncNewCandidateSubmit;window.renderPersonModal=renderPersonModal;
})();
