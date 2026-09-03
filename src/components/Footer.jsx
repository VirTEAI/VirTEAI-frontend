const imgLogo =
  'https://www.figma.com/api/mcp/asset/5b06928c-fe00-4658-a0e0-4f6050128a7f.png';
const imgWaveLeft =
  'https://www.figma.com/api/mcp/asset/7d55701f-e1c0-489b-94a6-93469c4cf5f6.svg';
const imgWaveRight =
  'https://www.figma.com/api/mcp/asset/6a0c3239-4e95-4381-b9e3-ea5a65a17f46.svg';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-hairline-soft bg-surface px-6 pb-10 pt-16 md:px-20">
      <div
        className="pointer-events-none absolute -left-16 top-0 h-full w-[260px] rotate-[99deg] opacity-60"
        aria-hidden="true"
      >
        <img src={imgWaveLeft} alt="" className="h-full w-full object-contain" />
      </div>
      <div
        className="pointer-events-none absolute -right-10 bottom-0 h-[220px] w-[420px] rotate-[16deg] opacity-60"
        aria-hidden="true"
      >
        <img src={imgWaveRight} alt="" className="h-full w-full object-contain" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1270px] flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-[350px]">
          <div className="mb-4 h-[46px] w-[110px]">
            <img src={imgLogo} alt="VirTEAI" className="h-full w-full object-contain" />
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
