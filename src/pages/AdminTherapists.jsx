import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import EditProfileModal from '../components/EditProfileModal';
import ConfirmModal from '../components/ConfirmModal';
import { apiFetch } from '../lib/api-client';
import { fadeInUp, staggerContainer, staggerItem, buttonTap } from '../lib/motion';

function ChevronDown({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Uma "linha" de paciente dentro do card de um terapeuta — usada tanto pros
// já vinculados (com botão "Desvincular") quanto reaproveitada visualmente
// pelo <select> de adicionar (como texto de cada opção).
function patientOptionLabel(patient, therapists) {
  if (!patient.responsibleTherapistId) return `${patient.name} — sem terapeuta`;
  const current = therapists.find((t) => t.id === patient.responsibleTherapistId);
  return `${patient.name} — atualmente com ${current?.name ?? 'outro terapeuta'}`;
}

export default function AdminTherapists() {
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedToAdd, setSelectedToAdd] = useState({});
  const [pendingAction, setPendingAction] = useState(null); // `${therapistId}:${patientId}` em voo
  const [actionError, setActionError] = useState('');
  const [editingTherapist, setEditingTherapist] = useState(null);
  const [deletingTherapist, setDeletingTherapist] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [therapistsRes, patientsRes] = await Promise.all([
      apiFetch('/api/users?role=terapeuta'),
      apiFetch('/api/users?role=paciente'),
    ]);
    if (therapistsRes.ok && patientsRes.ok) {
      setTherapists(therapistsRes.body.users);
      setPatients(patientsRes.body.users);
      setLoadError(false);
    } else {
      setLoadError(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const patientsByTherapist = useMemo(() => {
    const map = new Map();
    for (const therapist of therapists) map.set(therapist.id, []);
    for (const patient of patients) {
      if (patient.responsibleTherapistId && map.has(patient.responsibleTherapistId)) {
        map.get(patient.responsibleTherapistId).push(patient);
      }
    }
    return map;
  }, [therapists, patients]);

  const unlinkedCount = useMemo(
    () => patients.filter((p) => !p.responsibleTherapistId).length,
    [patients]
  );

  async function handleLink(therapistId) {
    const patientId = selectedToAdd[therapistId];
    if (!patientId) return;
    setActionError('');
    setPendingAction(`${therapistId}:${patientId}`);
    const { ok, body } = await apiFetch(`/api/users/${patientId}`, {
      method: 'PATCH',
      body: JSON.stringify({ responsibleTherapistId: therapistId }),
    });
    setPendingAction(null);
    if (!ok) {
      setActionError(body?.error ?? 'Não foi possível vincular o paciente.');
      return;
    }
    setSelectedToAdd((prev) => ({ ...prev, [therapistId]: '' }));
    await loadData();
  }

  async function handleUnlink(therapistId, patientId) {
    setActionError('');
    setPendingAction(`${therapistId}:${patientId}`);
    const { ok, body } = await apiFetch(`/api/users/${patientId}`, {
      method: 'PATCH',
      body: JSON.stringify({ responsibleTherapistId: null }),
    });
    setPendingAction(null);
    if (!ok) {
      setActionError(body?.error ?? 'Não foi possível desvincular o paciente.');
      return;
    }
    await loadData();
  }

  async function handleSaveTherapist(values) {
    const { ok, body } = await apiFetch(`/api/users/${editingTherapist.id}`, {
      method: 'PATCH',
      body: JSON.stringify(values),
    });
    if (!ok) {
      return { success: false, error: body?.error ?? 'Não foi possível salvar as alterações.' };
    }
    setEditingTherapist(null);
    await loadData();
    return { success: true };
  }

  async function handleDeleteTherapist() {
    setDeleteError('');
    setIsDeleting(true);
    const { ok, body } = await apiFetch(`/api/users/${deletingTherapist.id}`, { method: 'DELETE' });
    setIsDeleting(false);
    if (!ok) {
      setDeleteError(body?.error ?? 'Não foi possível excluir essa conta.');
      return;
    }
    setDeletingTherapist(null);
    await loadData();
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader showBack onBack={() => navigate('/admin')} />

      <main className="flex-1">
        <section className="mx-auto max-w-[1000px] px-6 py-10">
          <div className="mb-8">
            <h1 className="text-[24px] font-semibold tracking-tight text-ink">Gerenciar Terapeutas</h1>
            <p className="mt-1 text-[14px] text-ink-secondary">
              Veja quantos pacientes cada terapeuta tem, e vincule ou desvincule pacientes.
              {!isLoading && !loadError && (
                <span className="text-ink-tertiary"> {unlinkedCount} paciente(s) sem terapeuta.</span>
              )}
            </p>
          </div>

          {isLoading && <p className="text-[14px] text-ink-secondary">Carregando…</p>}

          {!isLoading && loadError && (
            <p className="text-[14px] text-danger">Não foi possível carregar terapeutas e pacientes.</p>
          )}

          {!isLoading && !loadError && therapists.length === 0 && (
            <p className="text-[14px] text-ink-secondary">Nenhum terapeuta cadastrado ainda.</p>
          )}

          <AnimatePresence>
            {actionError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-xl bg-danger-soft px-4 py-2 text-[13px] text-danger"
              >
                {actionError}
              </motion.p>
            )}
          </AnimatePresence>

          {!isLoading && !loadError && therapists.length > 0 && (
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
              {therapists.map((therapist) => {
                const linked = patientsByTherapist.get(therapist.id) ?? [];
                const isOpen = expandedId === therapist.id;
                // Qualquer paciente que não esteja já vinculado a ESTE terapeuta pode
                // ser adicionado — inclui tanto pacientes sem terapeuta quanto os
                // vinculados a outro (escolher um desses reatribui, o rótulo deixa
                // claro de quem ele viria).
                const assignable = patients.filter((p) => p.responsibleTherapistId !== therapist.id);

                return (
                  <motion.div
                    key={therapist.id}
                    variants={staggerItem}
                    className="rounded-2xl border border-hairline-soft bg-white p-5 shadow-soft"
                  >
                    <div className="flex w-full items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : therapist.id)}
                        aria-expanded={isOpen}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <SafeImage
                          src={therapist.avatar}
                          alt={therapist.name}
                          className="h-[48px] w-[48px] shrink-0"
                          rounded
                        />
                        <div className="min-w-0 text-left">
                          <p className="truncate text-[15px] font-medium text-ink">{therapist.name}</p>
                          <p className="truncate text-[12px] text-ink-tertiary">{therapist.email}</p>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-brand-soft px-3 py-1 text-[12px] font-medium text-brand-deep">
                          {linked.length} paciente{linked.length === 1 ? '' : 's'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingTherapist(therapist)}
                          className="rounded-lg border border-hairline px-3 py-1.5 text-[12px] font-medium text-ink transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError('');
                            setDeletingTherapist(therapist);
                          }}
                          className="rounded-lg border border-hairline px-3 py-1.5 text-[12px] font-medium text-danger transition-colors duration-200 hover:bg-danger-soft focus:outline-none focus:ring-2 focus:ring-brand"
                        >
                          Excluir
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isOpen ? null : therapist.id)}
                          aria-expanded={isOpen}
                          aria-label={isOpen ? 'Recolher' : 'Expandir'}
                          className="p-1"
                        >
                          <motion.span
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="block"
                          >
                            <ChevronDown className="h-5 w-5 text-ink-secondary" />
                          </motion.span>
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          variants={fadeInUp}
                          initial="hidden"
                          animate="show"
                          exit="hidden"
                          className="mt-4 flex flex-col gap-4 border-t border-hairline-soft pt-4"
                        >
                          {linked.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {linked.map((patient) => {
                                const busy = pendingAction === `${therapist.id}:${patient.id}`;
                                return (
                                  <div
                                    key={patient.id}
                                    className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2"
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      <SafeImage
                                        src={patient.avatar}
                                        alt={patient.name}
                                        className="h-[36px] w-[36px] shrink-0"
                                        rounded
                                      />
                                      <div className="min-w-0">
                                        <p className="truncate text-[13.5px] text-ink">{patient.name}</p>
                                        <p className="truncate text-[11px] text-ink-tertiary">
                                          {patient.email}
                                        </p>
                                      </div>
                                    </div>
                                    <motion.button
                                      type="button"
                                      whileTap={buttonTap}
                                      disabled={busy}
                                      onClick={() => handleUnlink(therapist.id, patient.id)}
                                      className="shrink-0 rounded-lg border border-hairline px-3 py-1 text-[12px] font-medium text-ink transition-colors duration-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                                    >
                                      {busy ? 'Removendo…' : 'Desvincular'}
                                    </motion.button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[13px] text-ink-tertiary">Nenhum paciente vinculado ainda.</p>
                          )}

                          {assignable.length > 0 && (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <select
                                value={selectedToAdd[therapist.id] ?? ''}
                                onChange={(e) =>
                                  setSelectedToAdd((prev) => ({ ...prev, [therapist.id]: e.target.value }))
                                }
                                className="w-full flex-1 rounded-xl border border-hairline bg-white px-4 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand sm:w-auto"
                              >
                                <option value="">Adicionar paciente…</option>
                                {assignable.map((patient) => (
                                  <option key={patient.id} value={patient.id}>
                                    {patientOptionLabel(patient, therapists)}
                                  </option>
                                ))}
                              </select>
                              <motion.button
                                type="button"
                                whileTap={buttonTap}
                                disabled={
                                  !selectedToAdd[therapist.id] ||
                                  pendingAction === `${therapist.id}:${selectedToAdd[therapist.id]}`
                                }
                                onClick={() => handleLink(therapist.id)}
                                className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-[13px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {pendingAction === `${therapist.id}:${selectedToAdd[therapist.id]}`
                                  ? 'Vinculando…'
                                  : 'Vincular'}
                              </motion.button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {editingTherapist && (
          <EditProfileModal
            title="Editar Terapeuta"
            profile={editingTherapist}
            onClose={() => setEditingTherapist(null)}
            onSave={handleSaveTherapist}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingTherapist && (
          <ConfirmModal
            title="Excluir terapeuta"
            message={`Tem certeza que quer excluir a conta de ${deletingTherapist.name}? Os pacientes vinculados a ela ficam sem terapeuta (não são excluídos). Os códigos de acesso gerados por ${deletingTherapist.name} e as sessões registradas a partir deles também são apagados. Essa ação não pode ser desfeita.`}
            confirmLabel="Excluir"
            isSubmitting={isDeleting}
            error={deleteError}
            onConfirm={handleDeleteTherapist}
            onClose={() => setDeletingTherapist(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
