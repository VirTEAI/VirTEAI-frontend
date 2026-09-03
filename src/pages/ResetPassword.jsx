import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { fadeInUp, staggerContainer, staggerItem, buttonTap, buttonHover } from '../lib/motion';

// Passo 3/3 — dentro do arquivo do Figma esse conteúdo mora num segundo
// frame também chamado "CodeAuthentication", mas o grupo interno dele já se
// chama "Redefinição" e o botão já vem com o texto certo: "Trocar Senha".
const imgLock =
  'https://www.figma.com/api/mcp/asset/6805ab61-1339-40ca-b6f1-f42b3d14f00f.png';

const fieldClass =
  'flex items-center gap-[10px] rounded-full bg-surface px-4 py-[10px] ring-1 ring-inset ring-hairline-soft transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand';

export default function ResetPassword() {
  const { passwordReset, resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  // Só chega aqui depois de confirmar o código no passo 2. `resetPassword()`
  // já limpa o `passwordReset` do contexto assim que a troca dá certo — sem
  // checar `done` aqui, esse guard dispararia de novo no mesmo instante e
  // mandaria de volta pro passo 1 antes da tela de sucesso aparecer.
  if (!passwordReset?.verified && !done) {
    return <Navigate to="/esqueci-senha" replace />;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    const result = resetPassword(password);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setError('');
    setDone(true);
    setTimeout(() => {
      navigate('/login', { replace: true, state: { passwordResetSuccess: true } });
    }, 1200);
  }

  return (
    <AuthShell mode="reset" hideTabs>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-[17px] font-semibold tracking-tight text-ink">Senha redefinida!</p>
            <p className="text-[13px] text-ink-secondary">Redirecionando para o login…</p>
          </motion.div>
        ) : (
          <motion.div key="form">
            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              className="mb-3 text-[22px] font-semibold tracking-tight text-ink"
            >
              Redefinição
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              className="mb-6 text-[14px] leading-relaxed text-ink-secondary"
            >
              Insira sua nova senha
            </motion.p>

            <motion.form
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-5"
              onSubmit={handleSubmit}
            >
              <motion.div variants={staggerItem}>
                <label htmlFor="newPassword" className="mb-2 block text-[14px] font-medium text-ink">
                  Nova Senha
                </label>
                <div className={fieldClass}>
                  <img src={imgLock} alt="" className="h-5 w-5 object-contain" />
                  <input
                    id="newPassword"
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
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-[14px] font-medium text-ink"
                >
                  Confirme a Senha
                </label>
                <div className={fieldClass}>
                  <img src={imgLock} alt="" className="h-5 w-5 object-contain" />
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
                Trocar Senha
              </motion.button>

              <motion.div variants={staggerItem} className="text-center">
                <Link to="/login" className="text-[13px] text-brand hover:underline">
                  Voltar ao Login
                </Link>
              </motion.div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
