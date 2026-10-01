import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import UserMenu from './UserMenu';
import SafeImage from './SafeImage';
import { BellIcon } from './icons';
import { useAuth } from '../context/AuthContext';
import { mobileMenu, buttonTap } from '../lib/motion';
import imgLogo from '../assets/images/logo.png';

const navLinkClass = ({ isActive }) =>
  `text-[14.8px] leading-normal transition-colors duration-200 ${
    isActive ? 'font-semibold text-ink' : 'text-ink-secondary hover:text-ink'
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `block py-2.5 text-[16px] transition-colors duration-200 ${
    isActive ? 'font-semibold text-ink' : 'text-ink-secondary'
  }`;

function MenuIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      {open ? (
        <path
          d="M6 6l12 12M18 6l-12 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function AppHeader({ showBack = false, onBack, onNotificationsClick }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cada papel enxerga só os atalhos que fazem sentido pra ele: paciente e
  // terapeuta usam /dashboard (o terapeuta com a opção de gerar código
  // liberada lá dentro); admin usa o próprio painel; terapeuta e admin têm
  // acesso à lista de códigos gerados.
  const showDashboardLink = user?.role === 'paciente' || user?.role === 'terapeuta';
  const showAdminLink = user?.role === 'admin';
  const showCodesLink = user?.role === 'terapeuta' || user?.role === 'admin';
  // "Gerenciar Pacientes" — só o terapeuta tem essa tela; o admin já
  // enxerga todos os pacientes de todos os terapeutas em "Painel Admin" →
  // Gerenciar Terapeutas.
  const showPatientsLink = user?.role === 'terapeuta';

  return (
    <>
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="vt-glass-nav sticky top-0 z-30 border-b border-hairline-soft"
      >
        <div className="mx-auto flex h-[96px] w-full max-w-[1440px] items-center justify-between px-6 md:px-10">
          <NavLink to="/" className="flex h-[84px] w-[198px] shrink-0 items-center overflow-hidden">
            <SafeImage src={imgLogo} alt="VirTEAI" className="h-full w-full" />
          </NavLink>

          <nav className="hidden items-center gap-[50px] md:flex">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            {showDashboardLink && (
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
            )}
            {showAdminLink && (
              <NavLink to="/admin" className={navLinkClass}>
                Painel Admin
              </NavLink>
            )}
            {showPatientsLink && (
              <NavLink to="/pacientes" className={navLinkClass}>
                Pacientes
              </NavLink>
            )}
            {showCodesLink && (
              <NavLink to="/codigos" className={navLinkClass}>
                Códigos
              </NavLink>
            )}
            <NavLink to="/about-us" className={navLinkClass}>
              About Us
            </NavLink>
            <NavLink to="/services" className={navLinkClass}>
              Services
            </NavLink>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            {onNotificationsClick ? (
              <motion.button
                type="button"
                onClick={onNotificationsClick}
                aria-label="Notificações"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.08 }}
                className="rounded-full p-1.5 transition-colors duration-200 hover:bg-surface"
              >
                <BellIcon className="h-6 w-6 text-ink" />
              </motion.button>
            ) : (
              <span className="rounded-full p-1.5 text-ink opacity-80">
                <BellIcon className="h-6 w-6" />
              </span>
            )}
            <UserMenu />
            <button
              type="button"
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              className="text-ink md:hidden"
            >
              <MenuIcon open={mobileOpen} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              variants={mobileMenu}
              initial="initial"
              animate="animate"
              exit="exit"
              className="vt-glass-nav overflow-hidden border-t border-hairline-soft px-6 md:hidden"
            >
              <nav className="flex flex-col py-2">
                <NavLink to="/" end className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                  Home
                </NavLink>
                {showDashboardLink && (
                  <NavLink
                    to="/dashboard"
                    className={mobileNavLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </NavLink>
                )}
                {showAdminLink && (
                  <NavLink
                    to="/admin"
                    className={mobileNavLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    Painel Admin
                  </NavLink>
                )}
                {showPatientsLink && (
                  <NavLink
                    to="/pacientes"
                    className={mobileNavLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    Pacientes
                  </NavLink>
                )}
                {showCodesLink && (
                  <NavLink
                    to="/codigos"
                    className={mobileNavLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    Códigos
                  </NavLink>
                )}
                <NavLink
                  to="/about-us"
                  className={mobileNavLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  About Us
                </NavLink>
                <NavLink
                  to="/services"
                  className={mobileNavLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  Services
                </NavLink>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {showBack && (
        <motion.button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          whileTap={buttonTap}
          whileHover={{ x: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
          className="ml-6 mt-6 flex h-[25px] w-[25px] items-center justify-center text-ink md:ml-10"
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
        </motion.button>
      )}
    </>
  );
}
