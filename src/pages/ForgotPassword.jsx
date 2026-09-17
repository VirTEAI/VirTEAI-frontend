import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AuthShell from '../components/AuthShell';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { fadeInUp, staggerContainer, staggerItem, buttonTap, buttonHover } from '../lib/motion';

// Passo 1/3 do fluxo "Esqueci minha senha", vindo do frame "RedefinePassword"
// do Figma (encontrado de graça relendo o dump local de metadata — ver
// README). O texto original fala em "link", mas a tela seguinte do próprio
// Figma ("CodeAuthentication") já fala em "código" — adaptamos a cópia daqui
// pra "código" pra manter o fluxo coerente, sem inventar uma etapa nova.
const imgLetter =
  'https://www.figma.com/api/mcp/asset/522cc5cd-01a8-43af-a4bc-86fc1bccc859.png';

const fieldClass =
  'flex items-center gap-[10px] rounded-full bg-surface px-4 py-[10px] ring-1 ring-inset ring-hairline-soft transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await requestPasswordReset(email);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setError('');
    navigate('/verificar-codigo');
  }

  return (
    <AuthShell mode="forgot" hideTabs>
      <motion.h1
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        className="mb-3 text-[22px] font-semibold tracking-tight text-ink"
      >
        Redefinir Senha
      </motion.h1>
      <motion.p
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        className="mb-6 text-[14px] leading-relaxed text-ink-secondary"
      >
        Informe o e-mail registrado em sua conta e enviaremos um código para você continuar a
        redefinição da senha.
      </motion.p>

      <motion.form
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourbestemail@email.com"
              className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-tertiary focus:outline-none"
            />
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-danger-soft px-4 py-2 text-[13px] text-danger"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          variants={staggerItem}
          type="submit"
          whileTap={buttonTap}
          whileHover={buttonHover}
          className="mt-2 flex h-[46px] items-center justify-center rounded-full bg-brand text-[16px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep"
        >
          Enviar Código
        </motion.button>

        <motion.div variants={staggerItem} className="text-center">
          <Link to="/login" className="text-[13px] text-brand hover:underline">
            Voltar ao Login
          </Link>
        </motion.div>
      </motion.form>

      <div className="mt-6 rounded-2xl border border-dashed border-hairline-soft bg-surface p-4">
        <p className="mb-2 text-[12px] text-ink-tertiary">
          Modo demonstração — não há envio de e-mail de verdade. Use uma das contas abaixo:
        </p>
        <div className="flex flex-col gap-1.5">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => setEmail(account.email)}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-[12px] text-ink transition-colors duration-200 hover:bg-white"
            >
              <span className="capitalize">{account.role}</span>
              <span className="text-ink-tertiary">{account.email}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
