import { z } from 'zod';

// `worldTitle` não é mais informado pelo cliente (Fase 4): o servidor busca
// o mundo pelo `worldId` e usa o título real de lá — ver `codes.controller.js`.
export const createCodeSchema = z.object({
  worldId: z.string().trim().min(1, 'Informe o mundo.'),
  patientId: z.string().uuid('Paciente inválido.'),
});

export const validateCodeSchema = z.object({
  code: z.string().trim().min(1, 'Informe o código.'),
});
