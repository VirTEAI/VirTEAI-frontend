import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { WaveDivider } from '../components/icons';
import { fadeInUp, staggerContainer, staggerItem, easeOut } from '../lib/motion';

const imgLogoMark =
  'https://www.figma.com/api/mcp/asset/9e7e8585-604c-4caf-8234-5f4f50230817.png';
const imgRocket =
  'https://www.figma.com/api/mcp/asset/747f4d62-a3f1-4585-8760-3109a1b365e2.png';
const imgColabLogo =
  'https://www.figma.com/api/mcp/asset/c1c59a1d-66d3-4437-a550-2f74b8570e14.png';

const team = [1, 2, 3, 4, 5, 6];

export default function AboutUs() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Quem somos */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          className="border-b border-hairline-soft px-6 py-24 md:py-28"
        >
          <div className="mx-auto max-w-[900px] text-center">
            <motion.img
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: easeOut }}
              src={imgLogoMark}
              alt="VirTEAI"
              className="mx-auto mb-8 h-[150px] w-auto object-contain md:h-[170px]"
            />
            <h1 className="mb-8 text-[40px] font-semibold tracking-tight text-ink">Quem somos?</h1>
            <p className="text-[20px] leading-relaxed text-ink-secondary">
              A VirTEAI nasceu em 2025 com um propósito claro: tornar a tecnologia mais humana,
              sensível e acessível para pessoas com Transtorno do Espectro Autista (TEA). Nossa
              empresa surgiu da união entre estudantes apaixonados por inovação, inclusão e
              transformação social. Acreditamos que a tecnologia deve ser feita para todos —
              respeitando as diferentes formas de perceber, sentir e interagir com o mundo.
            </p>
          </div>
        </motion.section>

        {/* Nossa missão */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="border-b border-hairline-soft px-6 py-24 md:py-28"
        >
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 md:grid-cols-[1fr_260px] md:gap-16">
            <div>
              <h2 className="mb-8 text-[36px] font-semibold tracking-tight text-ink">Nossa Missão</h2>
              <p className="whitespace-pre-line text-[18px] leading-relaxed text-ink-secondary">
                Nosso principal objetivo é oferecer óculos de realidade virtual acessíveis,
                seguros e personalizados para pessoas com TEA, independentemente da idade ou do
                nível de suporte necessário. Identificamos uma lacuna no mercado: a maioria dos
                dispositivos tecnológicos não considera as particularidades sensoriais e
                cognitivas das pessoas neurodivergentes.
                {'\n\n'}A VirTEAI veio para mudar isso.
                {'\n\n'}Desenvolvemos produtos com design adaptado, funcionalidades pensadas para
                o conforto e a autonomia do usuário, e personalização que respeita as
                necessidades individuais de cada pessoa.
                {'\n\n'}O que nos diferencia é a escuta ativa, a empatia e o compromisso com a
                inclusão verdadeira. Não criamos uma solução genérica — criamos uma experiência
                personalizada. Nossos óculos são mais do que tecnologia: são ferramentas de
                conexão, aprendizagem e bem-estar.
              </p>
            </div>
            <div className="mx-auto hidden h-[260px] w-[260px] items-center justify-center md:flex">
              <motion.img
                src={imgRocket}
                alt=""
                aria-hidden="true"
                animate={{ y: [0, -14, 0], rotate: [-6, -2, -6] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="h-[210px] w-auto object-contain"
              />
            </div>
          </div>
        </motion.section>

        {/* Nosso time */}
        <section className="border-b border-hairline-soft px-6 py-24 text-center md:py-28">
          <h2 className="mb-5 text-[36px] font-semibold tracking-tight text-ink">Nosso Time</h2>
          <p className="mx-auto mb-14 max-w-[1000px] text-[18px] leading-relaxed text-ink-secondary">
            A força da VirTEAI está na colaboração. Nosso time multidisciplinar reúne talentos de
            diferentes áreas, comprometidos com a acessibilidade e a inovação social:
          </p>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            className="flex flex-wrap justify-center gap-8"
          >
            {team.map((member) => (
              <motion.div
                key={member}
                variants={staggerItem}
                whileHover={{ scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="h-[72px] w-[72px] rounded-full bg-brand-soft shadow-soft"
                aria-hidden="true"
              />
            ))}
          </motion.div>
        </section>

        {/* Divisor decorativo */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="px-6 py-14 md:py-16"
        >
          <motion.div
            aria-hidden="true"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <WaveDivider className="h-[6px] w-full" />
          </motion.div>
        </motion.section>

        {/* Instituições parceiras */}
        <section className="flex flex-col items-center gap-7 px-6 py-16 md:py-20">
          <p className="text-[15px] font-medium text-ink-tertiary">
            Instituições que confiam na VirTEAI
          </p>
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: easeOut }}
            src={imgColabLogo}
            alt="Instituição parceira"
            className="h-[86px] w-[91px] object-contain opacity-90"
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
