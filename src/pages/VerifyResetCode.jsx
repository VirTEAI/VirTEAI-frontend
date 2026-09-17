import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { fadeInUp, staggerContainer, staggerItem, buttonTap, buttonHover } from '../lib/motion';

// Passo 2/3, vindo do frame "CodeAuthentication" do Figma: 5 caixas de
// código separadas por um traço (layout real do Figma — "Code1/Code2/Code3"
// + traço + "Code1/Code2", ou seja, um código no formato XXX-XX).
const BOX_COUNT = 5;
const DASH_AFTER_INDEX = 2; // traço decorativo depois da 3ª caixa

export default function VerifyResetCode() {
  const { passwordReset, verifyResetCode } = useAuth();
  const [digits, setDigits] = useState(Array(BOX_COUNT).fill(''));
  const [error, setError] = useState('');
  const inputsRef = useRef([]);
  const navigate = useNavigate();

  // Sem um pedido de redefinição em andamento, não faz sentido cair aqui
  // direto pela URL — manda de volta pro passo 1.
  if (!passwordReset) {
    return <Navigate to="/esqueci-senha" replace />;
  }

  function handleChange(index, rawValue) {
    const value = rawValue.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < BOX_COUNT - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, BOX_COUNT);
    if (!pasted) return;
    event.preventDefault();
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < BOX_COUNT; i += 1) {
        next[i] = pasted[i] ?? '';
      }
      return next;
    });
    inputsRef.current[Math.min(pasted.length, BOX_COUNT - 1)]?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const code = digits.join('');
    if (code.length < BOX_COUNT) {
      setError('Informe os 5 dígitos do código.');
      return;
    }
    const result = await verifyResetCode(code);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setError('');
    navigate('/redefinir-senha');
  }

  return (
    <AuthShell mode="verify" hideTabs>
      <motion.h1
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        className="mb-3 text-[22px] font-semibold tracking-tight text-ink"
      >
        Autenticação
      </motion.h1>
      <motion.p
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        className="mb-6 text-[14px] leading-relaxed text-ink-secondary"
      >
        Enviamos um código para <span className="font-medium text-ink">{passwordReset.email}</span>. Por
        favor, informe-o abaixo para continuar a redefinição da senha.
      </motion.p>

      <motion.form
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6"
        onSubmit={handleSubmit}
      >
        <motion.div
          variants={staggerItem}
          className="flex items-center justify-center gap-2"
          onPaste={handlePaste}
        >
          {digits.map((digit, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                aria-label={`Dígito ${index + 1} do código`}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-[48px] w-[48px] rounded-2xl bg-surface text-center text-[20px] font-semibold text-ink ring-1 ring-inset ring-hairline-soft transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-brand"
              />
              {index === DASH_AFTER_INDEX && <span className="text-ink-tertiary">–</span>}
            </div>
          ))}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-danger-soft px-4 py-2 text-center text-[13px] text-danger"
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
          className="flex h-[46px] items-center justify-center rounded-full bg-brand text-[16px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep"
        >
          Confirmar Código
        </motion.button>

        <motion.div variants={staggerItem} className="text-center">
          <Link to="/login" className="text-[13px] text-brand hover:underline">
            Voltar ao Login
          </Link>
        </motion.div>
      </motion.form>

      <div className="mt-6 rounded-2xl border border-dashed border-hairline-soft bg-surface p-4 text-center">
        <p className="text-[12px] text-ink-tertiary">
          Modo demonstração — código gerado agora:{' '}
          <span className="font-mono font-semibold text-ink">
            {passwordReset.code.slice(0, 3)}-{passwordReset.code.slice(3)}
          </span>
        </p>
      </div>
    </AuthShell>
  );
}
