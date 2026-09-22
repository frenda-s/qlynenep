import { z } from 'zod'

export const createViolationSchema = z.object({
  student_id: z.string().min(1),
  violation_type_ids: z.array(z.string().min(1)).min(1).max(20),
  note: z.string().max(1000).optional().nullable(),
  idempotency_key: z.string().uuid(),
})

export const violationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  student_id: z.string().optional(),
  class_id: z.string().optional(),
  recorded_by: z.string().optional(),
  period: z.enum(['today', 'week', 'month', 'semester', 'year']).optional(),
})

export type CreateViolationInput = z.infer<typeof createViolationSchema>
