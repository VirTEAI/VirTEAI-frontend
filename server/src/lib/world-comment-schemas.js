import { z } from 'zod';

export const createCommentSchema = z.object({
  text: z.string().trim().min(1, 'Escreva um comentário.').max(500, 'Comentário muito longo.'),
});
