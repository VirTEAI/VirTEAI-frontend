import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import EditProfileModal from '../components/EditProfileModal';
import { SearchIcon } from '../components/icons';
import { usePatients } from '../hooks/usePatients';
import { apiFetch } from '../lib/api-client';
import { calcAge } from '../lib/age';
import { fadeInUp } from '../lib/motion';

// "Gerenciar Pacientes" — versão completa (com busca) da lista "Meus
// Pacientes" que já existe resumida no perfil do terapeuta
// (ProfilePsicologo.jsx). O backend (`GET /api/patients`) já devolve só os
// pacientes vinculados a quem está logado, então aqui não precisa filtrar
// nada além da busca por texto.
export default function ManagePatients() {
  const navigate = useNavigate();
  const { patients, isLoading, refresh } = usePatients();
  const [search, setSearch] = useState('');
  const [editingPatient, setEditingPatient] = useState(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (p.note ?? '').toLowerCase().includes(term)
    );
  }, [patients, search]);

  async function handleSave(patch) {
    const { ok, body } = await apiFetch(`/api/users/${editingPatient.id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (!ok) {
      return { success: false, error: body?.error ?? 'Não foi possível salvar as alterações.' };
    }
    setEditingPatient(null);
    await refresh();
    return { success: true };
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-[1000px] px-6 pb-20 pt-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-[24px] font-semibold tracking-tight text-ink">Gerenciar Pacientes</h1>
              <p className="mt-1 text-[14px] text-ink-secondary">
                {isLoading ? 'Carregando…' : `${patients.length} paciente(s) vinculado(s) a você.`}
              </p>
            </div>
            <div className="flex h-[38px] w-full max-w-[308px] items-center gap-2 rounded-full border border-hairline bg-white px-4 transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand">
              <SearchIcon className="h-[15px] w-[15px] text-ink-tertiary" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail ou nota"
                className="w-full bg-transparent text-[14px] text-ink placeholder:text-ink-tertiary focus:outline-none"
              />
            </div>
          </motion.div>

          {isLoading ? (
            <div className="rounded-2xl border border-hairline-soft bg-white p-10 text-center shadow-soft">
              <p className="text-[15px] text-ink-secondary">Carregando…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-hairline-soft bg-white p-10 text-center shadow-soft">
              <p className="text-[15px] text-ink-secondary">
                {patients.length === 0
                  ? 'Nenhum paciente vinculado a você ainda.'
                  : 'Nenhum paciente encontrado para essa busca.'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-hairline-soft bg-white shadow-soft">
              <div className="hidden grid-cols-[1fr_1fr_100px_auto] gap-4 border-b border-hairline-soft bg-surface px-6 py-3 text-[13px] text-ink-secondary md:grid">
                <span>Paciente</span>
                <span>Nota</span>
                <span>Idade</span>
                <span className="sr-only">Ações</span>
              </div>

              <div className="flex flex-col divide-y divide-hairline-soft">
                <AnimatePresence initial={false}>
                  {filtered.map((patient, i) => {
                    const age = calcAge(patient.birthDate);
                    return (
                      <motion.div
                        key={patient.id}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.3, delay: Math.min(i, 8) * 0.03 },
                        }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-[1fr_1fr_100px_auto] md:items-center md:gap-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <SafeImage
                            src={patient.avatar}
                            alt={patient.name}
                            className="h-[44px] w-[44px] shrink-0"
                            rounded
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-medium text-ink">{patient.name}</p>
                            <p className="truncate text-[12px] text-ink-tertiary">{patient.email}</p>
                          </div>
                        </div>
                        <p className="truncate text-[13px] text-ink-secondary">
                          {patient.note || 'Sem observações.'}
                        </p>
                        <p className="text-[13px] text-ink-secondary">
                          {age !== null ? `${age} anos` : 'Não informada'}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/paciente/${patient.id}`)}
                            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-hairline px-3 py-1.5 text-[12px] font-medium text-ink transition-colors duration-200 hover:border-brand hover:bg-surface hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand"
                          >
                            Ver perfil
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPatient(patient)}
                            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-hairline px-3 py-1.5 text-[12px] font-medium text-ink transition-colors duration-200 hover:border-brand hover:bg-surface hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand"
                          >
                            Editar dados
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {editingPatient && (
          <EditProfileModal
            title={`Editar dados de ${editingPatient.name}`}
            profile={editingPatient}
            onClose={() => setEditingPatient(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
