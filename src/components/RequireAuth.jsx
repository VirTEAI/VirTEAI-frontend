import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protege uma rota: exige sessão ativa e, opcionalmente, um ou mais papéis
// (role) permitidos. Se o papel não bater, manda para a home certa do
// usuário em vez de para o login (ele está logado, só não pode ver essa
// página). `role` aceita uma string única ("admin") ou uma lista
// (["paciente", "terapeuta"]) quando mais de um papel pode acessar a rota.
export default function RequireAuth({ role, children }) {
  const { user, isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  // A sessão é confirmada de forma assíncrona (GET /auth/me, a partir do
  // cookie httpOnly) assim que o app carrega. Enquanto isso não termina,
  // não dá pra saber se a pessoa está logada — redirecionar pro /login
  // "no chute" aqui causaria um flash indevido num F5 numa página
  // protegida, mesmo com sessão válida.
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[14px] text-ink-tertiary">
        Carregando…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const allowedRoles = Array.isArray(role) ? role : role ? [role] : null;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.homePath} replace />;
  }

  return children;
}
