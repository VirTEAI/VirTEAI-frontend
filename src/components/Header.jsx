import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import UserMenu from './UserMenu';
import SafeImage from './SafeImage';
import { BellIcon } from './icons';
import { useAuth } from '../context/AuthContext';
import { mobileMenu, buttonTap, buttonHover } from '../lib/motion';
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

export default function Header() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mesma regra de papéis usada no AppHeader (header das telas logadas) —
  // assim uma pessoa logada continua vendo Dashboard/Códigos/Painel Admin
  // mesmo em páginas "públicas" como Home, About Us e Services, em vez do
  // header reverter para a versão simplificada de visitante.
  const showDashboardLink = user?.role === 'paciente' || user?.role === 'terapeuta';
  const showAdminLink = user?.role === 'admin';
  const showCodesLink = user?.role === 'terapeuta' || user?.role === 'admin';

  return (
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

        {user ? (
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden rounded-full p-1.5 opacity-80 sm:block">
              <BellIcon className="h-6 w-6 text-ink" />
            </span>
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
        ) : (
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden rounded-full p-1.5 opacity-80 sm:block">
              <BellIcon className="h-6 w-6 text-ink" />
            </span>
            <NavLink
              to="/register"
              className="hidden text-[14.8px] text-ink-secondary transition-colors duration-200 hover:text-ink md:block"
            >
              Cadastra-se
            </NavLink>
            <motion.div whileTap={buttonTap} whileHover={buttonHover} className="hidden sm:block">
              <NavLink
                to="/login"
                className="flex h-[35px] items-center justify-center rounded-full bg-brand px-[30px] text-[14.8px] text-white shadow-button transition-colors duration-200 hover:bg-brand-deep"
              >
                Entrar
              </NavLink>
            </motion.div>
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
        )}
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
                <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                  Painel Admin
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
              <NavLink to="/about-us" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                About Us
              </NavLink>
              <NavLink to="/services" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                Services
              </NavLink>

              {!user && <div className="my-2 h-px w-full bg-hairline-soft" />}

              {user ? null : (
                <>
                  <NavLink
                    to="/register"
                    className={mobileNavLinkClass}
                    onClick={() => setMobileOpen(false)}
                  >
                    Cadastra-se
                  </NavLink>
                  <NavLink
                    to="/login"
                    className="mt-2 flex h-[44px] items-center justify-center rounded-full bg-brand text-[14.8px] text-white shadow-button"
                    onClick={() => setMobileOpen(false)}
                  >
                    Entrar
                  </NavLink>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
