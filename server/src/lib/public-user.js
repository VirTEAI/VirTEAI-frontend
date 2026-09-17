// Mesma regra que hoje vive em AuthContext.jsx (campo homePath calculado a
// partir do papel) — repetida aqui pra manter o front funcionando sem
// mudanças quando ele passar a consumir esta API (Fase 1b).
const HOME_PATH_BY_ROLE = {
  admin: '/admin',
  terapeuta: '/dashboard',
  paciente: '/dashboard',
};

export function homePathForRole(role) {
  return HOME_PATH_BY_ROLE[role] ?? '/';
}

// Nunca devolve passwordHash pra fora da API.
export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? null,
    // Campos da Fase 2 — sempre presentes na resposta (mesmo que `null`)
    // pra o front não precisar tratar "undefined vs null" diferente:
    // birthDate/note fazem sentido pro paciente, professionalId pro
    // terapeuta, responsibleTherapistId só existe num paciente vinculado.
    birthDate: user.birthDate ?? null,
    note: user.note ?? null,
    professionalId: user.professionalId ?? null,
    responsibleTherapistId: user.responsibleTherapistId ?? null,
    homePath: homePathForRole(user.role),
  };
}
