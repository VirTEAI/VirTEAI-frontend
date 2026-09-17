import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/client.js';
import { users, worlds } from '../src/db/schema.js';

const app = createApp();

// 1x1 PNG válido — pequeno o suficiente pra testar upload real sem
// depender de nenhum arquivo externo no repositório.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

beforeEach(async () => {
  await db.delete(worlds);
  await db.delete(users);
});

afterAll(async () => {
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

describe('GET /api/worlds', () => {
  it('exige sessão ativa (401)', async () => {
    const res = await request(app).get('/api/worlds');
    expect(res.status).toBe(401);
  });

  it('qualquer papel logado pode listar', async () => {
    await db.insert(worlds).values({ id: 'home', title: 'Home' });
    const { agent } = await createLoggedInUser({ role: 'paciente' });
    const res = await agent.get('/api/worlds');
    expect(res.status).toBe(200);
    expect(res.body.worlds.length).toBe(1);
    expect(res.body.worlds[0].id).toBe('home');
  });
});

describe('GET /api/worlds/:id', () => {
  it('mundo inexistente -> 404', async () => {
    const { agent } = await createLoggedInUser({ role: 'paciente' });
    const res = await agent.get('/api/worlds/nao-existe');
    expect(res.status).toBe(404);
  });

  it('devolve o mundo pelo id', async () => {
    await db.insert(worlds).values({ id: 'home', title: 'Home', description: 'Um lugar calmo.' });
    const { agent } = await createLoggedInUser({ role: 'terapeuta' });
    const res = await agent.get('/api/worlds/home');
    expect(res.status).toBe(200);
    expect(res.body.world.title).toBe('Home');
    expect(res.body.world.description).toBe('Um lugar calmo.');
  });
});

describe('POST /api/worlds', () => {
  it('paciente não pode criar mundo (403)', async () => {
    const { agent } = await createLoggedInUser({ role: 'paciente' });
    const res = await agent.post('/api/worlds').field('title', 'Parque');
    expect(res.status).toBe(403);
  });

  it('terapeuta não pode criar mundo (403)', async () => {
    const { agent } = await createLoggedInUser({ role: 'terapeuta' });
    const res = await agent.post('/api/worlds').field('title', 'Parque');
    expect(res.status).toBe(403);
  });

  it('admin cria um mundo e o id vira um slug do título', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const res = await agent
      .post('/api/worlds')
      .field('title', 'Praça de Alimentação')
      .field('description', 'Um shopping simulado.')
      .field('connectionId', '190293021');

    expect(res.status).toBe(201);
    expect(res.body.world.id).toBe('praca-de-alimentacao');
    expect(res.body.world.title).toBe('Praça de Alimentação');
    expect(res.body.world.connectionId).toBe('190293021');
    expect(res.body.world.likes).toBe(0);
    expect(res.body.world.views).toBe(0);
  });

  it('título duplicado gera um slug com sufixo numérico', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const first = await agent.post('/api/worlds').field('title', 'Parque');
    const second = await agent.post('/api/worlds').field('title', 'Parque');

    expect(first.body.world.id).toBe('parque');
    expect(second.body.world.id).toBe('parque-2');
  });

  it('título vazio -> 400', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const res = await agent.post('/api/worlds').field('title', '');
    expect(res.status).toBe(400);
  });

  it('faz upload real das duas imagens e devolve URLs servíveis', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const res = await agent
      .post('/api/worlds')
      .field('title', 'Fazenda')
      .attach('thumbnail', TINY_PNG, 'thumb.png')
      .attach('gallery', TINY_PNG, 'gallery.png');

    expect(res.status).toBe(201);
    expect(res.body.world.thumbnail).toMatch(/\/uploads\/worlds\/.+\.png$/);
    expect(res.body.world.gallery).toMatch(/\/uploads\/worlds\/.+\.png$/);
    expect(res.body.world.thumbnail).not.toBe(res.body.world.gallery);

    // o arquivo devolvido é servido de verdade, não só um caminho fake
    const thumbPath = new URL(res.body.world.thumbnail).pathname;
    const download = await request(app).get(thumbPath);
    expect(download.status).toBe(200);
    expect(download.headers['content-type']).toContain('image');
  });

  it('só uma imagem enviada -> usa a mesma URL nos dois campos', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const res = await agent.post('/api/worlds').field('title', 'Zoológico').attach('thumbnail', TINY_PNG, 'thumb.png');

    expect(res.status).toBe(201);
    expect(res.body.world.thumbnail).toBe(res.body.world.gallery);
  });

  it('arquivo que não é imagem -> 400', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const res = await agent
      .post('/api/worlds')
      .field('title', 'Inválido')
      .attach('thumbnail', Buffer.from('não é imagem'), { filename: 'arquivo.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/worlds/:id', () => {
  it('admin edita título e descrição', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const created = await agent.post('/api/worlds').field('title', 'Rascunho');

    const res = await agent
      .patch(`/api/worlds/${created.body.world.id}`)
      .field('description', 'Descrição atualizada.');

    expect(res.status).toBe(200);
    expect(res.body.world.description).toBe('Descrição atualizada.');
    expect(res.body.world.title).toBe('Rascunho');
  });

  it('terapeuta não pode editar mundo (403)', async () => {
    await db.insert(worlds).values({ id: 'home', title: 'Home' });
    const { agent } = await createLoggedInUser({ role: 'terapeuta' });
    const res = await agent.patch('/api/worlds/home').field('description', 'x');
    expect(res.status).toBe(403);
  });

  it('mundo inexistente -> 404', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const res = await agent.patch('/api/worlds/nao-existe').field('description', 'x');
    expect(res.status).toBe(404);
  });
});
