import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/client.js';
import { users } from '../src/db/schema.js';
import { hashPassword } from '../src/lib/password.js';

const app = createApp();

// POST /api/auth/register não cria mais conta direto (agora é um pedido de
// cadastro pendente de aprovação), então insere direto no banco — esses
// testes só precisam que a conta já exista pra testar o fluxo de "esqueci
// minha senha" sobre ela.
async function registerUser(overrides = {}) {
  const { password = 'senhaAntiga1', ...rest } = overrides;
  const passwordHash = await hashPassword(password);
  return db
    .insert(users)
    .values({ name: 'Fulana', email: 'fulana@exemplo.com', role: 'paciente', ...rest, passwordHash })
    .returning();
}

beforeEach(async () => {
  await db.delete(users);
});

afterAll(async () => {
  await db.delete(users);
  await pool.end();
});

describe('Fluxo de recuperação de senha', () => {
  it('recusa pedido pra e-mail que não existe', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'ninguem@exemplo.com' });
    expect(res.status).toBe(404);
  });

  it('gera um código de 5 dígitos pra conta existente', async () => {
    await registerUser();
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'fulana@exemplo.com' });
    expect(res.status).toBe(200);
    expect(res.body.code).toMatch(/^\d{5}$/);
  });

  it('recusa código errado e aceita o certo', async () => {
    await registerUser();
    const { body } = await request(app).post('/api/auth/forgot-password').send({ email: 'fulana@exemplo.com' });

    const wrong = await request(app)
      .post('/api/auth/verify-reset-code')
      .send({ email: 'fulana@exemplo.com', code: '00000' });
    expect(wrong.status).toBe(400);

    const right = await request(app)
      .post('/api/auth/verify-reset-code')
      .send({ email: 'fulana@exemplo.com', code: body.code });
    expect(right.status).toBe(200);
  });

  it('não deixa trocar a senha sem confirmar o código antes', async () => {
    await registerUser();
    await request(app).post('/api/auth/forgot-password').send({ email: 'fulana@exemplo.com' });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'fulana@exemplo.com', newPassword: 'senhaNova123' });

    expect(res.status).toBe(400);
  });

  it('troca a senha depois do código confirmado, e o login passa a usar a nova senha', async () => {
    await registerUser();
    const { body } = await request(app).post('/api/auth/forgot-password').send({ email: 'fulana@exemplo.com' });
    await request(app).post('/api/auth/verify-reset-code').send({ email: 'fulana@exemplo.com', code: body.code });

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'fulana@exemplo.com', newPassword: 'senhaNova123' });
    expect(resetRes.status).toBe(200);

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fulana@exemplo.com', password: 'senhaAntiga1' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fulana@exemplo.com', password: 'senhaNova123' });
    expect(newLogin.status).toBe(200);
  });
});
