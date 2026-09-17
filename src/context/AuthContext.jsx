import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api-client';

// As mesmas 3 contas de sempre — hoje existem de verdade no banco (veja
// `server/src/db/seed.js`, rodado com `npm run db:seed`). A lista aqui é só
// pra vitrine de "contas de demonstração" no Login/Esqueci-senha; a senha
// real é validada pelo backend, não por este array.
export const DEMO_ACCOUNTS = [
  { email: 'admin@virteai.com', password: 'admin123', role: 'admin' },
  { email: 'terapeuta@virteai.com', password: 'terapeuta123', role: 'terapeuta' },
  { email: 'paciente@virteai.com', password: 'paciente123', role: 'paciente' },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Fica true assim que a checagem inicial de sessão (GET /auth/me) termina
  // — enquanto isso, RequireAuth evita redirecionar pro /login "no chute"
  // (senão, num F5 numa página protegida, a pessoa veria um flash de
  // redirecionamento antes da sessão real ser confirmada).
  const [isReady, setIsReady] = useState(false);
  // Estado do fluxo "Esqueci minha senha" em andamento — só guarda o
  // e-mail/se-já-foi-confirmado; a validação de verdade é sempre do
  // servidor (veja server/src/lib/reset-store.js).
  const [passwordReset, setPasswordReset] = useState(null); // { email, verified, code? }

  // Ao carregar a página (ou dar F5), pergunta pro backend se o cookie
  // httpOnly ainda corresponde a uma sessão válida — substitui o antigo
  // "ler usuário salvo no localStorage".
  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/auth/me').then(({ ok, body }) => {
      if (cancelled) return;
      setUser(ok ? body.user : null);
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isReady,

      async login(email, password) {
        const { ok, body } = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (!ok) {
          return { success: false, error: body?.error ?? 'Não foi possível entrar.' };
        }
        setUser(body.user);
        return { success: true, user: body.user };
      },

      async register({ name, email, password, role }) {
        const { ok, body } = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, role }),
        });
        if (!ok) {
          return { success: false, error: body?.error ?? 'Não foi possível concluir o cadastro.' };
        }
        setUser(body.user);
        return { success: true, user: body.user };
      },

      async logout() {
        await apiFetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
      },

      passwordReset,

      // Passo 1/3 — pede o código de redefinição pro e-mail informado.
      async requestPasswordReset(email) {
        const { ok, body } = await apiFetch('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        if (!ok) {
          return { success: false, error: body?.error ?? 'Não encontramos nenhuma conta com esse e-mail.' };
        }
        setPasswordReset({ email, verified: false, code: body.code });
        return { success: true, code: body.code };
      },

      // Passo 2/3 — confirma o código de 5 dígitos.
      async verifyResetCode(code) {
        if (!passwordReset) {
          return { success: false, error: 'Solicite a redefinição de senha novamente.' };
        }
        const { ok, body } = await apiFetch('/api/auth/verify-reset-code', {
          method: 'POST',
          body: JSON.stringify({ email: passwordReset.email, code }),
        });
        if (!ok) {
          return { success: false, error: body?.error ?? 'Código incorreto. Confira e tente novamente.' };
        }
        setPasswordReset((prev) => (prev ? { ...prev, verified: true } : prev));
        return { success: true };
      },

      // Passo 3/3 — define a nova senha (o servidor confere se o código
      // desse e-mail já foi confirmado antes de aceitar).
      async resetPassword(newPassword) {
        if (!passwordReset?.verified) {
          return { success: false, error: 'Confirme o código antes de trocar a senha.' };
        }
        const { ok, body } = await apiFetch('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email: passwordReset.email, newPassword }),
        });
        if (!ok) {
          return { success: false, error: body?.error ?? 'Não foi possível trocar a senha.' };
        }
        setPasswordReset(null);
        return { success: true };
      },
    }),
    [user, isReady, passwordReset]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth precisa ser usado dentro de um <AuthProvider>');
  }
  return ctx;
}
