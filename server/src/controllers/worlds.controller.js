import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { worlds, accessCodes } from '../db/schema.js';
import { createWorldSchema, updateWorldSchema } from '../lib/world-schemas.js';
import { slugify } from '../lib/slug.js';

async function findWorldById(id) {
  const [row] = await db.select().from(worlds).where(eq(worlds.id, id)).limit(1);
  return row ?? null;
}

// Mapa worldId -> quantidade de códigos gerados, pra admin ver antes de
// excluir (ver `linkedCodesCount` em toPublicWorld) — excluir o mundo agora
// apaga esses códigos em cascata (onDelete: 'cascade' em
// accessCodes.worldId, desde que o admin pediu pra poder excluir mesmo com
// código vinculado, só avisando antes).
async function countCodesByWorld() {
  const rows = await db
    .select({ worldId: accessCodes.worldId, count: sql`count(*)`.mapWith(Number) })
    .from(accessCodes)
    .groupBy(accessCodes.worldId);
  return new Map(rows.map((r) => [r.worldId, r.count]));
}

async function countCodesForWorld(worldId) {
  const [row] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(accessCodes)
    .where(eq(accessCodes.worldId, worldId));
  return row?.count ?? 0;
}

// Gera um slug único a partir do título — "Ensino Fundamental" -> vira
// "ensino-fundamental"; se esse id já existir, tenta "-2", "-3" e por
// diante, até achar um livre.
async function generateUniqueSlug(title) {
  const base = slugify(title);
  let candidate = base;
  let attempt = 2;
  while (await findWorldById(candidate)) {
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
  return candidate;
}

function fileUrl(req, filename) {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/worlds/${filename}`;
}

// `linkedCodesCount` só é preenchido quando passado explicitamente (admin,
// nas telas onde isso importa pra avisar antes de excluir) — pra não pagar
// o custo da query extra em toda chamada de listWorlds/getWorld.
function toPublicWorld(row, linkedCodesCount) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    gallery: row.gallery,
    connectionId: row.connectionId,
    status: row.status,
    likes: row.likes,
    views: row.views,
    launchedAt: row.createdAt,
    ...(linkedCodesCount !== undefined ? { linkedCodesCount } : {}),
  };
}

// GET /api/worlds — lista mundos (qualquer pessoa logada: paciente navega o
// dashboard, terapeuta escolhe um mundo pra gerar código, admin gerencia).
// Mais recentes primeiro. Rascunho (status=draft) só aparece pra admin —
// pra qualquer outro papel, é como se o mundo ainda não existisse. Pra
// admin, já vem com `linkedCodesCount` por mundo (usado em "Gerenciar
// Mundos" pra avisar quantos códigos seriam apagados junto antes de
// excluir).
export async function listWorlds(req, res) {
  if (req.userRole === 'admin') {
    const [rows, codesCountByWorld] = await Promise.all([
      db.select().from(worlds).orderBy(desc(worlds.createdAt)),
      countCodesByWorld(),
    ]);
    return res.json({
      worlds: rows.map((row) => toPublicWorld(row, codesCountByWorld.get(row.id) ?? 0)),
    });
  }

  const rows = await db
    .select()
    .from(worlds)
    .where(eq(worlds.status, 'published'))
    .orderBy(desc(worlds.createdAt));
  return res.json({ worlds: rows.map((row) => toPublicWorld(row)) });
}

export async function getWorld(req, res) {
  const row = await findWorldById(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Mundo não encontrado.' });
  }
  // Rascunho não é pra ninguém além de admin enxergar, nem direto pelo id
  // (ex.: um paciente com o link salvo de quando o mundo ainda nem tinha
  // sido publicado).
  if (row.status === 'draft' && req.userRole !== 'admin') {
    return res.status(404).json({ error: 'Mundo não encontrado.' });
  }
  const linkedCodesCount = req.userRole === 'admin' ? await countCodesForWorld(row.id) : undefined;
  return res.json({ world: toPublicWorld(row, linkedCodesCount) });
}

// POST /api/worlds — "Vincular Novo Mundo" (admin only). multipart/form-data
// com os campos de texto + até 2 imagens (thumbnail/gallery); ambas
// opcionais — um mundo pode ser criado sem imagem, igual o modal já permitia
// deixar os dois slots de foto em branco.
export async function createWorld(req, res) {
  const parsed = createWorldSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
  }

  const id = await generateUniqueSlug(parsed.data.title);
  const thumbnailFile = req.files?.thumbnail?.[0];
  const galleryFile = req.files?.gallery?.[0];
  const thumbnailUrl = fileUrl(req, thumbnailFile?.filename);
  const galleryUrl = fileUrl(req, galleryFile?.filename);

  const [created] = await db
    .insert(worlds)
    .values({
      id,
      title: parsed.data.title,
      description: parsed.data.description,
      connectionId: parsed.data.connectionId || null,
      status: parsed.data.status,
      // Se só uma foto foi enviada, usa ela nos dois lugares em vez de
      // deixar a galeria (tela cheia) sem imagem nenhuma.
      thumbnail: thumbnailUrl ?? galleryUrl,
      gallery: galleryUrl ?? thumbnailUrl,
      createdById: req.userId,
    })
    .returning();

  return res.status(201).json({ world: toPublicWorld(created) });
}

// PATCH /api/worlds/:id — admin only. Ainda sem um botão de "editar mundo"
// na UI (não havia frame correspondente pronto no Figma), mas a API já é
// real e testada — fica pronta pra quando esse fluxo for desenhado.
export async function updateWorld(req, res) {
  const existing = await findWorldById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Mundo não encontrado.' });
  }

  const parsed = updateWorldSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
  }

  const thumbnailFile = req.files?.thumbnail?.[0];
  const galleryFile = req.files?.gallery?.[0];
  const patch = { ...parsed.data };
  if (thumbnailFile) patch.thumbnail = fileUrl(req, thumbnailFile.filename);
  if (galleryFile) patch.gallery = fileUrl(req, galleryFile.filename);

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Nada para atualizar.' });
  }

  const [updated] = await db
    .update(worlds)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(worlds.id, existing.id))
    .returning();

  return res.json({ world: toPublicWorld(updated) });
}

// DELETE /api/worlds/:id — admin only (checado na rota). Excluir o mundo
// apaga em cascata qualquer código de acesso gerado pra ele (e, por tabela,
// as sessões registradas a partir desses códigos — accessCodes.worldId e
// sessions.accessCodeId são ambos onDelete: 'cascade'). O front avisa isso
// antes de confirmar (ConfirmModal em AdminWorlds.jsx, usando
// `linkedCodesCount` de GET /api/worlds) — aqui só executa.
export async function deleteWorld(req, res) {
  const existing = await findWorldById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Mundo não encontrado.' });
  }

  await db.delete(worlds).where(eq(worlds.id, existing.id));

  return res.status(204).send();
}
