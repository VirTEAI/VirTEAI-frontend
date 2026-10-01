import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import ConfirmModal from '../components/ConfirmModal';
import { apiFetch } from '../lib/api-client';
import { fadeInUp } from '../lib/motion';
import { SearchIcon } from '../components/icons';

// Rótulo + mensagem de confirmação de cada grupo que dá pra apagar em
// massa — "ativos" (pedido do admin) é o mesmo grupo que aparece como
// "Pendente" na lista (ainda não usado, ainda não venceu); "expirado" nunca
// fica gravado no banco, é "pendente" que já passou do prazo (mesma conta
// de deriveStatus no backend).
const BULK_SCOPES = {
  pendente: { label: 'Apagar pendentes (ativos)', noun: 'código pendente', nounPlural: 'códigos pendentes' },
  expirado: { label: 'Apagar expirados', noun: 'código expirado', nounPlural: 'códigos expirados' },
};

function formatGeneratedAt(isoDate) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}


const STATUS_STYLES = {
  pendente: { label: 'Pendente', bg: 'bg-warning-soft', text: 'text-warning' },
  utilizado: { label: 'Utilizado', bg: 'bg-success-soft', text: 'text-success' },
  expirado: { label: 'Expirado', bg: 'bg-danger-soft', text: 'text-danger' },
};

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard indisponível (ex.: contexto sem permissão) — ignora.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-hairline px-3 py-1.5 text-[12px] font-medium text-ink transition-colors duration-200 hover:border-brand hover:bg-surface hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand"
    >
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  );
}

export default function AccessCodes() {
  const [search, setSearch] = useState('');
  const [codes, setCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deletingCode, setDeletingCode] = useState(null);
  const [isDeletingCode, setIsDeletingCode] = useState(false);
  const [deleteCodeError, setDeleteCodeError] = useState('');

  const [bulkScope, setBulkScope] = useState(null); // null | 'pendente' | 'expirado'
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/codes').then(({ ok, body }) => {
      if (cancelled) return;
      setCodes(ok ? body.codes : []);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return codes;
    return codes.filter(
      (entry) =>
        entry.code.toLowerCase().includes(term) ||
        (entry.patientName ?? '').toLowerCase().includes(term) ||
        entry.worldTitle.toLowerCase().includes(term)
    );
  }, [codes, search]);

  // Contagem por grupo pra mostrar nos botões de apagar em massa e decidir
  // se eles aparecem — calculado local (o `status` que já vem de
  // GET /api/codes é o derivado, mesma regra do backend).
  const bulkCounts = useMemo(
    () => ({
      pendente: codes.filter((c) => c.status === 'pendente').length,
      expirado: codes.filter((c) => c.status === 'expirado').length,
    }),
    [codes]
  );

  async function handleDeleteCode() {
    setDeleteCodeError('');
    setIsDeletingCode(true);
    const { ok, body } = await apiFetch(`/api/codes/${deletingCode.id}`, { method: 'DELETE' });
    setIsDeletingCode(false);
    if (!ok) {
      setDeleteCodeError(body?.error ?? 'Não foi possível apagar esse código.');
      return;
    }
    setCodes((prev) => prev.filter((c) => c.id !== deletingCode.id));
    setDeletingCode(null);
  }

  async function handleBulkDelete() {
    setBulkError('');
    setIsBulkDeleting(true);
    const { ok, body } = await apiFetch(`/api/codes/bulk?scope=${bulkScope}`, { method: 'DELETE' });
    setIsBulkDeleting(false);
    if (!ok) {
      setBulkError(body?.error ?? 'Não foi possível apagar esses códigos.');
      return;
    }
    // Recarrega do servidor em vez de filtrar local — o backend já aplicou
    // o escopo de dono (terapeuta só apaga o que ele gerou), então é a
    // fonte confiável de quais códigos realmente saíram.
    const { ok: refetchOk, body: refetchBody } = await apiFetch('/api/codes');
    if (refetchOk) setCodes(refetchBody.codes);
    setBulkScope(null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-[1270px] px-6 pb-20 pt-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <h1 className="text-[28px] text-ink">Códigos de Acesso Gerados</h1>
            <div className="flex h-[38px] w-full max-w-[308px] items-center gap-2 rounded-full border border-hairline bg-white px-4 transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand">
              <SearchIcon className="h-[15px] w-[15px] text-ink-tertiary" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código, paciente ou mundo"
                className="w-full bg-transparent text-[14px] text-ink placeholder:text-ink-tertiary focus:outline-none"
              />
            </div>
          </motion.div>

          {(bulkCounts.pendente > 0 || bulkCounts.expirado > 0) && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              className="mb-6 flex flex-wrap items-center gap-2"
            >
              <span className="text-[13px] text-ink-secondary">Apagar em massa:</span>
              {bulkCounts.expirado > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setBulkError('');
                    setBulkScope('expirado');
                  }}
                  className="rounded-lg border border-hairline px-3 py-1.5 text-[12px] font-medium text-danger transition-colors duration-200 hover:bg-danger-soft focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  Apagar expirados ({bulkCounts.expirado})
                </button>
              )}
              {bulkCounts.pendente > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setBulkError('');
                    setBulkScope('pendente');
                  }}
                  className="rounded-lg border border-hairline px-3 py-1.5 text-[12px] font-medium text-danger transition-colors duration-200 hover:bg-danger-soft focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  Apagar pendentes/ativos ({bulkCounts.pendente})
                </button>
              )}
            </motion.div>
          )}

          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-hairline-soft bg-white p-10 text-center shadow-soft"
            >
              <p className="text-[15px] text-ink-secondary">Carregando…</p>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-hairline-soft bg-white p-10 text-center shadow-soft"
            >
              <p className="text-[15px] text-ink-secondary">
                {codes.length === 0
                  ? 'Nenhum código foi gerado ainda. Selecione um mundo e um paciente no Dashboard e clique em "Gerar Código de Acesso".'
                  : 'Nenhum código encontrado para essa busca.'}
              </p>
            </motion.div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-hairline-soft bg-white shadow-soft">
              <div className="hidden grid-cols-[160px_1fr_1fr_180px_120px_auto] gap-4 border-b border-hairline-soft bg-surface px-6 py-3 text-[13px] text-ink-secondary md:grid">
                <span>Código</span>
                <span>Mundo</span>
                <span>Paciente</span>
                <span>Gerado em</span>
                <span>Status</span>
                <span className="sr-only">Ações</span>
              </div>

              <div className="flex flex-col divide-y divide-hairline-soft">
                <AnimatePresence initial={false}>
                {filtered.map((entry, i) => {
                  const status = STATUS_STYLES[entry.status] ?? STATUS_STYLES.pendente;
                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: Math.min(i, 8) * 0.03 } }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-[160px_1fr_1fr_180px_120px_auto] md:items-center md:gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[14px] font-bold tracking-wide text-ink">
                          {entry.code}
                        </span>
                      </div>
                      <p className="text-[14px] text-ink">{entry.worldTitle}</p>
                      <p className="text-[14px] text-ink">{entry.patientName ?? 'Paciente removido'}</p>
                      <p className="text-[13px] text-ink-secondary">{formatGeneratedAt(entry.generatedAt)}</p>
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${status.bg} ${status.text}`}
                      >
                        {status.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <CopyButton code={entry.code} />
                        {entry.status === 'utilizado' && (
                          <Link
                            to={`/dashboard/mundo/${entry.worldId}/resumo?code=${encodeURIComponent(entry.code)}`}
                            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-hairline px-3 py-1.5 text-[12px] font-medium text-ink transition-colors duration-200 hover:border-brand hover:bg-surface hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand"
                          >
                            Ver resumo
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteCodeError('');
                            setDeletingCode(entry);
                          }}
                          aria-label={`Apagar código ${entry.code}`}
                          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-hairline px-3 py-1.5 text-[12px] font-medium text-danger transition-colors duration-200 hover:border-danger hover:bg-danger-soft focus:outline-none focus:ring-2 focus:ring-brand"
                        >
                          Excluir
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
        {deletingCode && (
          <ConfirmModal
            title="Excluir código"
            message={`Tem certeza que quer apagar o código "${deletingCode.code}" (${deletingCode.worldTitle} — ${deletingCode.patientName ?? 'paciente removido'})? Se esse código já tiver uma sessão registrada, ela também será apagada. Essa ação não pode ser desfeita.`}
            confirmLabel="Excluir"
            isSubmitting={isDeletingCode}
            error={deleteCodeError}
            onConfirm={handleDeleteCode}
            onClose={() => setDeletingCode(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bulkScope && (
          <ConfirmModal
            title={BULK_SCOPES[bulkScope].label}
            message={`Tem certeza que quer apagar ${
              bulkCounts[bulkScope] === 1
                ? `o ${bulkCounts[bulkScope]} ${BULK_SCOPES[bulkScope].noun}`
                : `todos os ${bulkCounts[bulkScope]} ${BULK_SCOPES[bulkScope].nounPlural}`
            }? Sessões registradas a partir desses códigos também serão apagadas. Essa ação não pode ser desfeita.`}
            confirmLabel="Apagar"
            isSubmitting={isBulkDeleting}
            error={bulkError}
            onConfirm={handleBulkDelete}
            onClose={() => setBulkScope(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
