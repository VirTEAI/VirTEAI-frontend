import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { worldComments, worlds, users } from '../db/schema.js';
import { createCommentSchema } from '../lib/world-comment-schemas.js';

async function findWorldById(id) {
  const [row] = await db.select().from(worlds).where(eq(worlds.id, id)).limit(1);
  return row ?? null;
}

function toPublicComment(row) {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.createdAt,
    authorId: row.authorId,
    authorName: row.authorName,
    authorAvatar: row.authorAvatar,
  };
}

// GET /api/worlds/:worldId/comments — qualquer pessoa logada que possa ver
// o mundo (mesma regra do getWorld: rascunho só pra admin).
export async function listComments(req, res) {
  const world = await findWorldById(req.params.worldId);
  if (!world) {
    return res.status(404).json({ error: 'Mundo não encontrado.' });
  }
  if (world.status === 'draft' && req.userRole !== 'admin') {
    return res.status(404).json({ error: 'Mundo não encontrado.' });
  }

  const rows = await db
    .select({
      id: worldComments.id,
      text: worldComments.text,
      createdAt: worldComments.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorAvatar: users.avatar,
    })
    .from(worldComments)
    .innerJoin(users, eq(users.id, worldComments.authorId))
    .where(eq(worldComments.worldId, world.id))
    .orderBy(asc(worldComments.createdAt));

  return res.json({ comments: rows.map(toPublicComment) });
}

// POST /api/worlds/:worldId/comments — qualquer pessoa logada.
export async function createComment(req, res) {
  const world = await findWorldById(req.params.worldId);
  if (!world) {
    return res.status(404).json({ error: 'Mundo não encontrado.' });
  }

  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
  }

  const [created] = await db
    .insert(worldComments)
    .values({ worldId: world.id, authorId: req.userId, text: parsed.data.text })
    .returning();

  const [author] = await db
    .select({ id: users.id, name: users.name, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, req.userId))
    .limit(1);

  return res.status(201).json({
    comment: toPublicComment({
      ...created,
      authorId: author.id,
      authorName: author.name,
      authorAvatar: author.avatar,
    }),
  });
}

// DELETE /api/worlds/:worldId/comments/:commentId — quem escreveu o
// comentário, ou um admin (moderação).
export async function deleteComment(req, res) {
  const [comment] = await db
    .select()
    .from(worldComments)
    .where(eq(worldComments.id, req.params.commentId))
    .limit(1);

  if (!comment || comment.worldId !== req.params.worldId) {
    return res.status(404).json({ error: 'Comentário não encontrado.' });
  }

  if (req.userRole !== 'admin' && comment.authorId !== req.userId) {
    return res.status(403).json({ error: 'Você só pode apagar os seus próprios comentários.' });
  }

  await db.delete(worldComments).where(eq(worldComments.id, comment.id));
  return res.status(204).send();
}
