import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AppHeader from '../components/AppHeader';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import VincularMundoModal from '../components/VincularMundoModal';
import ConfirmModal from '../components/ConfirmModal';
import { apiFetch } from '../lib/api-client';
import { useWorlds } from '../hooks/useWorlds';
import { staggerContainer, staggerItem, buttonTap } from '../lib/motion';

// "Gerenciar Mundos" (admin): editar qualquer campo/imagem de um mundo já
// publicado, publicar ou continuar editando um rascunho, e excluir mundos
// — tudo em cima da mesma API já usada por VincularMundoModal e
// DashboardAdmin (useWorlds já traz rascunhos pra quem é admin).
export default function AdminWorlds() {
  const navigate = useNavigate();
  const { worlds, isLoading, refresh } = useWorlds();
  const [vincularOpen, setVincularOpen] = useState(false);
  const [editingWorld, setEditingWorld] = useState(null);
  const [deletingWorld, setDeletingWorld] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const sortedWorlds = [...worlds].sort(
    (a, b) => new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime()
  );

  function handleModalSubmit() {
    refresh();
    setVincularOpen(false);
    setEditingWorld(null);
  }

  async function handleDelete() {
    setDeleteError('');
    setIsDeleting(true);
    const { ok, body } = await apiFetch(`/api/worlds/${deletingWorld.id}`, { method: 'DELETE' });
    setIsDeleting(false);
    if (!ok) {
      setDeleteError(body?.error ?? 'Não foi possível excluir esse mundo.');
      return;
    }
    setDeletingWorld(null);
    refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader showBack onBack={() => navigate('/admin')} />

      <main className="flex-1">
        <section className="mx-auto max-w-[1000px] px-6 py-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[24px] font-semibold tracking-tight text-ink">Gerenciar Mundos</h1>
              <p className="mt-1 text-[14px] text-ink-secondary">
                Edite título, descrição e imagens, publique rascunhos ou exclua mundos.
              </p>
            </div>
            <motion.button
              type="button"
              onClick={() => setVincularOpen(true)}
              whileTap={buttonTap}
              className="flex h-[42px] items-center justify-center rounded-full bg-brand px-5 text-[14px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep"
            >
              Vincular Novo Mundo
            </motion.button>
          </div>

          {isLoading && <p className="text-[14px] text-ink-secondary">Carregando…</p>}

          {!isLoading && sortedWorlds.length === 0 && (
            <p className="text-[14px] text-ink-secondary">Nenhum mundo cadastrado ainda.</p>
          )}

          {!isLoading && sortedWorlds.length > 0 && (
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-3">
              {sortedWorlds.map((world) => (
                <motion.div
                  key={world.id}
                  variants={staggerItem}
                  className="flex items-center gap-4 rounded-2xl border border-hairline-soft bg-white p-4 shadow-soft"
                >
                  <SafeImage
                    src={world.thumbnail}
                    alt={world.title}
                    className="h-[56px] w-[80px] shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-medium text-ink">{world.title}</p>
                      {world.status === 'draft' && (
                        <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-ink-secondary ring-1 ring-inset ring-hairline-soft">
                          Rascunho
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[12px] text-ink-tertiary">
                      {world.likes} curtida{world.likes === 1 ? '' : 's'} · {world.views} visualizaç
                      {world.views === 1 ? 'ão' : 'ões'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingWorld(world)}
                      className="rounded-lg border border-hairline px-3 py-1.5 text-[12px] font-medium text-ink transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError('');
                        setDeletingWorld(world);
                      }}
                      className="rounded-lg border border-hairline px-3 py-1.5 text-[12px] font-medium text-danger transition-colors duration-200 hover:bg-danger-soft focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      Excluir
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {vincularOpen && (
          <VincularMundoModal onClose={() => setVincularOpen(false)} onSubmit={handleModalSubmit} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingWorld && (
          <VincularMundoModal
            world={editingWorld}
            onClose={() => setEditingWorld(null)}
            onSubmit={handleModalSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingWorld && (
          <ConfirmModal
            title="Excluir mundo"
            message={`Tem certeza que quer excluir "${deletingWorld.title}"? Essa ação não pode ser desfeita. Se já existir algum código de acesso gerado pra esse mundo, a exclusão é bloqueada.`}
            confirmLabel="Excluir"
            isSubmitting={isDeleting}
            error={deleteError}
            onConfirm={handleDelete}
            onClose={() => setDeletingWorld(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
