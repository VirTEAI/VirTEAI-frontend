import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-client';
import { useAuth } from '../context/AuthContext';

// Busca os pacientes acessíveis a quem está logado — usado no seletor de
// "Paciente Selecionado" (gerar código de acesso) e na lista "Meus
// Pacientes" do terapeuta. O backend já faz o recorte certo por trás de
// GET /api/patients: terapeuta só recebe os seus vinculados, admin recebe
// todos. Paciente não tem acesso a essa rota (nem precisa dela), então o
// hook nem chega a chamar a API nesse caso.
export function usePatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(user) && user.role !== 'paciente');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!user || user.role === 'paciente') {
      setPatients([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    apiFetch('/api/patients').then(({ ok, body }) => {
      if (cancelled) return;
      setPatients(ok ? body.patients : []);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, reloadToken]);

  // Chamado depois de editar os dados de um paciente ("Gerenciar
  // Pacientes") pra lista refletir a mudança sem precisar recarregar a
  // página inteira.
  function refresh() {
    setReloadToken((t) => t + 1);
  }

  return { patients, isLoading, refresh };
}
