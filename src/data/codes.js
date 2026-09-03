// Códigos de acesso gerados — armazenados em memória (reinicia ao recarregar
// a página, já que ainda não há backend). `getCodes`/`addCode` são o único
// ponto de leitura/escrita, usado tanto pelo modal Dashboard-Open quanto pela
// tela em tela cheia do mundo, e lido pela página /codigos.

let codes = [
  {
    id: 'code-seed-1',
    code: 'VTA-8K2N4Q',
    worldId: 'ensino-fundamental',
    worldTitle: 'Ensino Fundamental',
    patientName: 'Henrique de Ferraz',
    generatedAt: '25/08/2026 09:14',
    status: 'utilizado',
  },
  {
    id: 'code-seed-2',
    code: 'VTA-3F7X1P',
    worldId: 'ensino-fundamental',
    worldTitle: 'Ensino Fundamental',
    patientName: 'Fabricia Santos',
    generatedAt: '27/08/2026 16:40',
    status: 'pendente',
  },
  {
    id: 'code-seed-3',
    code: 'VTA-1D9M6R',
    worldId: 'home',
    worldTitle: 'Home',
    patientName: 'Murillo Fernandes',
    generatedAt: '18/08/2026 11:02',
    status: 'expirado',
  },
];

function generateCodeString() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `VTA-${result}`;
}

function formatNow() {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

export function getCodes() {
  return codes;
}

export function addCode({ worldId, worldTitle, patientName }) {
  const entry = {
    id: `code-${Date.now()}`,
    code: generateCodeString(),
    worldId,
    worldTitle,
    patientName,
    generatedAt: formatNow(),
    status: 'pendente',
  };
  codes = [entry, ...codes];
  return entry;
}
