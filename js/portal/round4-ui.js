/* Round 4 — Portal: refinamento da Estadia. */
(function round4PortalUi(){
  volunteerStay=function(){
    const application=state.currentApplication||{},unit=application.unitName||String(application.unitId||'—').replace(/^./,c=>c.toUpperCase());
    return `<section class="section volunteer-stay-page"><div class="section-head"><div><span class="eyebrow">${escapeHtml(unit)}</span><h2>Minha estadia</h2><p>Informações do período</p></div></div><div class="grid-2"><div class="card"><span class="eyebrow">Chegada</span><strong style="display:block;margin-top:8px">${stayFullDate(application.stayStart)}</strong></div><div class="card"><span class="eyebrow">Saída</span><strong style="display:block;margin-top:8px">${stayFullDate(application.stayEnd)}</strong></div></div><div class="card stay-unit-card" style="margin-top:10px"><h3>Unidade ${escapeHtml(unit)}</h3><p>A equipe local acompanha a experiência e pode ajustar datas e atividades conforme a rotina da comunidade.</p><a class="stay-support-link" href="https://wa.me/5547999504753" target="_blank" rel="noopener noreferrer"><span class="stay-support-icon"><i class="fa-brands fa-whatsapp"></i></span><span class="stay-support-copy"><small>Suporte pelo WhatsApp</small><strong>+55 47 99950-4753</strong></span><i class="fa-solid fa-chevron-right"></i></a><div class="stay-unit-actions"><button class="btn btn-soft" type="button" onclick="navigateVolunteer('info')"><i class="fa-solid fa-route"></i>Orientações</button></div></div></section>`;
  };
  window.volunteerStay=volunteerStay;
})();
