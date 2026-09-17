import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { toPublicUser } from '../lib/public-user.js';
import { updateUserSchema } from '../lib/user-schemas.js';

const ALLOWED_ROLE_FILTERS = ['admin', 'terapeuta', 'paciente'];

async function findUserById(id) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

// Quem pode VER o perfil de quem:
// - admin vê qualquer um;
// - qualquer pessoa vê o próprio perfil;
// - terapeuta vê os pacientes sob sua responsabilidade;
// - paciente vê o terapeuta responsável por ele (pra tela "Meus
//   Terapeutas").
function canView(actor, target) {
  if (actor.role === 'admin') return true;
  if (actor.id === target.id) return true;
  if (actor.role === 'terapeuta' && target.responsibleTherapistId === actor.id) return true;
  if (actor.role === 'paciente' && actor.responsibleTherapistId === target.id) return true;
  return false;
}

// Quem pode EDITAR o perfil de quem — regra já existente no front
// (Profile.jsx/ProfilePsicologo.jsx: "paciente nunca edita os próprios
// dados"), agora aplicada de verdade no servidor, não só escondendo o
// botão na tela:
// - admin edita qualquer um;
// - terapeuta edita o próprio perfil e os pacientes sob sua
//   responsabilidade;
// - paciente nunca edita (nem o próprio perfil).
function canEdit(actor, target) {
  if (actor.role === 'admin') return true;
  if (actor.role === 'terapeuta' && (actor.id === target.id || target.responsibleTherapistId === actor.id)) {
    return true;
  }
  return false;
}

// GET /api/users?role=paciente — admin only. Serve pra telas
// administrativas (ex.: escolher um terapeuta pra vincular a um paciente).
export async function listUsers(req, res) {
  const roleFilter = req.query.role;
  if (roleFilter && !ALLOWED_ROLE_FILTERS.includes(roleFilter)) {
    return res.status(400).json({ error: 'Papel inválido no filtro.' });
  }

  const rows = roleFilter
    ? await db.select().from(users).where(eq(users.role, roleFilter))
    : await db.select().from(users);

  return res.json({ users: rows.map(toPublicUser) });
}

export async function getUser(req, res) {
  const target = await findUserById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const actor = await findUserById(req.userId);
  if (!actor || !canView(actor, target)) {
    return res.status(403).json({ error: 'Você não tem permissão para ver esse perfil.' });
  }

  return res.json({ user: toPublicUser(target) });
}

export async function updateUser(req, res) {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
  }

  const target = await findUserById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const actor = await findUserById(req.userId);
  if (!actor || !canEdit(actor, target)) {
    return res.status(403).json({ error: 'Você não tem permissão para editar esse perfil.' });
  }

  if (parsed.data.email && parsed.data.email !== target.email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, parsed.data.email)))
      .limit(1);
    if (existing) {
      return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
    }
  }

  const [updated] = await db
    .update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.id, target.id))
    .returning();

  return res.json({ user: toPublicUser(updated) });
}
