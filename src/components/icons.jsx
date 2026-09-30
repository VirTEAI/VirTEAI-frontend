// Ícones simples redesenhados como SVG embutido, substituindo imagens que
// vinham de `https://www.figma.com/api/mcp/asset/...` — essas URLs nunca
// foram links públicos de verdade: são geradas por um servidor MCP do
// Figma que só existe enquanto uma sessão local de geração de código está
// rodando, então nunca carregaram em produção (nem em lugar nenhum fora
// daquele processo original). SVG embutido resolve de vez: sem link
// nenhum pra quebrar, nítido em qualquer tamanho, e já herda a cor do
// texto ao redor via `currentColor` (então `text-ink-secondary`,
// `opacity-70` etc. continuam funcionando normalmente em cima do ícone).
//
// Estilo consistente com os ícones que já existiam embutidos em
// GenerateCodeModal.jsx: viewBox 24x24, traço (stroke) sem preenchimento.

export function SearchIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 10a6 6 0 1 1 12 0c0 3.2 1 4.8 1.6 5.6.3.4 0 1-.5 1H4.9c-.5 0-.8-.6-.5-1C5 14.8 6 13.2 6 10Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-9.8-9.4C.7 7.7 2.3 4 6 3.4c2.1-.3 4 .7 6 3 2-2.3 3.9-3.3 6-3 3.7.6 5.3 4.3 3.8 7.7-2.3 4.8-9.8 9.4-9.8 9.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThumbsUpIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 11v9H4.5A1.5 1.5 0 0 1 3 18.5v-6A1.5 1.5 0 0 1 4.5 11H7Zm0 0 3.6-7.2c.3-.6 1-.9 1.6-.6.9.4 1.5 1.3 1.5 2.3V9h4.2c1 0 1.8.9 1.6 1.9l-1.3 7A2 2 0 0 1 16.2 20H10a3 3 0 0 1-3-3v-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EyeIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function EyeOffIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 3l18 18M9.9 5.1A10.6 10.6 0 0 1 12 5c6 0 9.5 6.5 9.5 6.5a15 15 0 0 1-3.2 3.9M6.6 6.6C4 8.3 2.5 11.5 2.5 11.5s3.5 6.5 9.5 6.5c1.4 0 2.6-.3 3.7-.8M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VerifiedIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2.5l2.3 1.3 2.6-.3 1.1 2.4 2.4 1.1-.3 2.6 1.3 2.3-1.3 2.3.3 2.6-2.4 1.1-1.1 2.4-2.6-.3L12 21.5l-2.3-1.3-2.6.3-1.1-2.4-2.4-1.1.3-2.6L2.5 12l1.3-2.3-.3-2.6 2.4-1.1 1.1-2.4 2.6.3L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8.5 12.3l2.3 2.2 4.2-4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FullscreenIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 4H5a1 1 0 0 0-1 1v4M15 4h4a1 1 0 0 1 1 1v4M9 20H5a1 1 0 0 1-1-1v-4M15 20h4a1 1 0 0 0 1-1v-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LetterIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 6.5 12 13l8.5-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="15.3" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function LinkIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9.5 14.5 14.5 9.5M8 6.5l1.2-1.2a3.5 3.5 0 0 1 5 5L13 11.5M16 17.5l-1.2 1.2a3.5 3.5 0 0 1-5-5L11 12.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 20c1.3-4 4.2-6 7.5-6s6.2 2 7.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckCrossIcon({ done = true, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
      {done ? (
        <path d="M7.5 12.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function ArchiveIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h12A1.5 1.5 0 0 0 19.5 18V8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 12.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CommentIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.5 4V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ImagePlaceholderIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.5" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 17l5.5-5 3.5 3.5 2.5-2.5L20 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AreaPinIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function FootprintsIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <ellipse cx="8" cy="7" rx="2.3" ry="3.2" stroke="currentColor" strokeWidth="1.4" transform="rotate(-12 8 7)" />
      <ellipse cx="16" cy="15" rx="2.3" ry="3.2" stroke="currentColor" strokeWidth="1.4" transform="rotate(12 16 15)" />
      <circle cx="5.5" cy="12" r="0.9" fill="currentColor" />
      <circle cx="18.5" cy="20" r="0.9" fill="currentColor" />
    </svg>
  );
}

// Onda decorativa usada como divisor de seção (Footer, AboutUs). É puramente
// visual — sem texto, sem significado — então vira um gradiente simples em
// vez de tentar reproduzir o traçado exato do Figma.
export function WaveDivider({ className = '' }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        background: 'linear-gradient(90deg, rgba(99,179,138,0.12), rgba(99,179,138,0.35), rgba(99,179,138,0.12))',
        borderRadius: '999px',
      }}
    />
  );
}
