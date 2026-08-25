/* Dados de demonstração: carregados somente com ?dev=1.
   Este arquivo não participa do fluxo normal e pode ser removido após o backend. */
(function applyOleiroMockData(){
  const dev = new URLSearchParams(location.search).get('dev') === '1';
  if(!dev || typeof state === 'undefined') return;

  state.units = [
    {id:'rodeio',name:'Rodeio',active:true,acceptingVolunteers:true},
    {id:'indaial',name:'Indaial',active:false,acceptingVolunteers:false}
  ];

  state.candidates = [
    {id:1,name:'Thomas Miller',country:'Alemanha',email:'thomas@email.com',phone:'+49 151 000000',gender:'male',unitId:'rodeio',unit:'Rodeio',from:'2026-09-03',to:'2026-09-18',status:'analysis',sessions:9,activities:4,submitted:'Hoje, 14:20'},
    {id:2,name:'Maria Gómez',country:'Argentina',email:'maria@email.com',phone:'+54 9 11 0000',gender:'female',unitId:'rodeio',unit:'Rodeio',from:'2026-09-10',to:'2026-09-25',status:'adjustments',sessions:6,activities:3,submitted:'Ontem'},
    {id:3,name:'Daniel Costa',country:'Brasil',email:'daniel@email.com',phone:'+55 47 99999-0000',gender:'male',unitId:'rodeio',unit:'Rodeio',from:'2026-10-02',to:'2026-10-17',status:'pending',sessions:0,activities:0,submitted:'—'},
    {id:4,name:'Sophie Martin',country:'França',email:'sophie@email.com',phone:'+33 6 0000',gender:'female',unitId:'rodeio',unit:'Rodeio',from:'2026-08-18',to:'2026-09-02',status:'approved',sessions:8,activities:3,submitted:'18/08'},
    {id:5,name:'Lucas García',country:'Espanha',email:'lucas@email.com',phone:'+34 600 000',gender:'male',unitId:'rodeio',unit:'Rodeio',from:'2026-08-20',to:'2026-09-05',status:'approved',sessions:7,activities:4,submitted:'17/08'},
    {id:6,name:'Alex Brown',country:'Canadá',email:'alex@email.com',phone:'+1 416 000',gender:'male',unitId:'rodeio',unit:'Rodeio',from:'2026-09-05',to:'2026-09-20',status:'rejected',sessions:4,activities:2,submitted:'20/08'}
  ];

  const regressionNames=['Ana Souza','Bruno Lima','Camila Torres','Diego Martins','Elena Rossi','Felipe Rocha','Grace Wilson','Hugo Pereira','Isabel Moreno','João Alves','Klara Schmidt','Mateo Ruiz','Nina Costa','Oliver Smith','Paula Silva','Rafael Mendes','Sara López','Victor Santos'];
  regressionNames.forEach((name,index)=>{
    const day=6+(index%18);
    const female=['Ana','Camila','Elena','Grace','Isabel','Klara','Nina','Paula','Sara'].some(first=>name.startsWith(first));
    state.candidates.push({
      id:100+index,
      name,
      country:index%3===0?'Brasil':index%3===1?'Espanha':'Alemanha',
      email:`regressao${index+1}@example.com`,
      phone:'+55 47 90000-0000',
      gender:female?'female':'male',
      unitId:'rodeio',
      unit:'Rodeio',
      from:`2026-09-${String(day).padStart(2,'0')}`,
      to:`2026-09-${String(Math.min(28,day+7)).padStart(2,'0')}`,
      status:index<14?'approved':index<16?'pending':'analysis',
      sessions:index<14?3+(index%5):0,
      activities:index<14?2+(index%3):0,
      submitted:index<14?'Teste regressivo':'—'
    });
  });

  state.groups = [
    {id:'A',capacity:5,note:'Grupo operacional 1',members:['João','Marcos','André','Paulo','Renato']},
    {id:'B',capacity:5,note:'Grupo operacional 2',members:['Felipe','Carlos','Diego','Rafael','Bruno']},
    {id:'C',capacity:5,note:'Grupo operacional 3',members:['Mateus','Eduardo','Gabriel','Leonardo','Thiago']},
    {id:'D',capacity:5,note:'Grupo operacional 4',members:['Pedro','Henrique','Gustavo','Daniel','Samuel']}
  ];

  state.activities = [
    {id:1,owner:'Thomas Miller',name:'Conversação em inglês',description:'Conversas básicas sobre situações do cotidiano.',duration:60,participation:'Até 10',materials:'Quadro e canetas',notes:'Nível iniciante',period:'Tarde',time:'15:15',dates:['2026-09-08','2026-09-10','2026-09-15']},
    {id:2,owner:'Thomas Miller',name:'Yoga e alongamento',description:'Alongamentos leves e exercícios básicos de mobilidade.',duration:60,participation:'Livre',materials:'Tapetes, se disponíveis',notes:'Pode ser adaptado.',period:'Tarde',time:'15:15',dates:['2026-09-07','2026-09-14']},
    {id:3,owner:'Thomas Miller',name:'Futebol',description:'Atividade esportiva recreativa.',duration:90,participation:'Livre',materials:'Bola',notes:'',period:'Tarde',time:'13:45',dates:['2026-09-09','2026-09-16']},
    {id:4,owner:'Thomas Miller',name:'Oficina de fotografia',description:'Fotografia básica utilizando celular.',duration:120,participation:'Até 5',materials:'Celulares',notes:'',period:'Manhã',time:'09:00',dates:['2026-09-11']},
    {id:5,owner:'Sophie Martin',name:'Yoga e alongamento',description:'Sessão de mobilidade e alongamento.',duration:60,participation:'Livre',materials:'Tapetes',notes:'',period:'Tarde',time:'13:45',dates:['2026-08-24']},
    {id:6,owner:'Lucas García',name:'Oficina de música',description:'Prática musical em grupo.',duration:60,participation:'Livre',materials:'Instrumentos disponíveis',notes:'',period:'Tarde',time:'15:15',dates:['2026-08-24']},
    {id:7,owner:'Sophie Martin',name:'Esporte recreativo',description:'Atividade leve em grupo.',duration:60,participation:'Livre',materials:'Bola',notes:'',period:'Noite',time:'19:30',dates:['2026-08-24']},
    {id:8,owner:'Maria Gómez',name:'Cozinha internacional',description:'Preparação coletiva de uma receita simples.',duration:90,participation:'Até 10',materials:'Ingredientes da receita',notes:'',period:'Tarde',time:'15:15',dates:['2026-09-10','2026-09-17']}
  ];

  state.sessionStatus = {
    '1-2026-09-08':'confirmed','1-2026-09-10':'change','1-2026-09-15':'confirmed',
    '2-2026-09-07':'confirmed','2-2026-09-14':'confirmed',
    '3-2026-09-09':'proposed','3-2026-09-16':'proposed','4-2026-09-11':'conflict',
    '5-2026-08-24':'confirmed','6-2026-08-24':'confirmed','7-2026-08-24':'confirmed',
    '8-2026-09-10':'proposed','8-2026-09-17':'proposed'
  };

  state.sessionGroups = {
    '1-2026-09-08':'C','2-2026-09-07':'A+B','3-2026-09-09':'Livre',
    '5-2026-08-24':'A+B','6-2026-08-24':'C','7-2026-08-24':'Livre','8-2026-09-10':'B'
  };

  state.notifications = [
    {id:1,title:'Cronograma atualizado',text:'Yoga foi movida para um novo horário.'},
    {id:2,title:'Alteração aguardando confirmação',text:'Thomas alterou uma sessão já confirmada.'},
    {id:3,title:'Planejamento enviado',text:'Um candidato enviou o planejamento para análise.'},
    {id:4,title:'Nova proposta',text:'Uma nova sessão foi proposta por um voluntário.'},
    {id:5,title:'Chegada próxima',text:'Há uma chegada prevista para os próximos dias.'},
    {id:6,title:'Planejamento reenviado',text:'Um candidato reenviou o planejamento após ajustes.'},
    {id:7,title:'Mudança de sessão',text:'Uma sessão confirmada recebeu pedido de alteração.'}
  ];
})();
