import { motion } from 'framer-motion';
import AuthShell from '../components/AuthShell';
import { fadeInUp, staggerContainer, staggerItem, buttonTap, buttonHover } from '../lib/motion';

const imgLetter =
  'https://www.figma.com/api/mcp/asset/f86b6666-4191-4922-8491-67e3a43c5947.png';

const fieldClass =
  'flex items-center gap-[10px] rounded-full bg-surface px-4 py-[10px] ring-1 ring-inset ring-hairline-soft transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand';

export default function Register() {
  function handleSubmit(event) {
    event.preventDefault();
    // TODO: integrar com o backend de cadastro.
  }

  return (
    <AuthShell mode="register">
      <motion.h1
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        className="mb-6 text-[22px] font-semibold tracking-tight text-ink"
      >
        Pedido de Associado
      </motion.h1>

      <motion.form
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        <motion.div variants={staggerItem}>
          <label htmlFor="fullName" className="mb-2 block text-[14px] font-medium text-ink">
            Nome Completo
          </label>
          <div className={fieldClass}>
            <img src={imgLetter} alt="" className="h-[23px] w-[19px] object-contain" />
            <input
              id="fullName"
              type="text"
              required
              autoComplete="name"
              placeholder="Matheus Silva"
              className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-tertiary focus:outline-none"
            />
          </div>
        </motion.div>

        <motion.div variants={staggerItem}>
          <label htmlFor="email" className="mb-2 block text-[14px] font-medium text-ink">
            E-mail
          </label>
          <div className={fieldClass}>
            <img src={imgLetter} alt="" className="h-[23px] w-[19px] object-contain" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="yourbestemail@email.com"
              className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-tertiary focus:outline-none"
            />
          </div>
        </motion.div>

        <motion.label
          variants={staggerItem}
          className="flex items-start gap-2 text-[12px] text-ink-secondary"
        >
          <input type="checkbox" required name="terms" className="mt-[3px] h-[11px] w-[11px]" />
          Estou de acordo com os Termos de Associação
        </motion.label>

        <motion.button
          variants={staggerItem}
          whileTap={buttonTap}
          whileHover={buttonHover}
          type="submit"
          className="mt-4 flex h-[46px] items-center justify-center rounded-full bg-brand text-[16px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep"
        >
          Enviar Pedido
        </motion.button>
      </motion.form>
    </AuthShell>
  );
}
