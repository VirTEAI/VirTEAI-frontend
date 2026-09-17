# Deploy — VirTEAI (Vercel + Render + Neon)

Guia passo a passo pra colocar o projeto no ar de verdade: front-end no
**Vercel**, back-end no **Render**, banco de dados no **Neon** (já
configurado — ver `BACKEND_ROADMAP.md`, seção 9).

Como este projeto roda num ambiente sandbox sem acesso de rede direto ao
Vercel/Render/GitHub com credenciais, os passos abaixo que exigem login
(criar repositório, conectar conta, colar variável de ambiente) precisam
ser feitos por você mesmo, nos respectivos sites. Preparei todo o resto
(configuração, scripts, arquivos) pra isso ser só clicar e colar.

## Antes de começar

- Você já tem conta no Vercel e no Render (confirmado).
- O banco de produção no Neon já existe e já está populado com os dados
  de demonstração (Fases 1–4). **Falta aplicar a migration da Fase 5**
  (tabelas `sessions`/`session_areas`) — isso acontece automaticamente no
  primeiro deploy do backend (Passo 2), não precisa fazer nada à parte.
- Guarde a connection string do Neon em mãos (a mesma usada no
  `run-neon-setup.mjs`), só **sem** o parâmetro `channel_binding=require`
  — mantenha só `sslmode=require`. Exemplo do formato:
  ```
  postgresql://neondb_owner:SENHA@ep-xxxxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
  ```

## Passo 1 — Subir o código pro GitHub

O zip que te mandei (`virteai-site-deploy-ready.zip`) já vem com um
repositório Git local pronto (`git init` + primeiro commit já feitos) —
você só precisa criar um repositório vazio no GitHub e apontar pra ele.

1. Descompacte o zip em algum lugar do seu computador.
2. No GitHub, crie um repositório novo (pode ser privado), **sem**
   marcar "Add a README" (pra não conflitar com o commit que já existe).
3. No terminal, dentro da pasta descompactada:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
   git push -u origin main
   ```
   (se você usa SSH em vez de HTTPS, use a URL `git@github.com:...` que o
   GitHub te mostra na tela de criação do repo)

## Passo 2 — Backend no Render

O repositório já inclui um `render.yaml` na raiz (Render chama isso de
"Blueprint") com a configuração pronta: root em `server/`, comando de
build que instala dependências **e já aplica a migration da Fase 5 e
semeia os dados de demonstração** (`npm install && npm run db:migrate &&
npm run db:seed`), e comando de start (`npm start`).

1. No painel do Render: **New +** → **Blueprint** → conecte o
   repositório que você acabou de criar no GitHub.
2. O Render vai detectar o `render.yaml` e mostrar o serviço
   `virteai-server` pronto pra criar. Antes de confirmar, ele vai pedir
   pra preencher as variáveis marcadas como secretas:
   - `DATABASE_URL` → a connection string do Neon (sem `channel_binding`,
     como no exemplo acima).
   - `JWT_SECRET` → gere um segredo novo, só pra produção (não reuse o de
     desenvolvimento). Rode isso no seu terminal e cole o resultado:
     ```bash
     node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
     ```
   - `CLIENT_ORIGIN` → por enquanto, coloque um valor temporário
     qualquer (ex.: `https://placeholder.vercel.app`) — você vai voltar
     aqui e corrigir no Passo 4, depois de saber a URL real do Vercel.
   - `NODE_ENV` já vem preenchido como `production` pelo próprio
     `render.yaml`.
3. Crie o serviço. O primeiro deploy demora um pouco mais (instala
   dependências, roda a migration nova e o seed). Acompanhe o log —
   deve terminar com o servidor escutando e o healthcheck (`/api/health`)
   passando.
4. Anote a URL que o Render te deu, algo como
   `https://virteai-server.onrender.com`. Teste no navegador:
   `https://virteai-server.onrender.com/api/health` deve responder
   `{"ok":true,"service":"virteai-server"}`.

**Nota sobre o plano gratuito do Render**: sem uso, o serviço "dorme"
depois de ~15 minutos, e a primeira requisição depois disso demora uns
30–50 segundos pra "acordar" — normal, não é erro. Se isso incomodar,
existe um plano pago sem essa limitação.

## Passo 3 — Frontend no Vercel

1. No painel do Vercel: **Add New** → **Project** → importe o mesmo
   repositório do GitHub.
2. O Vercel detecta automaticamente que é um projeto Vite (o `vercel.json`
   na raiz já define o build/output, e também garante que rotas como
   `/dashboard` ou `/codigos` funcionem certo ao dar refresh — sem isso,
   recarregar a página numa rota interna dá 404).
3. Antes de clicar em Deploy, adicione a variável de ambiente:
   - `VITE_API_URL` → a URL do Render do Passo 2 (ex.:
     `https://virteai-server.onrender.com`, **sem barra no final**).
4. Deploy. Ao terminar, anote a URL do projeto (ex.:
   `https://virteai-site.vercel.app`).

## Passo 4 — Fechar o círculo: atualizar o CORS no Render

Volte nas variáveis de ambiente do serviço `virteai-server` no Render e
corrija `CLIENT_ORIGIN` pro valor real do Vercel do Passo 3:

```
CLIENT_ORIGIN=https://virteai-site.vercel.app
```

Se o Vercel também te deu uma URL de preview (ex.:
`https://virteai-site-git-main-seu-usuario.vercel.app`), pode listar as
duas separadas por vírgula, sem espaço:

```
CLIENT_ORIGIN=https://virteai-site.vercel.app,https://virteai-site-git-main-seu-usuario.vercel.app
```

Salvar a variável já dispara um redeploy automático do backend.

## Passo 5 — Testar de ponta a ponta

Com as duas URLs no ar, abra a URL do Vercel e teste o fluxo completo com
as contas de demonstração (mesmas do banco local):

- `admin@virteai.com` / `admin123`
- `terapeuta@virteai.com` / `terapeuta123`
- `paciente@virteai.com` / `paciente123`

Confirme especificamente: login mantém a sessão depois de recarregar a
página (é o teste mais importante — é onde o cookie cross-domain
`sameSite=none` entra em ação), gerar um código de acesso, validar e
reportar uma sessão, e ver o resumo real em `/resumo`.

## Limitações conhecidas em produção

- **Upload de imagem de mundo não é persistente no Render free tier**: as
  imagens enviadas via "Vincular Novo Mundo" ficam salvas em disco local
  do servidor, que é apagado a cada novo deploy ou quando o serviço
  reinicia depois de dormir. Pra resolver de verdade é preciso trocar por
  um bucket real (S3, Cloudflare R2 etc.) — é exatamente o que a **Fase
  7** do roadmap já prevê. Enquanto isso não é feito, o mais seguro é
  evitar depender de imagens enviadas em produção pra demonstrações
  importantes (as imagens semeadas via `db:seed`, que são URLs externas,
  não são afetadas).
- **Cold start**: primeira requisição depois de um período sem uso demora
  (ver nota no Passo 2).
- **Migrations futuras**: qualquer nova migration gerada com
  `npm run db:generate` só chega no banco de produção no próximo deploy
  do Render (o `buildCommand` roda `db:migrate` automaticamente a cada
  deploy) — não precisa rodar nada manual, só fazer `git push`.

## Troubleshooting rápido

- **Login funciona mas some ao recarregar a página** → o cookie não está
  sendo salvo. Confira se `CLIENT_ORIGIN` no Render é *exatamente* a URL
  do Vercel (com `https://`, sem barra no final) e se `NODE_ENV=production`
  está mesmo definido no Render (é o que liga `secure`/`sameSite=none` no
  cookie).
- **Erro de CORS no console do navegador** → mesma causa acima:
  `CLIENT_ORIGIN` não bate com a URL de onde o front está servindo.
- **Deploy do Render falha na migration** → confira se `DATABASE_URL` não
  tem `channel_binding=require` (o driver usado, `pg`, não reconhece esse
  parâmetro — só `sslmode=require`).
- **`/resumo` sempre mostra "nenhuma sessão encontrada"** logo após o
  primeiro deploy → confirme que o build do Render realmente rodou
  `db:seed` (aparece no log de build) — ele semeia a sessão de
  demonstração pro código `VTA-8K2N4Q`.
