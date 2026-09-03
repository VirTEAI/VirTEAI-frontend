import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AuthShell from '../components/AuthShell';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { buttonTap, buttonHover } from '../lib/motion';

// Campo de texto em pílula, preenchido, sem borda dura — recebe um anel de
// foco na cor da marca (a mesma trocada em todo o fluxo de auth).
const fieldClass =
  'flex items-center gap-[10px] rounded-full bg-surface px-4 py-[10px] ring-1 ring-inset ring-hairline-soft transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand';

const imgLetter =
  'https://www.figma.com/api/mcp/asset/522cc5cd-01a8-43af-a4bc-86fc1bccc859.png';
const imgLock =
  'https://www.figma.com/api/mcp/asset/6805ab61-1339-40ca-b6f1-f42b3d14f00f.png';
const imgEye =
  'https://www.figma.com/api/mcp/asset/2dd74428-1953-4cf1-b3a8-9af39aba7a12.png';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleSubmit(event) {
    event.preventDefault();
    const result = login(email, password);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setError('');
    const from = location.state?.from;
    navigate(from ?? result.user.homePath, { replace: true });
  }

  function fillDemo(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  }

  return (
    <AuthShell mode="login">
      <h1 className="mb-6 text-[22px] font-semibold tracking-tight text-ink">Bem-vindo de volta</h1>

      <AnimatePresence>
        {location.state?.passwordResetSuccess && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 rounded-lg bg-success-soft px-4 py-2 text-[13px] text-success"
          >
            Senha redefinida com sucesso! Entre com sua nova senha.
          </motion.p>
        )}
      </AnimatePresence>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div>
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
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-[14px] font-medium text-ink">
            Senha
          </label>
          <div className={`justify-between gap-[15px] ${fieldClass}`}>
            <div className="flex flex-1 items-center gap-[15px]">
              <img src={imgLock} alt="" className="h-5 w-5 object-contain" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="****************"
                className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-tertiary focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="shrink-0"
            >
              <img src={imgEye} alt="" className="h-5 w-5 object-contain" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[12px]">
          <label className="flex items-center gap-2 text-ink-secondary">
            <input type="checkbox" name="remember" className="h-[11px] w-[11px]" />
            Lembre de mim
          </label>
          <Link to="/esqueci-senha" className="text-brand hover:underline">
            Esqueci minha senha
          </Link>
        </div>

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
          type="submit"
          whileTap={buttonTap}
          whileHover={buttonHover}
          className="mt-4 flex h-[46px] items-center justify-center rounded-full bg-brand text-[16px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep"
        >
          Entrar
        </motion.button>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-hairline-soft bg-surface p-4">
        <p className="mb-2 text-[12px] text-ink-tertiary">Contas de demonstração:</p>
        <div className="flex flex-col gap-1.5">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillDemo(account)}
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
