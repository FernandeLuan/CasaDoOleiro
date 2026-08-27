/* Round 21 — pendências de planejamento destacam o dia inteiro e resumem os tipos no cabeçalho. */
(function refinementsR21Admin(){
  const baseAdminPlanningDayCard=adminPlanningDayCard;

  function reviewState(day){
    const sessions=day?.sessions||[];
    const hasChange=sessions.some(session=>session.status==='change_requested');
    const hasProposal=sessions.some(session=>session.postApprovalProposal===true&&session.reviewStatus==='analysis');
    return {hasChange,hasProposal};
  }

  function reviewBadges(hasProposal,hasChange){
    const parts=[];
    if(hasProposal)parts.push('<span class="badge info day-review-badge">Nova atividade</span>');
    if(hasChange)parts.push('<span class="badge warning day-review-badge">Mudança solicitada</span>');
    if(parts.length<2)return parts.join('');
    return `${parts[0]}<span class="day-review-plus" aria-hidden="true">+</span>${parts[1]}`;
  }

  adminPlanningDayCard=function(p,day){
    let html=baseAdminPlanningDayCard(p,day);
    const {hasChange,hasProposal}=reviewState(day);
    if(!hasChange&&!hasProposal)return html;

    const tone=hasChange?'review-day-warning':'review-day-info';
    if(!html.includes(tone))html=html.replace('class="card planning-day-card','class="card planning-day-card '+tone);
    if(hasChange&&hasProposal&&!html.includes('review-day-combined'))html=html.replace('class="card planning-day-card','class="card planning-day-card review-day-combined');

    const tags=reviewBadges(hasProposal,hasChange);
    const marker='<div class="planning-day-date">';
    const start=html.indexOf(marker);
    if(start>=0&&!html.includes('day-review-summary')){
      const strongEnd=html.indexOf('</strong>',start);
      if(strongEnd>=0){
        const insertAt=strongEnd+'</strong>'.length;
        html=`${html.slice(0,insertAt)}<span class="day-review-summary">${tags}</span>${html.slice(insertAt)}`;
      }
    }
    return html;
  };

  window.adminPlanningDayCard=adminPlanningDayCard;
})();
