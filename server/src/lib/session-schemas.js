import { z } from 'zod';

// Corpo que o "óculos VR" simulado manda depois que um código de acesso
// já foi validado (POST /api/codes/validate) — é o relatório de telemetria
// da sessão: quanto tempo durou, quanto tempo/quantas vezes o olhar fixou
// em algo, e (opcional) as áreas/objetos mais observados, em ordem.
export const createSessionSchema = z.object({
  code: z.string().trim().min(1, 'Informe o código.'),
  durationSeconds: z.number().int().nonnegative('Duração inválida.'),
  totalFixationSeconds: z.number().int().nonnegative('Tempo de fixação inválido.'),
  fixationCount: z.number().int().nonnegative('Número de fixações inválido.'),
  heatmapUrl: z.string().trim().url('URL do mapa de calor inválida.').optional(),
  areas: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Informe o nome da área.'),
        tag: z.string().trim().min(1, 'Informe a categoria da área.'),
        timeSeconds: z.number().int().nonnegative('Tempo inválido.'),
      })
    )
    .max(20, 'No máximo 20 áreas por sessão.')
    .default([]),
});
