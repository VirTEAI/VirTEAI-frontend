import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import { apiFetch } from '../lib/api-client';
import { fadeInUp } from '../lib/motion';
import { SearchIcon } from '../components/icons';

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
    </div>
  );
}
