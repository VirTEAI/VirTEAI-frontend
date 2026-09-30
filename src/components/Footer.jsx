import SafeImage from './SafeImage';
import { WaveDivider } from './icons';

// Logo real ainda pendente de exportação no Figma — SafeImage evita que o
// link quebrado estoure o layout enquanto isso.
const imgLogo =
  'https://www.figma.com/api/mcp/asset/5b06928c-fe00-4658-a0e0-4f6050128a7f.png';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-hairline-soft bg-surface px-6 pb-10 pt-16 md:px-20">
      <WaveDivider
        className="pointer-events-none absolute -left-16 top-0 h-[6px] w-[260px] rotate-[99deg] opacity-60"
      />
      <WaveDivider
        className="pointer-events-none absolute -right-10 bottom-0 h-[6px] w-[420px] rotate-[16deg] opacity-60"
      />

      <div className="relative z-10 mx-auto flex max-w-[1270px] flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-[350px]">
          <div className="mb-4 h-[46px] w-[110px]">
            <SafeImage src={imgLogo} alt="VirTEAI" className="h-full w-full" />
          </div>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            Tecnologia de realidade virtual acolhedora para o desenvolvimento de habilidades
            sociais e acompanhamento terapêutico no espectro autista.
          </p>
        </div>

        <nav className="flex gap-8 text-[15px] text-ink-secondary">
          <a href="/login" className="transition-colors duration-200 hover:text-ink">
            Entrar
          </a>
          <a href="#termos" className="transition-colors duration-200 hover:text-ink">
            Termos
          </a>
          <a href="#privacidade" className="transition-colors duration-200 hover:text-ink">
            Privacidade
          </a>
        </nav>
      </div>

      <div className="relative z-10 mx-auto mt-10 max-w-[1270px] border-t border-hairline-soft pt-6">
        <p className="text-[13px] text-ink-tertiary">© 2026 VirTEAI. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
