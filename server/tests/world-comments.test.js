import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/client.js';
import { users, worlds, worldComments } from '../src/db/schema.js';

const app = createApp();

beforeEach(async () => {
  await db.delete(worldComments);
  await db.delete(worlds);
  await db.delete(users);
  await db.insert(worlds).values({ id: 'home', title: 'Home' });
});

afterAll(async () => {
  await db.delete(worldComments);
  await db.delete(worlds);
  await db.delete(users);
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

describe('GET /api/worlds/:worldId/comments', () => {
  it('exige sessão ativa (401)', async () => {
    const res = await request(app).get('/api/worlds/home/comments');
    expect(res.status).toBe(401);
  });

  it('mundo inexistente -> 404', async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent.get('/api/worlds/nao-existe/comments');
    expect(res.status).toBe(404);
  });

  it('lista vazia quando não há comentários', async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent.get('/api/worlds/home/comments');
    expect(res.status).toBe(200);
    expect(res.body.comments).toEqual([]);
  });

  it('lista comentários com o nome de quem escreveu', async () => {
    const { agent, user } = await createLoggedInUser({ name: 'Fabrícia Santos' });
    await agent.post('/api/worlds/home/comments').send({ text: 'Muito bom!' });

    const res = await agent.get('/api/worlds/home/comments');
    expect(res.status).toBe(200);
    expect(res.body.comments.length).toBe(1);
    expect(res.body.comments[0].text).toBe('Muito bom!');
    expect(res.body.comments[0].authorName).toBe('Fabrícia Santos');
    expect(res.body.comments[0].authorId).toBe(user.id);
  });
});

describe('POST /api/worlds/:worldId/comments', () => {
  it('texto vazio -> 400', async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent.post('/api/worlds/home/comments').send({ text: '  ' });
    expect(res.status).toBe(400);
  });

  it('mundo inexistente -> 404', async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent.post('/api/worlds/nao-existe/comments').send({ text: 'Oi' });
    expect(res.status).toBe(404);
  });

  it('qualquer papel logado pode comentar', async () => {
    const { agent } = await createLoggedInUser({ role: 'terapeuta' });
    const res = await agent.post('/api/worlds/home/comments').send({ text: 'Minha paciente adorou' });
    expect(res.status).toBe(201);
    expect(res.body.comment.text).toBe('Minha paciente adorou');
  });
});

describe('DELETE /api/worlds/:worldId/comments/:commentId', () => {
  it('autor do comentário pode apagar o próprio', async () => {
    const { agent } = await createLoggedInUser();
    const created = await agent.post('/api/worlds/home/comments').send({ text: 'Apagar depois' });

    const res = await agent.delete(`/api/worlds/home/comments/${created.body.comment.id}`);
    expect(res.status).toBe(204);

    const list = await agent.get('/api/worlds/home/comments');
    expect(list.body.comments.length).toBe(0);
  });

  it('outra pessoa comum não pode apagar o comentário alheio (403)', async () => {
    const { agent: author } = await createLoggedInUser();
    const created = await author.post('/api/worlds/home/comments').send({ text: 'Meu comentário' });

    const { agent: other } = await createLoggedInUser();
    const res = await other.delete(`/api/worlds/home/comments/${created.body.comment.id}`);
    expect(res.status).toBe(403);
  });

  it('admin pode apagar o comentário de qualquer pessoa (moderação)', async () => {
    const { agent: author } = await createLoggedInUser({ role: 'terapeuta' });
    const created = await author.post('/api/worlds/home/comments').send({ text: 'Vai ser apagado' });

    const { agent: admin } = await createLoggedInUser({ role: 'admin' });
    const res = await admin.delete(`/api/worlds/home/comments/${created.body.comment.id}`);
    expect(res.status).toBe(204);
  });

  it('comentário inexistente -> 404', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const res = await agent.delete('/api/worlds/home/comments/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
