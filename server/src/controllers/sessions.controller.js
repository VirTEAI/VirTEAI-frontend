import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { accessCodes, sessions, sessionAreas, users } from '../db/schema.js';
import { createSessionSchema } from '../lib/session-schemas.js';

async function findCodeByString(code) {
  const [row] = await db.select().from(accessCodes).where(eq(accessCodes.code, code)).limit(1);
  return row ?? null;
}

async function findAreasBySessionId(sessionId) {
  return db.select().from(sessionAreas).where(eq(sessionAreas.sessionId, sessionId)).orderBy(sessionAreas.rank);
}

// admin vê qualquer sessão; paciente só a própria; terapeuta só sessões de
// pacientes vinculados a ele (mesma regra de "Meus Pacientes").
async function isAuthorizedForPatient(req, patientId) {
  if (req.userRole === 'admin') return true;
  if (req.userRole === 'paciente') return patientId === req.userId;
  const [patient] = await db.select().from(users).where(eq(users.id, patientId)).limit(1);
  return patient?.responsibleTherapistId === req.userId;
}

function toPublicSession(row, areas) {
  return {
    id: row.id,
    worldId: row.worldId,
    patientId: row.patientId,
    durationSeconds: row.durationSeconds,
    totalFixationSeconds: row.totalFixationSeconds,
    fixationCount: row.fixationCount,
    avgFixationSeconds: row.avgFixationSeconds,
    heatmapUrl: row.heatmapUrl,
    createdAt: row.createdAt,
    areas: areas.map((a) => ({ rank: a.rank, name: a.name, tag: a.tag, timeSeconds: a.timeSeconds })),
  };
}

// POST /api/sessions — simula o óculos VR mandando o relatório da sessão
// depois que o código já foi validado. Qualquer pessoa autenticada pode
// chamar (mesmo motivo do POST /api/codes/validate: o dispositivo não
// necessariamente loga como um papel específico neste estágio do projeto).
export async function createSession(req, res) {
  const parsed = createSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
  }

  const { code, durationSeconds, totalFixationSeconds, fixationCount, heatmapUrl, areas } = parsed.data;

  const accessCode = await findCodeByString(code);
  if (!accessCode) {
    return res.status(404).json({ error: 'Código não encontrado.' });
  }
  if (accessCode.status !== 'utilizado') {
    return res.status(409).json({ error: 'Esse código ainda não foi validado — não há sessão pra registrar.' });
  }

  const [existing] = await db.select().from(sessions).where(eq(sessions.accessCodeId, accessCode.id)).limit(1);
  if (existing) {
    return res.status(409).json({ error: 'Já existe uma sessão registrada para esse código.' });
  }

  const avgFixationSeconds = fixationCount > 0 ? totalFixationSeconds / fixationCount : 0;

  const { session, insertedAreas } = await db.transaction(async (tx) => {
    const [createdSession] = await tx
      .insert(sessions)
      .values({
        accessCodeId: accessCode.id,
        patientId: accessCode.patientId,
        worldId: accessCode.worldId,
        durationSeconds,
        totalFixationSeconds,
        fixationCount,
        avgFixationSeconds,
        heatmapUrl: heatmapUrl ?? null,
      })
      .returning();

    let createdAreas = [];
    if (areas.length > 0) {
      createdAreas = await tx
        .insert(sessionAreas)
        .values(
          areas.map((area, i) => ({
            sessionId: createdSession.id,
            rank: i + 1,
            name: area.name,
            tag: area.tag,
            timeSeconds: area.timeSeconds,
          }))
        )
        .returning();
    }
    return { session: createdSession, insertedAreas: createdAreas };
  });

  return res.status(201).json({ session: toPublicSession(session, insertedAreas) });
}

// GET /api/sessions/by-code/:code — resumo de uma sessão específica (usado
// quando /codigos linka direto pro resumo de um código "Utilizado").
export async function getSessionByCode(req, res) {
  const accessCode = await findCodeByString(req.params.code);
  if (!accessCode) {
    return res.status(404).json({ error: 'Código não encontrado.' });
  }

  const [session] = await db.select().from(sessions).where(eq(sessions.accessCodeId, accessCode.id)).limit(1);
  if (!session) {
    return res.status(404).json({ error: 'Essa sessão ainda não foi registrada.' });
  }

  if (!(await isAuthorizedForPatient(req, session.patientId))) {
    return res.status(403).json({ error: 'Você não tem acesso a essa sessão.' });
  }

  const areas = await findAreasBySessionId(session.id);
  return res.json({ session: toPublicSession(session, areas) });
}

// GET /api/sessions/latest?worldId=... — sessão mais recente daquele mundo
// visível a quem está logado (usado como padrão em /resumo quando não veio
// um código específico na URL): paciente vê a própria; terapeuta vê a mais
// recente entre os pacientes dele; admin vê a mais recente de qualquer um.
export async function getLatestSession(req, res) {
  const { worldId } = req.query;
  if (!worldId) {
    return res.status(400).json({ error: 'Informe o worldId.' });
  }

  let session;
  if (req.userRole === 'admin') {
    [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.worldId, worldId))
      .orderBy(desc(sessions.createdAt))
      .limit(1);
  } else if (req.userRole === 'paciente') {
    [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.worldId, worldId), eq(sessions.patientId, req.userId)))
      .orderBy(desc(sessions.createdAt))
      .limit(1);
  } else {
    const rows = await db
      .select({ session: sessions })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.patientId))
      .where(and(eq(sessions.worldId, worldId), eq(users.responsibleTherapistId, req.userId)))
      .orderBy(desc(sessions.createdAt))
      .limit(1);
    session = rows[0]?.session;
  }

  if (!session) {
    return res.status(404).json({ error: 'Nenhuma sessão encontrada pra esse mundo.' });
  }

  const areas = await findAreasBySessionId(session.id);
  return res.json({ session: toPublicSession(session, areas) });
}
