import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/client.js';
import { users, registrationRequests } from '../src/db/schema.js';
import { hashPassword } from '../src/lib/password.js';

const app = createApp();

beforeEach(async () => {
  await db.delete(registrationRequests);
  await db.delete(users);
});

afterAll(async () => {
  await db.delete(registrationRequests);
  await db.delete(users);
  await pool.end();
});

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
  return { agent, user: created };
}

// Insere um pedido de cadastro direto no banco (status 'pendente' por
// padrão) e devolve a senha em texto puro junto, útil pra testar que a
// aprovação deixa logar com ela depois.
async function createRequest(overrides = {}) {
  const { password = 'senha123', email = `pedido-${Math.random().toString(36).slice(2)}@exemplo.com`, ...rest } =
    overrides;
  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(registrationRequests)
    .values({ name: 'Pedido Fulano', role: 'terapeuta', status: 'pendente', ...rest, email, passwordHash })
    .returning();
  return { request: created, password };
}

describe('GET /api/registration-requests', () => {
  it('bloqueia quem não tem sessão', async () => {
    const res = await request(app).get('/api/registration-requests');
    expect(res.status).toBe(401);
  });

  it('bloqueia quem não é admin', async () => {
    const { agent } = await createLoggedInUser({ role: 'terapeuta' });
    const res = await agent.get('/api/registration-requests');
    expect(res.status).toBe(403);
  });

  it('admin lista todos os pedidos, mais recente primeiro, sem expor a senha', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    await createRequest({ name: 'Primeiro', email: 'primeiro@exemplo.com' });
    await createRequest({ name: 'Segundo', email: 'segundo@exemplo.com' });

    const res = await agent.get('/api/registration-requests');
    expect(res.status).toBe(200);
    expect(res.body.requests).toHaveLength(2);
    expect(res.body.requests[0].name).toBe('Segundo');
    expect(res.body.requests[0].passwordHash).toBeUndefined();
  });

  it('filtra por status', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    await createRequest({ email: 'pendente@exemplo.com', status: 'pendente' });
    await createRequest({ email: 'rejeitado@exemplo.com', status: 'rejeitado' });

    const res = await agent.get('/api/registration-requests?status=pendente');
    expect(res.status).toBe(200);
    expect(res.body.requests).toHaveLength(1);
    expect(res.body.requests[0].email).toBe('pendente@exemplo.com');
  });
});

describe('POST /api/registration-requests/:id/approve', () => {
  it('bloqueia quem não é admin', async () => {
    const { agent } = await createLoggedInUser({ role: 'terapeuta' });
    const { request: req } = await createRequest();
    const res = await agent.post(`/api/registration-requests/${req.id}/approve`);
    expect(res.status).toBe(403);
  });

  it('404 pra pedido inexistente', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const res = await agent.post('/api/registration-requests/00000000-0000-0000-0000-000000000000/approve');
    expect(res.status).toBe(404);
  });

  it('cria a conta com os dados do pedido e a senha que a pessoa já tinha escolhido; marca o pedido como aprovado', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const { request: req, password } = await createRequest({ name: 'Nova Terapeuta', email: 'nova@exemplo.com' });

    const res = await agent.post(`/api/registration-requests/${req.id}/approve`);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('nova@exemplo.com');
    expect(res.body.user.role).toBe('terapeuta');
    expect(res.body.user.passwordHash).toBeUndefined();

    // A pessoa já consegue logar com a mesma senha que informou no pedido
    // — não precisa de nenhum passo extra depois da aprovação.
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'nova@exemplo.com', password });
    expect(loginRes.status).toBe(200);

    const [updatedRequest] = await db.select().from(registrationRequests).where(eq(registrationRequests.id, req.id));
    expect(updatedRequest.status).toBe('aprovado');
    expect(updatedRequest.decidedAt).not.toBeNull();
  });

  it('não deixa aprovar duas vezes', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const { request: req } = await createRequest();
    await agent.post(`/api/registration-requests/${req.id}/approve`);

    const res = await agent.post(`/api/registration-requests/${req.id}/approve`);
    expect(res.status).toBe(409);
  });

  it('bloqueia se já existe conta de verdade com esse e-mail', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const { request: req } = await createRequest({ email: 'corrida@exemplo.com' });
    await createLoggedInUser({ email: 'corrida@exemplo.com' });

    const res = await agent.post(`/api/registration-requests/${req.id}/approve`);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/registration-requests/:id/reject', () => {
  it('bloqueia quem não é admin', async () => {
    const { agent } = await createLoggedInUser({ role: 'terapeuta' });
    const { request: req } = await createRequest();
    const res = await agent.post(`/api/registration-requests/${req.id}/reject`);
    expect(res.status).toBe(403);
  });

  it('404 pra pedido inexistente', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const res = await agent.post('/api/registration-requests/00000000-0000-0000-0000-000000000000/reject');
    expect(res.status).toBe(404);
  });

  it('marca como rejeitado e não cria conta nenhuma', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const { request: req } = await createRequest({ email: 'negado@exemplo.com' });

    const res = await agent.post(`/api/registration-requests/${req.id}/reject`);
    expect(res.status).toBe(204);

    const [updatedRequest] = await db.select().from(registrationRequests).where(eq(registrationRequests.id, req.id));
    expect(updatedRequest.status).toBe('rejeitado');

    const [user] = await db.select().from(users).where(eq(users.email, 'negado@exemplo.com'));
    expect(user).toBeUndefined();
  });

  it('não deixa negar duas vezes', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const { request: req } = await createRequest();
    await agent.post(`/api/registration-requests/${req.id}/reject`);

    const res = await agent.post(`/api/registration-requests/${req.id}/reject`);
    expect(res.status).toBe(409);
  });
});
