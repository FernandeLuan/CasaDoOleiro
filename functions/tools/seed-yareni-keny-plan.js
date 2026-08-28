const readline = require('node:readline/promises');
const process = require('node:process');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'casadooleiro-35c4e';
const DEFAULT_TARGET_EMAIL = 'luan.fernande2001@gmail.com';

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

const normalize = value => String(value || '').trim().toLowerCase();
const clean = value => String(value || '').trim();

const ACTIVITIES = [
  {
    name: 'Apresentação e conexão inicial',
    description: 'Apresentação dos voluntários, interesses e ideias. O objetivo é conhecer o grupo e criar aproximação. Cada participante compartilha seu nome, algo que gosta, uma habilidade que possui e algo que gostaria de aprender. Os voluntários também compartilham de onde vêm e o que esperam aprender durante a experiência.',
    notes: 'Apresentação do voluntário, interesses e ideias.',
    duration: 60,
    slots: [
      { time: '13:00', period: 'Tarde' },
      { time: '14:00', period: 'Tarde' },
      { time: '15:00', period: 'Tarde' },
    ],
  },
  {
    name: 'Comunicação e integração',
    description: 'Caça ao Tesouro Cooperativa com estações de memória, comunicação, coordenação, movimento e lógica. O objetivo é estimular comunicação, cooperação e trabalho em equipe. As pistas são espalhadas pelo espaço e incluem pequenos desafios, perguntas sobre o grupo e atividades de colaboração. Não existe vencedor individual: o grupo vence junto.',
    notes: 'Caça ao Tesouro Cooperativa.',
    duration: 60,
    slots: [
      { time: '10:00', period: 'Manhã' },
      { time: '11:00', period: 'Manhã' },
    ],
  },
  {
    name: 'Roda de conversa: experiências, habilidades e novos caminhos',
    description: 'Atividade de cultura e conexão internacional — “Viaje pelo mundo”. Apresentar aspectos do Peru, como palavras básicas em espanhol, curiosidades, comidas típicas e costumes, e trocar experiências sobre expressões e costumes brasileiros. Pode incluir jogos de pronúncia, mímica e adivinhações culturais.',
    notes: 'Cultura e conexão internacional — Viaje pelo mundo.',
    duration: 60,
    slots: [
      { time: '13:00', period: 'Tarde' },
      { time: '14:00', period: 'Tarde' },
      { time: '15:00', period: 'Tarde' },
    ],
  },
  {
    name: 'Cultura e culinária peruanas',
    description: 'Oficina culinária com preparação de causa de frango. Os participantes podem preparar a batata, misturar os ingredientes, montar e decorar o prato. Durante a atividade, promover conversa sobre família, comida e lembranças.',
    notes: 'Sabores do Peru.',
    duration: 60,
    slots: [
      { time: '11:00', period: 'Manhã' },
    ],
  },
  {
    name: 'Circuito de desafios em equipe',
    description: 'Atividade voltada à descoberta e valorização das habilidades e experiências de cada participante. Trabalhar perguntas como: “Algo que faço bem?”, “Algo que aprendi na vida?”, “Algo que gostaria de melhorar?” e “Algo que posso ensinar?”. Se adequado, pode incluir uma pequena oficina sobre currículo e apresentação profissional.',
    notes: 'Descobrindo habilidades e possibilidades.',
    duration: 120,
    slots: [
      { time: '13:00', period: 'Tarde' },
      { time: '15:00', period: 'Tarde' },
    ],
  },
  {
    name: 'Oficina: habilidades, experiências e possibilidades para o futuro',
    description: 'Atividade de Vision Board — “Meu futuro, meus sonhos”. O objetivo é trabalhar motivação, sonhos e objetivos pessoais. Utilizando revistas, imagens, frases e cartolina, cada participante cria uma representação de como imagina a próxima etapa de sua vida, incluindo sonhos, objetivos, lugares que gostaria de conhecer e coisas que deseja conquistar.',
    notes: 'Vision Board — Meu futuro, meus sonhos.',
    duration: 60,
    slots: [
      { time: '09:00', period: 'Manhã' },
      { time: '10:00', period: 'Manhã' },
      { time: '13:00', period: 'Tarde' },
      { time: '14:00', period: 'Tarde' },
    ],
  },
  {
    name: 'Tecnologia útil no dia a dia',
    description: 'Oficina sobre o uso do celular e da internet como ferramentas para ampliar a autonomia pessoal e profissional. Pode abordar pesquisa de informações, criação e utilização de e-mail, organização digital, ferramentas úteis para o cotidiano e segurança no ambiente online.',
    notes: 'Tecnologia e autonomia.',
    duration: 60,
    slots: [
      { time: '09:30', period: 'Manhã' },
      { time: '10:30', period: 'Manhã' },
    ],
  },
  {
    name: 'Natureza & Horta',
    description: 'Atividade de movimento, integração e contato com a natureza. Pode incluir futebol, vôlei, jogos cooperativos ou o plantio de algo em conjunto. A atividade pode trabalhar a simbologia de que, assim como uma planta cresce e se transforma, nossas vidas também podem passar por processos de crescimento e transformação. O plantio pode permanecer como lembrança da passagem dos voluntários pela Casa.',
    notes: 'Movimento e natureza.',
    duration: 60,
    slots: [
      { time: '13:00', period: 'Tarde' },
      { time: '14:00', period: 'Tarde' },
      { time: '15:00', period: 'Tarde' },
      { time: '16:00', period: 'Tarde' },
    ],
  },
  {
    name: 'Projeto especial',
    description: 'Atividade de encerramento baseada em escuta, convivência e reflexão sobre a experiência. Trabalhar perguntas como: “O que aprendi nesses dias?”, “Qual momento marcou minha experiência?” e “Algo novo que descobri sobre mim?”. Depois, criar algo que possa permanecer como legado para a Casa do Oleiro, como um mural de lembranças, um pequeno manual de atividades com quizzes, caça ao tesouro, dinâmicas e oficinas, ou um vídeo da experiência.',
    notes: 'Encerramento e legado.',
    duration: 60,
    slots: [
      { time: '13:00', period: 'Tarde' },
      { time: '14:00', period: 'Tarde' },
      { time: '15:00', period: 'Tarde' },
      { time: '16:00', period: 'Tarde' },
    ],
  },
];

function iso(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (typeof value?.toDate === 'function') return value.toDate().toISOString().slice(0, 10);
  return '';
}

function addDays(value, days) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isWeekday(value) {
  const day = new Date(`${value}T12:00:00`).getDay();
  return day !== 0 && day !== 6;
}

function eligibleDates(start, end) {
  const from = iso(start);
  const to = iso(end);
  const rows = [];
  if (!from || !to || from >= to) return rows;
  for (let current = addDays(from, 1), guard = 0; current < to && guard < 370; current = addDays(current, 1), guard += 1) {
    if (isWeekday(current)) rows.push(current);
  }
  return rows;
}

function sessionKey(date, time) {
  return `${clean(date)}|${clean(time)}`;
}

function exactKey(date, time, name) {
  return `${sessionKey(date, time)}|${clean(name).toLocaleLowerCase('pt-BR')}`;
}

function managerStatus(applicationStatus) {
  const status = clean(applicationStatus);
  if (status === 'approved') return 'confirmed';
  if (status === 'rejected') throw new Error('A candidatura está recusada. O script não cadastrará atividades nela.');
  return 'manager_confirmed';
}

function samePlannedSession(existing, planned) {
  return clean(existing.activityName) === planned.name
    && Number(existing.duration || 0) === planned.duration
    && clean(existing.groupId) === 'Livre'
    && clean(existing.period) === planned.period
    && clean(existing.activityDescription) === planned.description
    && clean(existing.notes) === planned.notes;
}

async function resolveAdmin(rl, adminEmailArg) {
  if (adminEmailArg) {
    const user = await auth.getUserByEmail(adminEmailArg);
    const userDoc = await db.doc(`users/${user.uid}`).get();
    const data = userDoc.data() || {};
    if (!userDoc.exists || data.role !== 'admin' || data.active === false) {
      throw new Error(`O usuário ${adminEmailArg} não é um administrador ativo.`);
    }
    return { uid: user.uid, email: user.email || adminEmailArg };
  }

  const snapshot = await db.collection('users').where('role', '==', 'admin').get();
  const admins = snapshot.docs
    .map(doc => ({ uid: doc.id, ...(doc.data() || {}) }))
    .filter(row => row.active !== false);

  if (!admins.length) throw new Error('Nenhum administrador ativo foi encontrado em users.');
  if (admins.length === 1) return { uid: admins[0].uid, email: admins[0].email || admins[0].uid };

  console.log('\nAdministradores ativos encontrados:');
  admins.forEach((row, index) => console.log(`  ${index + 1}. ${row.email || '(sem e-mail)'} — ${row.uid}`));
  const answer = clean(await rl.question('\nDigite o e-mail ou UID do administrador que está fazendo este cadastro: '));
  const selected = admins.find(row => normalize(row.email) === normalize(answer) || row.uid === answer);
  if (!selected) throw new Error('Administrador informado não foi encontrado na lista acima.');
  return { uid: selected.uid, email: selected.email || selected.uid };
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const positionalEmail = process.argv.slice(2).find(value => !value.startsWith('--'));
    const targetEmail = normalize(positionalEmail || DEFAULT_TARGET_EMAIL);
    const adminEmailFlag = process.argv.find(value => value.startsWith('--admin-email='));
    const adminEmailArg = adminEmailFlag ? normalize(adminEmailFlag.slice('--admin-email='.length)) : '';

    if (!targetEmail || !targetEmail.includes('@')) throw new Error('Informe um e-mail de voluntário válido.');

    let targetUser;
    try {
      targetUser = await auth.getUserByEmail(targetEmail);
    } catch (error) {
      if (error?.code === 'auth/user-not-found') throw new Error(`Usuário ${targetEmail} não encontrado no Firebase Authentication.`);
      throw error;
    }

    const applicationsSnap = await db.collection('applications')
      .where('participantUids', 'array-contains', targetUser.uid)
      .limit(2)
      .get();

    if (applicationsSnap.empty) throw new Error('Nenhuma candidatura vinculada a esse usuário foi encontrada.');
    if (applicationsSnap.size > 1) throw new Error('Mais de uma candidatura vinculada ao mesmo usuário. Operação interrompida para evitar ambiguidade.');

    const appDoc = applicationsSnap.docs[0];
    const applicationId = appDoc.id;
    const application = appDoc.data() || {};
    if (application.active === false) throw new Error('A candidatura está inativa. O script não fará alterações.');
    if (!application.unitId) throw new Error('A candidatura não possui unitId.');

    const stayStart = iso(application.stayStart);
    const stayEnd = iso(application.stayEnd);
    const dates = eligibleDates(stayStart, stayEnd);
    if (!dates.length) throw new Error(`Nenhum dia útil elegível foi encontrado entre ${stayStart || '—'} e ${stayEnd || '—'}.`);

    const participantUids = Array.isArray(application.participantUids) ? application.participantUids.map(String) : [];
    const participantIndex = participantUids.indexOf(String(targetUser.uid));
    const profileDoc = await db.doc(`volunteer_profiles/${targetUser.uid}`).get();
    const profile = profileDoc.data() || {};
    const ownerName = clean(
      (participantIndex >= 0 && Array.isArray(application.participantNames) ? application.participantNames[participantIndex] : '')
      || profile.fullName
      || profile.name
      || targetUser.displayName
      || targetEmail,
    );

    const admin = await resolveAdmin(rl, adminEmailArg);
    const finalStatus = managerStatus(application.status);
    const usedActivities = ACTIVITIES.slice(0, Math.min(ACTIVITIES.length, dates.length));
    const omittedActivities = ACTIVITIES.slice(usedActivities.length);

    const planned = [];
    usedActivities.forEach((activity, index) => {
      const date = dates[index];
      activity.slots.forEach(slot => planned.push({
        date,
        name: activity.name,
        description: activity.description,
        notes: activity.notes,
        materials: '',
        duration: activity.duration,
        time: slot.time,
        period: slot.period,
      }));
    });

    const existingSnap = await db.collection('activity_sessions')
      .where('applicationId', '==', applicationId)
      .get();
    const existing = existingSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() || {}) }));

    const bySlot = new Map();
    const byExact = new Map();
    existing.forEach(row => {
      const slot = sessionKey(row.date, row.time);
      if (!bySlot.has(slot)) bySlot.set(slot, []);
      bySlot.get(slot).push(row);
      byExact.set(exactKey(row.date, row.time, row.activityName), row);
    });

    const toCreate = [];
    const alreadyPresent = [];
    const conflicts = [];

    for (const row of planned) {
      const exact = byExact.get(exactKey(row.date, row.time, row.name));
      if (exact) {
        if (samePlannedSession(exact, row)) {
          alreadyPresent.push({ planned: row, existing: exact });
        } else {
          conflicts.push({
            planned: row,
            reason: `Já existe a mesma atividade nesse horário, mas com dados diferentes (sessão ${exact.id}).`,
          });
        }
        continue;
      }

      const occupying = bySlot.get(sessionKey(row.date, row.time)) || [];
      if (occupying.length) {
        conflicts.push({
          planned: row,
          reason: `Horário já ocupado por: ${occupying.map(item => `${item.activityName || 'atividade sem nome'} [${item.id}]`).join(', ')}`,
        });
        continue;
      }

      toCreate.push(row);
    }

    console.log('\nCASA DO OLEIRO — CARGA DO PLANEJAMENTO YARENI/KENY');
    console.log('==================================================');
    console.log(`Projeto Firebase: ${PROJECT_ID}`);
    console.log(`Voluntário: ${ownerName}`);
    console.log(`E-mail: ${targetEmail}`);
    console.log(`UID: ${targetUser.uid}`);
    console.log(`Candidatura: ${applicationId}`);
    console.log(`Status da candidatura: ${application.status || '—'}`);
    console.log(`Unidade: ${application.unitName || application.unitId}`);
    console.log(`Estadia: ${stayStart} → ${stayEnd}`);
    console.log(`Administrador responsável: ${admin.email} (${admin.uid})`);
    console.log(`Grupo de todas as ocorrências: Livre`);

    console.log('\nDISTRIBUIÇÃO POR DIA');
    usedActivities.forEach((activity, index) => {
      const slots = activity.slots.map(slot => `${slot.time} (${activity.duration} min)`).join(', ');
      console.log(`${index + 1}. ${dates[index]} — ${activity.name}`);
      console.log(`   ${slots}`);
    });

    if (omittedActivities.length) {
      console.log('\nATIVIDADES SEM DIA DISPONÍVEL — NÃO SERÃO CADASTRADAS');
      omittedActivities.forEach((activity, index) => console.log(`  ${usedActivities.length + index + 1}. ${activity.name}`));
    }

    console.log('\nRESUMO');
    console.log(`Dias elegíveis encontrados: ${dates.length}`);
    console.log(`Atividades com dia disponível: ${usedActivities.length}/${ACTIVITIES.length}`);
    console.log(`Ocorrências planejadas nesses dias: ${planned.length}`);
    console.log(`Ocorrências idênticas já existentes: ${alreadyPresent.length}`);
    console.log(`Novas ocorrências a criar: ${toCreate.length}`);
    console.log(`Conflitos: ${conflicts.length}`);
    console.log(`Contadores atuais: activityCount=${Number(application.activityCount || 0)}, sessionCount=${Number(application.sessionCount || 0)}`);
    console.log(`Contadores após esta carga: activityCount=${Number(application.activityCount || 0) + toCreate.length}, sessionCount=${Number(application.sessionCount || 0) + toCreate.length}`);

    if (alreadyPresent.length) {
      console.log('\nJÁ EXISTENTES — SERÃO IGNORADAS');
      alreadyPresent.forEach(item => console.log(`  ${item.planned.date} ${item.planned.time} — ${item.planned.name}`));
    }

    if (conflicts.length) {
      console.log('\nCONFLITOS — NENHUM DADO SERÁ ALTERADO');
      conflicts.forEach(item => {
        console.log(`  ${item.planned.date} ${item.planned.time} — ${item.planned.name}`);
        console.log(`    ${item.reason}`);
      });
      throw new Error('Existem conflitos no planejamento. Resolva-os antes de executar a carga.');
    }

    if (!toCreate.length) {
      console.log('\n✓ Nada a criar. Todas as ocorrências que cabem na estadia já estão cadastradas exatamente como planejado.');
      return;
    }

    const confirmation = clean(await rl.question(`\nDigite APLICAR para criar ${toCreate.length} ocorrência(s) em produção: `));
    if (confirmation !== 'APLICAR') {
      console.log('Operação cancelada. Nenhum dado foi alterado.');
      return;
    }

    const batch = db.batch();
    const now = FieldValue.serverTimestamp();

    toCreate.forEach(row => {
      const activityRef = db.collection('activities').doc();
      const sessionRef = db.collection('activity_sessions').doc();

      const activityDefinition = {
        applicationId,
        ownerName,
        name: row.name,
        description: row.description,
        duration: row.duration,
        participation: 'Livre',
        materials: row.materials,
        notes: row.notes,
        period: row.period,
        time: row.time,
        managerCreated: true,
        status: finalStatus,
        updatedAt: now,
      };

      batch.set(activityRef, {
        ...activityDefinition,
        createdByUid: admin.uid,
        createdAt: now,
      });

      const sessionDefinition = {
        applicationId,
        activityId: activityRef.id,
        unitId: String(application.unitId),
        date: row.date,
        activityName: row.name,
        activityDescription: row.description,
        participation: 'Livre',
        materials: row.materials,
        notes: row.notes,
        ownerName,
        time: row.time,
        period: row.period,
        duration: row.duration,
        managerCreated: true,
        status: finalStatus,
        groupId: 'Livre',
        createdByUid: admin.uid,
        createdAt: now,
        updatedAt: now,
      };
      if (finalStatus === 'confirmed') sessionDefinition.confirmedAt = now;
      batch.set(sessionRef, sessionDefinition);
    });

    batch.update(appDoc.ref, {
      sessionCount: FieldValue.increment(toCreate.length),
      activityCount: FieldValue.increment(toCreate.length),
      planningCountVersion: 1,
      updatedAt: now,
    });

    await batch.commit();

    console.log(`\n✓ ${toCreate.length} ocorrência(s) criada(s) com sucesso.`);
    console.log('✓ Grupo: Livre.');
    console.log(`✓ Candidatura: ${applicationId}.`);
    console.log('✓ Nenhuma atividade existente foi removida ou sobrescrita.');
    console.log('\nRecomendação: rode npm run admin:audit -- "' + targetEmail + '" para validar os contadores e vínculos após a carga.');
  } finally {
    rl.close();
  }
}

main().catch(error => {
  console.error(`\nErro: ${error?.message || error}`);
  if (/credential|default credentials|Could not load/i.test(String(error?.message || ''))) {
    console.error('No primeiro uso do Cloud Shell: gcloud auth application-default login');
  }
  process.exitCode = 1;
});
