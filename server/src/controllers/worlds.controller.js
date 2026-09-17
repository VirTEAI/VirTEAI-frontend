import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { worlds } from '../db/schema.js';
import { createWorldSchema, updateWorldSchema } from '../lib/world-schemas.js';
import { slugify } from '../lib/slug.js';

async function findWorldById(id) {
  const [row] = await db.select().from(worlds).where(eq(worlds.id, id)).limit(1);
  return row ?? null;
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

function toPublicWorld(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    gallery: row.gallery,
    connectionId: row.connectionId,
    likes: row.likes,
    views: row.views,
    launchedAt: row.createdAt,
  };
}

// GET /api/worlds — lista todos os mundos (qualquer pessoa logada: paciente
// navega o dashboard, terapeuta escolhe um mundo pra gerar código, admin
// gerencia). Mais recentes primeiro.
export async function listWorlds(req, res) {
  const rows = await db.select().from(worlds).orderBy(desc(worlds.createdAt));
  return res.json({ worlds: rows.map(toPublicWorld) });
}

export async function getWorld(req, res) {
  const row = await findWorldById(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Mundo não encontrado.' });
  }
  return res.json({ world: toPublicWorld(row) });
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
