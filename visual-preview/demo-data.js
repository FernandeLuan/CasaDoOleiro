window.OLEIRO_DEMO_DATA = Object.freeze({
  stats: { candidates: 12, meetings: 3, pending: 4, approved: 5 },
  candidates: [
    {
      id:'josias', name:'Josias Almeida', country:'Brasil', unit:'Rodeio', language:'Português', status:'meeting', statusLabel:'Reunião agendada', stay:'07 set → 21 set', initials:'JA',
      contact:'josias.demo@example.com', phone:'+55 47 99999-0101', work:'Professor de educação física',
      planning:[
        {date:'11/09',weekday:'Sexta',total:'1h',activities:[{title:'Introdução ao Pilates',duration:'60 min',period:'Manhã',group:'Grupo Livre',description:'Apresentação dos princípios básicos do Pilates, consciência corporal e exercícios introdutórios com adaptações para diferentes níveis.',status:'approved'}]},
        {date:'14/09',weekday:'Segunda',total:'2h',activities:[{title:'Idiomas',duration:'60 min',period:'Manhã',group:'Turma A',description:'Conversação prática e vocabulário funcional.',status:'approved'},{title:'Pilates',duration:'60 min',period:'Tarde',group:'Turma B',description:'Sequência leve de mobilidade, respiração e postura.',status:'approved'}]},
        {date:'15/09',weekday:'Terça',total:'2h',activities:[{title:'Música',duration:'60 min',period:'Tarde',group:'Grupo Livre',description:'Atividade musical participativa com repertório escolhido pelo grupo.',status:'approved'},{title:'Idiomas',duration:'60 min',period:'Noite',group:'Turma A',description:'Dinâmica de conversação em situações do cotidiano.',status:'approved'}]},
        {date:'16/09',weekday:'Quarta',total:'3h',activities:[{title:'Mercado de Trabalho',duration:'180 min',period:'Tarde',group:'Grupo Livre',description:'Currículo, postura em entrevistas, busca de oportunidades e simulação prática.',status:'approved'}]},
        {date:'17/09',weekday:'Quinta',total:'2h30',activities:[{title:'Compostagem',duration:'90 min',period:'Manhã',group:'Turma B',description:'Prática de compostagem e reaproveitamento orgânico.',status:'approved'},{title:'Idiomas',duration:'60 min',period:'Tarde',group:'Turma A',description:'Vocabulário e conversação.',status:'approved'}]},
        {date:'18/09',weekday:'Sexta',total:'0h',activities:[]}
      ],
      history:[
        ['02 set · 14:20','Reunião agendada para 03/09 às 19h.'],
        ['01 set · 10:42','Planejamento aprovado pela gestão.'],
        ['31 ago · 21:15','Planejamento reenviado após ajustes.'],
        ['30 ago · 09:10','Ajuste solicitado em duas atividades.']
      ]
    },
    {id:'maria',name:'Maria Fernanda de Oliveira Albuquerque',country:'Argentina',unit:'Indaial',language:'Español',status:'planning',statusLabel:'Planejamento pendente',stay:'10 set → 24 set',initials:'MF',contact:'maria.demo@example.com',phone:'+54 11 5555-0102',work:'Designer freelancer',planning:[],history:[]},
    {id:'leo',name:'Leonardo Martins',country:'Brasil',unit:'Rodeio',language:'Português',status:'review',statusLabel:'Em análise',stay:'12 set → 26 set',initials:'LM',contact:'leo.demo@example.com',phone:'+55 48 99999-0103',work:'Estudante',planning:[],history:[]},
    {id:'anna',name:'Anna Schneider',country:'Alemanha',unit:'Indaial',language:'English',status:'adjustment',statusLabel:'Ajuste solicitado',stay:'14 set → 28 set',initials:'AS',contact:'anna.demo@example.com',phone:'+49 151 0000-0104',work:'Fotógrafa',planning:[],history:[]},
    {id:'dupla',name:'Lucas & Rafael',country:'Brasil',unit:'Rodeio',language:'Português',status:'approved',statusLabel:'Aprovados',stay:'18 set → 02 out',initials:'LR',contact:'dupla.demo@example.com',phone:'+55 47 99999-0105',work:'Trabalho remoto',planning:[],history:[]},
    {id:'sofia',name:'Sofía Ramírez',country:'Chile',unit:'Indaial',language:'Español',status:'meeting',statusLabel:'Reunião agendada',stay:'20 set → 04 out',initials:'SR',contact:'sofia.demo@example.com',phone:'+56 9 0000-0106',work:'Professora',planning:[],history:[]}
  ],
  agenda:[
    {date:'03 SET',weekday:'Quinta',items:[['19:00','Reunião · Josias Almeida','Rodeio'],['20:00','Reunião · Sofía Ramírez','Indaial']]},
    {date:'11 SET',weekday:'Sexta',items:[['Manhã','Introdução ao Pilates · Josias','Grupo Livre'],['Tarde','Oficina de culinária · Equipe','Turma B']]},
    {date:'14 SET',weekday:'Segunda',items:[['Manhã','Idiomas · Josias','Turma A'],['Tarde','Pilates · Josias','Turma B']]}
  ]
});
