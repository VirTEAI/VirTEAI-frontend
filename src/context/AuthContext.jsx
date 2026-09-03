import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'virteai_session';

// Contas mockadas — como pedido, contas fixas por enquanto (sem
// backend/cadastro real ainda). Trocar por autenticação de verdade quando
// houver uma API.
//
// Papéis e permissões (regra de negócio pedida):
// - paciente: só visualiza os mundos/mapas. Não gera código de acesso, não
//   edita nenhum dado do próprio perfil (nem o nome).
// - terapeuta: gera códigos de acesso para seus pacientes. Pode editar os
//   próprios dados e os dados do(s) paciente(s) sob sua responsabilidade.
// - admin: o único que pode vincular um novo mundo/mapa; também gera
//   códigos de acesso e pode editar qualquer dado (próprio, de pacientes e
//   de terapeutas).
const MOCK_USERS = [
  {
    email: 'admin@virteai.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin VirTEAI',
    avatar: 'https://www.figma.com/api/mcp/asset/c15449d4-ecda-46f1-a4fb-88af275d9ced.png',
    homePath: '/admin',
  },
  {
    email: 'terapeuta@virteai.com',
    password: 'terapeuta123',
    role: 'terapeuta',
    name: 'Carlos Alberto Pierrez',
    avatar: 'https://www.figma.com/api/mcp/asset/3fcb7fdc-f13c-4fd0-8b45-aa0f68e0027d.png',
    homePath: '/dashboard',
  },
  {
    email: 'paciente@virteai.com',
    password: 'paciente123',
    role: 'paciente',
    name: 'Martion Felinzes Silva',
    avatar: 'https://www.figma.com/api/mcp/asset/950035b0-18d4-49f9-8c4f-b28173a05df6.png',
    homePath: '/dashboard',
  },
];

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  // Estado transitório do fluxo "Esqueci minha senha" (RedefinePassword →
  // CodeAuthentication → Redefinição, vindo do Figma). Fica só na memória —
  // some se a página for recarregada, o que é aceitável pra um mock.
  const [passwordReset, setPasswordReset] = useState(null); // { email, code, verified }

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Sem acesso a localStorage (modo privado, etc.) — a sessão simplesmente
      // não persiste entre recarregamentos.
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login(email, password) {
        const match = MOCK_USERS.find(
          (candidate) =>
            candidate.email.toLowerCase() === email.trim().toLowerCase() &&
            candidate.password === password
        );
        if (!match) {
          return { success: false, error: 'E-mail ou senha incorretos.' };
        }
        const { password: _password, ...publicUser } = match;
        setUser(publicUser);
        return { success: true, user: publicUser };
      },
      logout() {
        setUser(null);
      },
      passwordReset,
      // Passo 1 — RedefinePassword: gera um código de 5 dígitos pro e-mail
      // informado (se ele existir entre as contas mockadas) e guarda em
      // memória. Não existe envio de e-mail de verdade, então devolvemos o
      // código pra tela mostrar como dica de demonstração.
      requestPasswordReset(email) {
        const match = MOCK_USERS.find(
          (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (!match) {
          return { success: false, error: 'Não encontramos nenhuma conta com esse e-mail.' };
        }
        const code = String(Math.floor(10000 + Math.random() * 90000));
        setPasswordReset({ email: match.email, code, verified: false });
        return { success: true, code };
      },
      // Passo 2 — CodeAuthentication: confere o código de 5 dígitos.
      verifyResetCode(code) {
        if (!passwordReset) {
          return { success: false, error: 'Solicite a redefinição de senha novamente.' };
        }
        if (code !== passwordReset.code) {
          return { success: false, error: 'Código incorreto. Confira e tente novamente.' };
        }
        setPasswordReset((prev) => (prev ? { ...prev, verified: true } : prev));
        return { success: true };
      },
      // Passo 3 — Redefinição: troca a senha da conta mockada em memória
      // (não persiste no localStorage nem sobrevive a um reload — é só pra
      // demonstrar o fluxo completo, incluindo logar de novo com a senha
      // nova, até existir um backend de verdade).
      resetPassword(newPassword) {
        if (!passwordReset?.verified) {
          return { success: false, error: 'Confirme o código antes de trocar a senha.' };
        }
        const match = MOCK_USERS.find((candidate) => candidate.email === passwordReset.email);
        if (match) {
          match.password = newPassword;
        }
        setPasswordReset(null);
        return { success: true };
      },
    }),
    [user, passwordReset]
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

export const DEMO_ACCOUNTS = MOCK_USERS.map(({ email, password, role }) => ({
  email,
  password,
  role,
}));
