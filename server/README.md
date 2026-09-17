# VirTEAI — Servidor (Fases 1–5: Autenticação, Pacientes & Perfis, Códigos de Acesso, Mundos, Sessões & Analytics)

API real em Node.js/Express + PostgreSQL (via Drizzle ORM): autenticação,
pacientes/terapeutas vinculados com perfis editáveis, geração/validação/
expiração real de códigos de acesso, CRUD de mundos com upload de imagem
real, e registro/consulta de sessões (telemetria simulada do dispositivo
VR) — tudo com autorização aplicada no servidor. Veja
`../BACKEND_ROADMAP.md` pra entender o contexto geral e as próximas fases.

## Banco de produção (Neon)

Além do Postgres local usado em dev/test, já existe um banco real na nuvem
(Neon) com o schema e os dados de demonstração aplicados — ver
`../BACKEND_ROADMAP.md`, seção 9. O backend abaixo ainda roda contra o
Postgres local; apontar pra esse banco Neon é parte do deploy (Fase 8).

## Rodando localmente

### 1. Banco de dados

Precisa de um PostgreSQL rodando. Neste ambiente de desenvolvimento já
existe um banco `virteai_dev` criado (usuário `virteai`) — se o serviço
não estiver de pé:

```bash
service postgresql start
```

Em outra máquina, crie o banco e ajuste `DATABASE_URL` no `.env` (veja
`.env.example`).

### 2. Instalar dependências

```bash
cd server
npm install
```

> Nota: a instalação de `vitest`/`drizzle-kit` precisa da flag
> `--legacy-peer-deps` neste ambiente por causa de um conflito de peer
> dependencies do `vitest` mais recente — se `npm install` reclamar,
> rode `npm install --legacy-peer-deps`.

### 3. Variáveis de ambiente

Copie `.env.example` pra `.env` e ajuste se precisar (o `.env` já existe
neste projeto configurado pro banco local).

### 4. Rodar as migrations

```bash
npm run db:generate   # gera o SQL a partir do schema.js, só quando ele mudar
npm run db:migrate    # aplica as migrations pendentes no banco
```

### 5. Subir o servidor

```bash
npm run dev
```

A API sobe em `http://localhost:4000` (ajustável via `PORT` no `.env`).

### 6. Rodar os testes automatizados

```bash
npm test
```

> Os testes rodam contra um banco **separado** (`virteai_test`) e uma pasta
> de upload **separada** (`uploads-test/`), ambos configurados em
> `vitest.config.js` — nunca tocam o `virteai_dev` nem `server/uploads/`. Se
> você criar o banco de teste do zero em outra máquina, aplique as
> migrations nele também:
> `DATABASE_URL="postgresql://virteai:virteai_dev_pw@localhost:5432/virteai_test" npx drizzle-kit migrate`.

### 7. Contas de demonstração (opcional)

```bash
npm run db:seed
```

Cria as 3 contas de sempre — `admin@virteai.com` / `admin123`,
`terapeuta@virteai.com` / `terapeuta123`, `paciente@virteai.com` /
`paciente123` — mais 4 pacientes extras (Murillo Fernandes, Henrique de
Ferraz, Fabricia Santos, Ana Beatriz Lima — senha `paciente123` para
todos), todos vinculados ao terapeuta de demonstração; 2 mundos reais
(`home`, `ensino-fundamental`, os mesmos que o front já mostrava como
mock); e 3 códigos de acesso de exemplo (um pendente, um utilizado, um já
expirado — pra `/codigos` não ficar vazia). `db:seed` é idempotente (pula
quem/o que já existe) mas **não atualiza** campos de quem já existe — se
você já tinha as 3 contas antigas (sem os campos da Fase 2) e quer os
dados novos populados, dê um `TRUNCATE users, worlds CASCADE;` no banco
antes de rodar de novo (o `CASCADE` também limpa os códigos de acesso, que
referenciam ambas as tabelas).

## Testando na mão (curl)

Com o servidor rodando em outro terminal:

```bash
# Registrar uma conta (já loga — o cookie de sessão fica salvo em cookies.txt)
curl -c cookies.txt -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Terapeuta","email":"ana@teste.com","password":"senha123","role":"terapeuta"}'

# Ver quem está logado (usa o cookie salvo)
curl -b cookies.txt http://localhost:4000/api/auth/me

# Logout
curl -b cookies.txt -c cookies.txt -X POST http://localhost:4000/api/auth/logout

# /me depois do logout deve voltar 401
curl -b cookies.txt http://localhost:4000/api/auth/me

# Login separado (sem ter registrado agora)
curl -c cookies2.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@teste.com","password":"senha123"}'

# Senha errada -> 401
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@teste.com","password":"errada"}'

# E-mail duplicado -> 409
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Outra Ana","email":"ana@teste.com","password":"outrasenha","role":"paciente"}'

# --- Pacientes & perfis (Fase 2) ---

# Logar como terapeuta de demonstração
curl -c cookies3.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"terapeuta@virteai.com","password":"terapeuta123"}'

# "Meus Pacientes" (só os vinculados a esse terapeuta)
curl -b cookies3.txt http://localhost:4000/api/patients

# Ver um perfil específico (troque <id> pelo id de um paciente da resposta acima)
curl -b cookies3.txt http://localhost:4000/api/users/<id>

# Editar dados de um paciente vinculado
curl -b cookies3.txt -X PATCH http://localhost:4000/api/users/<id> \
  -H "Content-Type: application/json" \
  -d '{"note":"Evoluindo bem nas últimas sessões"}'

# Listar terapeutas (admin only) — usado como fallback quando um admin
# abre a tela de perfil de terapeuta sem um terapeuta específico escolhido
curl -c cookies4.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@virteai.com","password":"admin123"}'
curl -b cookies4.txt "http://localhost:4000/api/users?role=terapeuta"

# --- Mundos (Fase 4) ---

# Listar mundos (qualquer papel logado)
curl -b cookies3.txt http://localhost:4000/api/worlds

# Criar um mundo novo (admin only, multipart/form-data — aqui sem imagens;
# pra mandar imagem de verdade, troque os -F de texto por
# -F "thumbnail=@/caminho/da/foto.png" -F "gallery=@/caminho/da/outra.png")
curl -b cookies4.txt -X POST http://localhost:4000/api/worlds \
  -F "title=Praça de Alimentação" \
  -F "description=Um shopping simulado." \
  -F "connectionId=190293021"

# Editar um mundo (admin only, troque <worldId> pelo id/slug devolvido acima)
curl -b cookies4.txt -X PATCH http://localhost:4000/api/worlds/<worldId> \
  -F "description=Descrição atualizada."

# --- Códigos de acesso (Fase 3, worldId agora referencia um mundo real da Fase 4) ---

# Gerar um código pra um paciente vinculado (troque <patientId> pelo id de
# um paciente da resposta de GET /api/patients acima; worldId precisa ser
# o id de um mundo que já existe — ex.: "ensino-fundamental", semeado por
# db:seed, ou o slug de um mundo criado no passo acima)
curl -b cookies3.txt -X POST http://localhost:4000/api/codes \
  -H "Content-Type: application/json" \
  -d '{"worldId":"ensino-fundamental","patientId":"<patientId>"}'

# Listar os códigos (terapeuta só vê os que ele mesmo gerou; admin vê todos)
curl -b cookies3.txt http://localhost:4000/api/codes

# Validar um código (simula o dispositivo VR lendo o código gerado acima —
# troque VTA-XXXXXX pelo código real que voltou no passo anterior)
curl -b cookies3.txt -X POST http://localhost:4000/api/codes/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"VTA-XXXXXX"}'

# Validar de novo o mesmo código -> 409 (já utilizado)
curl -b cookies3.txt -X POST http://localhost:4000/api/codes/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"VTA-XXXXXX"}'

# --- Sessões & analytics (Fase 5) ---

# Reportar o relatório de uma sessão (simula o "óculos VR" no final da
# experiência — o código precisa já estar "utilizado", ou seja, validado
# no passo acima; troque VTA-XXXXXX pelo mesmo código de antes)
curl -b cookies3.txt -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "code": "VTA-XXXXXX",
    "durationSeconds": 656,
    "totalFixationSeconds": 480,
    "fixationCount": 44,
    "areas": [
      {"name": "Dinossauro", "tag": "Brinquedo", "timeSeconds": 138},
      {"name": "Quadro-negro", "tag": "Objeto", "timeSeconds": 96}
    ]
  }'

# Registrar de novo pro mesmo código -> 409 (já existe sessão)
curl -b cookies3.txt -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"code":"VTA-XXXXXX","durationSeconds":100,"totalFixationSeconds":50,"fixationCount":5,"areas":[]}'

# Ver o resumo de uma sessão por código (autorização: dono, terapeuta
# vinculado ou admin — qualquer outro papel recebe 403)
curl -b cookies3.txt http://localhost:4000/api/sessions/by-code/VTA-XXXXXX

# Sessão mais recente de um mundo, sem saber o código (fallback usado em
# /resumo quando a URL não veio com ?code=)
curl -b cookies3.txt "http://localhost:4000/api/sessions/latest?worldId=ensino-fundamental"

# --- Esqueci minha senha (3 passos) ---

# 1) Pede o código (modo demonstração: o código volta na resposta)
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@teste.com"}'

# 2) Confirma o código (troque 12345 pelo código que veio no passo 1)
curl -X POST http://localhost:4000/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@teste.com","code":"12345"}'

# 3) Define a nova senha
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@teste.com","newPassword":"outraSenhaNova"}'
```

## Estrutura

```
server/
  drizzle/              # migrations SQL geradas
  drizzle.config.js
  uploads/               # imagens de mundo enviadas de verdade (gitignored)
    worlds/
  src/
    db/
      client.js           # pool do pg + instância do drizzle
      schema.js            # tabelas: users, access_codes, worlds, sessions, session_areas
      seed.js               # contas + mundos + códigos + sessão de demonstração (npm run db:seed)
    lib/
      auth-schemas.js      # validação zod (register/login/reset de senha)
      user-schemas.js       # validação zod (PATCH /api/users/:id)
      code-schemas.js       # validação zod (POST /api/codes, /api/codes/validate)
      code-generator.js     # gera o texto "VTA-XXXXXX" e a janela de validade (TTL)
      world-schemas.js       # validação zod (POST/PATCH /api/worlds)
      session-schemas.js      # validação zod (POST /api/sessions)
      slug.js                 # gera o id/slug de um mundo a partir do título
      jwt.js                 # assinar/verificar o token de sessão
      password.js            # hash/verificação de senha (bcryptjs)
      public-user.js         # remove passwordHash, calcula homePath
      session-cookie.js      # cookie httpOnly de sessão
      reset-store.js          # códigos de recuperação de senha (em memória)
    middleware/
      require-auth.js       # protege rotas, injeta req.userId/req.userRole
      upload.js               # multer — salva imagem de mundo em disco (UPLOAD_DIR)
      error-handler.js
    controllers/
      auth.controller.js
      users.controller.js    # GET /api/users, GET/PATCH /api/users/:id
      patients.controller.js  # GET /api/patients
      codes.controller.js      # POST/GET /api/codes, POST /api/codes/validate
      worlds.controller.js      # GET/POST/PATCH /api/worlds
      sessions.controller.js     # POST /api/sessions, GET /api/sessions/by-code/:code, GET /api/sessions/latest
    routes/
      auth.routes.js
      users.routes.js
      patients.routes.js
      codes.routes.js
      worlds.routes.js
      sessions.routes.js
    app.js                    # monta o Express (usado direto nos testes) — também
                               # serve /uploads/worlds estaticamente
    server.js                  # sobe o servidor de verdade
  tests/
    auth.test.js
    password-reset.test.js
    users-patients.test.js
    codes.test.js
    worlds.test.js
    sessions.test.js
```
