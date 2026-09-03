// Dados editáveis de perfil — mock em memória (reinicia ao recarregar a
// página, já que ainda não há backend). Guarda só os campos que a tela de
// "Editar dados" (temporária, pedida como demonstração) permite alterar.
// Quem pode chamar `updateProfile` é decidido nas telas (Profile.jsx /
// ProfilePsicologo.jsx) com base no papel do usuário logado, não aqui.

const profiles = {
  paciente: {
    name: 'Martion Felinzes Silva',
    birthDate: '20/04/1999',
    email: 'martinho007@gmail.com',
  },
  terapeuta: {
    name: 'Carlos Alberto Pierrez',
    birthDate: '28/06/1993',
    email: 'carlos.pierrez@virteai.work.com',
    therapistId: '407821',
  },
};

export function getProfile(key) {
  return profiles[key];
}

export function updateProfile(key, patch) {
  profiles[key] = { ...profiles[key], ...patch };
  return profiles[key];
}
