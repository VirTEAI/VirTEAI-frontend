import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { overlayFade, modalScale, buttonTap, buttonHover } from '../lib/motion';

// Modal genérico de "Editar dados" — temporário/mockado, reaproveitado tanto
// pelo perfil do paciente quanto pelo perfil do terapeuta. Quem pode abrir
// esse modal (e portanto editar) é decidido em cada tela, com base no papel
// de quem está logado — este componente só cuida do formulário em si.
export default function EditProfileModal({ title, profile, onClose, onSave }) {
  const [name, setName] = useState(profile.name ?? '');
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? '');
  const [email, setEmail] = useState(profile.email ?? '');

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleSubmit(event) {
    event.preventDefault();
    onSave({ name: name.trim() || profile.name, birthDate, email });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        variants={overlayFade}
        initial="initial"
        animate="animate"
        exit="exit"
        className="absolute inset-0"
      />

      <motion.form
        onSubmit={handleSubmit}
        variants={modalScale}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative z-10 flex w-full max-w-[480px] flex-col gap-6 rounded-3xl bg-white p-8 shadow-elevated"
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-[25px] w-[25px] items-center justify-center rounded-xl text-ink transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink">{title}</h2>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="edit-name" className="text-[14px] font-semibold text-ink">
            Nome Completo
          </label>
          <input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-tertiary transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="edit-birth" className="text-[14px] font-semibold text-ink">
            Data de Nascimento
          </label>
          <input
            id="edit-birth"
            type="text"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            placeholder="DD/MM/AAAA"
            className="w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-tertiary transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="edit-email" className="text-[14px] font-semibold text-ink">
            Email
          </label>
          <input
            id="edit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-tertiary transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={buttonTap}
            className="inline-flex h-[44px] flex-1 items-center justify-center rounded-xl border border-hairline text-[14px] font-medium text-ink transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Cancelar
          </motion.button>
          <motion.button
            type="submit"
            whileTap={buttonTap}
            whileHover={buttonHover}
            className="inline-flex h-[44px] flex-1 items-center justify-center rounded-xl bg-brand text-[14px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Salvar
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
