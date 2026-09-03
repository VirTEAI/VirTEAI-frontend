import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protege uma rota: exige sessão ativa e, opcionalmente, um ou mais papéis
// (role) permitidos. Se o papel não bater, manda para a home certa do
// usuário em vez de para o login (ele está logado, só não pode ver essa
// página). `role` aceita uma string única ("admin") ou uma lista
// (["paciente", "terapeuta"]) quando mais de um papel pode acessar a rota.
export default function RequireAuth({ role, children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const allowedRoles = Array.isArray(role) ? role : role ? [role] : null;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.homePath} replace />;
  }

  return children;
}
