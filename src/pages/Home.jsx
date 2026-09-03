import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { fadeInUp, fadeIn, staggerContainer, staggerItem, easeOut, buttonTap, buttonHover } from '../lib/motion';

const imgHeroMain =
  'https://www.figma.com/api/mcp/asset/46340bfd-ba83-4bf8-be15-f5d6301ead3d.png';
const imgHeroLeft =
  'https://www.figma.com/api/mcp/asset/bc3aa6fe-d622-4cd4-8fa7-b0e35a6ed624.png';
const imgHeroRight =
  'https://www.figma.com/api/mcp/asset/e0cdbc81-d8c4-4562-96fe-818a784245f2.png';

// As 3 fotos do hero já existiam no Figma como um "tríptico" decorativo (uma
// central nítida + duas laterais desfocadas, sempre as mesmas). Os 3 pontinhos
// embaixo já sugeriam um carrossel, mas nunca fizeram nada. Agora esse mesmo
// conjunto de imagens reais vira um carrossel de verdade: a imagem central
// (nítida) faz um rodízio entre as 3 fotos, e as laterais (desfocadas) sempre
// mostram a foto anterior/seguinte — clicáveis pra navegar.
const HERO_SLIDES = [imgHeroLeft, imgHeroMain, imgHeroRight];
const HERO_INTERVAL_MS = 6000;
const heroAlt = 'Pessoa utilizando óculos de realidade virtual VirTEAI';

const imgFamilia =
  'https://www.figma.com/api/mcp/asset/3113f797-f9d1-45ff-a8d1-7e2c5b4c7ea8.png';
const imgMundo1 =
  'https://www.figma.com/api/mcp/asset/079e7198-5b14-4231-bd81-9ad2dac10074.png';
const imgMundo2 =
  'https://www.figma.com/api/mcp/asset/6d3dff04-f746-4805-80fa-77bc18edacbe.png';
const imgMundo3 =
  'https://www.figma.com/api/mcp/asset/952aa373-7ddb-4813-9c25-ee6c0f7fc115.png';
const imgFootprints =
  'https://www.figma.com/api/mcp/asset/a54f23b1-7d13-4031-8d41-77369d92a36a.svg';
const imgColabLogo =
  'https://www.figma.com/api/mcp/asset/04cd15e4-5f48-4cf1-a2ba-e3db7df917fc.png';

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  // Avança sozinho a cada 6s — pausa ao passar o mouse/focar (teclado) e
  // respeita "reduzir movimento" do sistema, desligando o autoplay.
  useEffect(() => {
    if (heroPaused || reduceMotion) return undefined;
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, HERO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [heroPaused, reduceMotion]);

  function heroGoPrev() {
    setHeroIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }
  function heroGoNext() {
    setHeroIndex((i) => (i + 1) % HERO_SLIDES.length);
  }
  function heroKeyDown(event) {
    if (event.key === 'ArrowLeft') heroGoPrev();
    if (event.key === 'ArrowRight') heroGoNext();
  }

  const heroLeftSrc = HERO_SLIDES[(heroIndex + HERO_SLIDES.length - 1) % HERO_SLIDES.length];
  const heroCenterSrc = HERO_SLIDES[heroIndex];
  const heroRightSrc = HERO_SLIDES[(heroIndex + 1) % HERO_SLIDES.length];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-[1200px] flex-col items-center px-6 pb-28 pt-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="max-w-[653px] text-[clamp(34px,5vw,54px)] font-semibold leading-[1.08] tracking-tight text-ink"
            style={{ textWrap: 'balance' }}
          >
            A tecnologia que aproxima pessoas.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: easeOut }}
            className="mt-6 max-w-[680px] text-[19px] leading-relaxed text-ink-secondary"
          >
            Ambientes virtuais controlados para desenvolver habilidades sociais, promover
            adaptação sensorial e acompanhar a evolução terapêutica — com acolhimento e ciência.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24, ease: easeOut }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <motion.div whileTap={buttonTap} whileHover={buttonHover}>
              <Link
                to="/about-us"
                className="flex h-[49px] items-center justify-center rounded-full bg-brand px-8 text-[15px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep"
              >
                Conheça a VirTEAI
              </Link>
            </motion.div>
            <motion.div whileTap={buttonTap} whileHover={buttonHover}>
              <a
                href="#mundos-unicos"
                className="flex h-[49px] items-center justify-center rounded-full border border-hairline px-8 text-[15px] font-medium text-ink transition-colors duration-200 hover:bg-surface"
              >
                Saiba como funciona
              </a>
            </motion.div>
          </motion.div>

          <div
            role="group"
            aria-roledescription="carrossel"
            aria-label="Fotos da VirTEAI"
            onMouseEnter={() => setHeroPaused(true)}
            onMouseLeave={() => setHeroPaused(false)}
            onFocus={() => setHeroPaused(true)}
            onBlur={() => setHeroPaused(false)}
            onKeyDown={heroKeyDown}
            className="relative mt-16 flex w-full items-center justify-center"
          >
            <motion.button
              type="button"
              onClick={heroGoPrev}
              aria-label="Imagem anterior"
              initial={{ opacity: 0, x: -30, rotate: -2 }}
              animate={{ opacity: 0.85, x: 0, rotate: -2 }}
              transition={{ duration: 0.75, delay: 0.28, ease: easeOut }}
              className="absolute left-0 hidden h-[380px] w-[420px] overflow-hidden rounded-[24px] transition-opacity duration-200 hover:opacity-100 lg:block"
            >
              <AnimatePresence>
                <motion.img
                  key={heroLeftSrc}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: easeOut }}
                  src={heroLeftSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover blur-[1px]"
                />
              </AnimatePresence>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.16, ease: easeOut }}
              className="relative z-10 aspect-[13/8] w-full max-w-[699px] overflow-hidden rounded-[24px] shadow-elevated"
            >
              <AnimatePresence>
                <motion.img
                  key={heroCenterSrc}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: easeOut }}
                  src={heroCenterSrc}
                  alt={heroAlt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AnimatePresence>
            </motion.div>

            <motion.button
              type="button"
              onClick={heroGoNext}
              aria-label="Próxima imagem"
              initial={{ opacity: 0, x: 30, rotate: 2 }}
              animate={{ opacity: 0.85, x: 0, rotate: 2 }}
              transition={{ duration: 0.75, delay: 0.28, ease: easeOut }}
              className="absolute right-0 hidden h-[380px] w-[420px] overflow-hidden rounded-[24px] transition-opacity duration-200 hover:opacity-100 lg:block"
            >
              <AnimatePresence>
                <motion.img
                  key={heroRightSrc}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: easeOut }}
                  src={heroRightSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover blur-[1px]"
                />
              </AnimatePresence>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            role="tablist"
            aria-label="Selecionar foto do carrossel"
            className="mt-8 flex items-center gap-2"
          >
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === heroIndex}
                aria-label={`Ir para a foto ${i + 1} de ${HERO_SLIDES.length}`}
                onClick={() => setHeroIndex(i)}
                className={`h-[8px] rounded-full transition-all duration-300 ${
                  i === heroIndex ? 'w-[22px] bg-ink' : 'w-[8px] bg-hairline hover:bg-ink-tertiary'
                }`}
              />
            ))}
          </motion.div>
        </section>

        {/* Para famílias */}
        <section className="border-t border-hairline-soft">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 py-24 md:grid-cols-2 md:gap-16"
          >
            <motion.img
              variants={staggerItem}
              src={imgFamilia}
              alt="Família acompanhando o progresso terapêutico"
              className="h-[339px] w-full rounded-3xl object-cover shadow-soft md:order-2"
            />
            <motion.div variants={staggerItem} className="md:order-1">
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">
                Para famílias
              </p>
              <h2 className="mb-5 text-[32px] font-semibold leading-[1.15] tracking-tight text-ink">
                Mais perto de cada conquista
              </h2>
              <p className="mb-4 text-[18px] leading-relaxed text-ink-secondary">
                Cada pequena vitória importa. Com a VirteAI, famílias acompanham a evolução com
                clareza e confiança, celebrando o progresso em um ambiente seguro e acolhedor.
              </p>
              <p className="text-[18px] leading-relaxed text-ink-secondary">
                Você recebe atualizações simples, sem jargões, e orientações práticas para apoiar
                o desenvolvimento no dia a dia.
              </p>
              <img
                src={imgFootprints}
                alt=""
                aria-hidden="true"
                className="mt-6 hidden h-[96px] w-[82px] opacity-70 sm:block"
              />
            </motion.div>
          </motion.div>
        </section>

        {/* Mundos Únicos */}
        <section id="mundos-unicos" className="scroll-mt-24 border-t border-hairline-soft bg-surface">
          <div className="mx-auto max-w-[1200px] px-6 py-24">
            <motion.h2
              variants={fadeInUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.6 }}
              className="mb-12 text-center text-[32px] font-semibold tracking-tight text-ink"
            >
              Mundos Únicos
            </motion.h2>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-3"
            >
              <motion.img
                variants={staggerItem}
                whileHover={{
                  scale: 1.03,
                  y: -6,
                  boxShadow: '0 8px 16px -4px rgba(0,0,0,0.08), 0 32px 64px -16px rgba(0,0,0,0.22)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                src={imgMundo1}
                alt="Ambiente virtual: rua de cidade"
                className="h-[333px] w-full rounded-3xl object-cover shadow-soft"
              />
              <motion.img
                variants={staggerItem}
                whileHover={{
                  scale: 1.03,
                  y: -6,
                  boxShadow: '0 8px 16px -4px rgba(0,0,0,0.08), 0 32px 64px -16px rgba(0,0,0,0.22)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                src={imgMundo2}
                alt="Ambiente virtual: floresta"
                className="h-[333px] w-full rounded-3xl object-cover shadow-soft"
              />
              <motion.img
                variants={staggerItem}
                whileHover={{
                  scale: 1.03,
                  y: -6,
                  boxShadow: '0 8px 16px -4px rgba(0,0,0,0.08), 0 32px 64px -16px rgba(0,0,0,0.22)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                src={imgMundo3}
                alt="Ambiente virtual: mercado"
                className="h-[333px] w-full rounded-3xl object-cover shadow-soft"
              />
            </motion.div>
          </div>
        </section>

        {/* Instituições parceiras */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          className="flex flex-col items-center gap-6 border-t border-hairline-soft px-6 py-16"
        >
          <p className="text-[15px] font-medium text-ink-tertiary">
            Instituições que confiam na VirTEAI
          </p>
          <img src={imgColabLogo} alt="Instituição parceira" className="h-[86px] w-[91px] object-contain opacity-90" />
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
