import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { toPublicUser } from '../lib/public-user.js';

// GET /api/patients — "Meus Pacientes": terapeuta só vê quem está vinculado
// a ele (responsibleTherapistId); admin vê todos os pacientes do sistema
// (é quem faz a triagem/gestão geral). Paciente não chega aqui — a rota já
// exige requireRole('terapeuta', 'admin').
export async function listPatients(req, res) {
  const rows =
    req.userRole === 'admin'
      ? await db.select().from(users).where(eq(users.role, 'paciente'))
      : await db
          .select()
          .from(users)
          .where(and(eq(users.role, 'paciente'), eq(users.responsibleTherapistId, req.userId)));

  return res.json({ patients: rows.map(toPublicUser) });
}
