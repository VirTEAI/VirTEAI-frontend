import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-client';
import { useAuth } from '../context/AuthContext';

// Busca a lista real de mundos (GET /api/worlds) — usada no dashboard, no
// painel do admin e na tela de um mundo específico. Qualquer papel logado
// pode listar (o backend já garante isso), então o hook só não chama a API
// enquanto ainda não sabemos quem está logado.
export function useWorlds() {
  const { user } = useAuth();
  const [worlds, setWorlds] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(user));
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setWorlds([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    apiFetch('/api/worlds').then(({ ok, body }) => {
      if (cancelled) return;
      setWorlds(ok ? body.worlds : []);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, reloadToken]);

  // Chamado depois de criar um mundo novo (VincularMundoModal) pra fazer a
  // lista refletir a mudança sem precisar recarregar a página.
  function refresh() {
    setReloadToken((t) => t + 1);
  }

  return { worlds, isLoading, refresh };
}
