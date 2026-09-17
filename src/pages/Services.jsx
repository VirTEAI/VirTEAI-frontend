import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  fadeInUp,
  fadeIn,
  staggerContainer,
  staggerItem,
  easeOut,
  buttonTap,
  buttonHover,
  cardLift,
} from '../lib/motion';

// Ícones simples em SVG, no mesmo espírito dos usados em GenerateCodeModal —
// sem depender de mais uma biblioteca de ícones só para esta página nova.
function VRHeadsetIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="8" width="20" height="10" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.5" cy="13" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="15.5" cy="13" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 10V8a2 2 0 0 1 2-2h1M20 10V8a2 2 0 0 0-2-2h-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 20h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClipboardIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 11l2.2 2.2L16 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldKeyIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="10.6" cy="11.2" r="1.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M11.8 12.4 15 15.6M13.6 14.2l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function FamilyIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="8" r="1.9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 20c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.4 20c.2-2.4 1.6-4.2 4-4.4 2.1-.1 3.6 1.3 4.1 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 5.2a3 3 0 0 1 0 5.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18.5 20c0-2.6-1.2-4.7-3-5.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const TINTS = {
  blue: 'bg-brand-soft text-brand-deep',
  green: 'bg-success-soft text-success',
  orange: 'bg-[#f79420]/12 text-[#c2660a]',
  red: 'bg-[#c02329]/10 text-[#c02329]',
};

// Cada serviço abaixo corresponde a uma funcionalidade real já implementada
// no produto (mundos de RV, resumo de sessão com mapa de calor, testes
// AQ-10/AQ-50, geração de código de acesso, etc.) — nada aqui é inventado,
// é só a vitrine do que a plataforma já faz.
const SERVICES = [
  {
    icon: VRHeadsetIcon,
    tint: 'blue',
    title: 'Mundos em Realidade Virtual',
    description:
      'Ambientes controlados e sensorialmente adaptados — da sala de aula ao mercado — pra praticar habilidades sociais na prática, no ritmo de cada pessoa.',
  },
  {
    icon: ChartIcon,
    tint: 'green',
    title: 'Acompanhamento Terapêutico',
    description:
      'Cada sessão gera um resumo com mapa de calor do olhar, tempo de fixação e áreas mais observadas — progresso visto com dados, não só impressão.',
  },
  {
    icon: ClipboardIcon,
    tint: 'orange',
    title: 'Avaliação e Testes',
    description:
      'Testes como AQ-10 e AQ-50 acompanham a evolução de cada paciente ao longo do tempo, direto no perfil dele.',
  },
  {
    icon: ShieldKeyIcon,
    tint: 'red',
    title: 'Acesso Seguro por Código',
    description:
      'O terapeuta gera um código único que conecta o paciente certo ao mundo certo — sem exposição de dados, sem complicação na hora de colocar o headset.',
  },
  {
    icon: FamilyIcon,
    tint: 'blue',
    title: 'Portal para Famílias',
    description:
      'Atualizações simples e sem jargões pra família acompanhar cada conquista com clareza, entre uma sessão e outra.',
  },
  {
    icon: UsersIcon,
    tint: 'green',
    title: 'Painel para Terapeutas e Instituições',
    description:
      'Gestão de pacientes, vínculo de novos mundos e cadastro de terapeutas — um painel pensado pra quem cuida de várias pessoas ao mesmo tempo.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'O terapeuta gera o código',
    description: 'Escolhe o mundo, seleciona o paciente e gera um código de acesso único pra sessão.',
  },
  {
    number: '02',
    title: 'O paciente entra no mundo',
    description: 'Com o headset de RV, usa o código pra conectar direto no ambiente virtual escolhido.',
  },
  {
    number: '03',
    title: 'O progresso vira resumo',
    description: 'Ao final, a sessão vira um resumo com mapa de calor e estatísticas — pronto pra acompanhar.',
  },
];

export default function Services() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-hairline-soft px-6 pb-20 pt-24 md:pb-28 md:pt-32">
          <motion.div
            aria-hidden="true"
            animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute -left-24 top-10 h-[360px] w-[360px] rounded-full bg-brand/10 blur-3xl"
          />
          <motion.div
            aria-hidden="true"
            animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="pointer-events-none absolute -right-20 top-32 h-[300px] w-[300px] rounded-full bg-[#f79420]/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-[820px] text-center">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="mb-6 inline-flex items-center rounded-full bg-brand-soft px-4 py-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-brand-deep"
            >
              Nossos Serviços
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: easeOut }}
              className="text-[clamp(30px,4.6vw,48px)] font-semibold leading-[1.12] tracking-tight text-ink"
              style={{ textWrap: 'balance' }}
            >
              Tecnologia pensada para cada etapa da jornada terapêutica
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: easeOut }}
              className="mx-auto mt-6 max-w-[620px] text-[18px] leading-relaxed text-ink-secondary"
            >
              Da experiência em realidade virtual ao acompanhamento com dados reais, cada peça da
              VirTEAI existe pra tornar a terapia mais acessível — pro paciente, pro terapeuta e
              pra família.
            </motion.p>
          </div>
        </section>

        {/* Grade de serviços */}
        <section className="border-b border-hairline-soft px-6 py-24 md:py-28">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SERVICES.map(({ icon: Icon, tint, title, description }) => (
              <motion.div key={title} variants={staggerItem} className="rounded-2xl">
                <motion.div
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                  variants={cardLift}
                  className="flex h-full flex-col rounded-2xl border border-hairline-soft bg-white p-7"
                >
                  <span className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${TINTS[tint]}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mb-2 text-[18px] font-semibold tracking-tight text-ink">{title}</h3>
                  <p className="text-[14.5px] leading-relaxed text-ink-secondary">{description}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Como funciona */}
        <section className="relative overflow-hidden border-b border-hairline-soft bg-surface px-6 py-24 md:py-28">
          <div className="mx-auto max-w-[1000px]">
            <motion.h2
              variants={fadeInUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.6 }}
              className="mb-16 text-center text-[32px] font-semibold tracking-tight text-ink"
            >
              Como funciona
            </motion.h2>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8"
            >
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 top-6 hidden h-px bg-hairline md:block"
              />
              {STEPS.map((step) => (
                <motion.div key={step.number} variants={staggerItem} className="relative text-center">
                  <span className="relative z-10 mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-[15px] font-semibold text-white shadow-button">
                    {step.number}
                  </span>
                  <h3 className="mb-2 text-[17px] font-semibold tracking-tight text-ink">{step.title}</h3>
                  <p className="mx-auto max-w-[260px] text-[14.5px] leading-relaxed text-ink-secondary">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA final */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          className="px-6 py-24 text-center md:py-28"
        >
          <h2 className="mb-4 text-[28px] font-semibold tracking-tight text-ink">
            Pronto para experimentar?
          </h2>
          <p className="mx-auto mb-8 max-w-[520px] text-[16px] leading-relaxed text-ink-secondary">
            Crie sua conta e conheça de perto como a VirTEAI aproxima tecnologia e cuidado.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <motion.div whileTap={buttonTap} whileHover={buttonHover}>
              <Link
                to="/register"
                className="flex h-[49px] items-center justify-center rounded-full bg-brand px-8 text-[15px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep"
              >
                Cadastre-se
              </Link>
            </motion.div>
            <motion.div whileTap={buttonTap} whileHover={buttonHover}>
              <Link
                to="/login"
                className="flex h-[49px] items-center justify-center rounded-full border border-hairline px-8 text-[15px] font-medium text-ink transition-colors duration-200 hover:bg-surface"
              >
                Já tenho conta
              </Link>
            </motion.div>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
