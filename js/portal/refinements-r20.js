/* Round 20/22 — acabamento do Portal e consistência das ações do candidato. */
(function refinementsR20Portal(){
  function lang(){return typeof currentLanguage==='function'?currentLanguage():'pt'}
  function copy(){
    const l=lang();
    if(l==='en')return {title:'Sign out',question:'Do you really want to end your session?',body:'You will need to sign in again with your email and password.',cancel:'Cancel',exit:'Sign out',unit:'Unit',support:'Support'};
    if(l==='es')return {title:'Cerrar sesión',question:'¿Deseas cerrar tu sesión?',body:'Deberás iniciar sesión nuevamente con tu correo electrónico y contraseña.',cancel:'Cancelar',exit:'Cerrar sesión',unit:'Unidad',support:'Soporte'};
    return {title:'Sair do portal',question:'Deseja realmente encerrar sua sessão?',body:'Você precisará entrar novamente com seu email e senha.',cancel:'Cancelar',exit:'Sair',unit:'Unidade',support:'Suporte'};
  }
  function activeSessions(){return (state.sessions||[]).filter(row=>row.status!=='rejected'&&row.reviewStatus!=='rejected')}

  window.confirmVolunteerLogout=function(){const t=copy();openModal(t.title,t.question,`<div class="notice"><i class="fa-solid fa-right-from-bracket"></i><div>${t.body}</div></div>`,`<div class="confirm-delete-actions"><button class="btn btn-outline" type="button" onclick="closeModal()">${t.cancel}</button><button class="btn btn-danger" type="button" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i>${t.exit}</button></div>`)};

  const baseVolunteerHome=volunteerHome;
  volunteerHome=function(){
    let html=baseVolunteerHome();const t=copy();html=html.replace(/<small>Unidade<\/small><strong>(.*?)<\/strong><span>Suporte:/,`<strong class="home-unit-label">${t.unit}: $1</strong><span>${t.support}:`);
    const template=document.createElement('template');template.innerHTML=html;const card=template.content.querySelector('.home-unit-support');
    if(card){const label=card.querySelector('.home-unit-label')?.textContent?.trim()||`${t.unit}: Rodeio`,support=card.querySelector('.home-unit-copy span:last-child')?.textContent?.trim()||`${t.support}: +55 47 99950-4753`,link=document.createElement('a');link.className='card home-unit-support home-unit-support-link';link.href='https://wa.me/5547999504753';link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',`${t.support} WhatsApp`);link.innerHTML=`<span class="home-unit-icon"><i class="fa-brands fa-whatsapp"></i></span><span class="home-unit-link-copy"><strong class="home-unit-label">${escapeHtml(label)}</strong><span>${escapeHtml(support)}</span></span><i class="fa-solid fa-chevron-right home-unit-chevron" aria-hidden="true"></i>`;card.replaceWith(link);html=template.innerHTML}
    return html;
  };

  /* Atividades criadas pela gestão permanecem confirmadas e não viram nova proposta pelo candidato. */
  const baseSessionCardVolunteer=sessionCardVolunteer;
  sessionCardVolunteer=function(s,editable){const managerCreated=s?.raw?.managerCreated===true||s?.activity?.managerCreated===true;if(state.volunteerMode!=='approved'&&managerCreated)return baseSessionCardVolunteer(s,false);return baseSessionCardVolunteer(s,editable)};

  /* Nunca exibe uma ação de envio quando não existe sessão válida. */
  const baseVolunteerPlan=volunteerPlan;
  volunteerPlan=function(){let html=baseVolunteerPlan();if(state.volunteerMode!=='approved'&&state.volunteerPlanningLoadedFor===String(state.currentApplication?.id||'')&&activeSessions().length===0){html=html.replace(/<button class="btn btn-primary btn-block candidate-plan-submit"[^>]*>[\s\S]*?<\/button>/,`<button class="btn btn-soft btn-block candidate-plan-submit" type="button" disabled><i class="fa-solid fa-circle-info"></i>Adicione uma atividade para enviar</button>`)}return html};

  /* Exclusão do candidato: ao remover a última sessão em ajustes, volta persistentemente para Em preparação. */
  window.deletePlanningSession=async function(activityId,date){
    const session=typeof realSessionFor==='function'?realSessionFor(activityId,date):null,application=state.currentApplication;if(!session||!application?.id)return showToast('Sessão não encontrada.');
    const approved=state.volunteerMode==='approved',activity=(state.activities||[]).find(row=>String(row.id)===String(activityId)),postAdjustment=approved&&activity?.postApprovalProposal===true&&activity?.reviewStatus==='adjustments';if(approved&&!postAdjustment)return showToast('Esta sessão não pode ser excluída neste status.');
    const remaining=activeSessions().filter(row=>String(row.id)!==String(session.id)),resetEmpty=!approved&&state.volunteerPlanStatus==='adjustments'&&remaining.length===0,planningStatePatch=resetEmpty?{status:'pending',planningSubmittedAt:null,dayAdjustments:{}}:null;
    try{
      const result=await window.OleiroServices.planning.deleteSession(session.id,{applicationId:application.id,activityId,updateApplicationCounts:false,planningStatePatch});state.sessions=(state.sessions||[]).filter(row=>String(row.id)!==String(session.id));
      if(result.deletedActivity)state.activities=(state.activities||[]).filter(row=>String(row.id)!==String(activityId));else{const current=(state.activities||[]).find(row=>String(row.id)===String(activityId));if(current)current.dates=(current.dates||[]).filter(value=>value!==date)}
      if(resetEmpty){application.status='pending';application.planningSubmittedAt=null;application.dayAdjustments={};state.volunteerPlanStatus='draft'}
      closeModal();render();showToast(resetEmpty?'Atividade excluída. Monte seu planejamento novamente.':'Sessão excluída.');
    }catch(error){console.error(error);showToast(error?.message||'Não foi possível excluir a sessão.')}
  };

  window.volunteerHome=volunteerHome;window.sessionCardVolunteer=sessionCardVolunteer;window.volunteerPlan=volunteerPlan;
  if(state.role==='volunteer'&&typeof render==='function')render();
})();
