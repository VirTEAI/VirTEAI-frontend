import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import { AreaPinIcon } from '../components/icons';
import { useWorlds } from '../hooks/useWorlds';
import { apiFetch } from '../lib/api-client';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/motion';

const imgHeatmap = 'https://www.figma.com/api/mcp/asset/381b73bd-95e1-4c0b-a8a2-5862d22d1dc6.png';

const RANK_SUFFIX = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º'];

// mm:ss — mesmo formato usado no mock original, agora calculado a partir dos
// segundos que vêm da API.
function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds ?? 0));
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function buildGeneralStats(session) {
  return [
    { label: 'Duração da Sessão:', value: formatDuration(session.durationSeconds) },
    { label: 'Tempo de Fixação:', value: formatDuration(session.totalFixationSeconds) },
    { label: 'Numeros de Fixações:', value: String(session.fixationCount) },
    { label: 'Tempo de Médio de Fixação:', value: formatDuration(session.avgFixationSeconds) },
  ];
}

function buildTopAreas(session) {
  return (session.areas ?? []).map((area, i) => ({
    rank: RANK_SUFFIX[area.rank - 1] ?? `${area.rank}º`,
    name: area.name,
    tag: area.tag,
    time: formatDuration(area.timeSeconds),
    key: `${area.rank}-${i}`,
  }));
}

export default function SessionSummary() {
  const navigate = useNavigate();
  const { worldId } = useParams();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const patientId = searchParams.get('patientId');
  const { worlds } = useWorlds();
  const world = worlds.find((w) => w.id === worldId);

  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    // `patientId` vem de DashboardWorld.jsx quando quem está vendo é
    // terapeuta/admin e tinha um paciente selecionado no PatientSelector —
    // sem isso, /api/sessions/latest devolveria a sessão mais recente entre
    // TODOS os pacientes dele, não necessariamente a do paciente certo.
    const path = code
      ? `/api/sessions/by-code/${encodeURIComponent(code)}`
      : `/api/sessions/latest?worldId=${encodeURIComponent(worldId ?? '')}${
          patientId ? `&patientId=${encodeURIComponent(patientId)}` : ''
        }`;

    apiFetch(path).then(({ ok, body }) => {
      if (cancelled) return;
      if (ok) {
        setSession(body.session);
      } else {
        setSession(null);
        setError(body?.error ?? 'Não foi possível carregar o resumo dessa sessão.');
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [code, worldId, patientId]);

  const generalStats = session ? buildGeneralStats(session) : [];
  const topAreas = session ? buildTopAreas(session) : [];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader
        showBack
        onBack={() => navigate(worldId ? `/dashboard/mundo/${worldId}` : '/dashboard')}
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

          {isLoading ? (
            <div className="rounded-2xl border border-hairline-soft bg-white p-10 text-center shadow-soft">
              <p className="text-[15px] text-ink-secondary">Carregando…</p>
            </div>
          ) : !session ? (
            <div className="rounded-2xl border border-hairline-soft bg-white p-10 text-center shadow-soft">
              <p className="text-[15px] text-ink-secondary">
                {error ?? 'Ainda não há sessão registrada pra esse mundo.'}
              </p>
            </div>
          ) : (
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
                  src={session.heatmapUrl || imgHeatmap}
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
                {topAreas.length === 0 ? (
                  <p className="text-[14px] text-ink-secondary">Nenhuma área registrada nessa sessão.</p>
                ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-4"
                >
                  {topAreas.map((area) => (
                    <motion.div
                      key={area.key}
                      variants={staggerItem}
                      className="flex items-center gap-3"
                    >
                      <span className="w-[22px] shrink-0 text-[16px] text-ink">{area.rank}</span>
                      <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep"><AreaPinIcon className="h-5 w-5" /></span>
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
                )}
              </motion.div>
            </motion.div>
          </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
