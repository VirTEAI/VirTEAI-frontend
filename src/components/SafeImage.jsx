/**
 * Wrapper que evita que uma imagem quebrada (ex.: link do Figma expirado)
 * estoure o layout com o texto do alt. Sempre corta o conteúdo no tamanho
 * do container, com um fundo neutro por trás enquanto a imagem carrega.
 */
export default function SafeImage({ src, alt, className = '', rounded = false }) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden bg-hairline-soft ${rounded ? 'rounded-full' : ''} ${className}`}
    >
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
    </span>
  );
}
