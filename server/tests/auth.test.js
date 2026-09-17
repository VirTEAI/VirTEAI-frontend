import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/client.js';
import { users } from '../src/db/schema.js';

const app = createApp();

// Cada teste começa com a tabela de usuários vazia, pra não depender de
// ordem de execução nem de dados deixados por um teste anterior.
beforeEach(async () => {
  await db.delete(users);
});

afterAll(async () => {
  await db.delete(users);
  await pool.end();
});

describe('POST /api/auth/register', () => {
  it('cria a conta, nunca devolve a senha e já loga (cookie de sessão)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ana Paula',
      email: 'ana@exemplo.com',
      password: 'senha123',
      role: 'paciente',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ana@exemplo.com');
    expect(res.body.user.role).toBe('paciente');
    expect(res.body.user.homePath).toBe('/dashboard');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']?.[0]).toMatch(/virteai_session=/);
  });

  it('rejeita dados inválidos (e-mail malformado, senha curta)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'X',
      email: 'não-é-um-email',
      password: '123',
      role: 'paciente',
    });
    expect(res.status).toBe(400);
  });

  it('não deixa criar duas contas com o mesmo e-mail', async () => {
    const payload = { name: 'Dup', email: 'dup@exemplo.com', password: 'senha123', role: 'admin' };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...payload, name: 'Dup 2' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('loga com e-mail/senha corretos', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Carlos',
      email: 'carlos@exemplo.com',
      password: 'senha123',
      role: 'terapeuta',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carlos@exemplo.com', password: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('terapeuta');
  });

  it('recusa senha errada', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Bia',
      email: 'bia@exemplo.com',
      password: 'senhacerta',
      role: 'paciente',
    });

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
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      name: 'Duda',
      email: 'duda@exemplo.com',
      password: 'senha123',
      role: 'admin',
    });

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('duda@exemplo.com');
    expect(res.body.user.homePath).toBe('/admin');
  });
});

describe('POST /api/auth/logout', () => {
  it('limpa a sessão — /me volta a bloquear depois', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      name: 'Léo',
      email: 'leo@exemplo.com',
      password: 'senha123',
      role: 'paciente',
    });

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(204);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(401);
  });
});
