import jwt from 'jsonwebtoken';

const EXPIRES_IN = '7d';

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error('JWT_SECRET não configurado (confira o .env).');
  }
  return value;
}

export function signSession(payload) {
  return jwt.sign(payload, secret(), { expiresIn: EXPIRES_IN });
}

export function verifySession(token) {
  try {
    return jwt.verify(token, secret());
  } catch {
    return null;
  }
}
