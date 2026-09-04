/* Status do voluntário e prazo na mesma linha da listagem administrativa. */
(function volunteerStatusInline(){
  const params=new URLSearchParams(location.search);
  if(params.get('demo')!=='admin'||!/\/admin\//.test(location.pathname))return;
  if(window.__OLEIRO_VOLUNTEER_STATUS_INLINE_R68__)return;
  window.__OLEIRO_VOLUNTEER_STATUS_INLINE_R68__=true;

  function installStyles(){
    if(document.getElementById('volunteerStatusInlineR68Styles'))return;
    const style=document.createElement('style');
    style.id='volunteerStatusInlineR68Styles';
    style.textContent=`
      .volunteer-name-status-r68{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0;margin-bottom:2px}
      .volunteer-name-status-r68>h3{margin:0;min-width:0}
      .volunteer-name-status-r68 .badge{flex:0 0 auto;margin:0}
      .volunteer-name-status-badges-r68{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
      .volunteer-name-status-badges-r68 .candidate-deadline-mini{display:inline-flex!important;align-items:center;gap:4px;margin:0!important;font-size:11px;line-height:1.2;white-space:nowrap}
      .volunteer-list-page .item-main>.item-meta:empty,
      .volunteer-list-page .item-main>.candidate-status-row:empty,
      .planning-candidate-list .item-main>.item-meta:empty,
      .planning-candidate-list .item-main>.candidate-status-row:empty{display:none!important}
      @media(min-width:641px){
        .volunteer-list-page .volunteer-name-status-r68,
        .planning-candidate-list .volunteer-name-status-r68{flex-wrap:nowrap}
        .volunteer-list-page .volunteer-name-status-r68>h3,
        .planning-candidate-list .volunteer-name-status-r68>h3{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .volunteer-list-page .volunteer-name-status-badges-r68,
        .planning-candidate-list .volunteer-name-status-badges-r68{flex-wrap:nowrap}
      }
      @media(max-width:640px){
        .volunteer-name-status-r68{gap:6px}
        .volunteer-name-status-r68 .badge{font-size:.62rem}
        .volunteer-name-status-badges-r68 .candidate-deadline-mini{font-size:10px}
      }
    `;
    document.head.appendChild(style);
  }

  const basePersonCompact=typeof window.personCompact==='function'?window.personCompact:(typeof personCompact==='function'?personCompact:null);
  if(!basePersonCompact)return;

  personCompact=function(p){
    const html=basePersonCompact(p);
    const page=typeof state!=='undefined'?state.managerPage:'';
    if(!['volunteer','planning'].includes(page))return html;
    const template=document.createElement('template');template.innerHTML=html;
    const itemMain=template.content.querySelector('.item-main');
    const name=itemMain?.querySelector(':scope > h3')||itemMain?.querySelector('h3');
    const statusRow=itemMain?.querySelector(':scope > .candidate-status-row')||itemMain?.querySelector(':scope > .item-meta');
    const deadline=itemMain?.querySelector(':scope > .candidate-deadline-mini');
    if(!itemMain||!name||!statusRow)return html;

    const badges=[...statusRow.querySelectorAll('.badge')];
    if(!badges.length)return html;

    const line=document.createElement('div');line.className='volunteer-name-status-r68';
    const badgesWrap=document.createElement('div');badgesWrap.className='volunteer-name-status-badges-r68';
    name.before(line);line.appendChild(name);badges.forEach(badge=>badgesWrap.appendChild(badge));
    if(deadline)badgesWrap.appendChild(deadline);
    line.appendChild(badgesWrap);
    if(!statusRow.textContent.trim()&&!statusRow.children.length)statusRow.remove();
    return template.innerHTML;
  };
  window.personCompact=personCompact;

  installStyles();
  if(typeof state!=='undefined'&&state.role==='manager'&&['volunteer','planning'].includes(state.managerPage)&&typeof render==='function')render();
})();
