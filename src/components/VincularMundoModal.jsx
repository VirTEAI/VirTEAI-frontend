import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api-client';
import { ImagePlaceholderIcon } from './icons';
import { overlayFade, modalScale, buttonTap, buttonHover } from '../lib/motion';


function PhotoSlot({ file, existingUrl, onPick, wide = false }) {
  const inputRef = useRef(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  // Editando um mundo que já tem foto: mostra ela até uma nova ser
  // escolhida, em vez de voltar pro placeholder vazio.
  const displayUrl = previewUrl ?? existingUrl ?? null;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <motion.button
      type="button"
      onClick={() => inputRef.current?.click()}
      whileTap={buttonTap}
      className={`relative flex h-[180px] items-center justify-center overflow-hidden bg-surface ring-1 ring-inset ring-hairline-soft transition-colors duration-200 hover:bg-hairline-soft focus:outline-none focus:ring-2 focus:ring-brand ${
        wide ? 'flex-1 rounded-l-2xl' : 'flex-1 rounded-r-2xl border-l border-hairline'
      }`}
    >
      {displayUrl ? (
        <img src={displayUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <ImagePlaceholderIcon className="h-8 w-8 text-ink-tertiary opacity-60" />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </motion.button>
  );
}

// `world` presente = modo edição (PATCH no mundo existente, inclusive um
// rascunho que ainda não foi publicado); ausente = criação (POST), igual
// sempre funcionou.
export default function VincularMundoModal({ world = null, onClose, onSubmit }) {
  const isEditing = Boolean(world);
  const [nome, setNome] = useState(world?.title ?? '');
  const [descricao, setDescricao] = useState(world?.description ?? '');
  const [idConexao, setIdConexao] = useState(world?.connectionId ?? '');
  const [foto1, setFoto1] = useState(null);
  const [foto2, setFoto2] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

  // `status` decide se o POST/PATCH publica direto ou salva como rascunho —
  // os dois botões abaixo chamam isso com um valor diferente em vez de
  // depender de um checkbox separado.
  async function submitWithStatus(status) {
    setError('');

    const formData = new FormData();
    formData.append('title', nome || 'Novo Mundo');
    formData.append('description', descricao);
    formData.append('connectionId', idConexao);
    if (foto1) formData.append('thumbnail', foto1);
    if (foto2) formData.append('gallery', foto2);

    let result;
    setIsSubmitting(true);
    if (isEditing) {
      // Editando um mundo que já existe (publicado ou rascunho) — não mexe
      // no status aqui; isso é só o botão "Publicar" (handlePublish) que faz.
      result = await apiFetch(`/api/worlds/${world.id}`, { method: 'PATCH', body: formData });
    } else {
      formData.append('status', status);
      result = await apiFetch('/api/worlds', { method: 'POST', body: formData });
    }
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.body?.error ?? 'Não foi possível salvar o mundo. Tente novamente.');
      return;
    }

    onSubmit(result.body.world);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await submitWithStatus('published');
  }

  async function handleSaveDraft() {
    await submitWithStatus('draft');
  }

  async function handlePublish() {
    // Mundo já existe como rascunho — só muda o status, sem reenviar título/
    // descrição/imagens de novo (evita sobrescrever por engano se o campo
    // de texto estiver vazio nesse momento).
    setError('');
    setIsSubmitting(true);
    const { ok, body } = await apiFetch(`/api/worlds/${world.id}`, {
      method: 'PATCH',
      body: (() => {
        const fd = new FormData();
        fd.append('status', 'published');
        return fd;
      })(),
    });
    setIsSubmitting(false);
    if (!ok) {
      setError(body?.error ?? 'Não foi possível publicar o mundo.');
      return;
    }
    onSubmit(body.world);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.button
        type="button"
        aria-label="Fechar"
        onClick={() => !isSubmitting && onClose()}
        variants={overlayFade}
        initial="initial"
        animate="animate"
        exit="exit"
        className="absolute inset-0"
      />

      <motion.form
        onSubmit={handleSubmit}
        variants={modalScale}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[660px] flex-col gap-6 overflow-y-auto rounded-3xl bg-white p-8 shadow-elevated"
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar"
            className="flex h-[25px] w-[25px] items-center justify-center rounded-lg text-ink-secondary transition-colors duration-200 hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className="text-[24px] font-semibold tracking-tight text-ink">
            {isEditing ? 'Editar Mundo' : 'Vincular Novo Mundo'}
          </h2>
          {isEditing && world.status === 'draft' && (
            <span className="rounded-full bg-surface px-3 py-1 text-[12px] font-medium text-ink-secondary ring-1 ring-inset ring-hairline-soft">
              Rascunho
            </span>
          )}
        </div>

        <div className="flex h-[180px] w-full gap-0 overflow-hidden rounded-2xl">
          <PhotoSlot file={foto1} existingUrl={world?.thumbnail} onPick={setFoto1} wide />
          <PhotoSlot file={foto2} existingUrl={world?.gallery} onPick={setFoto2} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="vincular-nome" className="text-[14px] font-bold text-ink">
            Nome do Mundo
          </label>
          <input
            id="vincular-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Novo Mundo"
            className="w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-tertiary transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="vincular-descricao" className="text-[14px] font-bold text-ink">
            Descrição do Mundo
          </label>
          <textarea
            id="vincular-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Este mundo contem ........"
            rows={5}
            className="w-full resize-none rounded-xl border border-hairline bg-white p-5 text-[14px] text-ink placeholder:text-ink-tertiary transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="vincular-id" className="text-[14px] font-bold text-ink">
            ID Conexão
          </label>
          <input
            id="vincular-id"
            type="text"
            value={idConexao}
            onChange={(e) => setIdConexao(e.target.value)}
            placeholder="1902930219"
            className="w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-tertiary transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          {!isEditing && (
            <motion.button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              whileTap={buttonTap}
              whileHover={buttonHover}
              className="flex h-[49px] flex-1 items-center justify-center rounded-full border border-hairline text-[14px] font-medium text-ink transition-colors duration-200 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {isSubmitting ? 'Salvando…' : 'Salvar como Rascunho'}
            </motion.button>
          )}

          {isEditing && world.status === 'draft' && (
            <motion.button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
              whileTap={buttonTap}
              whileHover={buttonHover}
              className="flex h-[49px] flex-1 items-center justify-center rounded-full border border-hairline text-[14px] font-medium text-ink transition-colors duration-200 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {isSubmitting ? 'Publicando…' : 'Publicar Mundo'}
            </motion.button>
          )}

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={buttonTap}
            whileHover={buttonHover}
            className="flex h-[49px] flex-1 items-center justify-center rounded-full bg-brand text-[14px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {isSubmitting
              ? isEditing
                ? 'Salvando…'
                : 'Vinculando…'
              : isEditing
                ? 'Salvar Alterações'
                : 'Vincular Novo Mundo'}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
