import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/client.js';
import { users } from '../src/db/schema.js';
import { hashPassword } from '../src/lib/password.js';
import { toPublicUser } from '../src/lib/public-user.js';

const app = createApp();

beforeEach(async () => {
  await db.delete(users);
});

afterAll(async () => {
  await db.delete(users);
  await pool.end();
});

// Cria e já loga um usuário, devolvendo o agent (com cookie de sessão) e o
// usuário criado. POST /api/auth/register não cria mais conta direto (agora
// é um pedido de cadastro pendente de aprovação — ver
// registration-requests.test.js), então insere direto no banco (mesma senha
// com hash que o endpoint de verdade geraria) e loga pelo /api/auth/login.
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

describe('DELETE /api/users/:id', () => {
  it('exige sessão ativa (401)', async () => {
    const res = await request(app).delete('/api/users/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });

  it('terapeuta não pode excluir ninguém (403)', async () => {
    const { agent: therapistAgent } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: patient } = await createLoggedInUser({ role: 'paciente' });
    const res = await therapistAgent.delete(`/api/users/${patient.id}`);
    expect(res.status).toBe(403);
  });

  it('admin exclui a conta de um terapeuta', async () => {
    const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
    const { user: therapist } = await createLoggedInUser({ role: 'terapeuta' });

    const res = await adminAgent.delete(`/api/users/${therapist.id}`);
    expect(res.status).toBe(204);

    const after = await adminAgent.get(`/api/users/${therapist.id}`);
    expect(after.status).toBe(404);
  });

  it('pacientes vinculados ao terapeuta excluído ficam sem terapeuta (não quebram)', async () => {
    const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
    const { user: therapist } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: patient } = await createLoggedInUser({ role: 'paciente' });
    await linkPatientToTherapist(patient.id, therapist.id);

    const res = await adminAgent.delete(`/api/users/${therapist.id}`);
    expect(res.status).toBe(204);

    const patientAfter = await adminAgent.get(`/api/users/${patient.id}`);
    expect(patientAfter.status).toBe(200);
    expect(patientAfter.body.user.responsibleTherapistId).toBeNull();
  });

  it('admin não pode excluir a própria conta (400)', async () => {
    const { agent: adminAgent, user: admin } = await createLoggedInUser({ role: 'admin' });
    const res = await adminAgent.delete(`/api/users/${admin.id}`);
    expect(res.status).toBe(400);
  });

  it('usuário inexistente -> 404', async () => {
    const { agent: adminAgent } = await createLoggedInUser({ role: 'admin' });
    const res = await adminAgent.delete('/api/users/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
