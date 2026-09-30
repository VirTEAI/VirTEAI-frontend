import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import { ThumbsUpIcon, EyeIcon, VerifiedIcon, CommentIcon, HeartIcon } from '../components/icons';
import PatientSelector from '../components/PatientSelector';
import GenerateCodeModal from '../components/GenerateCodeModal';
import { useAuth } from '../context/AuthContext';
import { usePatients } from '../hooks/usePatients';
import { useWorlds } from '../hooks/useWorlds';
import { fadeInUp, staggerContainer, buttonTap, buttonHover } from '../lib/motion';

function formatLaunchedAt(isoDate) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(
    new Date(isoDate)
  );
}

const imgAvatarComment =
  'https://www.figma.com/api/mcp/asset/c0d9bce9-7097-450a-806f-d374e7b2c1e0.png';

const comments = [{ author: 'Fabricia Santos', text: 'Simplesmente muito bom!! minha paciente adorou' }];

export default function DashboardWorld() {
  const navigate = useNavigate();
  const { worldId } = useParams();
  const { user } = useAuth();
  const { worlds, isLoading: worldsLoading } = useWorlds();
  const world = worlds.find((w) => w.id === worldId);
  // Regra de permissão: paciente só visualiza o mundo — quem gera código de
  // acesso é o terapeuta (ou o admin, vindo de /admin).
  const canGenerateCode = user.role === 'terapeuta' || user.role === 'admin';
  const { patients, isLoading: patientsLoading } = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [showGenerateFlow, setShowGenerateFlow] = useState(false);

  // A lista de pacientes vem da API de forma assíncrona — assim que ela
  // chega, seleciona o primeiro por padrão.
  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  // Só redireciona depois que a lista de mundos terminou de carregar — antes
  // disso `world` também estaria undefined mesmo pra um id válido, e mandar
  // pra /dashboard nesse meio tempo seria um redirecionamento errado.
  if (!worldsLoading && !world) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!world) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <AppHeader showBack onBack={() => navigate(-1)} />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-[14px] text-ink-secondary">Carregando mundo…</p>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader showBack onBack={() => navigate(-1)} />

      <main className="flex-1">
        <section className="mx-auto max-w-[1270px] px-6 pt-8 pb-20 md:pb-28">
          {/* Galeria */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mb-8 flex gap-4 overflow-x-auto pb-2"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div key={i} variants={fadeInUp} className="shrink-0">
                <SafeImage
                  src={world.gallery}
                  alt={`${world.title} — imagem ${i + 1}`}
                  className="h-[280px] w-[460px] rounded-2xl shadow-soft md:h-[369px] md:w-[604px]"
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]"
          >
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-[24px] font-semibold tracking-tight text-ink">{world.title}</h1>
                <div className="flex items-center gap-5">
                  <span className="flex items-center gap-1.5 text-[16px] text-ink-secondary">
                    <ThumbsUpIcon className="h-[18px] w-[18px] opacity-70" />
                    {world.likes}
                  </span>
                  <span className="flex items-center gap-1.5 text-[16px] text-ink-secondary">
                    <EyeIcon className="h-[17px] w-[17px] opacity-70" />
                    {world.views}
                  </span>
                </div>
              </div>

              <p className="mb-6 max-w-[522px] text-[14px] leading-relaxed text-ink-secondary">
                {world.description}
              </p>

              <div className="mb-6 flex items-center gap-1.5 text-[14px] text-ink-secondary">
                <span>Desenvolvido por</span>
                <span className="text-[#67a379]">VirTEAI</span>
                <VerifiedIcon className="h-5 w-5" />
                <span className="ml-4">Lançado em</span>
                <span className="text-[#67a379]">{formatLaunchedAt(world.launchedAt)}</span>
              </div>

              <div className="mb-8 flex gap-3">
                <button
                  type="button"
                  aria-label="Favoritar"
                  className="flex h-[49px] w-[49px] items-center justify-center rounded-full bg-surface ring-1 ring-inset ring-hairline-soft transition-colors duration-200 hover:bg-hairline-soft"
                >
                  <HeartIcon className="h-[23px] w-[23px]" />
                </button>
                <button
                  type="button"
                  aria-label="Curtir"
                  className="flex h-[49px] w-[49px] items-center justify-center rounded-full bg-surface ring-1 ring-inset ring-hairline-soft transition-colors duration-200 hover:bg-hairline-soft"
                >
                  <ThumbsUpIcon className="h-[23px] w-[23px]" />
                </button>
                <button
                  type="button"
                  aria-label="Comentar"
                  className="flex h-[49px] w-[49px] items-center justify-center rounded-full bg-surface ring-1 ring-inset ring-hairline-soft transition-colors duration-200 hover:bg-hairline-soft"
                >
                  <CommentIcon className="h-[23px] w-[23px]" />
                </button>
              </div>

              <h2 className="mb-4 text-[16px] font-medium text-ink">{comments.length} Comentários</h2>
              <div className="flex flex-col gap-4">
                {comments.map((comment, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <SafeImage
                      src={imgAvatarComment}
                      alt={comment.author}
                      className="h-[37px] w-[37px]"
                      rounded
                    />
                    <div>
                      <p className="text-[16px] font-medium text-ink">{comment.author}</p>
                      <p className="text-[13px] text-ink-tertiary">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna lateral */}
            <aside className="flex flex-col gap-4">
              {canGenerateCode && (
                <>
                  <PatientSelector
                    patients={patients}
                    selectedId={selectedPatientId}
                    onSelect={setSelectedPatientId}
                  />

                  <motion.button
                    type="button"
                    onClick={() => setShowGenerateFlow(true)}
                    disabled={!selectedPatientId}
                    whileTap={buttonTap}
                    whileHover={buttonHover}
                    className="flex h-[49px] items-center justify-center rounded-full bg-brand text-[14px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {patientsLoading ? 'Carregando…' : 'Gerar Codigo de Acesso'}
                  </motion.button>
                </>
              )}

              <button
                type="button"
                onClick={() => navigate(`/dashboard/mundo/${world.id}/resumo`)}
                className="flex h-[49px] items-center justify-center rounded-full border border-hairline text-[14px] font-medium text-ink transition-colors duration-200 hover:bg-surface"
              >
                Ver Resumo da Última Sessão
              </button>

              <label className="sr-only" htmlFor="add-comment">
                Adicione um comentário
              </label>
              <input
                id="add-comment"
                type="text"
                placeholder="Adicione um comentario"
                className="rounded-full bg-surface px-4 py-2 text-[13px] text-ink ring-1 ring-inset ring-hairline-soft placeholder:text-ink-tertiary transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-brand"
              />

              <div className="mt-4 border-t border-hairline-soft pt-4">
                <p className="mb-1 text-[16px] font-medium text-ink">Alguma Duvida?</p>
                <p className="text-[14px] text-ink-secondary">contato@virteai.work.com</p>
              </div>
            </aside>
          </motion.div>
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {showGenerateFlow && (
          <GenerateCodeModal
            world={world}
            patientId={selectedPatient?.id}
            onClose={() => setShowGenerateFlow(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
