// Guarda em memória o estado do fluxo "esqueci minha senha" (código gerado,
// se já foi confirmado, validade). Isso é suficiente pro modo demonstração
// (sem envio de e-mail de verdade) e mantém o mesmo comportamento que o
// front já tinha quando o estado morava só no React — só que agora vive no
// servidor, chaveado por e-mail, e sobrevive a um F5 na tela de código.
//
// Não persiste em banco de propósito: é um dado transitório (expira em
// minutos), então uma tabela pra isso seria over-engineering nesta fase.
const TTL_MS = 10 * 60 * 1000; // 10 minutos

const store = new Map();

export function setResetEntry(email, entry) {
  store.set(email, entry);
}

export function getResetEntry(email) {
  const entry = store.get(email);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(email);
    return null;
  }
  return entry;
}

export function clearResetEntry(email) {
  store.delete(email);
}

export function createResetCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export function ttlMs() {
  return TTL_MS;
}
