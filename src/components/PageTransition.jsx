import { motion } from 'framer-motion';
import { pageTransition } from '../lib/motion';

// Envolve o conteúdo de cada página para dar um fade + leve deslize na
// entrada/saída ao trocar de rota (usado junto com <AnimatePresence> no App).
export default function PageTransition({ children }) {
  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransition}>
      {children}
    </motion.div>
  );
}
