import { useState } from 'react';
import avatarGeneric from '../assets/images/avatar-generic.png';

/**
 * Wrapper que evita que uma imagem quebrada estoure o layout com o texto
 * do alt. Sempre corta o conteúdo no tamanho do container, com um fundo
 * neutro por trás enquanto a imagem carrega.
 *
 * Avatar de usuário (rounded=true) sem `src` — ou que falha ao carregar —
 * cai no ícone de usuário genérico em vez de ficar só a caixa vazia: é o
 * mesmo avatar "comum" pra qualquer conta que não tenha foto própria
 * (decisão do projeto: todo usuário sem foto usa essa imagem única).
 * Pra conteúdo não-avatar (banner, logo, foto de mundo) sem `src`, continua
 * só a caixa neutra — não faz sentido mostrar um ícone de pessoa ali.
 */
export default function SafeImage({ src, alt, className = '', rounded = false }) {
  const [broken, setBroken] = useState(false);
  const useFallback = rounded && (!src || broken);
  const finalSrc = useFallback ? avatarGeneric : src;

  return (
    <span
      className={`relative block shrink-0 overflow-hidden bg-hairline-soft ${rounded ? 'rounded-full' : ''} ${className}`}
    >
      {(finalSrc || useFallback) && (
        <img
          src={finalSrc}
          alt={alt}
          onError={() => {
            if (rounded && !broken) setBroken(true);
          }}
          className={`absolute inset-0 h-full w-full ${useFallback ? 'object-contain p-[18%] opacity-40' : 'object-cover'}`}
        />
      )}
    </span>
  );
}
