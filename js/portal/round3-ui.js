/* Round 3 — ajustes finais do Portal candidato/voluntário. */
(function round3PortalUi(){
  const mapsUrl='https://www.google.com/maps/search/?api=1&query=R.%20S%C3%A3o%20Pedro%20Novo%2C%201999%2C%20Rodeio%20-%20SC%2C%2089136-000';
  window.openOleiroMaps=function(){const opened=window.open(mapsUrl,'_blank','noopener,noreferrer');if(!opened)location.href=mapsUrl};

  const baseVolunteerHome=volunteerHome;
  volunteerHome=function(){
    let html=baseVolunteerHome();
    html=html.replace(`<button class="menu-link" onclick="navigateVolunteer('info')"><i class="fa-solid fa-route"></i><span>Como chegar`, `<button class="menu-link" onclick="openOleiroMaps()"><i class="fa-solid fa-route"></i><span>Como chegar`);
    return html;
  };

  /* Planejamento é renderizado exclusivamente por js/portal/planejamento.js.
     Este módulo mantém apenas o ajuste do link de Como chegar. */

})();
