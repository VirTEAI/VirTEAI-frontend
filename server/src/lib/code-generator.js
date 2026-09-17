// Formato "VTA-XXXXXX" — o mesmo que o mock `src/data/codes.js` do front já
// usava, só que agora gerado no servidor (é ele quem grava no banco e quem
// garante unicidade via `UNIQUE` na coluna `code`).
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCodeString() {
  let result = '';
  for (let i = 0; i < 6; i += 1) {
    result += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `VTA-${result}`;
}

// Janela de validade de um código — mesma duração (~3h59m53s) que a UI do
// `GenerateCodeModal.jsx` já mostrava na contagem regressiva ("Tempo
// Restante do Mundo"), só que agora é o valor real gravado em `expiresAt`,
// não mais uma constante puramente visual no front.
export const CODE_TTL_MS = (4 * 60 * 60 - 7) * 1000;
