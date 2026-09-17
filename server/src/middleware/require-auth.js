import { verifySession } from '../lib/jwt.js';
import { SESSION_COOKIE_NAME } from '../lib/session-cookie.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const payload = token ? verifySession(token) : null;

  if (!payload) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  req.userId = payload.sub;
  req.userRole = payload.role;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Você não tem permissão para fazer isso.' });
    }
    next();
  };
}
