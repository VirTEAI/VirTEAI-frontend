import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import EditProfileModal from '../components/EditProfileModal';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../data/profiles';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/motion';

const imgAvatarBig =
  'https://www.figma.com/api/mcp/asset/cf21ce73-b06e-4a40-8196-6c3ed4c282d0.png';
const imgAvatarSmall =
  'https://www.figma.com/api/mcp/asset/3fcb7fdc-f13c-4fd0-8b45-aa0f68e0027d.png';
const imgAvatarTiny =
  'https://www.figma.com/api/mcp/asset/24092d7c-c6aa-46d7-8a8c-b523f8b6a06a.png';
const imgArchive =
  'https://www.figma.com/api/mcp/asset/d9101ac7-fb0a-4638-b840-cdeed39237c0.png';

// "Meu paciente" do terapeuta — o mesmo paciente da conta mockada
// (Martion Felinzes Silva), pra fechar o ciclo entre as duas contas de
// demonstração.
const patient = {
  name: 'Martion Felinzes Silva',
  note: 'Acompanhamento de TEA — testes AQ-10 e AQ-50',
};

const reports = [
  {
    title: 'Aprendizagem aprimorada com Martion Felinzes Silva',
    description: 'Relatório da última consulta com o Martion',
    patient: 'Martion Felinzes Silva',
  },
];

export default function ProfilePsicologo() {
  const { user } = useAuth();
  const [psychologist, setPsychologist] = useState(() => getProfile('terapeuta'));
  const [editing, setEditing] = useState(false);

  // Regra de permissão (temporária, mockada): quem chega nessa página já é
  // terapeuta (editando o próprio perfil) ou admin — ambos podem editar.
  const canEdit = user.role === 'admin' || user.role === 'terapeuta';

  function handleSave(patch) {
    setPsychologist(updateProfile('terapeuta', patch));
    setEditing(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader />

      <main className="flex-1">
        {/* Banner */}
        <div className="relative h-[234px] w-full overflow-hidden bg-brand-soft">
          <div className="absolute -right-24 -top-32 h-[350px] w-[700px] -rotate-[24deg] bg-white" />
        </div>

        <section className="mx-auto max-w-[1270px] px-6">
          {/* Cabeçalho do perfil */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="show"
            className="relative -mt-16 mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex items-end gap-6">
              <SafeImage
                src={imgAvatarBig}
                alt={psychologist.name}
                className="h-[123px] w-[123px] border-4 border-white shadow-soft"
                rounded
              />
              <div className="pb-1">
                <p className="text-[28px] leading-tight text-ink">{psychologist.name}</p>
                <p className="text-[17px] text-ink-secondary">33 Anos</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="rounded-full bg-brand-soft px-4 py-1 text-[13px] font-medium text-brand-deep">
                Terapeuta
              </span>
              <p className="text-[19.8px] text-ink">
                ID de Terapeuta: <span>{psychologist.therapistId}</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 pb-20 md:grid-cols-[564fr_724fr]"
          >
            {/* Meus dados */}
            <motion.div
              variants={staggerItem}
              className="h-fit rounded-2xl border border-hairline-soft bg-white p-6 shadow-soft"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-[19.8px] font-semibold tracking-tight text-ink">Meus dados:</h2>
                {canEdit && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setEditing(true)}
                    className="rounded-xl border border-hairline px-5 py-1.5 text-[13px] font-medium text-ink transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    Editar dados
                  </motion.button>
                )}
              </div>
              <dl className="flex flex-col gap-4">
                <div>
                  <dt className="text-[16px] text-ink">Nome Completo:</dt>
                  <dd className="text-[14px] text-ink-secondary">{psychologist.name}</dd>
                </div>
                <div>
                  <dt className="text-[16px] text-ink">Data de Nascimento</dt>
                  <dd className="text-[14px] text-ink-secondary">{psychologist.birthDate}</dd>
                </div>
                <div>
                  <dt className="text-[16px] text-ink">Email:</dt>
                  <dd className="text-[14px] break-all text-ink-secondary">{psychologist.email}</dd>
                </div>
                <div>
                  <dt className="text-[16px] text-ink">Senha:</dt>
                  <dd className="text-[14px] text-ink-secondary">**************</dd>
                </div>
              </dl>
            </motion.div>

            <motion.div variants={staggerItem} className="flex flex-col gap-6">
              {/* Meus pacientes */}
              <div className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-soft">
                <h2 className="mb-4 text-[19.8px] font-semibold tracking-tight text-ink">
                  Meus Pacientes:
                </h2>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <SafeImage
                      src={imgAvatarSmall}
                      alt={patient.name}
                      className="h-[54px] w-[54px] shadow-soft"
                      rounded
                    />
                    <div>
                      <p className="text-[13.5px] text-ink">{patient.name}</p>
                      <p className="text-[10.3px] text-ink-tertiary">{patient.note}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-xl border border-hairline px-5 py-1.5 text-[13px] font-medium text-ink transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    Conversar
                  </button>
                </div>
              </div>

              {/* Relatórios + Ficha */}
              <div className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-soft">
                <h2 className="mb-4 text-[19.8px] font-semibold tracking-tight text-ink">
                  Relátorios Recentes
                </h2>
                <div className="mb-6 flex flex-col gap-4">
                  {reports.map((report, i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <img src={imgArchive} alt="" className="mt-0.5 h-[25px] w-[25px]" />
                        <div>
                          <p className="text-[15px] text-ink">{report.title}</p>
                          <p className="text-[12px] text-ink-tertiary">{report.description}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[11.3px] text-ink">{report.patient}</span>
                        <SafeImage
                          src={imgAvatarTiny}
                          alt={report.patient}
                          className="h-[25px] w-[25px]"
                          rounded
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <h2 className="mb-2 text-[19.8px] font-semibold tracking-tight text-ink">Ficha</h2>
                <p className="mb-3 text-[12px] text-ink-secondary">
                  Se já possui um laudo e deseja disponibilizá-lo para a análise de nossos
                  terapeutas, pode anexá-lo no campo abaixo. (Opcional)
                </p>
                <label className="flex h-[88px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-hairline-soft text-[13.2px] text-ink transition-colors duration-200 hover:bg-surface focus-within:ring-2 focus-within:ring-brand">
                  <input type="file" className="hidden" />
                  <span className="rounded-xl border border-hairline px-5 py-1 text-ink">
                    Anexar Arquivo
                  </span>
                </label>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {editing && canEdit && (
          <EditProfileModal
            title={`Editar dados de ${psychologist.name}`}
            profile={psychologist}
            onClose={() => setEditing(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
