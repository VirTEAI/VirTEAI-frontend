import { defineConfig } from 'vitest/config';

// Os testes rodam contra um banco separado (`virteai_test`), nunca contra
// o `virteai_dev` — senão cada `npm test` apagaria os dados de
// desenvolvimento (inclusive as contas semeadas em `db:seed`). O
// `dotenv/config` que os módulos do servidor chamam não sobrescreve uma
// variável já definida, então isto aqui vence.
export default defineConfig({
  test: {
    environment: 'node',
    hookTimeout: 20000,
    testTimeout: 20000,
    env: {
      DATABASE_URL: 'postgresql://virteai:virteai_dev_pw@localhost:5432/virteai_test',
      // Mesmo motivo do DATABASE_URL acima: sem isolar, os testes de upload
      // (worlds.test.js) escreveriam arquivos de verdade em server/uploads/,
      // a mesma pasta que recebe uploads reais de um admin em desenvolvimento.
      UPLOAD_DIR: 'uploads-test/worlds',
    },
  },
});
