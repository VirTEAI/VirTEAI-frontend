import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/client.js';
import { users, registrationRequests } from '../src/db/schema.js';
import { hashPassword } from '../src/lib/password.js';

const app = createApp();

// Cada teste começa com as tabelas vazias, pra não depender de ordem de
// execução nem de dados deixados por um teste anterior. registrationRequests
// entra aqui desde que POST /api/auth/register passou a gravar um pedido em
// vez de criar a conta direto.
beforeEach(async () => {
  await db.delete(registrationRequests);
  await db.delete(users);
});

afterAll(async () => {
  await db.delete(registrationRequests);
  await db.delete(users);
  await pool.end();
});

// Helper só pra esses testes de auth.test.js — insere a conta direto no
// banco (sem passar pelo pedido de cadastro, que é só pra criar terapeuta
// via aprovação do admin), útil pra testar login/me/logout sobre uma conta
// que já existe.
async function createUser(overrides) {
  const passwordHash = await hashPassword(overrides.password ?? 'senha123');
  const [created] = await db
    .insert(users)
    .values({ name: 'Fulano', role: 'paciente', ...overrides, passwordHash })
    .returning();
  return created;
}

describe('POST /api/auth/register', () => {
  it('cria um pedido de cadastro pendente (não cria conta, não loga)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ana Paula',
      email: 'ana@exemplo.com',
      password: 'senha123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeUndefined();
    expect(res.headers['set-cookie']).toBeUndefined();

    const [request_] = await db
      .select()
      .from(registrationRequests)
      .where(eq(registrationRequests.email, 'ana@exemplo.com'));
    expect(request_.status).toBe('pendente');
    expect(request_.role).toBe('terapeuta');
    expect(request_.passwordHash).not.toBe('senha123'); // nunca em texto puro

    const [user] = await db.select().from(users).where(eq(users.email, 'ana@exemplo.com'));
    expect(user).toBeUndefined(); // a conta só nasce quando um admin aprova
  });

  it('rejeita dados inválidos (e-mail malformado, senha curta)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'X',
      email: 'não-é-um-email',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  it('não deixa pedir cadastro com e-mail de conta que já existe', async () => {
    await createUser({ email: 'dup@exemplo.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup', email: 'dup@exemplo.com', password: 'senha123' });

    expect(res.status).toBe(409);
  });

  it('não deixa dois pedidos pendentes com o mesmo e-mail', async () => {
    const payload = { name: 'Rep', email: 'rep@exemplo.com', password: 'senha123' };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('loga com e-mail/senha corretos', async () => {
    await createUser({ email: 'carlos@exemplo.com', password: 'senha123', role: 'terapeuta' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carlos@exemplo.com', password: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('terapeuta');
  });

  it('recusa senha errada', async () => {
    await createUser({ email: 'bia@exemplo.com', password: 'senhacerta' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bia@exemplo.com', password: 'senhaerrada' });

    expect(res.status).toBe(401);
  });

  it('recusa e-mail que não existe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ninguem@exemplo.com', password: 'qualquer' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('bloqueia quem não tem sessão', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('devolve o usuário logado quando a sessão é válida', async () => {
    await createUser({ email: 'duda@exemplo.com', password: 'senha123', role: 'admin' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'duda@exemplo.com', password: 'senha123' });

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('duda@exemplo.com');
    expect(res.body.user.homePath).toBe('/admin');
  });
});

describe('POST /api/auth/logout', () => {
  it('limpa a sessão — /me volta a bloquear depois', async () => {
    await createUser({ email: 'leo@exemplo.com', password: 'senha123' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'leo@exemplo.com', password: 'senha123' });

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(204);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(401);
  });
});
