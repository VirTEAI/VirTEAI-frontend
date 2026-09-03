# VirTEAI — Landing Pages

Início do site, gerado a partir do Figma (React + Vite + Tailwind CSS v4 + React Router).

## Páginas incluídas

Landing (pública):
- `/` — Home
- `/about-us` — About Us (Quem somos)
- `/services` — Services: vitrine das funcionalidades reais da plataforma
  (mundos de RV, acompanhamento com mapa de calor, testes AQ-10/AQ-50, código
  de acesso, portal das famílias, painel de terapeutas/instituições) + um
  "como funciona" em 3 passos e CTA de cadastro. Acessível pelo link
  "Services" do menu (antes era só um texto sem link).
- `/login` — Login
- `/register` — Cadastro (Pedido de Associado)
- `/esqueci-senha` — Passo 1/3 de "Esqueci minha senha" (informar o e-mail)
- `/verificar-codigo` — Passo 2/3 (confirmar o código enviado)
- `/redefinir-senha` — Passo 3/3 (definir a nova senha)

Área logada (veja "Papéis e permissões" abaixo pra saber quem acessa cada
rota):
- `/paciente` — Perfil do paciente (dados, terapeutas, testes). Paciente só
  visualiza; terapeuta e admin também podem editar.
- `/psicologo` — Perfil do terapeuta (dados, pacientes, relatórios, ficha).
  Só terapeuta (o próprio) e admin acessam.
- `/dashboard` — **Início-Logado**: tela principal pós-login, com banner de
  destaque, busca/filtro e as grades "Mundos Recentes" e "Mundos Populares".
  Acessível por paciente e terapeuta; o botão de gerar código só aparece
  para o terapeuta.
- `/dashboard/mundo/:worldId` — Tela em tela cheia de um mundo específico
  (galeria, curtidas/views, comentários). Paciente só visualiza; a seleção
  de paciente + "Gerar Código de Acesso" só aparecem para terapeuta/admin.
- `/dashboard/mundo/:worldId/resumo` — **Resumo da Sessão**: tela mostrada ao
  paciente ao terminar uma sessão dentro de uma experiência (mapa de calor do
  olhar, intensidade do foco, estatísticas gerais e áreas/objetos mais
  observados). Acessível pelo botão "Ver Resumo da Última Sessão" na tela do
  mundo.

Área do admin:
- `/admin` — **Dashboard-Admin**: rascunhos de mundos, busca, atalhos de
  "Configurações" (Vincular um novo Mundo / Novo Terapeuta) e as mesmas
  grades "Mundos Recentes"/"Mundos Populares". Protegida por login — só a
  conta `admin@virteai.com` (ver seção de login abaixo) consegue acessar;
  dados mockados, como pedido, para teste até haver backend.
  - Clicar em "Vincular um novo Mundo" abre o modal **Vincular Novo Mundo**
    (`src/components/VincularMundoModal.jsx`): 2 fotos, Nome do Mundo,
    Descrição, ID Conexão e botão de envio — que hoje só adiciona um card em
    "Rascunhos" localmente (sem backend ainda).
  - Clicar no sino no cabeçalho abre o painel de **Notificações**
    (`src/components/NotificationsModal.jsx`): lista de solicitações para
    virar terapeuta, com Negar/Confirmar (removem a solicitação da lista
    local por enquanto).
  - O atalho "Códigos Gerados" leva para `/codigos` (ver abaixo). A tela de
    lista de códigos em si não tinha um frame correspondente pronto no Figma,
    então foi criada mantendo a identidade visual do resto do site (cores,
    tipografia, componentes já existentes); já o fluxo de geração de código
    (o que acontece ao clicar em "Gerar Código de Acesso") **veio do Figma**
    — ver "Fluxo de gerar código" abaixo.

- `/codigos` — **Códigos de Acesso Gerados**: lista todos os códigos já
  gerados (código, mundo, paciente, data, status — Pendente / Utilizado /
  Expirado), com busca e botão de copiar código. Um código "Utilizado" linka
  direto para o Resumo da Sessão daquele mundo. Alimentada por
  `src/data/codes.js` (mock em memória).

### Fluxo do Dashboard

1. O usuário chega em `/dashboard` (Início-Logado) e vê os mundos em grade.
2. Ao clicar em um card de mundo, abre o **modal DashBoard-Open**
   (`src/components/DashboardOpenModal.jsx`) deslizando da direita, com a
   prévia do mundo, curtidas/views, paciente selecionado e o botão
   "Gerar Código de Acesso". É possível navegar entre mundos com as setas
   do modal, ou fechá-lo clicando fora, no X, ou com `Esc`.
3. Ao clicar no ícone de tela cheia dentro do modal, o app navega para
   `/dashboard/mundo/:worldId`, a página completa do mundo (a mesma criada
   anteriormente), reaproveitada como o destino "tela cheia".
4. Tanto no modal quanto na tela cheia, o card "Paciente Selecionado" agora é
   um seletor de verdade (`src/components/PatientSelector.jsx`) — clique
   para abrir a lista de pacientes mockados (`src/data/patients.js`) e
   escolher outro.
5. O botão "Gerar Código de Acesso" (nos dois lugares, só visível para
   terapeuta/admin) abre o fluxo de 3 passos descrito abaixo, que termina
   levando para `/codigos`, onde o novo código aparece no topo da lista.

Os dados de cada mundo (título, imagens, descrição, curtidas, views) ficam
centralizados em `src/data/worlds.js`, compartilhados entre os cards, o
modal e a página em tela cheia — adicionar um novo mundo é só adicionar uma
entrada nesse arquivo.

### Fluxo de gerar código (3 passos, vindo do Figma)

O botão "Gerar Código de Acesso" não gera o código na hora — ele abre
`src/components/GenerateCodeModal.jsx`, que segue os 3 estados que existem
no arquivo do Figma (frames "DashBoard-Modal" → "DashBoard-Loading" →
"DashBoard-Code", com conteúdo real que não tinha sido notado numa
investigação anterior neste projeto — encontrado de graça relendo o dump
local de metadata, sem gastar chamada de Figma):

1. **Confirmação** — "Deseja Iniciar a Experiência?", com uma checklist de
   segurança (VR ligado, local seguro, bateria do headset, aviso de
   desconforto/tontura) e um aviso de que um código será gerado. O botão
   "Gerar Código de Acesso" aqui dentro é que efetivamente dispara a
   geração; o X só fecha o fluxo sem gerar nada.
2. **Loading** — spinner centralizado por ~1,2s (não é possível fechar
   nesse meio-tempo).
3. **Código gerado** — mostra o código bem grande (mantive o formato
   `VTA-XXXXXX` já usado no resto do projeto, em vez do número puro do
   mockup do Figma, pra não quebrar a página `/codigos` que já depende
   desse formato), uma contagem regressiva de "Tempo Restante do Mundo"
   (só visual/cosmética por enquanto, começa em ~4h e desce de verdade a
   cada segundo enquanto o modal está aberto) e o botão **Ok**, que leva
   para `/codigos`.

Os ícones da checklist (VR, escudo, bateria, tontura) foram desenhados à
mão em SVG, seguindo o mesmo padrão já usado em outros ícones pequenos do
projeto (`NotificationsModal.jsx`, por exemplo) — evita depender de mais
URLs do CDN do Figma para elementos pequenos como esses.

## Login mockado, sessão e logout

O site tem um sistema de autenticação mockado (`src/context/AuthContext.jsx`),
sem backend — feito para demonstrar o fluxo completo de login, sessão e
proteção de rota enquanto não há uma API real.

**Contas de demonstração** (também aparecem como atalhos clicáveis na própria
tela de `/login`, que preenchem o formulário automaticamente):

| Papel     | E-mail                    | Senha           | Vai para     |
|-----------|----------------------------|------------------|---------------|
| Admin     | `admin@virteai.com`        | `admin123`       | `/admin`      |
| Terapeuta | `terapeuta@virteai.com`    | `terapeuta123`   | `/dashboard`  |
| Paciente  | `paciente@virteai.com`     | `paciente123`    | `/dashboard`  |

Como funciona:
- Ao logar, o usuário é salvo no `localStorage` (`virteai_session`) — a
  sessão **persiste entre recarregamentos e fechamentos de aba**, até o
  usuário clicar em "Sair".
- O avatar/nome no cabeçalho (`src/components/UserMenu.jsx`) agora reflete o
  usuário logado de verdade, com um menu suspenso contendo os dados da conta,
  um atalho **Ver perfil** (leva para `/paciente` ou `/psicologo`, conforme o
  papel) e o botão **Sair** (logout), que limpa a sessão e volta para
  `/login`.
- Rotas da área logada são protegidas por `src/components/RequireAuth.jsx`,
  que agora aceita um papel único ou uma lista de papéis permitidos. Sem
  sessão, o usuário é redirecionado para `/login`; com sessão mas papel não
  permitido (ex.: paciente tentando acessar `/admin`), ele é redirecionado
  para a própria home em vez de para o login.
- `Register.jsx` (Pedido de Associado) continua propositalmente sem lógica de
  envio — como pedido, o mock usa contas fixas, não cadastro livre.

### Esqueci minha senha (3 passos, vindo do Figma)

O link "Esqueci minha senha" em `/login` (antes um `<a href="#">` morto) agora
leva pro fluxo completo de redefinição, encontrado nos frames do Figma
"RedefinePassword", "CodeAuthentication" (existe duas vezes no arquivo — a
segunda ocorrência tem o grupo interno chamado "Redefinição") — tudo achado de
graça relendo o dump local de metadata já em cache, sem gastar chamada nova de
Figma.

1. **`/esqueci-senha`** (`src/pages/ForgotPassword.jsx`, frame
   "RedefinePassword") — título "Redefinir Senha", campo de e-mail e botão
   "Enviar Código". O texto original do Figma fala em enviar um "link", mas a
   tela seguinte do próprio Figma já fala em "código" — ajustei a cópia aqui
   pra "código" pra manter o fluxo coerente. Como não existe backend, o
   "e-mail" tem que bater com uma das contas mockadas; a mesma caixa
   pontilhada de "contas de demonstração" do login aparece aqui como atalho.
2. **`/verificar-codigo`** (`src/pages/VerifyResetCode.jsx`, frame
   "CodeAuthentication") — 5 caixas de dígito separadas por um traço no meio
   (layout real do Figma: 3 caixas + traço + 2 caixas, um código no formato
   `XXX-XX`), com o texto "Enviamos um código em seu email..." Como não há
   envio de e-mail de verdade, uma caixa pontilhada mostra o código gerado
   ("modo demonstração"), pra dar pra testar o fluxo inteiro sem sair do site.
3. **`/redefinir-senha`** (`src/pages/ResetPassword.jsx`, conteúdo do segundo
   frame "CodeAuthentication"/"Redefinição") — "Insira sua nova senha", campos
   Nova Senha / Confirme a Senha e o botão **Trocar Senha** (esse label já
   veio pronto do Figma). Valida tamanho mínimo e que as duas senhas batem,
   mostra uma confirmação animada e redireciona pro login (com um aviso de
   sucesso) depois de ~1,2s.

A troca de senha é real dentro do mock: `AuthContext.jsx` guarda o e-mail e o
código de 5 dígitos gerados em memória (`passwordReset`), confere o código no
passo 2 e, no passo 3, atualiza a senha da conta correspondente direto no
array `MOCK_USERS` — então dá pra logar de novo já com a senha nova (só não
sobrevive a um recarregamento da página, por ser em memória). As páginas 2 e 3
têm guarda de rota: acessar `/verificar-codigo` ou `/redefinir-senha` direto
pela URL, sem ter passado pelo passo anterior, redireciona de volta para
`/esqueci-senha`.

### Papéis e permissões

| Ação                                   | Paciente | Terapeuta | Admin |
|-----------------------------------------|:--------:|:---------:|:-----:|
| Ver mundos/mapas (`/dashboard`, tela cheia) | ✅ | ✅ | ✅ (via `/admin`) |
| Gerar código de acesso                  | ❌ | ✅ | ✅ |
| Vincular um novo mundo/mapa             | ❌ | ❌ | ✅ (única conta que pode) |
| Ver `/codigos` (códigos já gerados)     | ❌ | ✅ | ✅ |
| Ver o próprio perfil (`/paciente` ou `/psicologo`) | ✅ (sem editar) | ✅ | ✅ |
| Editar dados do próprio perfil          | ❌ | ✅ | ✅ |
| Editar dados do paciente (`/paciente`)  | ❌ | ✅ (só o(s) seu(s) paciente(s)) | ✅ (qualquer um) |

Rotas por papel: `/dashboard` → paciente e terapeuta · `/admin` → só admin ·
`/codigos` → terapeuta e admin · `/paciente` → paciente, terapeuta e admin ·
`/psicologo` → terapeuta e admin · `/dashboard/mundo/:worldId` e
`/dashboard/mundo/:worldId/resumo` → qualquer papel logado (a UI dentro dessas
telas é que muda conforme o papel — ver "Editar dados", abaixo).

Como só existe uma conta de cada papel no mock, "o(s) seu(s) paciente(s)" do
terapeuta hoje é sempre o único paciente cadastrado (`Martion Felinzes
Silva`) — em um sistema com múltiplos pacientes, isso viraria uma checagem
real de vínculo terapeuta↔paciente, não só o papel.

### Editar dados (temporário/mockado)

O botão "Editar dados", que antes não fazia nada em `/paciente` e
`/psicologo`, agora abre um modal (`src/components/EditProfileModal.jsx`)
para alterar Nome Completo, Data de Nascimento e Email. Os dados ficam em
`src/data/profiles.js` (mock em memória, reinicia ao recarregar a página —
por isso "temporário": é só pra demonstrar a interação, não persiste de
verdade ainda).

- O botão só aparece para quem tem permissão de editar aquele perfil (ver
  tabela acima) — para um paciente olhando o próprio perfil, o botão nem
  é renderizado, então não tem como ele mudar o próprio nome ou qualquer
  outro dado.

## Menu mobile

`Header.jsx` (público) e `AppHeader.jsx` (área logada) agora têm um menu
hambúrguer abaixo do breakpoint `md` (768px). Antes, a navegação inteira
(Home/Dashboard/About Us), o sino de notificações e o botão "Cadastra-se"
ficavam com `hidden md:flex`/`hidden md:block` e não tinha nenhum jeito de
alcançá-los no celular — o hambúrguer abre um painel vertical animado com os
mesmos links, mais os atalhos condicionais por papel (ver tabela de
permissões acima: Dashboard para paciente/terapeuta, Painel Admin para
admin, Códigos para terapeuta/admin).

## Correção: cor do texto do botão "Entrar" no header

O botão "Entrar" (público, header deslogado) tinha `text-white`, mas
aparecia com o texto preto. Causa raiz: no Tailwind v4, uma regra CSS fora
de qualquer `@layer` tem prioridade sobre TODAS as camadas do Tailwind
(inclusive `utilities`), não importa a especificidade — e `src/index.css`
tinha um reset global `a { color: inherit }` fora de layer, que sempre
vencia a classe `text-white` (o link "Entrar" é renderizado como `<a>` pelo
`NavLink`). A correção foi mover esse reset para dentro de `@layer base`
(junto com os outros resets do arquivo), o que faz a camada `utilities` do
Tailwind voltar a poder sobrescrever a cor normalmente — corrigido de forma
estrutural, não só nesse botão específico, prevenindo o mesmo problema em
qualquer outro link colorido que venha a ser adicionado.

## Animações

O site usa `framer-motion` para transições suaves em toda a navegação:

- Transição de página ao trocar de rota (fade + leve deslocamento vertical).
- Entrada em cascata (stagger) nas grades de mundos, cartões e listas.
- Modais e painéis (Vincular Mundo, Notificações, DashBoard-Open, menu do
  usuário, seletor de paciente) deslizam/aparecem com `AnimatePresence` e
  saem com uma animação de saída, em vez de sumir instantaneamente.
- Micro-interações: botões com leve escala ao passar o mouse/tocar, ícone de
  carregamento animado ao gerar um código de acesso, cartões de notificação
  encolhendo suavemente ao serem respondidos.
- As variantes de animação ficam centralizadas em `src/lib/motion.js` para
  manter o mesmo "sentimento" (durações, easing) em todo o site.

## Reformulação visual completa (design system)

O projeto passou por duas levas de refinamento visual. A primeira (ainda
citada em commits antigos) trouxe o "acabamento Apple" — tipografia,
espaçamento, sombras suaves, vidro fosco nos headers — para as páginas mais
usadas. A segunda leva, mais recente, é uma **reformulação completa**: pedido
explícito do cliente para adotar um "azul tecnológico" como cor PRIMÁRIA de
toda a interface (substituindo o antigo botão preto/verde), formalizar um
design system único e revisar **todas** as páginas do projeto — não só as
principais — para consistência visual de ponta a ponta, sem alterar rotas,
lógica, dados ou qualquer funcionalidade existente.

**Tokens** (`src/index.css`, bloco `@theme` do Tailwind v4) — viram
utilitários Tailwind de verdade (`bg-brand`, `text-ink`, etc.), usados em vez
de hex soltos em qualquer arquivo tocado nas duas levas:

| Token | Valor | Uso |
|---|---|---|
| `text-ink` / `bg-ink` | `#1d1d1f` | Texto principal (substitui `text-black` puro) |
| `text-ink-secondary` | `#6e6e73` | Texto de apoio, descrições |
| `text-ink-tertiary` | `#86868b` | Legendas, metadados |
| `border-hairline` / `border-hairline-soft` | `#d2d2d7` / `#e8e8ed` | Traços e divisórias |
| `bg-surface` | `#fbfbfd` | Fundo "levemente fora do branco" — inclusive o `<body>` inteiro agora, não só inputs |
| `bg-brand` / `text-brand` / `border-brand` / `ring-brand` | `#0973ba` | **Cor primária** — todo botão de ação, link ativo, item de nav ativo e anel de foco do site inteiro |
| `bg-brand-deep` / `text-brand-deep` | `#075a92` | Hover/ênfase da cor primária |
| `bg-brand-soft` | `#eaf4fb` | Tint clarinho pra fundo de chip/ícone/badge informativo |
| `text-accent-cyan` | `#22b8c9` | Detalhe pontual — nunca uma área grande |
| `bg-success-soft` / `text-success` | `#e6f7f0` / `#16794f` | Estado de sucesso (badge "Utilizado", teste concluído) |
| `bg-warning-soft` / `text-warning` | `#fef3c7` / `#92400e` | Estado de alerta (badge "Pendente") |
| `bg-danger-soft` / `text-danger` | `#fee2e2` / `#b42318` | Estado de erro/perigo (badge "Expirado", "Negar", "Sair") |
| `shadow-soft` / `shadow-elevated` / `shadow-button` | — | Sombras grandes e difusas em vez de bordas duras |
| `.vt-glass-nav` | — | Vidro fosco (`backdrop-filter: saturate(180%) blur(20px)`) nos headers fixos |

O azul (`brand`) substituiu o preto (`ink`) como cor de botão primário em
**todo** o fluxo de autenticação (Login/Cadastro/Esqueci senha/Verificar
código/Redefinir senha) e o verde `#67a379` como cor de ação principal no
fluxo de mundos (Gerar Código de Acesso, Salvar perfil, Vincular Mundo) — o
verde ficou só como um detalhe pontual já existente ("Desenvolvido por
VirTEAI ✓"), não mais como botão de ação. O painel diagonal
vermelho/laranja/azul decorativo do login é arte de marca existente e não foi
tocado.

**Páginas revisadas nesta leva** (além das já cobertas na leva anterior —
Home, About Us, fluxo de auth, Dashboard, cabeçalhos/rodapé/cards/modais de
mundo): `DashboardAdmin.jsx` (os três botões circulares de "Configurações"
viraram cards de ação modernos — ícone, título, descrição e indicador, com
hover), `Profile.jsx`/`ProfilePsicologo.jsx` (cards tokenizados, barra de
progresso dos testes agora usa cor semântica de verdade — verde quando
concluído, azul quando em andamento), `EditProfileModal.jsx`,
`VincularMundoModal.jsx`, `NotificationsModal.jsx`, `AccessCodes.jsx` (badges
de status viraram o padrão semântico acima) e `SessionSummary.jsx`. A escala
de cor do mapa de calor (`Intensidade do Foco`) foi mantida intocada por ser
uma visualização de dados literal, não um acento de UI.

**Home** ganhou dois CTAs abaixo do subtítulo do hero (o texto do hero em si
não mudou): "Conheça a VirTEAI" (primário, leva para `/about-us`) e "Saiba
como funciona" (secundário, rola suavemente até a seção "Mundos Únicos").
**Dashboard** ganhou uma saudação com o nome real da pessoa logada e uma
frase de contexto por papel (paciente/terapeuta/admin) — sem métricas
inventadas.

**Movimento** (`src/lib/motion.js`) — mesmos helpers de física de mola
(`buttonTap`/`buttonHover`/`cardLift`) reaproveitados; nenhuma biblioteca de
animação nova foi adicionada nesta leva.

**Tipografia e formas** — segue o padrão já estabelecido: `font-semibold` +
`tracking-tight` em títulos, cantos maiores e consistentes (`rounded-xl` em
inputs/botões internos, `rounded-2xl`/`3xl` em cards/banners/modais,
`rounded-full` em pílulas de marketing/badges), anel de foco visível
(`focus:ring-2 focus:ring-brand`) em todo elemento interativo — incluindo
vários que não tinham nenhum estado de foco antes.

### Logo e cabeçalho

A logo do cabeçalho (`Header.jsx`/`AppHeader.jsx`) foi aumentada em duas
levas — hoje está em `84×198px` (era `52×122px` originalmente), com a barra
do cabeçalho também aumentada para `96px` de altura para acomodá-la com
folga. Qualquer elemento que dependia da altura antiga do cabeçalho foi
atualizado junto — por exemplo, o painel lateral de `DashboardOpenModal.jsx`
usa `top-[96px]` para começar exatamente onde o cabeçalho termina.

### About Us: de volta ao layout original (fiel ao Figma), com mais vida

A tela `/about-us` recebeu uma segunda passada de design (manchas coloridas,
seção "O que nos guia", círculos de time coloridos, anéis girando) que
acabou fugindo do que havia sido desenhado originalmente no Figma. A pedido,
a página voltou pra estrutura original — hero, Nossa Missão, Nosso Time e
Instituições Parceiras, sem seções ou formas novas — mas manteve (e reforçou)
as animações, que continuam sendo o toque de "vida" da página:

- A logo principal do hero (`imgLogoMark`) ficou ainda maior:
  `110px` → `150px` de altura (`170px` em telas médias+).
- O foguete de "Nossa Missão" ganhou uma flutuação contínua suave (sobe,
  desce e balança levemente) no lugar dos anéis pontilhados que giravam ao
  redor dele.
- A onda decorativa continua fora do antigo `<div className="py-10
  md:py-14">` (removido antes, a pedido) — hoje é uma `<section>` enxuta,
  sem o fundo em gradiente que havia sido adicionado, com a própria onda
  flutuando suavemente.
- Os círculos do "Nosso Time" voltaram a ser lisos (sem ícone, sem cores por
  item), com uma leve animação de entrada em cascata e um pequeno aumento ao
  passar o mouse.
- As seções "O que nos guia", as manchas coloridas atrás do hero/rodapé de
  parceiros e o brilho pulsante atrás da logo parceira foram removidos —
  eram conteúdo/formas que eu tinha adicionado e que não faziam parte do
  design original.

### Header consistente para quem está logado

Antes, ao visitar Home, About Us ou Services já logado, o cabeçalho "voltava"
para a versão simplificada de visitante (só Home/About Us/Services + um
link avulso "Ir para Dashboard"). Agora o `Header.jsx` usado nessas páginas
públicas aplica a mesma regra de papéis do `AppHeader.jsx`: uma pessoa
logada vê Home, Dashboard (paciente/terapeuta), Painel Admin (admin),
Códigos (terapeuta/admin), About Us e Services sempre no menu, em qualquer
uma dessas páginas — tanto no menu desktop quanto no mobile.

### Mais respiro no mundo em tela cheia

Na tela de um mundo aberto em tela cheia (`/dashboard/mundo/:worldId`, via o
botão de tela cheia no modal do Dashboard), o conteúdo da página encostava
direto no rodapé. Foi adicionado espaçamento inferior (`pb-20`, `pb-28` em
telas médias+) entre o final do conteúdo e o `Footer`.

## Rodando localmente

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## ⚠️ Importante: imagens temporárias

As imagens e ícones ainda apontam para o CDN do Figma
(`https://www.figma.com/api/mcp/asset/...`). Esses links funcionam agora, mas
**expiram em cerca de 7 dias** — depois disso as imagens somem do site.

Antes de publicar em produção, baixe essas imagens (exportando manualmente do
Figma: clique na imagem → Export → PNG/SVG) e troque as URLs pelos arquivos
locais em `src/assets/`. Isso inclui o ícone da aba (favicon): `index.html`
aponta pro mesmo PNG da logo usada no cabeçalho — troque por um arquivo local
(ex.: `public/favicon.png`) e ajuste a tag `<link rel="icon">`. Os pontos que
usam essas URLs estão em:

- `index.html` (favicon)
- `src/components/Header.jsx`, `AppHeader.jsx`, `Footer.jsx`, `AuthShell.jsx`
- `src/pages/Home.jsx`, `AboutUs.jsx`, `Login.jsx`, `Register.jsx`
- `src/pages/Profile.jsx`, `ProfilePsicologo.jsx`, `Dashboard.jsx`, `DashboardWorld.jsx`,
  `SessionSummary.jsx`, `DashboardAdmin.jsx`
- `src/components/WorldCard.jsx`, `DashboardOpenModal.jsx`, `VincularMundoModal.jsx`,
  `PatientSelector.jsx`
- `src/data/worlds.js`, `src/data/patients.js`

Todo componente com foto/avatar já usa `src/components/SafeImage.jsx`, que
corta a imagem quebrada num quadrado/círculo cinza em vez de deixar o texto
alternativo (alt) estourar o layout — então quando o link expirar, o site
continua com o layout intacto até você trocar pelas imagens locais.

## Próximos passos sugeridos

- Trocar as imagens do Figma por arquivos locais (ver aviso acima).
- Conectar Login/Register/Perfis/Dashboard a um backend real — hoje o login
  usa contas fixas mockadas em `src/context/AuthContext.jsx` (ver seção
  "Login mockado, sessão e logout" acima), sem senha criptografada nem API.
- Trocar `src/data/profiles.js` (mock de "Editar dados") por uma API real —
  hoje as edições não persistem entre recarregamentos da página.
- Implementar de fato o cadastro em `Register.jsx` (hoje só visual).
- Com múltiplos pacientes/terapeutas reais, trocar a checagem de permissão
  "é terapeuta" por uma checagem de vínculo de verdade (esse terapeuta
  atende esse paciente específico?) — hoje isso é implícito porque só existe
  um paciente e um terapeuta no mock.
- Revisar as ilustrações decorativas simplificadas (algumas formas soltas do
  Figma foram simplificadas para manter o código limpo).
- A galeria de imagens do `/dashboard/mundo/:worldId` repete a mesma imagem
  5x (é o que o Figma tinha) — trocar por fotos reais de cada ambiente do
  mundo virtual.
- Substituir os dados fixos de "Paciente Selecionado" e comentários (em
  `DashboardOpenModal.jsx` e `DashboardWorld.jsx`) por dados reais vindos de
  um backend.
- Em `SessionSummary.jsx` (Resumo da Sessão), as estatísticas gerais e as
  "Áreas mais observadas" são dados de exemplo — em produção viriam do
  relatório que o cliente VR gera ao final da sessão (junto com a imagem real
  do mapa de calor do olhar).
- `/admin` usa dados mockados (rascunhos, mundos, solicitações de
  terapeuta) — a rota já é restrita à conta admin (ver seção de login
  acima); falta conectar a uma API real.
- O botão "Novo Terapeuta" em `/admin` ainda não abre nada — não havia um
  frame correspondente pronto no Figma; só o ícone/label foram implementados.
- O envio do formulário "Vincular Novo Mundo" e as decisões de
  Negar/Confirmar em Notificações só atualizam estado local (React) — não
  persistem nem chamam uma API ainda.
- `src/data/codes.js` e `src/data/patients.js` são mocks em memória (os
  códigos gerados somem ao recarregar a página) — trocar por chamadas reais
  de API quando o backend existir. A tela `/codigos` não tinha um frame
  correspondente pronto no Figma, então foi desenhada do zero nesta sessão,
  reaproveitando os componentes, cores e espaçamentos já usados no resto do
  site (o fluxo de geração de código em si, esse sim, veio do Figma — ver
  "Fluxo de gerar código" acima).
