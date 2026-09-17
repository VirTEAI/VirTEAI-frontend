import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { accessCodes, users, worlds } from '../db/schema.js';
import { createCodeSchema, validateCodeSchema } from '../lib/code-schemas.js';
import { generateCodeString, CODE_TTL_MS } from '../lib/code-generator.js';

async function findUserById(id) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

async function findWorldById(id) {
  const [world] = await db.select().from(worlds).where(eq(worlds.id, id)).limit(1);
  return world ?? null;
}

// "expirado" nunca é gravado no banco — é calculado na leitura, comparando
// `expiresAt` com a hora atual (ver comentário em `db/schema.js`). Sem
// isso, um código "pendente" que já passou da validade continuaria
// aparecendo como pendente até alguém escrever no banco de novo.
function deriveStatus(row) {
  if (row.status === 'utilizado') return 'utilizado';
  if (new Date(row.expiresAt).getTime() <= Date.now()) return 'expirado';
  return row.status;
}

function toPublicCode(row) {
  return {
    id: row.id,
    code: row.code,
    worldId: row.worldId,
    worldTitle: row.worldTitle,
    patientId: row.patientId,
    patientName: row.patientName ?? null,
    status: deriveStatus(row),
    expiresAt: row.expiresAt,
    usedAt: row.usedAt,
    generatedAt: row.createdAt,
  };
}

// POST /api/codes — gera um código pra um paciente + mundo. Terapeuta só
// gera pra pacientes vinculados a ele; admin gera pra qualquer paciente.
export async function createCode(req, res) {
  const parsed = createCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
  }

  const { worldId, patientId } = parsed.data;

  const world = await findWorldById(worldId);
  if (!world) {
    return res.status(404).json({ error: 'Mundo não encontrado.' });
  }

  const patient = await findUserById(patientId);
  if (!patient || patient.role !== 'paciente') {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  if (req.userRole === 'terapeuta' && patient.responsibleTherapistId !== req.userId) {
    return res.status(403).json({ error: 'Você só pode gerar código para os seus próprios pacientes.' });
  }

  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  // A coluna `code` é UNIQUE — colisão é praticamente impossível (33^6
  // combinações possíveis), mas tenta de novo em vez de deixar vazar um
  // 500 pro cliente no caso raro de bater.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const [created] = await db
        .insert(accessCodes)
        .values({
          code: generateCodeString(),
          worldId,
          worldTitle: world.title,
          patientId,
          generatedById: req.userId,
          expiresAt,
        })
        .returning();
      return res.status(201).json({ code: toPublicCode({ ...created, patientName: patient.name }) });
    } catch (err) {
      if (err?.code !== '23505' || attempt === 4) throw err;
    }
  }
  return undefined;
}

const CODE_COLUMNS = {
  id: accessCodes.id,
  code: accessCodes.code,
  worldId: accessCodes.worldId,
  worldTitle: accessCodes.worldTitle,
  patientId: accessCodes.patientId,
  patientName: users.name,
  status: accessCodes.status,
  expiresAt: accessCodes.expiresAt,
  usedAt: accessCodes.usedAt,
  createdAt: accessCodes.createdAt,
};

// GET /api/codes — "Códigos de Acesso Gerados": terapeuta só vê os que ele
// mesmo gerou; admin vê todos.
export async function listCodes(req, res) {
  const rows =
    req.userRole === 'admin'
      ? await db
          .select(CODE_COLUMNS)
          .from(accessCodes)
          .leftJoin(users, eq(accessCodes.patientId, users.id))
          .orderBy(desc(accessCodes.createdAt))
      : await db
          .select(CODE_COLUMNS)
          .from(accessCodes)
          .leftJoin(users, eq(accessCodes.patientId, users.id))
          .where(eq(accessCodes.generatedById, req.userId))
          .orderBy(desc(accessCodes.createdAt));

  return res.json({ codes: rows.map(toPublicCode) });
}

// POST /api/codes/validate — simula o dispositivo VR lendo o código pra
// liberar o mundo: confere validade e marca como utilizado (uso único).
// Qualquer pessoa autenticada pode chamar (o headset não necessariamente
// loga como um papel específico neste estágio do projeto).
export async function validateCode(req, res) {
  const parsed = validateCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Informe o código.' });
  }

  const [row] = await db.select().from(accessCodes).where(eq(accessCodes.code, parsed.data.code)).limit(1);
  if (!row) {
    return res.status(404).json({ error: 'Código não encontrado.' });
  }

  const status = deriveStatus(row);
  if (status === 'utilizado') {
    return res.status(409).json({ error: 'Esse código já foi utilizado.' });
  }
  if (status === 'expirado') {
    return res.status(410).json({ error: 'Esse código expirou.' });
  }

  const [updated] = await db
    .update(accessCodes)
    .set({ status: 'utilizado', usedAt: new Date() })
    .where(eq(accessCodes.id, row.id))
    .returning();

  const patient = await findUserById(updated.patientId);
  return res.json({ code: toPublicCode({ ...updated, patientName: patient?.name }) });
}
