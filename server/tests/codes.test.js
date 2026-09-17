import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/client.js';
import { users, accessCodes, worlds } from '../src/db/schema.js';

const app = createApp();

beforeEach(async () => {
  // access_codes referencia users e worlds com ON DELETE CASCADE/RESTRICT,
  // então limpa nessa ordem: códigos primeiro, depois o resto.
  await db.delete(accessCodes);
  await db.delete(users);
  await db.delete(worlds);
  // Mundo fixo usado pelos testes (Fase 4: worldId agora é FK de verdade
  // pra `worlds`, não basta mais mandar qualquer string no POST /api/codes).
  await db.insert(worlds).values({ id: 'ensino-fundamental', title: 'Ensino Fundamental' });
});

afterAll(async () => {
  await db.delete(accessCodes);
  await db.delete(users);
  await db.delete(worlds);
  await pool.end();
});

async function createLoggedInUser(overrides) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({
    name: 'Fulano',
    email: `fulano-${Math.random().toString(36).slice(2)}@exemplo.com`,
    password: 'senha123',
    role: 'paciente',
    ...overrides,
  });
  return { agent, user: res.body.user };
}

async function linkPatientToTherapist(patientId, therapistId) {
  await db.update(users).set({ responsibleTherapistId: therapistId }).where(eq(users.id, patientId));
}

const WORLD = { worldId: 'ensino-fundamental' };

describe('POST /api/codes', () => {
  it('paciente não pode gerar código (403)', async () => {
    const { agent, user } = await createLoggedInUser({ role: 'paciente' });
    const res = await agent.post('/api/codes').send({ ...WORLD, patientId: user.id });
    expect(res.status).toBe(403);
  });

  it('terapeuta gera código pra um paciente vinculado a ele', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: patient } = await createLoggedInUser({ name: 'Meu Paciente', role: 'paciente' });
    await linkPatientToTherapist(patient.id, therapist.id);

    const res = await therapistAgent.post('/api/codes').send({ ...WORLD, patientId: patient.id });
    expect(res.status).toBe(201);
    expect(res.body.code.code).toMatch(/^VTA-[A-Z0-9]{6}$/);
    expect(res.body.code.status).toBe('pendente');
    expect(res.body.code.patientName).toBe('Meu Paciente');
    expect(res.body.code.worldTitle).toBe('Ensino Fundamental');
  });

  it('terapeuta não gera código pra um paciente que não é seu (403)', async () => {
    const { agent: therapistAgent } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: strangerPatient } = await createLoggedInUser({ role: 'paciente' });

    const res = await therapistAgent.post('/api/codes').send({ ...WORLD, patientId: strangerPatient.id });
    expect(res.status).toBe(403);
  });

  it('admin gera código pra qualquer paciente', async () => {
    const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
    const { user: patient } = await createLoggedInUser({ role: 'paciente' });

    const res = await adminAgent.post('/api/codes').send({ ...WORLD, patientId: patient.id });
    expect(res.status).toBe(201);
  });

  it('paciente inexistente -> 404', async () => {
    const { agent: therapistAgent } = await createLoggedInUser({ role: 'terapeuta' });
    const res = await therapistAgent
      .post('/api/codes')
      .send({ ...WORLD, patientId: '00000000-0000-0000-0000-000000000000' });
    expect(res.status).toBe(404);
  });

  it('dados inválidos -> 400', async () => {
    const { agent: therapistAgent } = await createLoggedInUser({ role: 'terapeuta' });
    const res = await therapistAgent.post('/api/codes').send({ worldId: '', patientId: 'não-é-uuid' });
    expect(res.status).toBe(400);
  });

  it('mundo inexistente -> 404', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: patient } = await createLoggedInUser({ role: 'paciente' });
    await linkPatientToTherapist(patient.id, therapist.id);

    const res = await therapistAgent.post('/api/codes').send({ worldId: 'mundo-que-nao-existe', patientId: patient.id });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/codes', () => {
  it('terapeuta só vê os códigos que ele mesmo gerou', async () => {
    const { agent: therapistAAgent, user: therapistA } = await createLoggedInUser({
      name: 'Terapeuta A',
      role: 'terapeuta',
    });
    const { agent: therapistBAgent, user: therapistB } = await createLoggedInUser({
      name: 'Terapeuta B',
      role: 'terapeuta',
    });
    const { user: patientA } = await createLoggedInUser({ name: 'Paciente A', role: 'paciente' });
    const { user: patientB } = await createLoggedInUser({ name: 'Paciente B', role: 'paciente' });
    await linkPatientToTherapist(patientA.id, therapistA.id);
    await linkPatientToTherapist(patientB.id, therapistB.id);

    await therapistAAgent.post('/api/codes').send({ ...WORLD, patientId: patientA.id });
    await therapistBAgent.post('/api/codes').send({ ...WORLD, patientId: patientB.id });

    const res = await therapistAAgent.get('/api/codes');
    expect(res.status).toBe(200);
    expect(res.body.codes.length).toBe(1);
    expect(res.body.codes[0].patientName).toBe('Paciente A');
  });

  it('admin vê todos os códigos', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
    const { user: patient } = await createLoggedInUser({ role: 'paciente' });
    await linkPatientToTherapist(patient.id, therapist.id);

    await therapistAgent.post('/api/codes').send({ ...WORLD, patientId: patient.id });

    const res = await adminAgent.get('/api/codes');
    expect(res.status).toBe(200);
    expect(res.body.codes.length).toBe(1);
  });
});

describe('POST /api/codes/validate', () => {
  it('valida um código pendente e marca como utilizado', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { agent: patientAgent, user: patient } = await createLoggedInUser({ role: 'paciente' });
    await linkPatientToTherapist(patient.id, therapist.id);

    const created = await therapistAgent.post('/api/codes').send({ ...WORLD, patientId: patient.id });
    const { code } = created.body.code;

    const res = await patientAgent.post('/api/codes/validate').send({ code });
    expect(res.status).toBe(200);
    expect(res.body.code.status).toBe('utilizado');
    expect(res.body.code.usedAt).not.toBeNull();
  });

  it('recusa validar um código já utilizado (409)', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { agent: patientAgent, user: patient } = await createLoggedInUser({ role: 'paciente' });
    await linkPatientToTherapist(patient.id, therapist.id);

    const created = await therapistAgent.post('/api/codes').send({ ...WORLD, patientId: patient.id });
    const { code } = created.body.code;

    await patientAgent.post('/api/codes/validate').send({ code });
    const res = await patientAgent.post('/api/codes/validate').send({ code });
    expect(res.status).toBe(409);
  });

  it('recusa validar um código expirado (410)', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { agent: patientAgent, user: patient } = await createLoggedInUser({ role: 'paciente' });
    await linkPatientToTherapist(patient.id, therapist.id);

    const created = await therapistAgent.post('/api/codes').send({ ...WORLD, patientId: patient.id });
    const { code, id } = created.body.code;

    // Simula a passagem do tempo: força expiresAt pro passado direto no banco
    // (esperar ~4h de verdade no teste não é viável).
    await db
      .update(accessCodes)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(accessCodes.id, id));

    const res = await patientAgent.post('/api/codes/validate').send({ code });
    expect(res.status).toBe(410);
  });

  it('código inexistente -> 404', async () => {
    const { agent } = await createLoggedInUser({ role: 'paciente' });
    const res = await agent.post('/api/codes/validate').send({ code: 'VTA-000000' });
    expect(res.status).toBe(404);
  });

  it('exige sessão ativa (401)', async () => {
    const res = await request(app).post('/api/codes/validate').send({ code: 'VTA-000000' });
    expect(res.status).toBe(401);
  });
});
