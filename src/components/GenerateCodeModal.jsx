import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { addCode } from '../data/codes';
import { overlayFade, modalScale, buttonTap, buttonHover } from '../lib/motion';

// Fluxo de 3 passos vindo do Figma (frames "DashBoard-Modal" → "DashBoard-
// Loading" → "DashBoard-Code"): confirmação com checklist de segurança →
// loading → código gerado, com um botão que leva para /codigos.

const CLOSE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function VRHeadsetIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="8" width="20" height="10" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.5" cy="13" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="15.5" cy="13" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 10V8a2 2 0 0 1 2-2h1M20 10V8a2 2 0 0 0-2-2h-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BatteryIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="8" width="17" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M21 10.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="4.5" y="10.2" width="10" height="3.6" rx="0.8" fill="currentColor" />
    </svg>
  );
}

function DizzyIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 9l3 3-3 3M16 9l-3 3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 16.5c.8.7 1.6 1 2.5 1s1.7-.3 2.5-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const CHECKLIST = [
  { icon: VRHeadsetIcon, text: 'Estou utilizando meu óculos de Realidade Virtual (VR).' },
  { icon: ShieldIcon, text: 'Local seguro, livre de obstáculos e com espaço suficiente para me movimentar.' },
  { icon: BatteryIcon, text: 'Meu headset e controles estão conectados e com bateria suficiente.' },
  { icon: DizzyIcon, text: 'Caso sinta desconforto, tontura ou enjoo, interromperei a experiência imediatamente.' },
];

const WORLD_TIME_LIMIT_SECONDS = 4 * 60 * 60 - 7; // ~03:59:53, igual ao Figma

function formatCountdown(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function GenerateCodeModal({ world, patientName, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('confirm'); // 'confirm' | 'loading' | 'code'
  const [generatedCode, setGeneratedCode] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(WORLD_TIME_LIMIT_SECONDS);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && step !== 'loading') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, step]);

  // Contagem regressiva só roda de verdade enquanto o código gerado está
  // sendo mostrado — é só um detalhe visual (o tempo não persiste entre
  // reaberturas do modal, já que ainda não há backend controlando isso).
  useEffect(() => {
    if (step !== 'code') return undefined;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  async function handleConfirm() {
    setStep('loading');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const entry = addCode({ worldId: world.id, worldTitle: world.title, patientName });
    setGeneratedCode(entry);
    setStep('code');
  }

  function handleGoToCodes() {
    navigate('/codigos');
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        variants={overlayFade}
        initial="initial"
        animate="animate"
        exit="exit"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <motion.div
        variants={modalScale}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative z-10 flex w-full max-w-[534px] flex-col items-center gap-5 rounded-[28px] bg-white p-8 text-center shadow-elevated"
      >
        {step !== 'loading' && (
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="absolute left-6 top-6 flex h-[20px] w-[20px] items-center justify-center text-ink-secondary transition-colors duration-200 hover:text-ink"
          >
            {CLOSE_ICON}
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex w-full flex-col items-center gap-5 pt-4"
            >
              <h2 className="text-[24px] font-semibold tracking-tight text-ink">Deseja Iniciar a Experiência?</h2>
              <p className="text-[14px] leading-relaxed text-ink-secondary">
                Antes de continuar, confirme que você está em um ambiente adequado para uma
                experiência segura e confortável.
              </p>

              <div className="flex w-full flex-col gap-3 text-left">
                {CHECKLIST.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-[13px] leading-snug text-ink-secondary">{text}</p>
                  </div>
                ))}
              </div>

              <p className="text-[12px] text-ink-tertiary">
                Importante: Após confirmar, um código de acesso será gerado para conectar o
                ambiente web ao dispositivo VR.
              </p>

              <motion.button
                type="button"
                onClick={handleConfirm}
                whileTap={buttonTap}
                whileHover={buttonHover}
                className="flex h-[49px] w-full items-center justify-center rounded-full bg-brand text-[14px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep"
              >
                Gerar Codigo de Acesso
              </motion.button>
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex w-full flex-col items-center gap-4 py-16"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                className="h-16 w-16 rounded-full border-[6px] border-brand-soft border-t-brand"
              />
              <p className="text-[14px] text-ink-tertiary">Gerando código de acesso…</p>
            </motion.div>
          )}

          {step === 'code' && generatedCode && (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex w-full flex-col items-center gap-5 pt-4"
            >
              <h2 className="text-[24px] font-semibold tracking-tight text-ink">Código Gerado!!</h2>

              <motion.p
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
                className="font-mono text-[44px] font-semibold tracking-wider text-ink"
              >
                {generatedCode.code}
              </motion.p>

              <motion.button
                type="button"
                onClick={handleGoToCodes}
                whileTap={buttonTap}
                whileHover={buttonHover}
                className="flex h-[49px] w-full items-center justify-center rounded-full bg-brand text-[14px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep"
              >
                Ok
              </motion.button>

              <p className="text-[13px] text-ink-secondary">
                Tempo Restante do Mundo:{' '}
                <span className="font-mono font-semibold text-ink">{formatCountdown(secondsLeft)}</span>
              </p>

              <p className="text-[12px] text-ink-tertiary">
                Importante: Seus códigos serão armazenados na sessão Códigos.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
