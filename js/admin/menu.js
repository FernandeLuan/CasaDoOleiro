function managerMenu(){return `<section class="section"><div class="menu-list">
  ${menuLink('fa-circle-info','Informações do portal','Conteúdo que candidatos e voluntários consultam',"openInfoEditor()")}
  ${menuLink('fa-building','Unidades','Rodeio ativa • Indaial preparada',"openUnits()")}
  ${menuLink('fa-user-shield','Gestores e acessos','Administradores e coordenadores',"openManagers()")}
  ${menuLink('fa-clock','Rotina-base','Horários de referência da comunidade',"openRoutine()")}
  ${menuLink('fa-user','Minha conta','Preferências e sessão',"showToast('Tela de conta entra na próxima etapa de backend.')")}
  ${menuLink('fa-right-from-bracket','Sair','Encerrar sessão neste dispositivo','logout()')}
  </div></section>`}

function openInfoEditor(){openModal('Informações do portal','Conteúdo visível para candidatos e voluntários.',`${infoAccordion()}<button class="btn btn-primary btn-block" onclick="showToast('Na versão com banco, cada bloco será editável pelo gestor.')">Editar conteúdo</button>`)}

function openUnits(){openModal('Unidades','Estrutura preparada para expansão.',`<div class="list"><div class="list-item"><div class="metric-icon"><i class="fa-solid fa-house"></i></div><div class="item-main"><h3>Rodeio</h3><p>Unidade ativa</p><div class="item-meta">${badge('Ativa','success')}</div></div></div><div class="list-item"><div class="metric-icon"><i class="fa-solid fa-house"></i></div><div class="item-main"><h3>Indaial</h3><p>Preparada para ativação futura</p><div class="item-meta">${badge('Inativa')}</div></div></div></div>`)}

function openManagers(){openModal('Gestores e acessos','MVP com mesmo nível de permissão.',`<div class="list"><div class="list-item"><div class="avatar">LF</div><div class="item-main"><h3>Luan Fernande</h3><p>Administrador principal</p></div>${badge('Gestor','success')}</div><div class="list-item"><div class="avatar">CO</div><div class="item-main"><h3>Coordenador Rodeio</h3><p>Acesso completo no MVP</p></div>${badge('Gestor','success')}</div></div>`)}

function openRoutine(){openModal('Rotina-base','Referência geral da comunidade.',`<div class="routine-list">${[['06:00','Despertar e higiene'],['06:15–07:30','Devocional'],['07:30–08:15','Café da manhã'],['08:15–11:15','Atividades práticas'],['11:15–12:00','Reunião de sentimentos'],['12:00–13:30','Almoço e descanso'],['13:45–15:00','Atividades'],['15:00–15:15','Café da tarde'],['15:15–16:30','Atividades'],['16:30 em diante','Banho, lazer e jantar'],['19:30–21:00','Filme, palestra, documentário ou outras atividades'],['21:00','Alojamento'],['21:30','Silêncio total']].map(([t,n])=>`<div class="routine-row"><time>${t}</time><span>${n}</span></div>`).join('')}</div>`)}
