import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import { ArchiveIcon } from '../components/icons';
import EditProfileModal from '../components/EditProfileModal';
import { useAuth } from '../context/AuthContext';
import { usePatients } from '../hooks/usePatients';
import { apiFetch } from '../lib/api-client';
import { calcAge } from '../lib/age';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/motion';

// "Relatórios Recentes" — ainda não modelado no backend (fica pra quando
// sessões/analytics existirem de verdade); por ora continua ilustrativo.
const reports = [];

export default function ProfilePsicologo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSelf = user.role === 'terapeuta';

  // Admin chega aqui sem um terapeuta específico escolhido (não há, hoje,
  // um link "ver perfil" a partir de uma lista de terapeutas) — como
  // fallback, busca o primeiro terapeuta cadastrado no sistema.
  const [fallbackTherapistId, setFallbackTherapistId] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (isSelf) return undefined;
    apiFetch('/api/users?role=terapeuta').then(({ ok, body }) => {
      if (!cancelled && ok) setFallbackTherapistId(body.users[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [isSelf]);

  const targetId = isSelf ? user.id : fallbackTherapistId;

  const [psychologist, setPsychologist] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!targetId) {
      setPsychologist(null);
      return undefined;
    }
    apiFetch(`/api/users/${targetId}`).then(({ ok, body }) => {
      if (cancelled) return;
      if (ok) {
        setPsychologist(body.user);
        setLoadError(false);
      } else {
        setPsychologist(null);
        setLoadError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  // "Meus Pacientes" — o backend já filtra certo (terapeuta só vê os seus,
  // admin vê todos); quando é o próprio terapeuta olhando o próprio perfil
  // a lista bate exatamente com o `psychologist` mostrado acima.
  const { patients } = usePatients();

  // Regra de permissão: quem chega nessa página já é terapeuta (editando o
  // próprio perfil) ou admin (editando qualquer um) — paciente nem acessa a
  // rota (RequireAuth no App.jsx já bloqueia).
  const canEdit = user.role === 'admin' || (user.role === 'terapeuta' && psychologist?.id === user.id);

  async function handleSave(patch) {
    const { ok, body } = await apiFetch(`/api/users/${psychologist.id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (!ok) {
      return { success: false, error: body?.error ?? 'Não foi possível salvar as alterações.' };
    }
    setPsychologist(body.user);
    setEditing(false);
    return { success: true };
  }

  if (!psychologist) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center px-6 text-center text-[14px] text-ink-tertiary">
          {loadError
            ? 'Não foi possível carregar este perfil.'
            : targetId
              ? 'Carregando…'
              : 'Nenhum terapeuta cadastrado ainda.'}
        </main>
        <Footer />
      </div>
    );
  }

  const age = calcAge(psychologist.birthDate);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader />

      <main className="flex-1">
        {/* Banner */}
        <div className="relative h-[234px] w-full overflow-hidden bg-brand-soft">
          <div className="absolute -right-24 -top-32 h-[350px] w-[700px] -rotate-[24deg] bg-white" />
        </div>

        <section className="mx-auto max-w-[1270px] px-6">
          {/* Cabeçalho do perfil */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className="relative -mt-16 mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex items-end gap-6">
              <SafeImage
                src={psychologist.avatar}
                alt={psychologist.name}
                className="h-[123px] w-[123px] border-4 border-white shadow-soft"
                rounded
              />
              <div className="pb-1">
                <p className="text-[28px] leading-tight text-ink">{psychologist.name}</p>
                <p className="text-[17px] text-ink-secondary">
                  {age !== null ? `${age} Anos` : 'Idade não informada'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="rounded-full bg-brand-soft px-4 py-1 text-[13px] font-medium text-brand-deep">
                Terapeuta
              </span>
              <p className="text-[19.8px] text-ink">
                ID de Terapeuta: <span>{psychologist.professionalId || 'Não informado'}</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 pb-20 md:grid-cols-[564fr_724fr]"
          >
            {/* Meus dados */}
            <motion.div
              variants={staggerItem}
              className="h-fit rounded-2xl border border-hairline-soft bg-white p-6 shadow-soft"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-[19.8px] font-semibold tracking-tight text-ink">Meus dados:</h2>
                {canEdit && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setEditing(true)}
                    className="rounded-xl border border-hairline px-5 py-1.5 text-[13px] font-medium text-ink transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    Editar dados
                  </motion.button>
                )}
              </div>
              <dl className="flex flex-col gap-4">
                <div>
                  <dt className="text-[16px] text-ink">Nome Completo:</dt>
                  <dd className="text-[14px] text-ink-secondary">{psychologist.name}</dd>
                </div>
                <div>
                  <dt className="text-[16px] text-ink">Data de Nascimento</dt>
                  <dd className="text-[14px] text-ink-secondary">
                    {psychologist.birthDate || 'Não informado'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[16px] text-ink">Email:</dt>
                  <dd className="text-[14px] break-all text-ink-secondary">{psychologist.email}</dd>
                </div>
                <div>
                  <dt className="text-[16px] text-ink">Senha:</dt>
                  <dd className="text-[14px] text-ink-secondary">**************</dd>
                </div>
              </dl>
            </motion.div>

            <motion.div variants={staggerItem} className="flex flex-col gap-6">
              {/* Meus pacientes */}
              <div className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-soft">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[19.8px] font-semibold tracking-tight text-ink">Meus Pacientes:</h2>
                  {isSelf && patients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate('/pacientes')}
                      className="text-[12.5px] font-medium text-brand transition-colors duration-200 hover:text-brand-deep"
                    >
                      Gerenciar todos
                    </button>
                  )}
                </div>
                {patients.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {patients.map((patient) => (
                      <div key={patient.id} className="flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/paciente/${patient.id}`)}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 -m-1 text-left transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                        >
                          <SafeImage
                            src={patient.avatar}
                            alt={patient.name}
                            className="h-[54px] w-[54px] shrink-0 shadow-soft"
                            rounded
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] text-ink">{patient.name}</p>
                            <p className="truncate text-[10.3px] text-ink-tertiary">{patient.note}</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="shrink-0 rounded-xl border border-hairline px-5 py-1.5 text-[13px] font-medium text-ink transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                        >
                          Conversar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-ink-tertiary">Nenhum paciente vinculado ainda.</p>
                )}
              </div>

              {/* Relatórios + Ficha */}
              <div className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-soft">
                <h2 className="mb-4 text-[19.8px] font-semibold tracking-tight text-ink">
                  Relátorios Recentes
                </h2>
                {reports.length > 0 ? (
                  <div className="mb-6 flex flex-col gap-4">
                    {reports.map((report, i) => (
                      <div key={i} className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <ArchiveIcon className="mt-0.5 h-[25px] w-[25px] text-ink-secondary" />
                          <div>
                            <p className="text-[15px] text-ink">{report.title}</p>
                            <p className="text-[12px] text-ink-tertiary">{report.description}</p>
                          </div>
                        </div>
                        <span className="text-[11.3px] text-ink">{report.patient}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-6 text-[13px] text-ink-tertiary">
                    Nenhum relatório disponível ainda.
                  </p>
                )}

                <h2 className="mb-2 text-[19.8px] font-semibold tracking-tight text-ink">Ficha</h2>
                <p className="mb-3 text-[12px] text-ink-secondary">
                  Se já possui um laudo e deseja disponibilizá-lo para a análise de nossos
                  terapeutas, pode anexá-lo no campo abaixo. (Opcional)
                </p>
                <label className="flex h-[88px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-hairline-soft text-[13.2px] text-ink transition-colors duration-200 hover:bg-surface focus-within:ring-2 focus-within:ring-brand">
                  <input type="file" className="hidden" />
                  <span className="rounded-xl border border-hairline px-5 py-1 text-ink">
                    Anexar Arquivo
                  </span>
                </label>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {editing && canEdit && (
          <EditProfileModal
            title={`Editar dados de ${psychologist.name}`}
            profile={psychologist}
            onClose={() => setEditing(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
