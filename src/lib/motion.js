// Variantes de animação compartilhadas (Framer Motion) — centralizadas aqui
// para manter o "sentimento" das transições consistente pelo site inteiro.

export const easeOut = [0.16, 1, 0.3, 1];

export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: easeOut } },
};

// Container que escalona a entrada dos filhos (grades de cards, listas).
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

// Transição de página: fade + leve deslocamento vertical.
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: easeOut } },
};

// Modal centralizado (Vincular Novo Mundo, etc.)
export const modalScale = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: easeOut } },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15 } },
};

export const overlayFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// Painel deslizando (DashBoard-Open, Notificações).
export const slideFromRight = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: easeOut } },
  exit: { opacity: 0, x: 24, transition: { duration: 0.18 } },
};

// Dropdown pequeno (seletor de paciente, menu do usuário).
export const dropdownPop = {
  initial: { opacity: 0, scale: 0.96, y: -6 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.16, ease: easeOut } },
  exit: { opacity: 0, scale: 0.97, y: -4, transition: { duration: 0.12 } },
};

// Física com um pouco de "mola" em vez de easing linear/cúbico puro — é o
// que faz um botão parecer que reage de verdade ao toque, em vez de só
// encolher/crescer numa curva fixa. Ajustado aqui (mesmo formato de objeto
// de antes), então todo botão do site que já usa buttonTap/buttonHover via
// whileTap/whileHover ganha o refinamento de graça, sem precisar tocar em
// cada arquivo.
export const buttonTap = { scale: 0.97, transition: { type: 'spring', stiffness: 500, damping: 30 } };
export const buttonHover = {
  scale: 1.02,
  transition: { type: 'spring', stiffness: 400, damping: 25 },
};

// Elevação suave em cards clicáveis (mundos, etc.) — sombra grande e difusa
// em vez de borda, do jeito que a Apple "levanta" um cartão do fundo.
export const cardLift = {
  rest: { y: 0, scale: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)' },
  hover: {
    y: -6,
    scale: 1.012,
    boxShadow: '0 8px 16px -4px rgba(0,0,0,0.08), 0 32px 64px -16px rgba(0,0,0,0.22)',
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

// Painel do menu mobile (hamburger) — abre/fecha em altura, embaixo do
// header, nos breakpoints onde a navegação horizontal fica escondida.
export const mobileMenu = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto', transition: { duration: 0.25, ease: easeOut } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.18 } },
};
