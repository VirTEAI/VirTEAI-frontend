import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import { worlds } from '../data/worlds';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/motion';

const imgHeatmap = 'https://www.figma.com/api/mcp/asset/381b73bd-95e1-4c0b-a8a2-5862d22d1dc6.png';
const imgAreaIcon = 'https://www.figma.com/api/mcp/asset/f9ac6be1-0665-4abe-816f-4ae249de90f7.png';

// Dados de exemplo — em produção, viriam do relatório gerado pelo cliente VR
// ao final da sessão (duração, fixações do olhar, objetos mais observados...).
const generalStats = [
  { label: 'Duração da Sessão:', value: '10:56' },
  { label: 'Tempo de Fixação:', value: '10:56' },
  { label: 'Numeros de Fixações:', value: '10:56' },
  { label: 'Tempo de Médio de Fixação:', value: '10:56' },
];

const topAreas = [
  { rank: '1º', name: 'Dinossauro', tag: 'Brinquedo', time: '02:18' },
  { rank: '2º', name: 'Dinossauro', tag: 'Brinquedo', time: '02:18' },
  { rank: '3º', name: 'Dinossauro', tag: 'Brinquedo', time: '02:18' },
  { rank: '4º', name: 'Dinossauro', tag: 'Brinquedo', time: '02:18' },
  { rank: '5º', name: 'Dinossauro', tag: 'Brinquedo', time: '02:18' },
];

export default function SessionSummary() {
  const navigate = useNavigate();
  const { worldId } = useParams();
  const world = worlds[worldId];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader
        showBack
        onBack={() => navigate(world ? `/dashboard/mundo/${world.id}` : '/dashboard')}
      />

      <main className="flex-1">
        <section className="mx-auto max-w-[1270px] px-6 pb-20 pt-8">
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className="mb-8 text-center text-[28px] text-ink md:text-[30px]"
          >
            Resumo da Sessão{world ? ` — ${world.title}` : ''}
          </motion.h1>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_390px]">
            {/* Mapa de calor */}
            <motion.div variants={fadeInUp} initial="hidden" animate="show">
              <h2 className="mb-4 text-center text-[20px] text-ink">Mapa de Calor</h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <SafeImage
                  src={imgHeatmap}
                  alt="Mapa de calor da sessão"
                  className="h-[300px] w-full rounded-lg shadow-[0px_5px_5px_0px_rgba(0,0,0,0.15)] md:h-[434px]"
                />
              </motion.div>

              <h3 className="mb-3 mt-6 text-center text-[20px] text-ink">Intesidade do Foco</h3>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-ink">Baixo</span>
                <div
                  className="h-4 w-full rounded-lg"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, rgb(18, 61, 253) 0%, rgb(57, 184, 245) 25%, rgb(240, 247, 31) 50%, rgb(253, 142, 3) 74.519%, rgb(251, 1, 2) 100%)',
                  }}
                />
                <span className="text-[13px] text-ink">Alto</span>
              </div>
            </motion.div>

            {/* Coluna lateral */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-6"
            >
              <motion.div variants={staggerItem} className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-soft">
                <h2 className="mb-4 text-[18px] text-ink">Estatísticas Gerais</h2>
                <dl className="flex flex-col gap-2">
                  {generalStats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between gap-4">
                      <dt className="text-[16px] text-ink">{stat.label}</dt>
                      <dd className="text-[16px] text-ink">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>

              <motion.div variants={staggerItem} className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-soft">
                <h2 className="mb-4 text-[18px] text-ink">Áreas mais observadas</h2>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-4"
                >
                  {topAreas.map((area, i) => (
                    <motion.div
                      key={`${area.rank}-${i}`}
                      variants={staggerItem}
                      className="flex items-center gap-3"
                    >
                      <span className="w-[22px] shrink-0 text-[16px] text-ink">{area.rank}</span>
                      <SafeImage src={imgAreaIcon} alt="" className="h-[40px] w-[40px]" rounded />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] text-ink">{area.name}</p>
                        <span className="mt-1 inline-flex items-center rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-semibold text-brand-deep">
                          {area.tag}
                        </span>
                      </div>
                      <span className="shrink-0 text-[16px] text-ink-secondary">{area.time}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
