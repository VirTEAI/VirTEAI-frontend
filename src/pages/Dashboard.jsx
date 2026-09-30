import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import WorldCard from '../components/WorldCard';
import DashboardOpenModal from '../components/DashboardOpenModal';
import SafeImage from '../components/SafeImage';
import { SearchIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useWorlds } from '../hooks/useWorlds';
import { fadeInUp, staggerContainer } from '../lib/motion';

const imgBanner = 'https://www.figma.com/api/mcp/asset/a270abd0-53e8-4503-bcbe-b534e957e797.png';

const ROLE_LABEL = {
  paciente: 'Pronto para a sessão de hoje?',
  terapeuta: 'Acompanhe seus pacientes e mundos.',
  admin: 'Visão geral da plataforma.',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { worlds, isLoading: worldsLoading } = useWorlds();
  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const firstName = user?.name?.split(' ')[0] ?? '';

  // Sem uma lista fixa de ids duplicados (era só pra preencher a grade do
  // mock) — "Recentes" e "Populares" agora são a mesma lista de mundos
  // reais, só ordenada de dois jeitos diferentes.
  const recentWorlds = [...worlds].sort(
    (a, b) => new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime()
  );
  const popularWorlds = [...worlds].sort((a, b) => b.views - a.views);
  const selectedWorld = worlds.find((w) => w.id === selectedWorldId) ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-[1330px] px-6 pt-8">
          {/* Saudação — contexto rápido de onde a pessoa está e o que pode
              fazer aqui, com dados reais da sessão (sem métricas inventadas). */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className="mb-8"
          >
            <h1 className="text-[24px] font-semibold tracking-tight text-ink">
              Olá{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1 text-[15px] text-ink-secondary">
              {ROLE_LABEL[user?.role] ?? 'Escolha um mundo para começar.'}
            </p>
          </motion.div>

          {/* Banner de destaque */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className="relative mb-12 h-[280px] overflow-hidden rounded-3xl shadow-soft md:h-[413px]"
          >
            <SafeImage src={imgBanner} alt="Mundo em destaque" className="h-full w-full" />
            <p
              className="absolute left-6 top-6 font-['League_Spartan',_sans-serif] text-[32px] text-white md:left-8 md:top-8 md:text-[40px]"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}
            >
              Tendencia
            </p>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <button type="button" className="text-[19.8px] font-medium text-ink transition-colors duration-200 hover:text-brand">
              Filtrar
            </button>
            <div className="flex h-[38px] w-full max-w-[308px] items-center gap-2 rounded-full bg-surface px-4 ring-1 ring-inset ring-hairline-soft transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand">
              <SearchIcon className="h-[15px] w-[15px] text-ink-tertiary opacity-60" />
              <input
                type="search"
                placeholder="Mundo Empresarial...."
                className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-tertiary focus:outline-none"
              />
            </div>
          </motion.div>

          <h2 className="mb-5 text-[19.8px] font-semibold tracking-tight text-ink">Mundos Recentes</h2>
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
              <WorldCard key={`recent-${world.id}`} world={world} onSelect={(w) => setSelectedWorldId(w.id)} />
            ))}
          </motion.div>

          <h2 className="mb-5 text-[19.8px] font-semibold tracking-tight text-ink">Mundos Populares</h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mb-16 flex flex-wrap gap-6"
          >
            {popularWorlds.map((world) => (
              <WorldCard key={`popular-${world.id}`} world={world} onSelect={(w) => setSelectedWorldId(w.id)} />
            ))}
          </motion.div>
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {selectedWorld && (
          <DashboardOpenModal
            world={selectedWorld}
            worldOrder={worlds.map((w) => w.id)}
            onClose={() => setSelectedWorldId(null)}
            onChangeWorld={(id) => setSelectedWorldId(id)}
            onFullscreen={(id) => navigate(`/dashboard/mundo/${id}`)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
