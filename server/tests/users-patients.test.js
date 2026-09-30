import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/client.js';
import { users } from '../src/db/schema.js';

const app = createApp();

beforeEach(async () => {
  await db.delete(users);
});

afterAll(async () => {
  await db.delete(users);
  await pool.end();
});

// Cria e já loga um usuário, devolvendo o agent (com cookie de sessão) e o
// usuário criado.
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

describe('GET /api/patients', () => {
  it('paciente não acessa (403)', async () => {
    const { agent } = await createLoggedInUser({ role: 'paciente' });
    const res = await agent.get('/api/patients');
    expect(res.status).toBe(403);
  });

  it('terapeuta só vê os próprios pacientes', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({
      name: 'Dra. Ana',
      role: 'terapeuta',
    });
    const { user: myPatient } = await createLoggedInUser({ name: 'Meu Paciente', role: 'paciente' });
    const { user: otherPatient } = await createLoggedInUser({ name: 'Outro Paciente', role: 'paciente' });
    await linkPatientToTherapist(myPatient.id, therapist.id);
    // otherPatient fica sem terapeuta vinculado.

    const res = await therapistAgent.get('/api/patients');
    expect(res.status).toBe(200);
    const names = res.body.patients.map((p) => p.name);
    expect(names).toContain('Meu Paciente');
    expect(names).not.toContain('Outro Paciente');
  });

  it('admin vê todos os pacientes, vinculados ou não', async () => {
    const { agent: adminAgent } = await createLoggedInUser({ name: 'Admin', role: 'admin' });
    await createLoggedInUser({ name: 'Paciente A', role: 'paciente' });
    await createLoggedInUser({ name: 'Paciente B', role: 'paciente' });

    const res = await adminAgent.get('/api/patients');
    expect(res.status).toBe(200);
    expect(res.body.patients.length).toBe(2);
  });
});

describe('GET /api/users/:id', () => {
  it('um paciente não vê o perfil de outro paciente sem relação', async () => {
    const { agent } = await createLoggedInUser({ name: 'Paciente 1', role: 'paciente' });
    const { user: other } = await createLoggedInUser({ name: 'Paciente 2', role: 'paciente' });

    const res = await agent.get(`/api/users/${other.id}`);
    expect(res.status).toBe(403);
  });

  it('paciente vê o próprio terapeuta responsável', async () => {
    const { user: therapist } = await createLoggedInUser({ name: 'Dr. João', role: 'terapeuta' });
    const { agent: patientAgent, user: patient } = await createLoggedInUser({
      name: 'Paciente Vinculado',
      role: 'paciente',
    });
    await linkPatientToTherapist(patient.id, therapist.id);

    const res = await patientAgent.get(`/api/users/${therapist.id}`);
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Dr. João');
  });

  it('terapeuta vê um paciente vinculado a ele, mas não um que não é seu', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({
      name: 'Dra. Bia',
      role: 'terapeuta',
    });
    const { user: myPatient } = await createLoggedInUser({ name: 'Meu Paciente', role: 'paciente' });
    const { user: strangerPatient } = await createLoggedInUser({ name: 'Estranho', role: 'paciente' });
    await linkPatientToTherapist(myPatient.id, therapist.id);

    const ok = await therapistAgent.get(`/api/users/${myPatient.id}`);
    expect(ok.status).toBe(200);

    const blocked = await therapistAgent.get(`/api/users/${strangerPatient.id}`);
    expect(blocked.status).toBe(403);
  });
});

describe('PATCH /api/users/:id', () => {
  it('paciente nunca pode editar (nem o próprio perfil)', async () => {
    const { agent, user } = await createLoggedInUser({ role: 'paciente' });
    const res = await agent.patch(`/api/users/${user.id}`).send({ name: 'Novo Nome' });
    expect(res.status).toBe(403);
  });

  it('terapeuta edita um paciente vinculado a ele', async () => {
    const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: myPatient } = await createLoggedInUser({ name: 'Antes', role: 'paciente' });
    await linkPatientToTherapist(myPatient.id, therapist.id);

    const res = await therapistAgent
      .patch(`/api/users/${myPatient.id}`)
      .send({ name: 'Depois', note: 'Evoluindo bem' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Depois');
    expect(res.body.user.note).toBe('Evoluindo bem');
  });

  it('terapeuta não edita um paciente que não é seu', async () => {
    const { agent: therapistAgent } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: strangerPatient } = await createLoggedInUser({ role: 'paciente' });

    const res = await therapistAgent.patch(`/api/users/${strangerPatient.id}`).send({ name: 'Hackeado' });
    expect(res.status).toBe(403);
  });

  it('admin edita qualquer perfil', async () => {
    const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
    const { user: someone } = await createLoggedInUser({ role: 'terapeuta' });

    const res = await adminAgent.patch(`/api/users/${someone.id}`).send({ name: 'Editado pelo admin' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Editado pelo admin');
  });

  it('recusa e-mail duplicado', async () => {
    const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
    const { user: someone } = await createLoggedInUser({ role: 'terapeuta', email: 'ocupado@exemplo.com' });
    const { user: target } = await createLoggedInUser({ role: 'terapeuta' });

    const res = await adminAgent.patch(`/api/users/${target.id}`).send({ email: someone.email });
    expect(res.status).toBe(409);
  });

  describe('responsibleTherapistId (Gerenciar Terapeutas)', () => {
    it('admin vincula um paciente a um terapeuta', async () => {
      const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
      const { user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
      const { user: patient } = await createLoggedInUser({ role: 'paciente' });

      const res = await adminAgent
        .patch(`/api/users/${patient.id}`)
        .send({ responsibleTherapistId: therapist.id });
      expect(res.status).toBe(200);
      expect(res.body.user.responsibleTherapistId).toBe(therapist.id);
    });

    it('admin desvincula um paciente (responsibleTherapistId: null)', async () => {
      const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
      const { user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
      const { user: patient } = await createLoggedInUser({ role: 'paciente' });
      await linkPatientToTherapist(patient.id, therapist.id);

      const res = await adminAgent
        .patch(`/api/users/${patient.id}`)
        .send({ responsibleTherapistId: null });
      expect(res.status).toBe(200);
      expect(res.body.user.responsibleTherapistId).toBeNull();
    });

    it('terapeuta não pode reatribuir o próprio paciente a outro terapeuta', async () => {
      const { agent: therapistAgent, user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
      const { user: otherTherapist } = await createLoggedInUser({ role: 'terapeuta' });
      const { user: patient } = await createLoggedInUser({ role: 'paciente' });
      await linkPatientToTherapist(patient.id, therapist.id);

      const res = await therapistAgent
        .patch(`/api/users/${patient.id}`)
        .send({ responsibleTherapistId: otherTherapist.id });
      expect(res.status).toBe(403);
    });

    it('recusa vincular terapeuta a um alvo que não é paciente', async () => {
      const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
      const { user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
      const { user: anotherTherapist } = await createLoggedInUser({ role: 'terapeuta' });

      const res = await adminAgent
        .patch(`/api/users/${anotherTherapist.id}`)
        .send({ responsibleTherapistId: therapist.id });
      expect(res.status).toBe(400);
    });

    it('recusa vincular a um id que não é terapeuta', async () => {
      const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
      const { user: patient } = await createLoggedInUser({ role: 'paciente' });
      const { user: notATherapist } = await createLoggedInUser({ role: 'paciente' });

      const res = await adminAgent
        .patch(`/api/users/${patient.id}`)
        .send({ responsibleTherapistId: notATherapist.id });
      expect(res.status).toBe(400);
    });
  });
});
