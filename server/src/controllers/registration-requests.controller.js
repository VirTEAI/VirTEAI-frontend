import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { registrationRequests, users } from '../db/schema.js';
import { toPublicUser } from '../lib/public-user.js';

// Nunca devolve passwordHash — mesmo princípio do toPublicUser em
// public-user.js, só que pra um pedido (que também guarda uma senha com
// hash, até ser aprovado).
function toPublicRequest(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt,
    decidedAt: row.decidedAt,
  };
}

// GET /api/registration-requests — painel do admin (sininho de
// notificações em DashboardAdmin.jsx). Sem `?status=`, devolve tudo (mais
// recente primeiro); com `?status=pendente`, só quem ainda não foi avaliado
// — é o que a tela de notificações usa por padrão.
export async function listRegistrationRequests(req, res) {
  const { status } = req.query;
  const rows = status
    ? await db
        .select()
        .from(registrationRequests)
        .where(eq(registrationRequests.status, status))
        .orderBy(desc(registrationRequests.createdAt))
    : await db.select().from(registrationRequests).orderBy(desc(registrationRequests.createdAt));

  return res.json({ requests: rows.map(toPublicRequest) });
}

async function findRequestById(id) {
  const [row] = await db.select().from(registrationRequests).where(eq(registrationRequests.id, id)).limit(1);
  return row ?? null;
}

// POST /api/registration-requests/:id/approve — só aqui a conta nasce de
// verdade em `users`, com o mesmo nome/e-mail/senha (já com hash) que a
// pessoa informou no pedido; o papel vem do próprio pedido (hoje sempre
// 'terapeuta', ver schema.js). Confere de novo se o e-mail não foi ocupado
// nesse meio-tempo (ex.: dois pedidos pendentes pro mesmo e-mail — o
// register() já bloqueia um segundo pedido pendente, mas não impede um
// segundo e-mail diferente virar o mesmo depois, nem outro fluxo de criar
// conta direto).
export async function approveRegistrationRequest(req, res) {
  const reqRow = await findRequestById(req.params.id);
  if (!reqRow) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }
  if (reqRow.status !== 'pendente') {
    return res.status(409).json({ error: 'Esse pedido já foi avaliado.' });
  }

  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, reqRow.email)).limit(1);
  if (existingUser) {
    return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
  }

  const [createdUser] = await db
    .insert(users)
    .values({ name: reqRow.name, email: reqRow.email, passwordHash: reqRow.passwordHash, role: reqRow.role })
    .returning();

  await db
    .update(registrationRequests)
    .set({ status: 'aprovado', decidedById: req.userId, decidedAt: new Date() })
    .where(eq(registrationRequests.id, reqRow.id));

  return res.status(201).json({ user: toPublicUser(createdUser) });
}

// POST /api/registration-requests/:id/reject — nunca apaga a linha (fica
// como histórico de quem já foi avaliado e por quem), só muda o status.
export async function rejectRegistrationRequest(req, res) {
  const reqRow = await findRequestById(req.params.id);
  if (!reqRow) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }
  if (reqRow.status !== 'pendente') {
    return res.status(409).json({ error: 'Esse pedido já foi avaliado.' });
  }

  await db
    .update(registrationRequests)
    .set({ status: 'rejeitado', decidedById: req.userId, decidedAt: new Date() })
    .where(eq(registrationRequests.id, reqRow.id));

  return res.status(204).send();
}
