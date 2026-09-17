import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { setSessionCookie, clearSessionCookie } from '../lib/session-cookie.js';
import { toPublicUser } from '../lib/public-user.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
} from '../lib/auth-schemas.js';
import { setResetEntry, getResetEntry, clearResetEntry, createResetCode, ttlMs } from '../lib/reset-store.js';

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
  }
  const { name, email, password, role, avatar } = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash, role, avatar })
    .returning();

  setSessionCookie(res, created);
  return res.status(201).json({ user: toPublicUser(created) });
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  setSessionCookie(res, user);
  return res.json({ user: toPublicUser(user) });
}

export function logout(req, res) {
  clearSessionCookie(res);
  return res.status(204).send();
}

export async function me(req, res) {
  const [user] = await db.select().from(users).where(eq(users.id, req.userId)).limit(1);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  return res.json({ user: toPublicUser(user) });
}

// Passo 1/3 do "esqueci minha senha". Modo demonstração: sem envio de
// e-mail de verdade, o código volta na própria resposta pra tela mostrar
// (mesmo comportamento que já existia quando isso era simulado no front).
export async function forgotPassword(req, res) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
  }
  const { email } = parsed.data;

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return res.status(404).json({ error: 'Não encontramos nenhuma conta com esse e-mail.' });
  }

  const code = createResetCode();
  setResetEntry(email, { code, verified: false, expiresAt: Date.now() + ttlMs() });
  return res.json({ code });
}

// Passo 2/3.
export async function verifyResetCode(req, res) {
  const parsed = verifyResetCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
  }
  const { email, code } = parsed.data;

  const entry = getResetEntry(email);
  if (!entry) {
    return res.status(400).json({ error: 'Solicite a redefinição de senha novamente.' });
  }
  if (entry.code !== code) {
    return res.status(400).json({ error: 'Código incorreto. Confira e tente novamente.' });
  }

  setResetEntry(email, { ...entry, verified: true });
  return res.json({ success: true });
}

// Passo 3/3.
export async function resetPassword(req, res) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
  }
  const { email, newPassword } = parsed.data;

  const entry = getResetEntry(email);
  if (!entry?.verified) {
    return res.status(400).json({ error: 'Confirme o código antes de trocar a senha.' });
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.email, email));
  clearResetEntry(email);

  return res.json({ success: true });
}
