import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../src/app.js';
import { db, pool } from '../src/db/client.js';
import { users, worlds, accessCodes } from '../src/db/schema.js';
import { hashPassword } from '../src/lib/password.js';
import { toPublicUser } from '../src/lib/public-user.js';

const app = createApp();

// 1x1 PNG válido — pequeno o suficiente pra testar upload real sem
// depender de nenhum arquivo externo no repositório.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

beforeEach(async () => {
  // access_codes.worldId é onDelete: 'cascade' (era 'restrict' até a Fase
  // 6), então a ordem já não é obrigatória — mas apaga códigos antes mesmo
  // assim, só por clareza.
  await db.delete(accessCodes);
  await db.delete(worlds);
  await db.delete(users);
});

afterAll(async () => {
  await db.delete(accessCodes);
  await db.delete(worlds);
  await db.delete(users);
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

  it('admin publica um rascunho via status', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const created = await agent.post('/api/worlds').field('title', 'Rascunho').field('status', 'draft');
    expect(created.body.world.status).toBe('draft');

    const res = await agent.patch(`/api/worlds/${created.body.world.id}`).field('status', 'published');
    expect(res.status).toBe(200);
    expect(res.body.world.status).toBe('published');
  });
});

describe('Rascunhos (status draft/published)', () => {
  it('mundo criado com status=draft só aparece pra admin em GET /api/worlds', async () => {
    const { agent: admin } = await createLoggedInUser({ role: 'admin' });
    await admin.post('/api/worlds').field('title', 'Rascunho Admin').field('status', 'draft');
    await admin.post('/api/worlds').field('title', 'Publicado');

    const asAdmin = await admin.get('/api/worlds');
    expect(asAdmin.body.worlds.length).toBe(2);

    const { agent: paciente } = await createLoggedInUser({ role: 'paciente' });
    const asPaciente = await paciente.get('/api/worlds');
    expect(asPaciente.body.worlds.length).toBe(1);
    expect(asPaciente.body.worlds[0].title).toBe('Publicado');
  });

  it('GET /api/worlds/:id de um rascunho -> 404 pra quem não é admin', async () => {
    const { agent: admin } = await createLoggedInUser({ role: 'admin' });
    const created = await admin.post('/api/worlds').field('title', 'Secreto').field('status', 'draft');

    const { agent: terapeuta } = await createLoggedInUser({ role: 'terapeuta' });
    const res = await terapeuta.get(`/api/worlds/${created.body.world.id}`);
    expect(res.status).toBe(404);
  });

  it('sem status informado -> continua publicado por padrão (comportamento antigo preservado)', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const created = await agent.post('/api/worlds').field('title', 'Padrão');
    expect(created.body.world.status).toBe('published');
  });
});

describe('DELETE /api/worlds/:id', () => {
  it('paciente/terapeuta não podem excluir (403)', async () => {
    await db.insert(worlds).values({ id: 'home', title: 'Home' });
    const { agent } = await createLoggedInUser({ role: 'terapeuta' });
    const res = await agent.delete('/api/worlds/home');
    expect(res.status).toBe(403);
  });

  it('mundo inexistente -> 404', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const res = await agent.delete('/api/worlds/nao-existe');
    expect(res.status).toBe(404);
  });

  it('admin exclui um mundo sem códigos de acesso', async () => {
    const { agent } = await createLoggedInUser({ role: 'admin' });
    const created = await agent.post('/api/worlds').field('title', 'Descartável');

    const res = await agent.delete(`/api/worlds/${created.body.world.id}`);
    expect(res.status).toBe(204);

    const after = await agent.get(`/api/worlds/${created.body.world.id}`);
    expect(after.status).toBe(404);
  });

  it('mundo com código de acesso gerado -> admin ainda consegue excluir, apagando o(s) código(s) junto (cascade)', async () => {
    const { agent: admin } = await createLoggedInUser({ role: 'admin' });
    const created = await admin.post('/api/worlds').field('title', 'Com Código');
    const { agent: terapeuta, user: terapeutaUser } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: paciente } = await createLoggedInUser({ role: 'paciente' });
    await db.update(users).set({ responsibleTherapistId: terapeutaUser.id }).where(eq(users.id, paciente.id));

    const codeRes = await terapeuta
      .post('/api/codes')
      .send({ worldId: created.body.world.id, patientId: paciente.id });

    const res = await admin.delete(`/api/worlds/${created.body.world.id}`);
    expect(res.status).toBe(204);

    const stillThere = await admin.get(`/api/worlds/${created.body.world.id}`);
    expect(stillThere.status).toBe(404);

    // O código gerado pra esse mundo some junto (accessCodes.worldId é
    // onDelete: 'cascade' desde que o admin pediu pra poder excluir mundo
    // mesmo com código vinculado).
    const [codeRow] = await db.select().from(accessCodes).where(eq(accessCodes.id, codeRes.body.code.id));
    expect(codeRow).toBeUndefined();
  });

  it('GET /api/worlds (admin) traz linkedCodesCount por mundo', async () => {
    const { agent: admin } = await createLoggedInUser({ role: 'admin' });
    const created = await admin.post('/api/worlds').field('title', 'Com Código');
    const { agent: terapeuta, user: terapeutaUser } = await createLoggedInUser({ role: 'terapeuta' });
    const { user: paciente } = await createLoggedInUser({ role: 'paciente' });
    await db.update(users).set({ responsibleTherapistId: terapeutaUser.id }).where(eq(users.id, paciente.id));
    await terapeuta.post('/api/codes').send({ worldId: created.body.world.id, patientId: paciente.id });

    const res = await admin.get('/api/worlds');
    const world = res.body.worlds.find((w) => w.id === created.body.world.id);
    expect(world.linkedCodesCount).toBe(1);
  });
});
