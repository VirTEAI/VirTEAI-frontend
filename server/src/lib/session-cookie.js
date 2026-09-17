import { signSession } from './jwt.js';

export const SESSION_COOKIE_NAME = 'virteai_session';

export function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // Em produção (HTTPS) o cookie só viaja em conexão segura. Em
    // desenvolvimento local (HTTP) isso ficaria bloqueado, então
    // desligamos só nesse caso.
    secure: isProduction,
    // 'lax' funciona em dev porque front e back estão no mesmo site (só
    // portas diferentes, localhost). Em produção o front (Vercel) e o
    // back (Render) ficam em domínios diferentes de verdade — um cookie
    // 'lax' nunca viajaria numa requisição cross-site feita via
    // `fetch(..., { credentials: 'include' })`, então vira 'none' (exige
    // `secure: true`, que já é o caso em produção).
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias, em sincronia com o JWT
  };
}

export function setSessionCookie(res, user) {
  const token = signSession({ sub: user.id, role: user.role });
  res.cookie(SESSION_COOKIE_NAME, token, cookieOptions());
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, cookieOptions());
}
