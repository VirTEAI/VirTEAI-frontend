import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SafeImage from './SafeImage';
import { overlayFade, slideFromRight, buttonTap } from '../lib/motion';

// Ícones simplificados em SVG (o design original usa bell-dot.svg e
// user-check.svg exportados do Figma; recriados aqui para evitar depender de
// mais uma URL do CDN do Figma nesse componente pequeno).
function BellDotIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 2a5 5 0 0 0-5 5v3.2c0 .5-.2 1-.6 1.4L3 13h14l-1.4-1.4a2 2 0 0 1-.6-1.4V7a5 5 0 0 0-5-5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8 16a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="15.5" cy="4.5" r="2.5" fill="#B42318" stroke="white" />
    </svg>
  );
}

function UserCheckIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={className}>
      <circle cx="5.5" cy="4" r="2.2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M1.5 12c0-2.2 1.8-3.5 4-3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M9 8l1 1 2-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Hoje só existe pedido de cadastro como terapeuta (ver Register.jsx), mas
// o texto já busca o rótulo certo por `role` em vez de fixar a frase —
// não quebra se um dia existir mais de um tipo de pedido.
const ROLE_LABELS = {
  terapeuta: 'terapeuta',
  admin: 'administrador',
  paciente: 'paciente',
};

export default function NotificationsModal({ requests, decidingId, error, onDecide, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <motion.button
        type="button"
        aria-label="Fechar notificações"
        onClick={onClose}
        variants={overlayFade}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        variants={slideFromRight}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fixed right-6 top-[88px] z-50 flex max-h-[80vh] w-full max-w-[435px] flex-col gap-5 overflow-y-auto rounded-3xl border border-hairline-soft bg-white p-6 shadow-elevated md:right-10"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center rounded-xl bg-brand-soft p-2 text-brand-deep">
              <BellDotIcon className="h-5 w-5" />
            </span>
            <h2 className="text-[20px] font-bold text-ink">Notificações</h2>
          </div>
          {requests.length > 0 && (
            <motion.span
              key={requests.length}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success"
            >
              {requests.length} NOVA{requests.length > 1 ? 'S' : ''}
            </motion.span>
          )}
        </div>

        <div className="h-px w-full bg-hairline-soft" />

        {requests.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-6 text-center text-[13px] text-ink-tertiary"
          >
            Nenhuma solicitação pendente.
          </motion.p>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {requests.map((req) => (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-hairline-soft bg-white p-4 shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <SafeImage src={req.avatar} alt={req.name} className="h-[40px] w-[40px]" rounded />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink">{req.name}</p>
                      <p className="truncate text-[13px] text-ink-tertiary">{req.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-lg bg-success-soft px-2.5 py-1.5">
                    <UserCheckIcon className="h-3.5 w-3.5 text-success" />
                    <p className="flex-1 text-[12px] font-medium text-success">
                      Solicitação para ser {ROLE_LABELS[req.role] ?? req.role}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      onClick={() => onDecide(req.id, 'negar')}
                      disabled={decidingId === req.id}
                      whileTap={buttonTap}
                      className="flex-1 rounded-xl bg-danger-soft px-4 py-2.5 text-[13px] font-bold text-danger transition-colors duration-200 hover:bg-danger-soft/70 focus:outline-none focus:ring-2 focus:ring-danger disabled:opacity-60"
                    >
                      Negar
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => onDecide(req.id, 'confirmar')}
                      disabled={decidingId === req.id}
                      whileTap={buttonTap}
                      className="flex-1 rounded-xl bg-success-soft px-4 py-2.5 text-[13px] font-bold text-success transition-colors duration-200 hover:bg-success-soft/70 focus:outline-none focus:ring-2 focus:ring-success disabled:opacity-60"
                    >
                      {decidingId === req.id ? 'Aguarde…' : 'Confirmar'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl bg-danger-soft px-4 py-2 text-center text-[13px] text-danger"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </>
  );
}
