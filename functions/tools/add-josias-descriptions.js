const readline=require('node:readline/promises');
const process=require('node:process');
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');

const PROJECT_ID=process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT||'casadooleiro-35c4e';
initializeApp({credential:applicationDefault(),projectId:PROJECT_ID});
const auth=getAuth(),db=getFirestore();
const APPLY=process.argv.includes('--apply');
const emailArg=process.argv.slice(2).find(value=>!value.startsWith('--'))||'';
const normalize=value=>String(value||'').trim().toLowerCase();
const key=value=>normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'');

const DESCRIPTIONS={
  'introducao ao pilates':'Introdução aos princípios básicos do Pilates, com exercícios de respiração, postura, mobilidade e consciência corporal. A atividade busca apresentar a prática de forma gradual e adaptada às necessidades dos participantes.',
  'pilates':'Prática de exercícios de Pilates voltados ao fortalecimento, equilíbrio, flexibilidade, postura e consciência corporal, respeitando os limites individuais e incentivando a evolução durante as aulas.',
  'idiomas':'Atividade prática de idiomas com foco em comunicação e situações do cotidiano. Serão trabalhados vocabulário, expressões básicas, compreensão e conversação por meio de exercícios e dinâmicas.',
  'musica':'Vivência musical com atividades de ritmo, percepção sonora, expressão e participação em grupo. A proposta é utilizar a música como ferramenta de integração, criatividade e desenvolvimento pessoal.',
  'mercado de trabalho':'Atividade voltada à preparação para o mercado de trabalho, abordando elaboração de currículo, comportamento profissional, comunicação, entrevistas de emprego e orientações para busca de oportunidades.',
  'compostagem':'Atividade prática sobre compostagem e reaproveitamento de resíduos orgânicos, apresentando como separar os materiais, cuidar do processo de decomposição e utilizar o composto produzido de forma sustentável.',
  'consciencia corporal':'Prática voltada à percepção do próprio corpo por meio de exercícios de mobilidade, postura, coordenação, equilíbrio e respiração, promovendo maior consciência dos movimentos e bem-estar corporal.',
  'jogos':'Momento de integração por meio de jogos e atividades recreativas que estimulam raciocínio, comunicação, cooperação e convivência entre os participantes de forma leve e participativa.',
  'encerramento e feedback':'Encontro de encerramento para compartilhar experiências, avaliar as atividades realizadas e conversar sobre aprendizados e dificuldades. Espaço destinado também à troca de feedbacks e conclusão do período de participação.',
};

async function main(){
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  try{
    const email=normalize(emailArg||await rl.question('E-mail do Josias: '));
    if(!email||!email.includes('@'))throw new Error('Informe um e-mail válido.');
    const user=await auth.getUserByEmail(email);
    const apps=await db.collection('applications').where('participantUids','array-contains',user.uid).limit(2).get();
    if(apps.empty)throw new Error('Nenhuma candidatura encontrada.');
    if(apps.size>1)throw new Error('Mais de uma candidatura encontrada; operação cancelada.');
    const appDoc=apps.docs[0],applicationId=appDoc.id;
    const [activitiesSnap,sessionsSnap]=await Promise.all([
      db.collection('activities').where('applicationId','==',applicationId).get(),
      db.collection('activity_sessions').where('applicationId','==',applicationId).get(),
    ]);
    const activities=activitiesSnap.docs;
    const sessions=sessionsSnap.docs;
    if(activities.length!==26||sessions.length!==26)throw new Error(`Esperadas 26 activities e 26 sessions do planejamento aprovado; encontradas ${activities.length} e ${sessions.length}. Nenhum dado alterado.`);

    const unknown=[];
    for(const doc of activities){const name=doc.data().name||'';if(!DESCRIPTIONS[key(name)])unknown.push(`activity ${doc.id}: ${name}`)}
    for(const doc of sessions){const name=doc.data().activityName||'';if(!DESCRIPTIONS[key(name)])unknown.push(`session ${doc.id}: ${name}`)}
    if(unknown.length)throw new Error(`Há nomes sem descrição reconhecida:\n${unknown.join('\n')}`);

    console.log('\nCASA DO OLEIRO — DESCRIÇÕES DO PLANEJAMENTO DO JOSIAS');
    console.log('=====================================================');
    console.log(`Candidatura: ${applicationId}`);
    console.log(`Activities: ${activities.length} | Sessions: ${sessions.length}`);
    Object.entries(DESCRIPTIONS).forEach(([name,description])=>console.log(`\n${name.toUpperCase()}\n${description}`));

    if(!APPLY){console.log('\nSIMULAÇÃO — nenhum dado foi alterado. Rode novamente com --apply para gravar somente as descrições.');return}
    const confirmation=String(await rl.question('\nDigite DESCRICOES JOSIAS para confirmar: ')).trim();
    if(confirmation!=='DESCRICOES JOSIAS'){console.log('Operação cancelada.');return}

    const batch=db.batch(),now=FieldValue.serverTimestamp();
    for(const doc of activities){const data=doc.data();batch.update(doc.ref,{description:DESCRIPTIONS[key(data.name)],updatedAt:now})}
    for(const doc of sessions){const data=doc.data();batch.update(doc.ref,{activityDescription:DESCRIPTIONS[key(data.activityName)],updatedAt:now})}
    await batch.commit();

    const [aVerify,sVerify]=await Promise.all([
      db.collection('activities').where('applicationId','==',applicationId).get(),
      db.collection('activity_sessions').where('applicationId','==',applicationId).get(),
    ]);
    const missingA=aVerify.docs.filter(doc=>!String(doc.data().description||'').trim());
    const missingS=sVerify.docs.filter(doc=>!String(doc.data().activityDescription||'').trim());
    if(missingA.length||missingS.length)throw new Error(`Atualização feita, mas a verificação encontrou descrições vazias: activities=${missingA.length}, sessions=${missingS.length}.`);
    console.log('\n✓ Descrições atualizadas com sucesso.');
    console.log(`✓ 26 activities e 26 activity_sessions conferidas.`);
    console.log('✓ Datas, durações, nomes e demais campos não foram alterados por este script.');
  }finally{rl.close()}
}
main().catch(error=>{console.error(`\nErro: ${error?.message||error}`);process.exitCode=1});
