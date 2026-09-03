import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SafeImage from './SafeImage';
import PatientSelector from './PatientSelector';
import GenerateCodeModal from './GenerateCodeModal';
import { useAuth } from '../context/AuthContext';
import { worldOrder } from '../data/worlds';
import { patients } from '../data/patients';
import { overlayFade, slideFromRight, buttonTap, buttonHover } from '../lib/motion';

const imgThumbsUp = 'https://www.figma.com/api/mcp/asset/04f3c331-3ec4-41b0-8ab3-42ea2d1266f7.png';
const imgEye = 'https://www.figma.com/api/mcp/asset/f89336d3-c510-46f1-85f0-dbe462c07d18.png';
const imgVerified = 'https://www.figma.com/api/mcp/asset/0dad4cdb-8df1-46ed-baba-70ca3d887848.png';
const imgFullScreen = 'https://www.figma.com/api/mcp/asset/cc29922e-2e49-497c-96ef-7bba87161d0e.png';

function ChevronIcon({ direction = 'right', className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d={direction === 'right' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardOpenModal({ world, onClose, onChangeWorld, onFullscreen }) {
  const { user } = useAuth();
  // Regra de permissão: paciente só visualiza o mundo — quem gera código de
  // acesso é o terapeuta (ou o admin, pelo fluxo em /admin).
  const canGenerateCode = user.role === 'terapeuta' || user.role === 'admin';
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0].id);
  const [showGenerateFlow, setShowGenerateFlow] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !showGenerateFlow) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showGenerateFlow]);

  const currentIndex = worldOrder.indexOf(world.id);
  const goTo = (offset) => {
    const nextIndex = (currentIndex + offset + worldOrder.length) % worldOrder.length;
    onChangeWorld(worldOrder[nextIndex]);
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="fixed inset-x-0 bottom-0 top-[96px] z-40 flex justify-end">
      {/* Overlay escuro — clique fecha o modal */}
      <motion.button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        variants={overlayFade}
        initial="initial"
        animate="animate"
        exit="exit"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Setas de navegar entre mundos */}
      <motion.button
        type="button"
        aria-label="Mundo anterior"
        onClick={() => goTo(-1)}
        whileHover={{ scale: 1.1 }}
        whileTap={buttonTap}
        className="absolute left-6 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft backdrop-blur md:flex"
      >
        <ChevronIcon direction="left" className="h-6 w-6" />
      </motion.button>

      {/* Painel */}
      <motion.div
        variants={slideFromRight}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative z-10 h-full w-full max-w-[720px] overflow-y-auto bg-white p-6 shadow-elevated sm:p-10"
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-[25px] w-[25px] items-center justify-center text-ink transition-colors duration-200 hover:text-ink-secondary"
          >
            <ChevronIcon direction="left" className="h-full w-full" />
          </button>
          <button
            type="button"
            aria-label="Ver em tela cheia"
            onClick={() => onFullscreen(world.id)}
            className="flex h-[30px] w-[30px] items-center justify-center text-ink transition-opacity duration-200 hover:opacity-70"
          >
            <img src={imgFullScreen} alt="" className="h-full w-full" />
          </button>
        </div>

        <div className="relative mb-4">
          <SafeImage src={world.gallery} alt={world.title} className="h-[280px] w-full rounded-2xl md:h-[369px]" />
          <button
            type="button"
            aria-label="Mundo anterior"
            onClick={() => goTo(-1)}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft backdrop-blur md:hidden"
          >
            <ChevronIcon direction="left" className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo mundo"
            onClick={() => goTo(1)}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft backdrop-blur"
          >
            <ChevronIcon direction="right" className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between gap-4">
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">{world.title}</h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[16px] text-ink-secondary">
              <img src={imgThumbsUp} alt="" className="h-[18px] w-[18px] opacity-70" />
              {world.likes}
            </span>
            <span className="flex items-center gap-1.5 text-[16px] text-ink-secondary">
              <img src={imgEye} alt="" className="h-[17px] w-[17px] opacity-70" />
              {world.views}
            </span>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-1.5 text-[14px] text-ink-secondary">
          <span>Desenvolvido por</span>
          <span className="text-[#67a379]">VirTEAI</span>
          <img src={imgVerified} alt="Verificado" className="h-5 w-5" />
        </div>

        <p className="mb-6 max-w-[522px] text-[14px] leading-relaxed text-ink-secondary">
          {world.description}
        </p>

        {canGenerateCode && (
          <>
            <PatientSelector
              selectedId={selectedPatientId}
              onSelect={setSelectedPatientId}
              className="mb-4"
            />

            <motion.button
              type="button"
              onClick={() => setShowGenerateFlow(true)}
              whileTap={buttonTap}
              whileHover={buttonHover}
              className="flex h-[49px] w-full items-center justify-center rounded-full bg-brand text-[14px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep"
            >
              Gerar Codigo de Acesso
            </motion.button>
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {showGenerateFlow && (
          <GenerateCodeModal
            world={world}
            patientName={selectedPatient?.name}
            onClose={() => setShowGenerateFlow(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
