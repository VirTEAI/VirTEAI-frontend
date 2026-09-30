import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api-client';
import { ImagePlaceholderIcon } from './icons';
import { overlayFade, modalScale, buttonTap, buttonHover } from '../lib/motion';


function PhotoSlot({ file, onPick, wide = false }) {
  const inputRef = useRef(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

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
      {previewUrl ? (
        <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
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

export default function VincularMundoModal({ onClose, onSubmit }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [idConexao, setIdConexao] = useState('');
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('title', nome || 'Novo Mundo');
    formData.append('description', descricao);
    formData.append('connectionId', idConexao);
    if (foto1) formData.append('thumbnail', foto1);
    if (foto2) formData.append('gallery', foto2);

    setIsSubmitting(true);
    const { ok, body } = await apiFetch('/api/worlds', { method: 'POST', body: formData });
    setIsSubmitting(false);

    if (!ok) {
      setError(body?.error ?? 'Não foi possível vincular o mundo. Tente novamente.');
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
          <h2 className="text-[24px] font-semibold tracking-tight text-ink">Vincular Novo Mundo</h2>
        </div>

        <div className="flex h-[180px] w-full gap-0 overflow-hidden rounded-2xl">
          <PhotoSlot file={foto1} onPick={setFoto1} wide />
          <PhotoSlot file={foto2} onPick={setFoto2} />
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

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={buttonTap}
          whileHover={buttonHover}
          className="flex h-[49px] items-center justify-center rounded-full bg-brand text-[14px] font-medium text-white shadow-button transition-colors duration-200 hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {isSubmitting ? 'Vinculando…' : 'Vincular Novo Mundo'}
        </motion.button>
      </motion.form>
    </div>
  );
}
