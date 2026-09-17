# Roadmap do backend — VirTEAI

Este documento existe pra gente seguir passo a passo, sem perder o fio.
Cada fase termina em algo **testável de verdade** (banco real, API real,
teste automatizado rodando) antes de passar pra próxima. Ele vai sendo
atualizado conforme avançamos — pense nele como o "mapa" do projeto.

## 1. Análise da stack (decisões e porquês)

| Ponto | Escolha | Por quê |
|---|---|---|
| Linguagem do backend | **Node.js** | O front já é JavaScript (React). Uma linguagem só no projeto inteiro é mais fácil de você mesmo manter, sem alternar contexto entre JS e Python. |
| Framework HTTP | **Express** | Já era a opção que você tinha em mente; é o mais documentado/ensinado do ecossistema Node, sem "mágica" escondida — fica fácil entender o que cada linha faz. |
| Banco de dados | **PostgreSQL** | Robusto, relacional (os dados daqui têm relação clara: paciente pertence a terapeuta, código pertence a mundo e a paciente, etc.), e já está **instalado neste ambiente** — dá pra desenvolver/testar sem precisar criar conta em lugar nenhum agora. Mais pra frente, na hora de colocar em produção de verdade, ele roda em qualquer provedor (Railway, Render, Supabase, Neon, RDS...). |
| ORM (camada entre código e banco) | **Drizzle ORM** | A ideia original era Prisma, mas na hora de configurar descobri que o Prisma baixa um binário (`schema-engine`) de `binaries.prisma.sh` — e esse domínio está bloqueado pela política de rede deste ambiente (o mesmo tipo de bloqueio que já afeta o CDN do Figma, documentado mais abaixo no README principal). Troquei pra Drizzle, que faz a mesma coisa (schema declarativo em código, migrations geradas automaticamente, client com autocomplete) só que 100% em JavaScript puro, sem nenhum binário externo pra baixar — funciona igual aqui e em qualquer lugar. |
| Autenticação | **JWT guardado em cookie `httpOnly`** | Mais seguro que guardar token em `localStorage` (que o front faz hoje) — um cookie `httpOnly` não pode ser lido por JavaScript malicioso injetado na página (proteção extra contra XSS). O navegador manda o cookie sozinho em cada request. |
| Hash de senha | **bcryptjs** | Padrão da indústria pra senha, e a versão "js" (sem dependência nativa/compilada) evita problemas de instalação em qualquer ambiente — inclusive este sandbox. |
| Validação de entrada | **zod** | Valida o corpo das requisições (email válido, senha com tamanho mínimo, etc.) com mensagens de erro claras, e serve de documentação viva do formato esperado. |
| Estrutura de pastas | Uma pasta `/server` dentro do mesmo projeto (por enquanto) | Mantém front e back juntos, mais simples de você navegar enquanto o projeto é pequeno. Se um dia crescer muito, separar em dois repositórios é uma migração simples. |
| Testes | **vitest + supertest** | Testes automatizados que sobem a API e fazem requisições de verdade contra ela (registro, login, etc.), sem precisar clicar em nada — é o que garante que cada fase realmente funciona antes de seguir pra próxima. |
| Ambiente de desenvolvimento | PostgreSQL local (já disponível aqui) + arquivo `.env` | Zero conta externa necessária pra começar a testar. Quando você quiser colocar em produção de verdade (fora deste ambiente), aí sim escolhemos onde hospedar banco + API — fica pra fase final (Deploy). |

## 2. Fases (cada uma "fecha" testável)

- [x] **Fase 0 — Fundação do backend**: pasta `/server`, Express, Drizzle
      conectado ao Postgres local, rota `GET /api/health` só pra confirmar
      que tudo conversa.
- [x] **Fase 1 — Autenticação real**: tabela `User` de verdade no banco,
      registro, login, logout, "quem sou eu", senha com hash, sessão via
      cookie, e recuperação de senha (código de 5 dígitos, validado contra
      contas reais). Testável com testes automatizados + `curl`/Postman.
- [x] **Fase 1b — Front ligado na API real**: o `AuthContext.jsx` não usa
      mais `MOCK_USERS`/`localStorage` — chama a API de verdade, com
      sessão via cookie `httpOnly`. Login, cadastro (que ganhou campos de
      senha e papel, que não existiam antes), logout e o fluxo completo de
      "esqueci minha senha" testados de ponta a ponta no navegador.
- [x] **Fase 2 — Pacientes & perfis**: pacientes viraram usuários reais no
      banco, vinculados ao terapeuta responsável (`responsibleTherapistId`),
      com autorização de visualização/edição aplicada de verdade no
      servidor. `PatientSelector`, `Profile.jsx` e `ProfilePsicologo.jsx`
      deixaram de usar `data/patients.js` e `data/profiles.js` (removidos) e
      agora falam com a API.
- [x] **Fase 3 — Códigos de acesso**: geração, validação e expiração real de
      código, gravado no banco e vinculado a um paciente real — `data/codes.js`
      (mock em memória) foi removido.
- [x] **Fase 4 — Mundos / conteúdo**: CRUD de mundos (Criar, Ler, Editar) com
      upload de imagem real (multer, disco local), e `access_codes.worldId`
      virou uma FK de verdade pra essa tabela — `data/worlds.js` (estático)
      foi removido.
- [x] **Fase 5 — Sessões & analytics** *(estamos aqui)*: tabelas
      `sessions`/`session_areas`, endpoint pra receber telemetria (mock de
      "óculos VR" simulando envio de dados: duração, fixações do olhar,
      áreas mais observadas) e `SessionSummary`/`AccessCodes` ligados na
      API real em vez dos números de exemplo fixos.
- [ ] **Fase 6 — Avaliações, aprovação de terapeuta e notificações**.
- [ ] **Fase 7 — Armazenamento de arquivo real** (laudo, thumbnails).
- [ ] **Fase 8 — Deploy**: escolher hospedagem real pra banco + API +
      front, variáveis de ambiente de produção, domínio.

Cada checkbox marcado tem um teste automatizado passando por trás — nada
fica "feito" só porque o código foi escrito.

## 3. Fase 1 em detalhe — o que foi construído

Modelo de dados (`server/src/db/schema.js`, tabela criada de verdade no
Postgres via migration em `server/drizzle/0000_crazy_ares.sql`):

```js
export const roleEnum = pgEnum('role', ['admin', 'terapeuta', 'paciente']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

Endpoints (`server/src/routes/auth.routes.js`):

- `POST /api/auth/register` — cria conta (nome, e-mail, senha, papel),
  valida com zod, já loga em seguida (define o cookie de sessão).
- `POST /api/auth/login` — confere e-mail/senha (hash comparado com
  bcryptjs), define cookie de sessão.
- `POST /api/auth/logout` — limpa o cookie.
- `GET /api/auth/me` — devolve o usuário logado, lendo o cookie (protegido
  pelo middleware `requireAuth`).
- `POST /api/auth/forgot-password` — gera um código de 5 dígitos pra uma
  conta existente (modo demonstração: sem e-mail de verdade, o código
  volta na resposta).
- `POST /api/auth/verify-reset-code` — confirma o código.
- `POST /api/auth/reset-password` — troca a senha, só aceita se o código
  já foi confirmado.

14 testes automatizados (`server/tests/*.test.js`, `npm test` dentro de
`/server`, rodando contra um banco `virteai_test` separado do banco de
desenvolvimento) cobrem: registro válido, dados inválidos, e-mail
duplicado, login certo/errado/inexistente, `/me` bloqueado sem sessão e
liberado com sessão válida, logout derrubando a sessão, e o fluxo
completo de recuperação de senha (incluindo logar com a senha nova
depois). Todos passando.

Regras mantidas do mock atual: os três papéis (`admin`, `terapeuta`,
`paciente`) e a ideia de "para onde vai depois de logar" (`homePath`),
calculada a partir do papel.

## 4. Fase 1b em detalhe — o front ligado na API

- `src/context/AuthContext.jsx`: reescrito do zero. `login`, `register`,
  `logout`, `requestPasswordReset`, `verifyResetCode` e `resetPassword`
  agora são `async` (chamam a API de verdade com `fetch(..., {credentials:
  'include'})`). Ao carregar a página, faz `GET /api/auth/me` pra
  descobrir se o cookie de sessão ainda é válido — substitui o antigo "ler
  usuário salvo no localStorage".
- `src/components/RequireAuth.jsx`: ganhou um estado `isReady` — enquanto
  a checagem inicial de sessão não termina, mostra "Carregando…" em vez de
  decidir redirecionar. Sem isso, um F5 numa página protegida piscaria
  para o login antes da sessão real (via cookie) ser confirmada.
- `src/pages/Login.jsx`, `ForgotPassword.jsx`, `VerifyResetCode.jsx`,
  `ResetPassword.jsx`: os `handleSubmit` viraram `async`/`await` (antes
  chamavam funções mockadas e síncronas).
- `src/pages/Register.jsx`: **ganhou campos que não existiam** — a tela
  original (vinda do Figma) só tinha nome + e-mail, porque não existia
  cadastro de verdade por trás. Agora tem senha, confirmação de senha e um
  seletor de papel (paciente/terapeuta/admin), porque sem isso não dá pra
  criar uma conta que depois funcione pra logar.
- `src/components/UserMenu.jsx`: `handleLogout` agora espera (`await`) o
  logout terminar antes de navegar.
- `server/src/db/seed.js` (`npm run db:seed`): cria as 3 contas de
  demonstração de sempre como usuários reais no banco, pra vitrine de
  "contas de demonstração" no Login continuar funcionando.

Testado de ponta a ponta no navegador (Playwright): rota protegida sem
sessão manda pro login; cadastro real cria a conta e já loga; sessão
sobrevive a um F5 (cookie); logout derruba a sessão e a rota protegida
volta a bloquear; fluxo completo de "esqueci minha senha" (pedir código →
confirmar → trocar senha → logar com a senha nova) funciona ponta a
ponta.

## 5. Fase 2 em detalhe — pacientes & perfis

Modelo de dados (`server/src/db/schema.js`, colunas novas adicionadas à
mesma tabela `users` via migration `server/drizzle/0001_nervous_sersi.sql`
— paciente e terapeuta continuam sendo o mesmo tipo de usuário, só com
campos diferentes preenchidos):

```js
export const users = pgTable('users', {
  // ...campos da Fase 1 (id, name, email, passwordHash, role, avatar)...
  birthDate: varchar('birth_date', { length: 20 }),        // "DD/MM/AAAA", texto livre
  note: text('note'),                                       // nota de acompanhamento (paciente)
  professionalId: varchar('professional_id', { length: 64 }), // ID de terapeuta
  responsibleTherapistId: uuid('responsible_therapist_id')
    .references(() => users.id, { onDelete: 'set null' }),   // paciente → terapeuta responsável
});
```

Endpoints novos:

- `GET /api/patients` — "Meus Pacientes": terapeuta só vê quem está
  vinculado a ele; admin vê todos os pacientes do sistema. Paciente não
  acessa (403).
- `GET /api/users/:id` — perfil de um usuário, com autorização: admin vê
  qualquer um; qualquer pessoa vê o próprio perfil; terapeuta vê seus
  pacientes; paciente vê o terapeuta responsável por ele.
- `PATCH /api/users/:id` — edita nome/e-mail/data de nascimento/nota, com
  a mesma regra que já existia só na tela (mock): paciente nunca edita
  (nem o próprio perfil); terapeuta edita o próprio perfil e seus
  pacientes; admin edita qualquer um. Recusa e-mail duplicado.
- `GET /api/users?role=paciente|terapeuta|admin` — admin-only, lista por
  papel (usado hoje só como fallback de "qual terapeuta mostrar" quando um
  admin abre `/psicologo`).

11 testes automatizados novos (`server/tests/users-patients.test.js`,
total agora **25 testes** em `/server`) cobrem toda a matriz de
autorização acima, incluindo o caso "paciente nunca pode editar, nem o
próprio perfil" e a rejeição de e-mail duplicado.

Front ligado na API real:

- `src/lib/api-client.js` (novo): o `apiFetch` que vivia dentro do
  `AuthContext.jsx` virou um módulo compartilhado, reaproveitado por todo
  código que fala com o backend.
- `src/hooks/usePatients.js` (novo): busca `GET /api/patients` — usado
  pelo `PatientSelector` (via `DashboardOpenModal`/`DashboardWorld`, na
  hora de gerar código de acesso) e pela lista "Meus Pacientes" do
  `ProfilePsicologo.jsx`. Não chama a API se quem está logado é paciente.
- `src/lib/age.js` (novo): calcula idade a partir do texto
  "DD/MM/AAAA" — substitui a idade que era hardcoded ("27 Anos") nas duas
  telas de perfil.
- `src/components/PatientSelector.jsx`: parou de importar
  `data/patients.js` — agora recebe `patients` por prop (vindo da API) e
  mostra um aviso quando a lista está vazia.
- `src/pages/Profile.jsx` e `ProfilePsicologo.jsx`: reescritas para buscar
  o usuário real (`GET /api/users/:id`) em vez do mock `getProfile`/
  `updateProfile`. Paciente vê o próprio perfil; terapeuta vê o próprio;
  admin (que ainda não tem uma tela de perfil dedicada) cai num fallback —
  o primeiro paciente/terapeuta cadastrado — já documentado como
  simplificação aceita, sem link direto ainda de "ver perfil de fulano".
  `Profile.jsx` também busca o terapeuta responsável de verdade pra seção
  "Meus Terapeutas"; `ProfilePsicologo.jsx` lista todos os pacientes reais
  do terapeuta em "Meus Pacientes" (antes era um único paciente
  hardcoded).
- `src/components/EditProfileModal.jsx`: `onSave` virou assíncrono e passa
  a devolver `{ success, error }` — o modal agora mostra "Salvando…" e uma
  mensagem de erro (ex.: e-mail duplicado) em vez de fechar sempre.
- `src/data/patients.js` e `src/data/profiles.js` foram removidos — nada
  mais os importa.

Testado com os 25 testes automatizados do backend + Playwright no
navegador cobrindo: seletor de paciente com dados reais (no modal e na
página do mundo), perfil do terapeuta com edição real (nome, ID, data de
nascimento) e lista de pacientes real, perfil do paciente com terapeuta
vinculado real e sem botão de editar, e os dois fallbacks de admin
(`/paciente` e `/psicologo`).

## 6. Fase 3 em detalhe — códigos de acesso

Modelo de dados (`server/src/db/schema.js`, tabela nova criada via
migration `server/drizzle/0002_optimal_scarlet_spider.sql`). Na época desta
fase, o mundo (`worldId`/`worldTitle`) ainda não era uma entidade de
verdade no banco — isso só chegou na Fase 4, que adicionou a FK — então
continuava guardado do mesmo jeito que o mock fazia; só o paciente e quem
gerou o código é que já eram usuários reais, com FK de verdade pra `users`:

```js
export const codeStatusEnum = pgEnum('code_status', ['pendente', 'utilizado', 'expirado']);

export const accessCodes = pgTable('access_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  worldId: varchar('world_id', { length: 64 }).notNull(), // Fase 4: virou FK, ver seção 7
  worldTitle: varchar('world_title', { length: 255 }).notNull(),
  patientId: uuid('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  generatedById: uuid('generated_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: codeStatusEnum('status').notNull().default('pendente'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

Um detalhe importante: `'expirado'` **nunca é gravado** no banco — é
calculado toda vez que um código é lido, comparando `expiresAt` com a hora
atual (`deriveStatus()` em `codes.controller.js`). Sem isso, um código
"pendente" que passou da validade continuaria aparecendo como pendente até
alguém escrever no banco de novo.

Endpoints novos (`server/src/routes/codes.routes.js`):

- `POST /api/codes` — gera um código pra um paciente + mundo (terapeuta só
  gera pros seus próprios pacientes; admin gera pra qualquer um). Expira em
  ~3h59m53s (a mesma janela que a contagem regressiva do
  `GenerateCodeModal.jsx` já mostrava, só que agora é o valor real gravado
  em `expiresAt`, não mais uma constante puramente visual).
- `GET /api/codes` — "Códigos de Acesso Gerados": terapeuta só vê os que
  ele mesmo gerou; admin vê todos.
- `POST /api/codes/validate` — simula o dispositivo VR lendo o código pra
  liberar o mundo: confere validade (não encontrado → 404, já utilizado →
  409, expirado → 410) e marca como utilizado (uso único). Qualquer pessoa
  autenticada pode chamar, já que o headset não necessariamente loga como
  um papel específico neste estágio do projeto.

13 testes automatizados novos (`server/tests/codes.test.js`, total agora
**38 testes** em `/server`) cobrem toda a matriz de autorização de
geração, o filtro de listagem por terapeuta/admin, e o fluxo completo de
validação — incluindo forçar `expiresAt` pro passado direto no banco pra
testar um código expirado sem precisar esperar ~4h de verdade.

Front ligado na API real:

- `src/components/GenerateCodeModal.jsx`: `handleConfirm` chama
  `POST /api/codes` (antes chamava `addCode()` do mock) e passou a receber
  `patientId` como prop em vez de `patientName` (que não era mais usado
  depois da troca). A contagem regressiva "Tempo Restante do Mundo" agora
  conta a partir do `expiresAt` real devolvido pela API, não mais de uma
  constante fixa. Erros da API (ex.: paciente não é mais seu) aparecem como
  mensagem no próprio modal em vez de falhar silenciosamente.
- `src/pages/AccessCodes.jsx`: busca `GET /api/codes` num `useEffect` em
  vez de ler o mock `getCodes()` — tem estado de carregamento, e a data
  "Gerado em" (que a API devolve como data ISO) é formatada no front.
- `src/data/codes.js` foi removido — nada mais o importa.
- `server/src/db/seed.js`: ganhou 3 códigos de exemplo (um de cada status),
  vinculados aos pacientes reais, pra `/codigos` não ficar vazia numa base
  recém-semeada.

Testado com os 38 testes automatizados do backend + Playwright no
navegador cobrindo: os 3 códigos semeados aparecendo com o status certo
(incluindo o "expirado" sendo calculado corretamente na leitura), a busca
por código/paciente/mundo, o fluxo completo de gerar um código de verdade
a partir do Dashboard (confirmação → API real → código exibido → aparece
em `/codigos`), e a confirmação de que paciente não vê o botão de gerar
código.

## 7. Fase 4 em detalhe — mundos / conteúdo

Modelo de dados (`server/src/db/schema.js`, tabela nova criada via migration
`server/drizzle/0003_eminent_bulldozer.sql`). Diferente de `access_codes` e
`users` (que usam `uuid`), `worlds.id` é um **slug legível** (`varchar(80)`,
ex.: `'ensino-fundamental'`) — decisão deliberada pra não precisar mudar a
rota `/dashboard/mundo/:worldId` que já existia no front, usando o mesmo id
como antes só que agora gerado a partir do título em vez de escrito à mão:

```js
export const worlds = pgTable('worlds', {
  id: varchar('id', { length: 80 }).primaryKey(), // slug, ex.: "ensino-fundamental"
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  thumbnail: text('thumbnail'),        // URL servida por este servidor (/uploads/worlds/...)
  gallery: text('gallery'),
  connectionId: varchar('connection_id', { length: 120 }),
  likes: integer('likes').notNull().default(0),
  views: integer('views').notNull().default(0),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

Uma segunda migration (`0004_acoustic_maestro.sql`) trocou
`access_codes.worldId` de texto solto pra uma FK de verdade pra `worlds`
(`ON DELETE RESTRICT` — não dá pra apagar um mundo que já tem código
gerado pra ele). Como já existiam códigos de demonstração no banco de
desenvolvimento referenciando `'home'`/`'ensino-fundamental'` como texto
livre, a migration só pôde ser aplicada com segurança depois de semear
esses dois mundos reais primeiro — ordem: criar a tabela `worlds` → rodar
`db:seed` (cria as linhas `home` e `ensino-fundamental`) → aplicar a
segunda migration com a FK. `worldTitle` continua existindo em
`access_codes`, agora como uma cópia proposital do título no momento da
geração (não só um espelho de `worlds.title`) — se alguém renomear um
mundo depois, os códigos já gerados continuam mostrando o título de quando
foram criados.

Geração do slug (`server/src/lib/slug.js`): normaliza acento/maiúscula/
espaço ("Praça de Alimentação" → `praca-de-alimentacao`); se o slug já
existir, tenta `-2`, `-3`, e assim por diante até achar um livre
(`generateUniqueSlug()` em `worlds.controller.js`).

Upload de imagem real (`server/src/middleware/upload.js`, `multer`):
salva em disco local (`server/uploads/worlds/<uuid>.<ext>`), servido pelo
próprio Express em `/uploads/worlds/...` — real de verdade (o arquivo é
salvo e servido, não é um mock), mas propositalmente simples: trocar por
um bucket de verdade (S3 etc.) é a Fase 7, e a troca fica contida nesse
arquivo + `fileUrl()` no controller, sem mexer no resto da API. Limite de
8MB por imagem, só aceita `image/*`. `UPLOAD_DIR` é configurável por
variável de ambiente pelo mesmo motivo do `DATABASE_URL` separado em
`vitest.config.js`: sem isso, rodar os testes escreveria arquivos de
verdade dentro da pasta de uploads de desenvolvimento (foi exatamente o
que aconteceu numa primeira versão, corrigido antes de fechar a fase).

Endpoints novos (`server/src/routes/worlds.routes.js`):

- `GET /api/worlds` — lista todos os mundos, mais recentes primeiro.
  Qualquer papel logado pode acessar.
- `GET /api/worlds/:id` — um mundo específico.
- `POST /api/worlds` — "Vincular Novo Mundo" (admin only). Recebe
  `multipart/form-data` com título (obrigatório), descrição e ID de
  conexão (opcionais) + até 2 imagens (`thumbnail`/`gallery`, ambas
  opcionais). Se só uma imagem for enviada, usa ela nos dois campos em vez
  de deixar a galeria sem imagem nenhuma.
- `PATCH /api/worlds/:id` — edita um mundo (admin only). Ainda sem botão
  na UI (não havia frame correspondente pronto no Figma pra "editar
  mundo"), mas a API já é real e testada.

Decisões de escopo, documentadas aqui pra não parecerem esquecimento: não
existe `DELETE /api/worlds` (nenhuma tela do Figma tem um botão pra isso,
e com `ON DELETE RESTRICT` apagar um mundo com códigos gerados quebraria a
regra de negócio de qualquer forma); e não existe um campo
`status`/rascunho/publicado (não havia UI pra controlar isso — a seção
"Rascunhos" do `/admin` continua sendo dados de exemplo locais, sem
relação com a tabela `worlds` real).

16 testes automatizados novos (`server/tests/worlds.test.js`, total agora
**54 testes** em `/server`) cobrem listagem, permissão de criação (só
admin), geração de slug a partir do título (incluindo colisão com sufixo
`-2`), upload real de imagem (com download de verificação do arquivo
servido), o caso de só uma imagem enviada, arquivo não-imagem rejeitado, e
edição. `codes.test.js` também ganhou um teste novo ("mundo inexistente ->
404") e seu fixture de mundo passou a usar uma linha real da tabela
`worlds` em vez de qualquer string solta.

Front ligado na API real:

- `src/hooks/useWorlds.js` (novo): busca `GET /api/worlds`, no mesmo
  padrão do `usePatients.js` — usado por `Dashboard.jsx`, `DashboardWorld.jsx`,
  `DashboardAdmin.jsx` e `SessionSummary.jsx`. Expõe um `refresh()` pra
  recarregar a lista sem precisar dar F5 (usado depois de criar um mundo
  novo).
- `src/lib/api-client.js`: `apiFetch` passou a detectar corpo `FormData` e,
  nesse caso, deixa de forçar `Content-Type: application/json` — sem isso o
  navegador não conseguia mandar o boundary do multipart certo, e o upload
  de imagem quebrava.
- `src/components/VincularMundoModal.jsx`: `handleSubmit` virou assíncrono
  de verdade — monta um `FormData` com os campos de texto + as até 2
  imagens escolhidas e chama `POST /api/worlds`; mostra "Vinculando…" e
  erro da API em vez de só fechar o modal sempre. Não adiciona mais um
  item na lista local de "Rascunhos" (isso era um placeholder de antes de
  existir API de verdade) — quem estava chamando o modal (`DashboardAdmin.jsx`)
  só dá um `refresh()` na lista de mundos depois de fechar, e o mundo novo
  aparece direto em "Mundos Recentes".
- `Dashboard.jsx`/`DashboardAdmin.jsx`: "Mundos Recentes" e "Mundos
  Populares" deixaram de ser duas listas fixas de ids duplicados (só
  existiam pra preencher a grade do mock) — agora são a mesma lista real de
  mundos, ordenada por data de criação e por visualizações, respectivamente.
- `DashboardWorld.jsx`: espera a lista de mundos carregar antes de decidir
  redirecionar pra `/dashboard` quando o id não existe (antes, com dado
  síncrono do mock, isso nunca foi um problema; com fetch assíncrono,
  redirecionar cedo demais mandaria embora um `worldId` válido que só
  ainda não tinha chegado).
- `src/data/worlds.js` foi removido — nada mais o importa.

Testado com os 54 testes automatizados do backend + Playwright no
navegador cobrindo: os 2 mundos semeados (`Home`, `Ensino Fundamental`)
aparecendo em `/dashboard` e `/admin`, o fluxo completo de "Vincular Novo
Mundo" com upload real de imagem (a imagem enviada aparece de verdade na
tela cheia do mundo, servida pelo próprio backend), o mundo novo surgindo
em "Mundos Recentes" sem precisar recarregar a página, navegação entre
mundos pelas setas do modal lateral, o resumo de sessão mostrando o título
certo do mundo novo, e a geração de um código de acesso de ponta a ponta
pro mundo recém-criado (confirmando que a FK `access_codes.worldId ->
worlds.id` funciona com um mundo criado na hora, não só com os
semeados).

## 8. Fase 5 em detalhe — sessões & analytics

Modelo de dados (`server/src/db/schema.js`, tabelas novas criadas via
migration `server/drizzle/0005_typical_the_fallen.sql`):

```js
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  accessCodeId: uuid('access_code_id').notNull().unique()
    .references(() => accessCodes.id, { onDelete: 'cascade' }),
  patientId: uuid('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  worldId: varchar('world_id', { length: 80 }).notNull().references(() => worlds.id, { onDelete: 'cascade' }),
  durationSeconds: integer('duration_seconds').notNull(),
  totalFixationSeconds: integer('total_fixation_seconds').notNull(),
  fixationCount: integer('fixation_count').notNull(),
  avgFixationSeconds: real('avg_fixation_seconds').notNull(),
  heatmapUrl: text('heatmap_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessionAreas = pgTable('session_areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  tag: varchar('tag', { length: 60 }).notNull(),
  timeSeconds: integer('time_seconds').notNull(),
});
```

`accessCodeId` é `unique()` de propósito: um código de acesso é de uso
único (regra já existente desde a Fase 3), então só pode existir **uma**
sessão por código — tentar registrar duas dá `409`. `avgFixationSeconds`
é calculado no servidor (`totalFixationSeconds / fixationCount`, com
proteção contra divisão por zero), nunca confiado ao cliente.

Endpoints novos (`server/src/routes/sessions.routes.js`,
`server/src/controllers/sessions.controller.js`):

- `POST /api/sessions` — simula o dispositivo VR reportando o relatório
  ao final da experiência: `{ code, durationSeconds, totalFixationSeconds,
  fixationCount, heatmapUrl?, areas[] }`. Confere que o código existe
  (`404`), que já foi validado/`utilizado` (`409` se ainda `pendente`), e
  que ainda não tem sessão registrada (`409` se já tiver). Qualquer pessoa
  autenticada pode chamar — mesmo critério do `POST /api/codes/validate`
  (o "óculos" não loga como um papel específico nesse estágio do
  projeto). `patientId`/`worldId` são copiados do próprio código, nunca
  aceitos do corpo da requisição.
- `GET /api/sessions/by-code/:code` — resumo de uma sessão específica.
  Usado por `/codigos` → "Ver resumo", que agora manda o código na URL.
- `GET /api/sessions/latest?worldId=...` — sessão mais recente daquele
  mundo, usada como *fallback* em `/resumo` quando a URL não tem um
  código específico (ex.: alguém navegando direto pro mundo, sem passar
  por `/codigos`).

Autorização (`isAuthorizedForPatient`, mesmo critério já usado em
pacientes/perfis desde a Fase 2): admin vê qualquer sessão; paciente só a
própria (`403` pra tentar ver a de outro); terapeuta só sessões de
pacientes vinculados a ele via `responsibleTherapistId` (`403` pra
paciente de outro terapeuta).

17 testes automatizados novos (`server/tests/sessions.test.js`, total
agora **71 testes** em `/server`) cobrem: sessão ativa exigida (`401`),
código inexistente (`404`), código ainda `pendente` (`409`), registro com
cálculo correto da média de fixação, duas sessões pro mesmo código
bloqueado (`409`), dados inválidos (`400`), leitura por código com toda a
matriz de autorização (dono, estranho, terapeuta vinculado, terapeuta não
vinculado, admin), e a busca por "mais recente" pra paciente e terapeuta.

Seed (`server/src/db/seed.js`): o código de demonstração `VTA-8K2N4Q`
(já `utilizado`) ganhou uma sessão de exemplo (`ensureSession`, mesmo
padrão idempotente do `ensureCode`) com 5 áreas mais observadas — é o que
faz `/resumo` mostrar dado real assim que o banco é semeado, sem precisar
gerar uma sessão nova primeiro.

Front ligado na API real:

- `src/pages/AccessCodes.jsx`: o link "Ver resumo" (só aparece pra
  código `utilizado`) agora manda o código na query string
  (`?code=VTA-XXXXXX`), pra `SessionSummary` saber exatamente qual sessão
  abrir — antes ia só pelo `worldId`, o que misturaria sessões de
  pacientes diferentes no mesmo mundo.
- `src/pages/SessionSummary.jsx`: parou de usar os arrays fixos
  `generalStats`/`topAreas`. Lê o `code` da query string; se tiver,
  busca `GET /api/sessions/by-code/:code`; senão, cai no *fallback*
  `GET /api/sessions/latest?worldId=`. Estados de carregamento e "sem
  sessão encontrada" tratados na tela. Duração, tempo de fixação total e
  tempo médio de fixação são formatados em `mm:ss` a partir dos segundos
  reais; "Áreas mais observadas" vem de `session.areas` (rank, nome, tag,
  tempo), não mais de 5 linhas idênticas de exemplo. O mapa de calor usa
  `session.heatmapUrl` quando existe (a API ainda não gera um de verdade
  — fica pra uma fase futura de telemetria visual) e cai pro placeholder
  antigo quando `null`, via `SafeImage` (mesmo padrão de fallback já
  usado nas outras telas).

Testado com os 71 testes automatizados do backend + Playwright no
navegador cobrindo o fluxo de ponta a ponta: login como terapeuta, gerar
um código de acesso novo pra "Ensino Fundamental" pela UI, confirmar que
ele aparece `pendente` em `/codigos`, simular o dispositivo VR validando
o código (`POST /api/codes/validate` → status vira `utilizado`) e
reportando a sessão (`POST /api/sessions` com telemetria de exemplo,
incluindo conferir que `avgFixationSeconds` bate com o cálculo
esperado), recarregar `/codigos` e confirmar que o botão "Ver resumo"
aparece com o código certo na URL, e por fim abrir `/resumo` e conferir
que a tela mostra exatamente os números e as áreas mandadas na
telemetria — não os de exemplo. Também confirmado que dois códigos
diferentes (o semeado `VTA-8K2N4Q` e o gerado no teste) abrem cada um a
sua própria sessão, sem misturar dados.

## 9. Banco de produção real (Neon)

Primeiro passo concreto da Fase 8 (Deploy): o schema completo (migrations
0000–0004) e os dados de demonstração já foram aplicados num banco
PostgreSQL real na nuvem, hospedado no [Neon](https://neon.tech) — banco
separado do `virteai_dev`/`virteai_test` locais.

Como isso foi feito: o sandbox onde o backend roda hoje não tem acesso de
rede ao Neon (bloqueio de política de egress do ambiente), então em vez de
rodar `drizzle-kit migrate` direto, as 5 migrations foram concatenadas com
os dados de seed (mesmas contas/pacientes/mundos/códigos do
`server/src/db/seed.js`, com as senhas já hasheadas em bcrypt) num único
`neon-setup.sql`, executado por um script Node standalone
(`run-neon-setup.mjs`, dependência única: `pg`) rodado no computador do
usuário — validado antes contra um banco Postgres local (dry run) pra
garantir que o SQL estava correto antes de rodar contra o banco de
verdade.

Pendências conhecidas, não bloqueantes pro banco em si:
- O acesso ao **painel** do Neon (console) ficou temporariamente bloqueado
  por um problema de 2FA/recovery codes da conta — isso não afeta a
  conexão com o banco (login do painel e credencial do Postgres são coisas
  separadas), só a visualização/gestão pelo site da Neon. Recuperação de
  conta free-tier é feita pelo Discord da Neon, não por ticket oficial.
- O backend (`server/`) ainda não foi apontado pra essa `DATABASE_URL` de
  produção — ele continua rodando contra o Postgres local em
  desenvolvimento. Apontar pra Neon de verdade faz sentido junto do deploy
  do backend em si (próximo passo abaixo), não antes.

## 10. Próximo passo

Com a Fase 5 pronta, pacientes, terapeutas, códigos de acesso, mundos e
agora sessões/telemetria são todos reais e ligados entre si no banco — o
`SessionSummary` não mostra mais nenhum número de exemplo fixo. Não sobrou
nenhuma tela principal do fluxo logado rodando em cima de dado mockado em
memória (`/admin` ainda tem "Rascunhos" e "Solicitações" de exemplo, fora
do escopo desta fase). O próximo passo é a **Fase 6 — Avaliações, aprovação
de terapeuta e notificações**: hoje `/admin` mostra "Solicitações" de
cadastro de terapeuta e o sino de notificações com dados de exemplo — a
Fase 6 troca isso por um fluxo real de aprovação/rejeição de terapeuta
(hoje qualquer cadastro com `role: 'terapeuta'` já entra ativo) e
notificações persistidas no banco.
