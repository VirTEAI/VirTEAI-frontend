import { motion } from 'framer-motion';
import { overlayFade, modalScale, buttonTap, buttonHover } from '../lib/motion';

// Modal genérico de confirmação — reaproveitado em toda ação destrutiva
// (excluir terapeuta, excluir mundo, excluir comentário) pra nunca deixar
// um "apagar" acontecer com um clique só, sem chance de voltar atrás.
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  isSubmitting = false,
  error = '',
  onConfirm,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.button
        type="button"
        aria-label="Fechar"
        onClick={() => !isSubmitting && onClose()}
        variants={overlayFade}
        initial="initial"
        animate="animate"
        exit="exit"
        className="absolute inset-0"
      />

      <motion.div
        variants={modalScale}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative z-10 flex w-full max-w-[440px] flex-col gap-5 rounded-3xl bg-white p-7 shadow-elevated"
      >
        <h2 className="text-[19px] font-semibold tracking-tight text-ink">{title}</h2>
        <p className="text-[14px] leading-relaxed text-ink-secondary">{message}</p>

        {error && <p className="-mt-2 text-[13px] text-danger">{error}</p>}

        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            whileTap={buttonTap}
            className="inline-flex h-[44px] flex-1 items-center justify-center rounded-xl border border-hairline text-[14px] font-medium text-ink transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </motion.button>
          <motion.button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            whileTap={buttonTap}
            whileHover={buttonHover}
            className={`inline-flex h-[44px] flex-1 items-center justify-center rounded-xl text-[14px] font-medium text-white shadow-button transition-colors duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-60 ${
              danger ? 'bg-danger' : 'bg-brand'
            }`}
          >
            {isSubmitting ? 'Aguarde…' : confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
