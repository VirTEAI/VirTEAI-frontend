// Semeia as contas de demonstração como usuários reais no banco: as 3 de
// sempre (admin/terapeuta/paciente, mesmas credenciais do MOCK_USERS
// original) mais 4 pacientes extras (vindos do antigo `src/data/patients.js`
// do front), todos vinculados ao terapeuta de demonstração — é o que dá
// dado de verdade pra "Meus Pacientes"/"Paciente Selecionado" na Fase 2.
// Também semeia 3 códigos de acesso de exemplo (pendente/utilizado/
// expirado), pra tela /codigos não ficar vazia numa base recém-criada
// (Fase 3).
//
// Rodar com: npm run db:seed (idempotente — pula quem já existe)
import 'dotenv/config';
import { and, eq, inArray } from 'drizzle-orm';
import { db, pool } from './client.js';
import { users, accessCodes, worlds, sessions, sessionAreas, registrationRequests } from './schema.js';
import { hashPassword } from '../lib/password.js';
import { CODE_TTL_MS } from '../lib/code-generator.js';

// URL pública de um arquivo em server/assets/ (versionado no git — ver
// app.js). Usa RENDER_EXTERNAL_URL (que o Render preenche sozinho em todo
// serviço web, sem precisar configurar nada manualmente) quando não há um
// SERVER_PUBLIC_URL explícito; em dev local cai em localhost.
function assetUrl(relPath) {
  const base =
    process.env.SERVER_PUBLIC_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${process.env.PORT || 4000}`;
  return `${base.replace(/\/$/, '')}/assets/${relPath}`;
}

// Todo usuário sem avatar próprio usa o mesmo ícone genérico — decisão do
// projeto (ver SafeImage.jsx), não precisa de link nenhum pra isso.
const DEMO_EMAILS = [
  'admin@virteai.com',
  'terapeuta@virteai.com',
  'paciente@virteai.com',
  'murillo.fernandes@demo.virteai.com',
  'henrique.ferraz@demo.virteai.com',
  'fabricia.santos@demo.virteai.com',
  'ana.lima@demo.virteai.com',
];

async function findByEmail(email) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

async function ensureUser({ email, password, ...rest }) {
  const existing = await findByEmail(email);
  if (existing) {
    console.log(`- já existe: ${email}`);
    return existing;
  }
  const passwordHash = await hashPassword(password);
  const [created] = await db.insert(users).values({ email, passwordHash, ...rest }).returning();
  console.log(`+ criada: ${email} (${created.role})`);
  return created;
}

async function findWorldById(id) {
  const [row] = await db.select().from(worlds).where(eq(worlds.id, id)).limit(1);
  return row ?? null;
}

async function ensureWorld({ id, ...rest }) {
  const existing = await findWorldById(id);
  if (existing) {
    console.log(`- mundo já existe: ${id}`);
    return existing;
  }
  const [created] = await db.insert(worlds).values({ id, ...rest }).returning();
  console.log(`+ mundo criado: ${id}`);
  return created;
}

async function findPendingRequestByEmail(email) {
  const [row] = await db
    .select()
    .from(registrationRequests)
    .where(and(eq(registrationRequests.email, email), eq(registrationRequests.status, 'pendente')))
    .limit(1);
  return row ?? null;
}

// Mesma ideia do `ensureUser`: só cria se ainda não tiver um pedido
// pendente desse e-mail. Senha com hash igual a um pedido de verdade
// teria — ninguém loga com ela até um admin aprovar.
async function ensureRegistrationRequest({ name, email, password, role = 'terapeuta' }) {
  const existing = await findPendingRequestByEmail(email);
  if (existing) {
    console.log(`- pedido de cadastro já existe: ${email}`);
    return existing;
  }
  const passwordHash = await hashPassword(password);
  const [created] = await db.insert(registrationRequests).values({ name, email, passwordHash, role }).returning();
  console.log(`+ pedido de cadastro criado: ${email}`);
  return created;
}

async function findCodeByString(code) {
  const [row] = await db.select().from(accessCodes).where(eq(accessCodes.code, code)).limit(1);
  return row ?? null;
}

async function findSessionByAccessCodeId(accessCodeId) {
  const [row] = await db.select().from(sessions).where(eq(sessions.accessCodeId, accessCodeId)).limit(1);
  return row ?? null;
}

// Mesma lógica do `ensureCode`: só cria se essa sessão (uma por código) já
// não existir. `areas` vem em ordem — o rank é a posição na lista.
async function ensureSession({ accessCodeId, patientId, worldId, durationSeconds, totalFixationSeconds, fixationCount, areas }) {
  const existing = await findSessionByAccessCodeId(accessCodeId);
  if (existing) {
    console.log(`- sessão já existe pro código: ${accessCodeId}`);
    return existing;
  }
  const [created] = await db
    .insert(sessions)
    .values({
      accessCodeId,
      patientId,
      worldId,
      durationSeconds,
      totalFixationSeconds,
      fixationCount,
      avgFixationSeconds: fixationCount > 0 ? totalFixationSeconds / fixationCount : 0,
    })
    .returning();
  if (areas.length > 0) {
    await db
      .insert(sessionAreas)
      .values(areas.map((area, i) => ({ sessionId: created.id, rank: i + 1, ...area })));
  }
  console.log(`+ sessão criada pro código: ${accessCodeId}`);
  return created;
}

// Mesma lógica do `ensureUser`: só cria se não existir ainda. O texto do
// código aqui é fixo (não gerado aleatoriamente) só pra ficar previsível de
// achar numa base recém-semeada.
async function ensureCode({ code, worldId, worldTitle, patientId, generatedById, status, expiresAt, usedAt }) {
  const existing = await findCodeByString(code);
  if (existing) {
    console.log(`- código já existe: ${code}`);
    return existing;
  }
  const [created] = await db
    .insert(accessCodes)
    .values({ code, worldId, worldTitle, patientId, generatedById, status, expiresAt, usedAt })
    .returning();
  console.log(`+ código criado: ${code} (${created.status})`);
  return created;
}

async function seed() {
  const admin = await ensureUser({
    name: 'Admin VirTEAI',
    email: 'admin@virteai.com',
    password: 'admin123',
    role: 'admin',
  });

  const therapist = await ensureUser({
    name: 'Carlos Alberto Pierrez',
    email: 'terapeuta@virteai.com',
    password: 'terapeuta123',
    role: 'terapeuta',
    birthDate: '28/06/1993',
    professionalId: '407821',
  });

  // "Paciente principal" de demonstração — a mesma conta que já existia,
  // agora vinculada ao terapeuta acima e com uma nota de acompanhamento.
  await ensureUser({
    name: 'Martion Felinzes Silva',
    email: 'paciente@virteai.com',
    password: 'paciente123',
    role: 'paciente',
    birthDate: '20/04/1999',
    note: 'Acompanhamento de TEA — testes AQ-10 e AQ-50',
    responsibleTherapistId: therapist.id,
  });

  // Os outros 4 pacientes que antes viviam só em src/data/patients.js —
  // usados no seletor de "Paciente Selecionado" ao gerar código de acesso e
  // na lista "Meus Pacientes" do terapeuta.
  const EXTRA_PATIENTS = [
    {
      name: 'Murillo Fernandes',
      email: 'murillo.fernandes@demo.virteai.com',
      note: 'Tratamento de Hiperatividade relacionada a carros',
    },
    {
      name: 'Henrique de Ferraz',
      email: 'henrique.ferraz@demo.virteai.com',
      note: 'Tratamento de Hiperatividade relacionada a carros',
    },
    {
      name: 'Fabricia Santos',
      email: 'fabricia.santos@demo.virteai.com',
      note: 'Acompanhamento de rotina social',
    },
    {
      name: 'Ana Beatriz Lima',
      email: 'ana.lima@demo.virteai.com',
      note: 'Terapia de comunicação alternativa',
    },
  ];

  const extraPatients = [];
  for (const patient of EXTRA_PATIENTS) {
    const created = await ensureUser({
      ...patient,
      password: 'paciente123',
      role: 'paciente',
      responsibleTherapistId: therapist.id,
    });
    extraPatients.push(created);
  }

  // Os 2 mundos que antes viviam só em src/data/worlds.js — mesmo id (slug),
  // título e descrição de sempre, agora como registros reais no banco
  // (Fase 4). `createdById` aponta pro admin, já que é quem usa o
  // formulário "Vincular Novo Mundo" pra criar mundos de verdade. Cada
  // mundo tem sua própria foto de verdade agora (server/assets/worlds/),
  // em vez de reaproveitar a mesma imagem genérica nos dois.
  const imgHome = assetUrl('worlds/mundo-home.png');
  const imgEnsino = assetUrl('worlds/mundo-ensino.png');

  await ensureWorld({
    id: 'home',
    title: 'Home',
    description:
      'Um espaço de boas-vindas para os pacientes explorarem antes de escolher o mundo do dia — um ambiente calmo, pensado para reduzir a ansiedade de início de sessão.',
    thumbnail: imgHome,
    gallery: imgHome,
    likes: 17,
    views: 20,
    createdById: admin.id,
  });

  await ensureWorld({
    id: 'ensino-fundamental',
    title: 'Ensino Fundamental',
    description:
      'Explore uma escola de ensino fundamental totalmente interativa, criada para transformar o aprendizado em uma grande aventura. Caminhe por salas de aula, biblioteca, refeitório, quadra esportiva e pátio enquanto realiza desafios e descobre novas atividades. Cada ambiente foi desenvolvido para estimular a exploração, a autonomia e o desenvolvimento de habilidades importantes para crianças com Transtorno do Espectro Autista (TEA), oferecendo uma experiência divertida, acolhedora e segura, onde aprender faz parte da brincadeira.',
    thumbnail: imgEnsino,
    gallery: imgEnsino,
    likes: 17,
    views: 20,
    createdById: admin.id,
  });

  // `ensureUser`/`ensureWorld` só criam quem ainda não existe — então, pra
  // quem já tinha rodado o seed antes (com os links antigos do Figma como
  // avatar/thumbnail/gallery), essas 2 atualizações forçadas garantem que a
  // correção chega mesmo numa base já semeada, sem precisar apagar nada.
  // Só mexe nas contas/mundos de demonstração conhecidos (listas acima),
  // nunca em dado real de um usuário de verdade.
  await db.update(users).set({ avatar: null }).where(inArray(users.email, DEMO_EMAILS));
  await db
    .update(worlds)
    .set({ thumbnail: imgHome, gallery: imgHome })
    .where(eq(worlds.id, 'home'));
  await db
    .update(worlds)
    .set({ thumbnail: imgEnsino, gallery: imgEnsino })
    .where(eq(worlds.id, 'ensino-fundamental'));

  // Códigos de exemplo — um de cada status, pra tela /codigos mostrar algo
  // reconhecível assim que a base é criada (Fase 3).
  const [murillo, henrique] = extraPatients;
  const now = Date.now();

  const usedCode = await ensureCode({
    code: 'VTA-8K2N4Q',
    worldId: 'ensino-fundamental',
    worldTitle: 'Ensino Fundamental',
    patientId: henrique.id,
    generatedById: therapist.id,
    status: 'utilizado',
    expiresAt: new Date(now - CODE_TTL_MS + 5 * 60 * 1000), // já teria expirado, mas foi usado antes
    usedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
  });

  // Relatório de sessão (Fase 5) pro único código já "utilizado" — é o que
  // faz a tela /resumo não ficar vazia numa base recém-semeada.
  await ensureSession({
    accessCodeId: usedCode.id,
    patientId: henrique.id,
    worldId: 'ensino-fundamental',
    durationSeconds: 656, // 10:56
    totalFixationSeconds: 480,
    fixationCount: 44,
    areas: [
      { name: 'Dinossauro', tag: 'Brinquedo', timeSeconds: 138 },
      { name: 'Quadro-negro', tag: 'Objeto', timeSeconds: 96 },
      { name: 'Mapa-múndi', tag: 'Objeto', timeSeconds: 74 },
      { name: 'Colega de turma', tag: 'Personagem', timeSeconds: 51 },
      { name: 'Livro aberto', tag: 'Objeto', timeSeconds: 39 },
    ],
  });

  await ensureCode({
    code: 'VTA-3F7X1P',
    worldId: 'ensino-fundamental',
    worldTitle: 'Ensino Fundamental',
    patientId: murillo.id,
    generatedById: therapist.id,
    status: 'pendente',
    expiresAt: new Date(now + CODE_TTL_MS),
    usedAt: null,
  });

  await ensureCode({
    code: 'VTA-1D9M6R',
    worldId: 'home',
    worldTitle: 'Home',
    patientId: murillo.id,
    generatedById: therapist.id,
    status: 'pendente', // "expirado" é calculado na leitura a partir de expiresAt (ver codes.controller.js)
    expiresAt: new Date(now - 24 * 60 * 60 * 1000), // expirou ontem
    usedAt: null,
  });

  // Pedidos de cadastro de exemplo — mesmos nomes que já viviam mockados em
  // DashboardAdmin.jsx (initialRequests), agora como linhas de verdade em
  // 'pendente', pra tela de notificações do admin não ficar vazia numa base
  // recém-criada.
  const SAMPLE_REQUESTS = [
    { name: 'Ana Clara Souza', email: 'ana.souza@email.com', password: 'pedido123' },
    { name: 'Carlos Eduardo Lima', email: 'carlos.eduardo@email.com', password: 'pedido123' },
    { name: 'Mariana Ferreira', email: 'mariana.ferreira@email.com', password: 'pedido123' },
  ];
  for (const request of SAMPLE_REQUESTS) {
    await ensureRegistrationRequest(request);
  }

  return { admin, therapist };
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    return pool.end().finally(() => process.exit(1));
  });
