import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/client.js';
import { users, worlds, accessCodes, sessions, sessionAreas } from '../src/db/schema.js';
import { generateCodeString, CODE_TTL_MS } from '../src/lib/code-generator.js';
import { hashPassword } from '../src/lib/password.js';
import { toPublicUser } from '../src/lib/public-user.js';

const app = createApp();

beforeEach(async () => {
  // Ordem por causa das FKs: sessões/áreas primeiro, depois códigos, depois
  // usuários/mundos.
  await db.delete(sessionAreas);
  await db.delete(sessions);
  await db.delete(accessCodes);
  await db.delete(users);
  await db.delete(worlds);
  await db.insert(worlds).values({ id: 'ensino-fundamental', title: 'Ensino Fundamental' });
});

afterAll(async () => {
  await db.delete(sessionAreas);
  await db.delete(sessions);
  await db.delete(accessCodes);
  await db.delete(users);
  await db.delete(worlds);
  await pool.end();
});

// POST /api/auth/register não cria mais conta direto (agora é um pedido de
// cadastro pendente de aprovação — ver registration-requests.test.js), então
// os testes que só precisam de "um usuário logado qualquer" inserem direto
// no banco (mesma senha com hash que o endpoint de verdade geraria) e
// logam pelo /api/auth/login de sempre.
async function createLoggedInUser(overrides) {
  const { password = 'senha123', email = `fulano-${Math.random().toString(36).slice(2)}@exemplo.com`, ...rest } =
    overrides ?? {};
  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({ name: 'Fulano', role: 'paciente', ...rest, email, passwordHash })
    .returning();
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password });
  return { agent, user: toPublicUser(created) };
}

async function linkPatientToTherapist(patientId, therapistId) {
  await db.update(users).set({ responsibleTherapistId: therapistId }).where(eq(users.id, patientId));
}

// Cria um código de acesso já com status "utilizado" direto no banco — o
// que testar aqui é a Fase 5 (sessão), não o fluxo de validação em si (já
// coberto em codes.test.js), então pula direto pro estado que a sessão
// precisa encontrar.
async function createUsedCode({ patientId, therapistId, worldId = 'ensino-fundamental' }) {
  const [code] = await db
    .insert(accessCodes)
    .values({
      code: generateCodeString(),
      worldId,
      worldTitle: 'Ensino Fundamental',
      patientId,
      generatedById: therapistId,
      status: 'utilizado',
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      usedAt: new Date(),
    })
    .returning();
  return code;
}

const TELEMETRY = {
  durationSeconds: 656,
  totalFixationSeconds: 480,
  fixationCount: 12,
  areas: [
    { name: 'Dinossauro', tag: 'Brinquedo', timeSeconds: 138 },
    { name: 'Quadro-negro', tag: 'Objeto', timeSeconds: 96 },
  ],
};

describe('POST /api/sessions', () => {
  it('exige sessão ativa (401)', async () => {
    const res = await request(app).post('/api/sessions').send({ code: 'VTA-000000', ...TELEMETRY });
    expect(res.status).toBe(401);
  });

  it('código inexistente -> 404', async () => {
    const { agent } = await createLoggedInUser({ role: 'paciente' });
    const res = await agent.post('/api/sessions').send({ code: 'VTA-000000', ...TELEMETRY });
    expect(res.status).toBe(404);
  });

  it('código ainda não validado (pendente) -> 409', async () => {
    const { agent, user: patient } = await createLoggedInUser({ role: 'paciente' });
    const { user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const [pendingCode] = await db
      .insert(accessCodes)
      .values({
        code: generateCodeString(),
        worldId: 'ensino-fundamental',
        worldTitle: 'Ensino Fundamental',
        patientId: patient.id,
        generatedById: therapist.id,
        status: 'pendente',
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      })
      .returning();

    const res = await agent.post('/api/sessions').send({ code: pendingCode.code, ...TELEMETRY });
    expect(res.status).toBe(409);
  });

  it('registra a sessão e calcula a média de fixação', async () => {
    const { agent, user: patient } = await createLoggedInUser({ role: 'paciente' });
    const { user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const code = await createUsedCode({ patientId: patient.id, therapistId: therapist.id });

    const res = await agent.post('/api/sessions').send({ code: code.code, ...TELEMETRY });
    expect(res.status).toBe(201);
    expect(res.body.session.durationSeconds).toBe(656);
    expect(res.body.session.avgFixationSeconds).toBeCloseTo(480 / 12, 5);
    expect(res.body.session.areas).toHaveLength(2);
    expect(res.body.session.areas[0]).toMatchObject({ rank: 1, name: 'Dinossauro', tag: 'Brinquedo', timeSeconds: 138 });
  });

  it('não deixa registrar duas sessões pro mesmo código -> 409', async () => {
    const { agent, user: patient } = await createLoggedInUser({ role: 'paciente' });
    const { user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const code = await createUsedCode({ patientId: patient.id, therapistId: therapist.id });

    await agent.post('/api/sessions').send({ code: code.code, ...TELEMETRY });
    const res = await agent.post('/api/sessions').send({ code: code.code, ...TELEMETRY });
    expect(res.status).toBe(409);
  });

  it('dados inválidos -> 400', async () => {
    const { agent } = await createLoggedInUser({ role: 'paciente' });
    const res = await agent.post('/api/sessions').send({ code: 'VTA-000000', durationSeconds: -1 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/sessions/by-code/:code', () => {
  async function setupSession() {
    const { user: patient } = await createLoggedInUser({ name: 'Paciente Dono', role: 'paciente' });
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    await linkPatientToTherapist(patient.id, therapist.id);
    const code = await createUsedCode({ patientId: patient.id, therapistId: therapist.id });
    await therapistAgent.post('/api/sessions').send({ code: code.code, ...TELEMETRY });
    return { patient, therapist, code };
  }

  it('exige sessão ativa (401)', async () => {
    const res = await request(app).get('/api/sessions/by-code/VTA-000000');
    expect(res.status).toBe(401);
  });

  it('código sem sessão registrada -> 404', async () => {
    const { agent, user: patient } = await createLoggedInUser({ role: 'paciente' });
    const { user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const code = await createUsedCode({ patientId: patient.id, therapistId: therapist.id });
    const res = await agent.get(`/api/sessions/by-code/${code.code}`);
    expect(res.status).toBe(404);
  });

  it('o próprio paciente vê a sessão', async () => {
    const { patient, code } = await setupSession();
    const patientAgent = request.agent(app);
    // login separado pro paciente já criado em setupSession
    await patientAgent.post('/api/auth/login').send({ email: patient.email, password: 'senha123' });
    const res = await patientAgent.get(`/api/sessions/by-code/${code.code}`);
    expect(res.status).toBe(200);
    expect(res.body.session.patientId).toBe(patient.id);
  });

  it('outro paciente não tem acesso (403)', async () => {
    const { code } = await setupSession();
    const { agent: strangerAgent } = await createLoggedInUser({ role: 'paciente' });
    const res = await strangerAgent.get(`/api/sessions/by-code/${code.code}`);
    expect(res.status).toBe(403);
  });

  it('terapeuta vinculado ao paciente vê a sessão', async () => {
    const { therapist, code } = await setupSession();
    const therapistAgent = request.agent(app);
    await therapistAgent.post('/api/auth/login').send({ email: therapist.email, password: 'senha123' });
    const res = await therapistAgent.get(`/api/sessions/by-code/${code.code}`);
    expect(res.status).toBe(200);
  });

  it('terapeuta não vinculado ao paciente não tem acesso (403)', async () => {
    const { code } = await setupSession();
    const { agent: strangerTherapistAgent } = await createLoggedInUser({ role: 'terapeuta' });
    const res = await strangerTherapistAgent.get(`/api/sessions/by-code/${code.code}`);
    expect(res.status).toBe(403);
  });

  it('admin vê qualquer sessão', async () => {
    const { code } = await setupSession();
    const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
    const res = await adminAgent.get(`/api/sessions/by-code/${code.code}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/sessions/latest', () => {
  it('sem worldId -> 400', async () => {
    const { agent } = await createLoggedInUser({ role: 'paciente' });
    const res = await agent.get('/api/sessions/latest');
    expect(res.status).toBe(400);
  });

  it('nenhuma sessão pra esse mundo -> 404', async () => {
    const { agent } = await createLoggedInUser({ role: 'paciente' });
    const res = await agent.get('/api/sessions/latest?worldId=ensino-fundamental');
    expect(res.status).toBe(404);
  });

  it('paciente vê a própria sessão mais recente do mundo', async () => {
    const { agent: patientAgent, user: patient } = await createLoggedInUser({ role: 'paciente' });
    const { user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const code = await createUsedCode({ patientId: patient.id, therapistId: therapist.id });
    await patientAgent.post('/api/sessions').send({ code: code.code, ...TELEMETRY });

    const res = await patientAgent.get('/api/sessions/latest?worldId=ensino-fundamental');
    expect(res.status).toBe(200);
    expect(res.body.session.patientId).toBe(patient.id);
  });

  it('terapeuta vê a sessão mais recente entre os pacientes dele', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: patient } = await createLoggedInUser({ role: 'paciente' });
    await linkPatientToTherapist(patient.id, therapist.id);
    const code = await createUsedCode({ patientId: patient.id, therapistId: therapist.id });
    await therapistAgent.post('/api/sessions').send({ code: code.code, ...TELEMETRY });

    const res = await therapistAgent.get('/api/sessions/latest?worldId=ensino-fundamental');
    expect(res.status).toBe(200);
    expect(res.body.session.patientId).toBe(patient.id);
  });

  it('terapeuta com patientId -> só a sessão daquele paciente específico, mesmo com outro mais recente', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: patientA } = await createLoggedInUser({ role: 'paciente' });
    const { user: patientB } = await createLoggedInUser({ role: 'paciente' });
    await linkPatientToTherapist(patientA.id, therapist.id);
    await linkPatientToTherapist(patientB.id, therapist.id);

    const codeA = await createUsedCode({ patientId: patientA.id, therapistId: therapist.id });
    await therapistAgent.post('/api/sessions').send({ code: codeA.code, ...TELEMETRY });
    // Sessão de B é criada depois (mais recente) — sem filtrar por
    // patientId, seria essa que viria como "latest".
    const codeB = await createUsedCode({ patientId: patientB.id, therapistId: therapist.id });
    await therapistAgent.post('/api/sessions').send({ code: codeB.code, ...TELEMETRY });

    const res = await therapistAgent.get(
      `/api/sessions/latest?worldId=ensino-fundamental&patientId=${patientA.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.session.patientId).toBe(patientA.id);
  });

  it('terapeuta com patientId de um paciente que não é dele -> 404 (não vaza sessão alheia)', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: otherTherapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: strangerPatient } = await createLoggedInUser({ role: 'paciente' });
    await linkPatientToTherapist(strangerPatient.id, otherTherapist.id);
    const code = await createUsedCode({ patientId: strangerPatient.id, therapistId: otherTherapist.id });
    await therapistAgent.post('/api/sessions').send({ code: code.code, ...TELEMETRY });

    const res = await therapistAgent.get(
      `/api/sessions/latest?worldId=ensino-fundamental&patientId=${strangerPatient.id}`
    );
    expect(res.status).toBe(404);
  });

  it('admin com patientId -> só a sessão daquele paciente', async () => {
    const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
    const { user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: patient } = await createLoggedInUser({ role: 'paciente' });
    const code = await createUsedCode({ patientId: patient.id, therapistId: therapist.id });
    await adminAgent.post('/api/sessions').send({ code: code.code, ...TELEMETRY });

    const res = await adminAgent.get(
      `/api/sessions/latest?worldId=ensino-fundamental&patientId=${patient.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.session.patientId).toBe(patient.id);
  });
});
