# Imagens ainda pendentes

A maior parte das imagens do projeto já foi trocada por arquivos locais de verdade (ver `src/assets/images/` e `server/assets/worlds/`) — não dependem mais de nenhum link do Figma.

Ficaram só 3 pendências, todas de baixa prioridade (a tela não quebra sem elas — `SafeImage` mostra um espaço neutro ou, no caso de avatar, o ícone de usuário genérico):

- **Ilustração da tela de login/cadastro** (`src/components/AuthShell.jsx`) — ainda aponta pro link antigo do Figma.
- **Banner "Mundo em destaque" do painel admin** (`src/pages/DashboardAdmin.jsx`) — por ora reaproveita o mesmo `dashboard-banner.png` do dashboard comum; se quiser uma arte diferente pra essa tela, precisa de um arquivo próprio.
- **Imagem de fallback do mapa de calor** (`src/pages/SessionSummary.jsx`) — só aparece se o heatmap real (gerado pela sessão) não carregar; a mais baixa prioridade de todas.

Pra resolver qualquer uma dessas, exporte do Figma (PNG 2x ou SVG) e mande aqui — reaproveito o mesmo processo já usado pras outras.
