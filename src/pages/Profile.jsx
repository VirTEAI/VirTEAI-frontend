import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import { CheckCrossIcon } from '../components/icons';
import EditProfileModal from '../components/EditProfileModal';
import { useAuth } from '../context/AuthContext';
import { usePatients } from '../hooks/usePatients';
import { apiFetch } from '../lib/api-client';
import { calcAge } from '../lib/age';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/motion';

// Testes de triagem — ainda não modelados no backend (isso é Fase futura,
// fora do escopo de "pacientes & perfis"); por ora continuam ilustrativos.
const tests = [
  {
    name: 'AQ-10',
    description: 'Um teste curto, para auxiliar na avaliação e identificação de TEA em pacientes',
    status: 'Completo',
    progress: 100,
    done: true,
  },
  {
    name: 'AQ-50',
    description: 'Um teste curto, para auxiliar na avaliação e identificação de TEA em pacientes',
    status: 'Em Andamento',
    progress: 60,
    done: false,
  },
];

export default function Profile() {
  const { user } = useAuth();
  const isOwnProfile = user.role === 'paciente';

  // Terapeuta/admin chegam aqui sem um paciente específico escolhido (não
  // há, hoje, um link "ver perfil" a partir de "Meus Pacientes") — como
  // fallback, mostra o primeiro paciente acessível a quem está logado.
  const { patients } = usePatients();
  const targetId = isOwnProfile ? user.id : patients[0]?.id ?? null;

  const [patient, setPatient] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!targetId) {
      setPatient(null);
      return undefined;
    }
    apiFetch(`/api/users/${targetId}`).then(({ ok, body }) => {
      if (cancelled) return;
      if (ok) {
        setPatient(body.user);
        setLoadError(false);
      } else {
        setPatient(null);
        setLoadError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  // "Meu Terapeuta" — busca só depois que já sabemos quem é o paciente.
  const [therapist, setTherapist] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (!patient?.responsibleTherapistId) {
      setTherapist(null);
      return undefined;
    }
    apiFetch(`/api/users/${patient.responsibleTherapistId}`).then(({ ok, body }) => {
      if (!cancelled) setTherapist(ok ? body.user : null);
    });
    return () => {
      cancelled = true;
    };
  }, [patient?.responsibleTherapistId]);

  // Regra de permissão: paciente nunca edita os próprios dados; terapeuta só
  // edita pacientes sob sua responsabilidade; admin edita qualquer um — o
  // mesmo que o servidor aplica de verdade em PATCH /api/users/:id.
  const canEdit =
    user.role === 'admin' || (user.role === 'terapeuta' && patient?.responsibleTherapistId === user.id);

  async function handleSave(patch) {
    const { ok, body } = await apiFetch(`/api/users/${patient.id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (!ok) {
      return { success: false, error: body?.error ?? 'Não foi possível salvar as alterações.' };
    }
    setPatient(body.user);
    setEditing(false);
    return { success: true };
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center px-6 text-center text-[14px] text-ink-tertiary">
          {loadError
            ? 'Não foi possível carregar este perfil.'
            : targetId
              ? 'Carregando…'
              : 'Nenhum paciente vinculado a você ainda.'}
        </main>
        <Footer />
      </div>
    );
  }

  const age = calcAge(patient.birthDate);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader />

      <main className="flex-1">
        {/* Banner */}
        <div className="relative h-[234px] w-full overflow-hidden bg-surface">
          <div className="absolute -right-24 -top-32 h-[350px] w-[700px] -rotate-[24deg] bg-white" />
        </div>

        <section className="mx-auto max-w-[1270px] px-6">
          {/* Cabeçalho do perfil */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className="relative -mt-16 mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex items-end gap-6">
              <SafeImage
                src={patient.avatar}
                alt={patient.name}
                className="h-[123px] w-[123px] border-4 border-white shadow-soft"
                rounded
              />
              <div className="pb-1">
                <p className="text-[28px] leading-tight text-ink">{patient.name}</p>
                <p className="text-[17px] text-ink-secondary">
                  {age !== null ? `${age} Anos` : 'Idade não informada'}
                </p>
              </div>
            </div>
            <span className="self-start rounded-full bg-brand-soft px-4 py-1 text-[13px] font-medium text-brand-deep sm:self-auto">
              Paciente
            </span>
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
              className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-soft"
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
                  <dd className="text-[14px] text-ink-secondary">{patient.name}</dd>
                </div>
                <div>
                  <dt className="text-[16px] text-ink">Data de Nascimento</dt>
                  <dd className="text-[14px] text-ink-secondary">{patient.birthDate || 'Não informado'}</dd>
                </div>
                <div>
                  <dt className="text-[16px] text-ink">Email:</dt>
                  <dd className="text-[14px] text-ink-secondary">{patient.email}</dd>
                </div>
                <div>
                  <dt className="text-[16px] text-ink">Senha:</dt>
                  <dd className="text-[14px] text-ink-secondary">**************</dd>
                </div>
              </dl>
            </motion.div>

            <motion.div variants={staggerItem} className="flex flex-col gap-6">
              {/* Meus terapeutas */}
              <div className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-soft">
                <h2 className="mb-4 text-[19.8px] font-semibold tracking-tight text-ink">
                  Meus Terapeutas:
                </h2>
                {therapist ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <SafeImage
                        src={therapist.avatar}
                        alt={therapist.name}
                        className="h-[54px] w-[54px] shadow-soft"
                        rounded
                      />
                      <div>
                        <p className="text-[13.5px] text-ink">{therapist.name}</p>
                        <p className="text-[10.3px] text-ink-tertiary">Especialista em TEA</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-xl border border-hairline px-5 py-1.5 text-[13px] font-medium text-ink transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      Conversar
                    </button>
                  </div>
                ) : (
                  <p className="text-[13px] text-ink-tertiary">Nenhum terapeuta vinculado ainda.</p>
                )}
              </div>

              {/* Testes */}
              <div className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-soft">
                <h2 className="mb-4 text-[19.8px] font-semibold tracking-tight text-ink">Testes</h2>
                <div className="flex flex-col gap-4">
                  {tests.map((test) => (
                    <div key={test.name} className="flex items-start gap-3">
                      <CheckCrossIcon
                        done={test.done}
                        className={`mt-1 h-[22px] w-[21px] ${test.done ? 'text-success' : 'text-ink-tertiary'}`}
                      />
                      <div className="flex-1">
                        <p className="text-[15px] text-ink">{test.name}</p>
                        <p className="text-[12px] text-ink-tertiary">{test.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] text-ink">
                          Status: <span>{test.status}</span>
                        </p>
                        <div className="mt-1 h-[11px] w-[103px] overflow-hidden rounded-full bg-hairline-soft">
                          <div
                            className={`h-full rounded-full ${test.done ? 'bg-success' : 'bg-brand'}`}
                            style={{ width: `${test.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {editing && canEdit && (
          <EditProfileModal
            title={`Editar dados de ${patient.name}`}
            profile={patient}
            onClose={() => setEditing(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
