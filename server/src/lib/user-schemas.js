import { z } from 'zod';

// Mesmos campos que o EditProfileModal.jsx já envia — `birthDate` continua
// texto livre (o front nunca validou formato de data, e não é usado em
// nenhum cálculo, então não há motivo pra apertar isso agora no backend).
export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome muito curto.').optional(),
    email: z.string().trim().toLowerCase().email('E-mail inválido.').optional(),
    birthDate: z.string().trim().max(20).optional(),
    note: z.string().trim().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nada para atualizar.' });
