// Gera um slug ("ensino-fundamental") a partir de um título ("Ensino
// Fundamental") — usado como `id` de um mundo, pra manter o mesmo formato
// de URL legível que `/dashboard/mundo/:worldId` já usava antes de mundos
// virarem uma tabela de verdade (Fase 4).
export function slugify(text) {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'mundo';
}
