import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer, real } from 'drizzle-orm/pg-core';

// Os três papéis já usados no front (mock em AuthContext.jsx) — mantidos
// idênticos pra não precisar mudar nenhuma regra de permissão da UI.
export const roleEnum = pgEnum('role', ['admin', 'terapeuta', 'paciente']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  avatar: text('avatar'),

  // Campos da Fase 2 (Pacientes & Perfis) — todos opcionais porque só fazem
  // sentido pra um papel específico:
  //
  // - birthDate: fica como texto livre ("DD/MM/AAAA"), igual a tela de
  //   edição já pedia — não vale a pena virar um `date` de verdade agora
  //   (exigiria validar/converter formato) só pra um campo que hoje é só
  //   exibido, não usado em cálculo nenhum.
  // - note: observação do terapeuta sobre o paciente (era o campo "note" de
  //   patients.js) — só relevante pra quem é paciente.
  // - professionalId: o "ID de Terapeuta" mostrado no perfil do terapeuta
  //   (era o campo "therapistId" de profiles.js — renomeado aqui pra não
  //   confundir com o FK abaixo, que também se chamaria "therapistId").
  // - responsibleTherapistId: liga um paciente ao terapeuta responsável por
  //   ele (auto-relacionamento dentro da própria tabela `users`) — é o que
  //   faltava pra "Meus Pacientes"/"Paciente Selecionado" pararem de ser
  //   uma lista fixa e virarem uma relação de verdade no banco.
  birthDate: varchar('birth_date', { length: 20 }),
  note: text('note'),
  professionalId: varchar('professional_id', { length: 64 }),
  responsibleTherapistId: uuid('responsible_therapist_id').references(() => users.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Fase 4 (Mundos/Conteúdo) — `id` é um slug (ex.: "ensino-fundamental"),
// não um uuid, de propósito: é o mesmo texto já usado nas rotas do front
// (`/dashboard/mundo/:worldId`) desde antes de mundos virarem uma tabela de
// verdade, então manter o formato evita ter que mudar URL nenhuma.
// `thumbnail`/`gallery` são URLs — servidas por este mesmo servidor
// (`/uploads/worlds/...`, via multer) quando alguém sobe uma imagem de
// verdade pelo formulário "Vincular Novo Mundo"; os 2 mundos de
// demonstração continuam usando as URLs do Figma, como todo o resto do
// conteúdo semeado.
// "Rascunho" — mundo criado pelo admin mas ainda não pronto pra aparecer
// pra paciente/terapeuta. `listWorlds` só devolve rascunho pra quem é
// admin; todo mundo semeado (`db:seed`) e todo mundo publicado continua
// 'published', então isso não muda nada do que já existe.
export const worldStatusEnum = pgEnum('world_status', ['draft', 'published']);

export const worlds = pgTable('worlds', {
  id: varchar('id', { length: 80 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  thumbnail: text('thumbnail'),
  gallery: text('gallery'),
  connectionId: varchar('connection_id', { length: 120 }),
  status: worldStatusEnum('status').notNull().default('published'),
  likes: integer('likes').notNull().default(0),
  views: integer('views').notNull().default(0),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Fase 3 (Códigos de Acesso) — substitui o `codes.js` em memória.
// `worldTitle` fica guardado solto de propósito (não é só um espelho de
// `worlds.title`): é um retrato de como o mundo se chamava no momento em
// que o código foi gerado, útil mesmo se o título do mundo mudar depois.
// `worldId`, por outro lado, aponta de verdade pra tabela `worlds` (ver
// FK abaixo) desde a Fase 4.
export const codeStatusEnum = pgEnum('code_status', ['pendente', 'utilizado', 'expirado']);

export const accessCodes = pgTable('access_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  worldId: varchar('world_id', { length: 80 })
    .notNull()
    .references(() => worlds.id, { onDelete: 'restrict' }),
  worldTitle: varchar('world_title', { length: 255 }).notNull(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  generatedById: uuid('generated_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // "pendente"/"utilizado" são o estado de verdade, gravado no banco;
  // "expirado" nunca é gravado — é calculado na leitura comparando
  // `expiresAt` com a hora atual (ver `codes.controller.js`), senão um
  // código "pendente" que passou da validade continuaria aparecendo como
  // pendente até alguém escrever no banco de novo.
  status: codeStatusEnum('status').notNull().default('pendente'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Fase 5 (Sessões & Analytics) — o relatório que o "óculos VR" manda ao
// terminar uma experiência. `accessCodeId` é único: um código só pode ser
// usado uma vez (Fase 3), então só existe uma sessão por código, e é assim
// que a sessão sabe a que paciente/mundo/terapeuta ela pertence. `patientId`
// e `worldId` ficam denormalizados aqui (mesmo padrão do `worldTitle` em
// `accessCodes`) pra listar/consultar sessões sem precisar sempre voltar em
// `access_codes`.
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  accessCodeId: uuid('access_code_id')
    .notNull()
    .unique()
    .references(() => accessCodes.id, { onDelete: 'cascade' }),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  worldId: varchar('world_id', { length: 80 })
    .notNull()
    .references(() => worlds.id, { onDelete: 'cascade' }),
  durationSeconds: integer('duration_seconds').notNull(),
  totalFixationSeconds: integer('total_fixation_seconds').notNull(),
  fixationCount: integer('fixation_count').notNull(),
  avgFixationSeconds: real('avg_fixation_seconds').notNull(),
  heatmapUrl: text('heatmap_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// "Áreas mais observadas" — lista ordenada (rank 1º, 2º, 3º...) de objetos/
// pontos de interesse que o óculos identificou durante a sessão.
export const sessionAreas = pgTable('session_areas', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  tag: varchar('tag', { length: 60 }).notNull(),
  timeSeconds: integer('time_seconds').notNull(),
});

// Comentários na página de um mundo (DashboardWorld.jsx) — qualquer pessoa
// logada pode comentar; apagar é reservado a quem escreveu ou a um admin
// (moderação, pedida explicitamente pelo projeto).
export const worldComments = pgTable('world_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  worldId: varchar('world_id', { length: 80 })
    .notNull()
    .references(() => worlds.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
