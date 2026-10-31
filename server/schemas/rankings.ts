import { z } from 'zod'

export const rankingQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'semester', 'year']).default('month'),
  class_id: z.string().optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
})
