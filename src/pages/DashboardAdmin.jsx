import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import WorldCard from '../components/WorldCard';
import VincularMundoModal from '../components/VincularMundoModal';
import NotificationsModal from '../components/NotificationsModal';
import { worlds, recentWorldIds, popularWorldIds } from '../data/worlds';
import { fadeInUp, staggerContainer, buttonTap, buttonHover } from '../lib/motion';

const imgSearch = 'https://www.figma.com/api/mcp/asset/3fd68137-5c75-4630-b40a-7526ab81558f.png';
const imgLink = 'https://www.figma.com/api/mcp/asset/4e618a44-11db-4cde-a4ae-fd9350b54d3f.png';
const imgUser = 'https://www.figma.com/api/mcp/asset/3a37b205-1680-43c4-8407-e683fd917976.png';
const imgBanner = 'https://www.figma.com/api/mcp/asset/9e1de782-9774-4f61-a3d9-959e6065f598.png';

const imgAvatar1 = 'https://www.figma.com/api/mcp/asset/c15449d4-ecda-46f1-a4fb-88af275d9ced.png';
const imgAvatar2 = 'https://www.figma.com/api/mcp/asset/712ca6ee-ac4e-41bb-9f70-16e61959a741.png';
const imgAvatar3 = 'https://www.figma.com/api/mcp/asset/8e6fafcd-2306-4df1-be3e-1def1ee9cff4.png';

// Dados mockados — em produção viriam da API (mundos em rascunho, solicitações
// de terapeutas pendentes de aprovação). Comentário deixado a pedido, já que
// dados reais serão conectados depois.
const initialDrafts = [{ id: 'draft-1', title: 'Untitled' }];

const initialRequests = [
  { id: 'req-1', name: 'Ana Clara Souza', email: 'ana.souza@email.com', avatar: imgAvatar1 },
  { id: 'req-2', name: 'Carlos Eduardo Lima', email: 'carlos.eduardo@email.com', avatar: imgAvatar2 },
  { id: 'req-3', name: 'Mariana Ferreira', email: 'mariana.ferreira@email.com', avatar: imgAvatar3 },
];

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState(initialDrafts);
  const [requests, setRequests] = useState(initialRequests);
  const [vincularOpen, setVincularOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  function handleVincularSubmit(data) {
    setDrafts((prev) => [...prev, { id: `draft-${prev.length + 1}`, title: data.nome }]);
    setVincularOpen(false);
  }

  function handleRequestDecision(id) {
    // "Negar" e "Confirmar" apenas removem a solicitação da lista local por
    // enquanto — sem backend real ainda para aprovar/recusar terapeutas.
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
            {drafts.map((draft) => (
              <motion.div
                key={draft.id}
                variants={fadeInUp}
                className="flex w-full max-w-[328px] flex-col gap-2"
              >
                <div className="aspect-[372/227] w-full rounded-xl bg-surface ring-1 ring-inset ring-hairline-soft" />
                <p className="text-[16px] text-ink">{draft.title}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mb-12 flex justify-end">
            <div className="flex h-[38px] w-full max-w-[308px] items-center gap-2 rounded-full border border-hairline px-4 transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand">
              <img src={imgSearch} alt="" className="h-[15px] w-[15px]" />
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
                <img src={imgLink} alt="" className="h-5 w-5" />
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
                <img src={imgUser} alt="" className="h-5 w-5" />
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
            {recentWorldIds.map((id, i) => (
              <WorldCard
                key={`recent-${i}`}
                world={worlds[id]}
                onSelect={(world) => navigate(`/dashboard/mundo/${world.id}`)}
              />
            ))}
          </motion.div>

          <h2 className="mb-4 text-[19.8px] text-ink">Mundos Populares</h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mb-20 flex flex-wrap gap-6"
          >
            {popularWorldIds.map((id, i) => (
              <WorldCard
                key={`popular-${i}`}
                world={worlds[id]}
                onSelect={(world) => navigate(`/dashboard/mundo/${world.id}`)}
              />
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
        {notificationsOpen && (
          <NotificationsModal
            requests={requests}
            onDecide={handleRequestDecision}
            onClose={() => setNotificationsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
