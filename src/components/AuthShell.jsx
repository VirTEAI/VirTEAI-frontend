import { NavLink } from 'react-router-dom';
// Mesma marca usada no topo da página Sobre Nós, só que um pouco menor
// aqui — cabe melhor acima do card de login/cadastro.
import imgLogo from '../assets/images/sobre-marca.png';

const tabClass = (isActiveTab) =>
  `flex h-[34px] flex-1 items-center justify-center rounded-full text-[14.5px] font-medium transition-all duration-200 ${
    isActiveTab ? 'bg-white text-brand shadow-soft' : 'text-ink-secondary hover:text-ink'
  }`;

export default function AuthShell({ mode, hideTabs = false, children }) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-surface">
      {/* Painel decorativo — mesmas cores da marca, em faixas diagonais */}
      <div className="relative hidden w-1/2 shrink-0 overflow-hidden bg-[#c02329] md:block">
        <div className="absolute inset-x-0 top-[28%] h-[36%] rounded-tr-[30px] bg-[#f79420]" />
        <div className="absolute inset-x-0 top-[59%] h-[34%] rounded-tr-[30px] bg-[#0973ba]" />
        <div className="absolute inset-x-0 top-[14%] h-[16%] bg-[#9e161c]" />
        <div className="absolute inset-x-0 top-[46%] h-[16%] bg-[#ec860d]" />
        <div className="absolute inset-x-0 top-[76%] h-[24%] bg-[#076baf]" />
      </div>

      {/* Coluna do formulário */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-16 md:w-1/2">
        <div className="w-full max-w-[508px]">
          <div className="mb-10 flex justify-center">
            <NavLink to="/" aria-label="Ir para a página inicial">
              <img src={imgLogo} alt="VirTEAI" className="h-[80px] w-auto object-contain" />
            </NavLink>
          </div>

          <div className="rounded-[28px] border border-hairline-soft bg-white p-8 shadow-soft sm:p-10">
            {!hideTabs && (
              <div className="mb-8 flex rounded-full border border-hairline-soft bg-surface p-1">
                <NavLink to="/login" className={() => tabClass(mode === 'login')}>
                  Entrar
                </NavLink>
                <NavLink to="/register" className={() => tabClass(mode === 'register')}>
                  Cadastrar-se
                </NavLink>
              </div>
            )}

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
