import { z } from 'zod';

// Vem de multipart/form-data (multer), então todo campo chega como string
// solta em `req.body` — sem aninhamento, sem tipos além de texto.
export const createWorldSchema = z.object({
  title: z.string().trim().min(1, 'Informe o nome do mundo.'),
  description: z.string().trim().optional().default(''),
  connectionId: z.string().trim().optional().default(''),
});

// Sem `.refine` de "campo nenhum vazio" aqui de propósito: um PATCH válido
// pode vir só com uma imagem nova (sem nenhum campo de texto), e os
// arquivos ficam em `req.files`, fora do que esse schema valida — quem
// decide se a requisição não tem nada pra atualizar é o controller, que
// olha os dois juntos.
export const updateWorldSchema = z.object({
  title: z.string().trim().min(1, 'Informe o nome do mundo.').optional(),
  description: z.string().trim().optional(),
  connectionId: z.string().trim().optional(),
});
