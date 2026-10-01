import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthShell from '../components/AuthShell';
import { LetterIcon, LockIcon, VerifiedIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { fadeInUp, staggerContainer, staggerItem, buttonTap, buttonHover } from '../lib/motion';


const fieldClass =
  'flex items-center gap-[10px] rounded-full bg-surface px-4 py-[10px] ring-1 ring-inset ring-hairline-soft transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand';

// Essa tela não cria conta na hora — manda um "pedido de associado" (como
// paciente nunca é criado por autocadastro, só por terapeuta/admin, e
// admin não se autocadastra, o único papel que dá pra pedir aqui é
// terapeuta; por isso não tem mais seletor de papel). Um admin revisa o
// pedido no painel dele (sininho de notificações) e só aí a conta nasce de
// verdade — com a mesma senha informada aqui, pra pessoa já poder logar
// assim que for aprovada.
export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { requestRegistration } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    const result = await requestRegistration({ name, email, password });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setError('');
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AuthShell mode="register">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-4 py-6 text-center"
        >
          <motion.span
            variants={staggerItem}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success"
          >
            <VerifiedIcon className="h-7 w-7" />
          </motion.span>
          <motion.h1 variants={staggerItem} className="text-[22px] font-semibold tracking-tight text-ink">
            Pedido enviado!
          </motion.h1>
          <motion.p variants={staggerItem} className="max-w-[360px] text-[14px] text-ink-secondary">
            Um administrador vai revisar seus dados antes de liberar o acesso. Assim que seu cadastro for
            aprovado, você já pode entrar com o e-mail e a senha que acabou de criar.
          </motion.p>
        </motion.div>
      </AuthShell>
    );
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
            <LetterIcon className="h-[23px] w-[19px] text-ink-secondary" />
            <input
              id="fullName"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <LetterIcon className="h-[23px] w-[19px] text-ink-secondary" />
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

        <motion.div variants={staggerItem}>
          <label htmlFor="password" className="mb-2 block text-[14px] font-medium text-ink">
            Senha
          </label>
          <div className={fieldClass}>
            <LockIcon className="h-5 w-5 text-ink-secondary" />
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="****************"
              className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-tertiary focus:outline-none"
            />
          </div>
        </motion.div>

        <motion.div variants={staggerItem}>
          <label htmlFor="confirmPassword" className="mb-2 block text-[14px] font-medium text-ink">
            Confirme a Senha
          </label>
          <div className={fieldClass}>
            <LockIcon className="h-5 w-5 text-ink-secondary" />
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="****************"
              className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-tertiary focus:outline-none"
            />
          </div>
        </motion.div>

        <motion.p variants={staggerItem} className="text-[12px] text-ink-secondary">
          Esse formulário é pra quem quer se associar como terapeuta. Conta de paciente é criada pelo seu
          terapeuta ou pelo administrador, não por aqui.
        </motion.p>

        <motion.label
          variants={staggerItem}
          className="flex items-start gap-2 text-[12px] text-ink-secondary"
        >
          <input type="checkbox" required name="terms" className="mt-[3px] h-[11px] w-[11px]" />
          Estou de acordo com os Termos de Associação
        </motion.label>

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
          whileTap={buttonTap}
          whileHover={buttonHover}
          type="submit"
          disabled={submitting}
          className="mt-4 flex h-[46px] items-center justify-center rounded-full bg-brand text-[16px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep disabled:opacity-60"
        >
          {submitting ? 'Enviando…' : 'Enviar Pedido'}
        </motion.button>
      </motion.form>
    </AuthShell>
  );
}
