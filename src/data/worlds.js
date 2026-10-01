// Dataset compartilhado entre os cards do dashboard, o modal DashBoard-Open
// e a página em tela cheia do mundo.

const IMG_THUMB = 'https://www.figma.com/api/mcp/asset/a762546b-8c98-4320-bb31-8097acb62d1a.png';
const IMG_GALLERY = 'https://www.figma.com/api/mcp/asset/d660efc7-26a5-4680-9a7a-6c1e2806f730.png';

export const worlds = {
  home: {
    id: 'home',
    title: 'Home',
    thumbnail: IMG_THUMB,
    gallery: IMG_THUMB,
    likes: 17,
    views: 20,
    description:
      'Um espaço de boas-vindas para os pacientes explorarem antes de escolher o mundo do dia — um ambiente calmo, pensado para reduzir a ansiedade de início de sessão.',
    launchedAt: '02/03/25',
  },
  'ensino-fundamental': {
    id: 'ensino-fundamental',
    title: 'Ensino Fundamental',
    thumbnail: IMG_THUMB,
    gallery: IMG_GALLERY,
    likes: 17,
    views: 20,
    description:
      'Explore uma escola de ensino fundamental totalmente interativa, criada para transformar o aprendizado em uma grande aventura. Caminhe por salas de aula, biblioteca, refeitório, quadra esportiva e pátio enquanto realiza desafios e descobre novas atividades. Cada ambiente foi desenvolvido para estimular a exploração, a autonomia e o desenvolvimento de habilidades importantes para crianças com Transtorno do Espectro Autista (TEA), oferecendo uma experiência divertida, acolhedora e segura, onde aprender faz parte da brincadeira.',
    launchedAt: '17/05/25',
  },
};

export const recentWorldIds = ['home', 'ensino-fundamental', 'ensino-fundamental', 'ensino-fundamental'];
export const popularWorldIds = [
  'ensino-fundamental',
  'ensino-fundamental',
  'ensino-fundamental',
  'ensino-fundamental',
];

export const worldOrder = ['home', 'ensino-fundamental'];
