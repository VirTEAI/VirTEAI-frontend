import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SafeImage from './SafeImage';
import { useAuth } from '../context/AuthContext';
import { dropdownPop, buttonTap } from '../lib/motion';

const ROLE_LABELS = {
  admin: 'Administrador',
  paciente: 'Paciente',
  terapeuta: 'Terapeuta',
};

// Cada papel tem uma tela de perfil própria — o admin ainda não tem uma
// tela de perfil dedicada, então não mostra o link "Ver perfil".
const PROFILE_PATH = {
  paciente: '/paciente',
  terapeuta: '/psicologo',
};

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const profilePath = PROFILE_PATH[user.role];

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate('/login');
  }

  function handleViewProfile() {
    setOpen(false);
    navigate(profilePath);
  }

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        whileTap={buttonTap}
        className="flex items-center gap-2"
      >
        <span className="hidden text-[14.8px] text-ink sm:block">{user.name.split(' ')[0]}!</span>
        <SafeImage src={user.avatar} alt={user.name} className="h-[34px] w-[34px]" rounded />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30"
            />
            <motion.div
              variants={dropdownPop}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute right-0 top-full z-40 mt-3 w-[240px] rounded-2xl border border-hairline-soft bg-white/95 p-4 shadow-elevated backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center gap-3">
                <SafeImage src={user.avatar} alt={user.name} className="h-[42px] w-[42px]" rounded />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink">{user.name}</p>
                  <p className="text-[11px] text-ink-tertiary">{ROLE_LABELS[user.role] ?? user.role}</p>
                </div>
              </div>
              <div className="mb-3 h-px w-full bg-hairline-soft" />
              {profilePath && (
                <button
                  type="button"
                  onClick={handleViewProfile}
                  className="mb-2 flex w-full items-center justify-center rounded-full border border-hairline px-4 py-2 text-[13px] font-semibold text-ink transition-colors duration-200 hover:bg-surface"
                >
                  Ver perfil
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center rounded-full bg-danger-soft px-4 py-2 text-[13px] font-semibold text-danger transition-colors duration-200 hover:bg-danger-soft/70"
              >
                Sair
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
