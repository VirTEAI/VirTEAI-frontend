// Wrapper fino sobre fetch, compartilhado por todo o front — sempre manda o
// cookie de sessão (`credentials: 'include'`) e sempre tenta ler um corpo
// JSON, mesmo em respostas de erro (é onde a API manda a mensagem pra
// mostrar na tela). Extraído do AuthContext pra ser reaproveitado pelos
// hooks/telas que também falam com o backend (pacientes, perfis).
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export async function apiFetch(path, options = {}) {
  // Upload de imagem (VincularMundoModal) manda um FormData — nesse caso o
  // Content-Type (com o boundary do multipart) tem que ser definido pelo
  // próprio navegador, nunca forçado pra 'application/json' aqui.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers ?? {}) },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
}
