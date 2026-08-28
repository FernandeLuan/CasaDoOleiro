/* Round 20/28 — acabamento do Portal sem mecanismo paralelo de tradução. */
(function refinementsR20Portal(){
  function activeSessions(){return (state.sessions||[]).filter(row=>row.status!=='rejected'&&row.reviewStatus!=='rejected')}

  window.confirmVolunteerLogout=function(){openModal(t('portal.logout.title'),t('portal.logout.question'),`<div class="notice"><i class="fa-solid fa-right-from-bracket"></i><div>${escapeHtml(t('portal.logout.body'))}</div></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">${escapeHtml(t('common.cancel'))}</button><button class="btn btn-danger" type="button" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i>${escapeHtml(t('action.signOut'))}</button></div>`)};

  const baseVolunteerHome=volunteerHome;
  volunteerHome=function(){
    let html=baseVolunteerHome();const template=document.createElement('template');template.innerHTML=html;const card=template.content.querySelector('.home-unit-support');
    if(card){const unit=card.querySelector('.home-unit-copy strong')?.textContent?.trim()||'Rodeio',link=document.createElement('a');link.className='card home-unit-support home-unit-support-link';link.href='https://wa.me/5547999504753';link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',`${t('portal.support.support')} WhatsApp`);link.innerHTML=`<span class="home-unit-icon"><i class="fa-brands fa-whatsapp"></i></span><span class="home-unit-link-copy"><strong class="home-unit-label">${escapeHtml(t('portal.support.unit'))}: ${escapeHtml(unit)}</strong><span>${escapeHtml(t('portal.support.support'))}: +55 47 99950-4753</span></span><i class="fa-solid fa-chevron-right home-unit-chevron" aria-hidden="true"></i>`;card.replaceWith(link);html=template.innerHTML}
    return html;
  };

  /* Atividades criadas pela gestão permanecem confirmadas e não viram nova proposta pelo candidato. */
  const baseSessionCardVolunteer=sessionCardVolunteer;
  sessionCardVolunteer=function(s,editable){const managerCreated=s?.raw?.managerCreated===true||s?.activity?.managerCreated===true;if(state.volunteerMode!=='approved'&&managerCreated)return baseSessionCardVolunteer(s,false);return baseSessionCardVolunteer(s,editable)};

  /* Nunca exibe uma ação de envio quando não existe sessão válida. */
  const baseVolunteerPlan=volunteerPlan;
  volunteerPlan=function(){let html=baseVolunteerPlan();if(state.volunteerMode!=='approved'&&state.volunteerPlanningLoadedFor===String(state.currentApplication?.id||'')&&activeSessions().length===0){html=html.replace(/<button class="btn btn-primary btn-block candidate-plan-submit"[^>]*>[\s\S]*?<\/button>/,`<button class="btn btn-soft btn-block candidate-plan-submit" type="button" disabled><i class="fa-solid fa-circle-info"></i>${escapeHtml(t('portal.plan.addBeforeSend'))}</button>`)}return html};

  window.volunteerHome=volunteerHome;window.sessionCardVolunteer=sessionCardVolunteer;window.volunteerPlan=volunteerPlan;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();