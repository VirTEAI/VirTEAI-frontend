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

  // Vincular/desvincular paciente-terapeuta ("Gerenciar Terapeutas", tela de
  // admin) é mais restrito do que o resto do PATCH: mesmo um terapeuta que
  // pode editar os dados de um paciente seu não pode reatribuir esse
  // paciente a outro terapeuta — só admin. `canEdit` acima já garante que
  // quem chegou até aqui pode editar o perfil de algum jeito; esta checagem
  // extra é só sobre esse campo específico.
  if (Object.prototype.hasOwnProperty.call(parsed.data, 'responsibleTherapistId')) {
    if (actor.role !== 'admin') {
      return res.status(403).json({
        error: 'Apenas administradores podem vincular ou desvincular pacientes de terapeutas.',
      });
    }
    if (target.role !== 'paciente') {
      return res.status(400).json({ error: 'Só é possível vincular um terapeuta a um paciente.' });
    }
    if (parsed.data.responsibleTherapistId !== null) {
      const candidateTherapist = await findUserById(parsed.data.responsibleTherapistId);
      if (!candidateTherapist || candidateTherapist.role !== 'terapeuta') {
        return res.status(400).json({ error: 'Terapeuta inválido.' });
      }
    }
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

// DELETE /api/users/:id — admin only (checado na rota via requireRole).
// Efeitos em cascata já definidos no schema (ver schema.js): pacientes
// vinculados ao terapeuta excluído ficam sem terapeuta (responsibleTherapistId
// -> null), mundos criados por ele ficam sem autor, mas os códigos de acesso
// que ele gerou — e as sessões registradas a partir deles — são apagados
// junto (onDelete: 'cascade' em access_codes.generated_by_id). O front avisa
// isso na confirmação antes de chamar essa rota.
export async function deleteUser(req, res) {
  const target = await findUserById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  if (req.userId === target.id) {
    return res.status(400).json({ error: 'Você não pode excluir a própria conta.' });
  }

  await db.delete(users).where(eq(users.id, target.id));
  return res.status(204).send();
}
