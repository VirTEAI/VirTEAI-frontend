import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import { SearchIcon, LinkIcon, UserIcon } from '../components/icons';
import WorldCard from '../components/WorldCard';
import VincularMundoModal from '../components/VincularMundoModal';
import NotificationsModal from '../components/NotificationsModal';
import { useWorlds } from '../hooks/useWorlds';
import { apiFetch } from '../lib/api-client';
import { fadeInUp, staggerContainer, buttonTap, buttonHover } from '../lib/motion';
// Mesmo banner "Mundo em destaque" usado no dashboard do paciente/terapeuta
// — não recebemos uma arte separada pra essa tela (ver PENDENTES.md).
import imgBanner from '../assets/images/dashboard-banner.png';

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const { worlds, isLoading: worldsLoading, refresh: refreshWorlds } = useWorlds();
  // Pedidos de cadastro pendentes (tela "Cadastrar" → vira pedido, não
  // conta direto — ver Register.jsx) — sininho de notificações aqui no
  // dashboard do admin é onde eles são revisados/aprovados/negados.
  const [requests, setRequests] = useState([]);
  const [decidingId, setDecidingId] = useState(null);
  const [decisionError, setDecisionError] = useState('');
  const [vincularOpen, setVincularOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/registration-requests?status=pendente').then(({ ok, body }) => {
      if (cancelled) return;
      setRequests(ok ? body.requests : []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // O mundo criado pelo modal já é real (POST /api/worlds), não um rascunho
  // local — só falta recarregar a lista pra ele aparecer em "Mundos
  // Recentes"/"Rascunhos" e fechar o modal.
  function handleVincularSubmit() {
    refreshWorlds();
    setVincularOpen(false);
    setEditingDraft(null);
  }

  // GET /api/worlds já devolve rascunho (status=draft) só pra admin — ver
  // worlds.controller.js. "Mundos Recentes"/"Mundos Populares" são só o que
  // já está publicado; um rascunho sem imagem/descrição ainda não é pra
  // aparecer misturado com conteúdo de verdade pra paciente/terapeuta (nem
  // apareceria mesmo, já que o backend esconde rascunho de quem não é
  // admin — esse filtro aqui é só pra não duplicar o card nessas duas
  // seções também, já que "Rascunhos" tem a seção própria dele).
  const publishedWorlds = worlds.filter((w) => w.status !== 'draft');
  const drafts = worlds.filter((w) => w.status === 'draft');
  const recentWorlds = [...publishedWorlds].sort(
    (a, b) => new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime()
  );
  const popularWorlds = [...publishedWorlds].sort((a, b) => b.views - a.views);

  // "Negar" chama reject, "Confirmar" chama approve — só aí a conta do
  // terapeuta nasce de verdade em `users` (ver
  // registration-requests.controller.js). Em qualquer um dos dois casos o
  // pedido sai da lista de pendentes.
  async function handleRequestDecision(id, decision) {
    setDecisionError('');
    setDecidingId(id);
    const action = decision === 'confirmar' ? 'approve' : 'reject';
    const { ok, body } = await apiFetch(`/api/registration-requests/${id}/${action}`, { method: 'POST' });
    setDecidingId(null);
    if (!ok) {
      setDecisionError(body?.error ?? 'Não foi possível concluir essa ação.');
      return;
    }
    setRequests((prev) => prev.filter((req) => req.id !== id));
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader
        onNotificationsClick={() => setNotificationsOpen((open) => !open)}
      />

      <main className="flex-1">
        <section className="mx-auto max-w-[1330px] px-6 pt-8">
          <h2 className="mb-4 text-[19.8px] text-ink">Rascunhos</h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mb-12 flex flex-wrap gap-6"
          >
            {!worldsLoading && drafts.length === 0 && (
              <p className="text-[14px] text-ink-secondary">
                Nenhum rascunho por enquanto — "Vincular um novo Mundo" abaixo tem a opção de
                salvar como rascunho em vez de publicar direto.
              </p>
            )}
            {drafts.map((draft) => (
              <WorldCard key={`draft-${draft.id}`} world={draft} onSelect={setEditingDraft} />
            ))}
          </motion.div>

          <div className="mb-12 flex justify-end">
            <div className="flex h-[38px] w-full max-w-[308px] items-center gap-2 rounded-full border border-hairline px-4 transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand">
              <SearchIcon className="h-[15px] w-[15px] text-ink-tertiary" />
              <input
                type="search"
                placeholder="Mundo Empresarial...."
                className="w-full bg-transparent text-[14px] text-ink placeholder:text-ink-tertiary focus:outline-none"
              />
            </div>
          </div>

          <h2 className="mb-4 text-[19.8px] text-ink">Configurações</h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mb-12 grid gap-4 sm:grid-cols-3"
          >
            <motion.button
              variants={fadeInUp}
              type="button"
              onClick={() => setVincularOpen(true)}
              whileTap={buttonTap}
              whileHover={buttonHover}
              className="group flex items-center gap-4 rounded-2xl border border-hairline-soft bg-white p-5 text-left shadow-soft transition-all duration-200 hover:border-brand hover:shadow-elevated focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-deep">
                <LinkIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">Vincular um novo Mundo</span>
                <span className="block truncate text-[13px] text-ink-secondary">
                  Cadastre um mundo de RV para os pacientes explorarem
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>

            <motion.button
              variants={fadeInUp}
              type="button"
              whileTap={buttonTap}
              whileHover={buttonHover}
              className="group flex items-center gap-4 rounded-2xl border border-hairline-soft bg-white p-5 text-left shadow-soft transition-all duration-200 hover:border-brand hover:shadow-elevated focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-deep">
                <UserIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">Novo Terapeuta</span>
                <span className="block truncate text-[13px] text-ink-secondary">
                  Cadastre um novo terapeuta na plataforma
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>

            <motion.button
              variants={fadeInUp}
              type="button"
              onClick={() => navigate('/codigos')}
              whileTap={buttonTap}
              whileHover={buttonHover}
              className="group flex items-center gap-4 rounded-2xl border border-hairline-soft bg-white p-5 text-left shadow-soft transition-all duration-200 hover:border-brand hover:shadow-elevated focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-deep">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <rect x="3" y="8" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M7 12h.01M11 12h.01M15 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M7 15h.01M11 15h.01M15 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">Códigos Gerados</span>
                <span className="block truncate text-[13px] text-ink-secondary">
                  Visualize e gerencie os códigos de acesso gerados
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>

            <motion.button
              variants={fadeInUp}
              type="button"
              onClick={() => navigate('/admin/terapeutas')}
              whileTap={buttonTap}
              whileHover={buttonHover}
              className="group flex items-center gap-4 rounded-2xl border border-hairline-soft bg-white p-5 text-left shadow-soft transition-all duration-200 hover:border-brand hover:shadow-elevated focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-deep">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="17" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M15.5 14.2c2.4.3 4 2.1 4 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">Gerenciar Terapeutas</span>
                <span className="block truncate text-[13px] text-ink-secondary">
                  Veja e vincule quais pacientes cada terapeuta tem
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>

            <motion.button
              variants={fadeInUp}
              type="button"
              onClick={() => navigate('/admin/mundos')}
              whileTap={buttonTap}
              whileHover={buttonHover}
              className="group flex items-center gap-4 rounded-2xl border border-hairline-soft bg-white p-5 text-left shadow-soft transition-all duration-200 hover:border-brand hover:shadow-elevated focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-deep">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">Gerenciar Mundos</span>
                <span className="block truncate text-[13px] text-ink-secondary">
                  Edite, publique ou exclua mundos existentes
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className="relative mb-12 h-[280px] overflow-hidden rounded-3xl md:h-[413px]"
          >
            <SafeImage src={imgBanner} alt="Mundo em destaque" className="h-full w-full" />
            <p
              className="absolute left-6 top-6 font-['League_Spartan',_sans-serif] text-[32px] text-white md:left-8 md:top-8 md:text-[40px]"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}
            >
              Tendencia
            </p>
          </motion.div>

          <h2 className="mb-4 text-[19.8px] text-ink">Mundos Recentes</h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mb-12 flex flex-wrap gap-6"
          >
            {worldsLoading && <p className="text-[14px] text-ink-secondary">Carregando mundos…</p>}
            {!worldsLoading && recentWorlds.length === 0 && (
              <p className="text-[14px] text-ink-secondary">Nenhum mundo cadastrado ainda.</p>
            )}
            {recentWorlds.map((world) => (
              <WorldCard key={`recent-${world.id}`} world={world} onSelect={(w) => navigate(`/dashboard/mundo/${w.id}`)} />
            ))}
          </motion.div>

          <h2 className="mb-4 text-[19.8px] text-ink">Mundos Populares</h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mb-20 flex flex-wrap gap-6"
          >
            {popularWorlds.map((world) => (
              <WorldCard key={`popular-${world.id}`} world={world} onSelect={(w) => navigate(`/dashboard/mundo/${w.id}`)} />
            ))}
          </motion.div>
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {vincularOpen && (
          <VincularMundoModal onClose={() => setVincularOpen(false)} onSubmit={handleVincularSubmit} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingDraft && (
          <VincularMundoModal
            world={editingDraft}
            onClose={() => setEditingDraft(null)}
            onSubmit={handleVincularSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notificationsOpen && (
          <NotificationsModal
            requests={requests}
            decidingId={decidingId}
            error={decisionError}
            onDecide={handleRequestDecision}
            onClose={() => setNotificationsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
