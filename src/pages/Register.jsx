import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AuthShell from '../components/AuthShell';
import { LetterIcon, LockIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { fadeInUp, staggerContainer, staggerItem, buttonTap, buttonHover } from '../lib/motion';


const fieldClass =
  'flex items-center gap-[10px] rounded-full bg-surface px-4 py-[10px] ring-1 ring-inset ring-hairline-soft transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand';

// A tela original (vinda do Figma) só tinha nome + e-mail — um cadastro
// "de pedido de associado", sem senha nem escolha de papel, porque não
// existia backend nenhum por trás. Agora que o cadastro cria uma conta de
// verdade, esses dois campos são obrigatórios: sem eles a pessoa não
// conseguiria logar depois. Mantive o resto da tela (título, cópia, termos)
// como estava.
const ROLE_OPTIONS = [
  { value: 'paciente', label: 'Paciente' },
  { value: 'terapeuta', label: 'Terapeuta' },
  { value: 'admin', label: 'Administrador' },
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('paciente');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

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
    const result = await register({ name, email, password, role });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setError('');
    navigate(result.user.homePath, { replace: true });
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

        <motion.fieldset variants={staggerItem}>
          <legend className="mb-2 text-[14px] font-medium text-ink">Você é...</legend>
          <div className="flex gap-2">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={role === option.value}
                className={`flex-1 rounded-full px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${
                  role === option.value
                    ? 'bg-brand text-white shadow-button'
                    : 'bg-surface text-ink-secondary ring-1 ring-inset ring-hairline-soft hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.fieldset>

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
