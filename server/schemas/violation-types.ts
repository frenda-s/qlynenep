import { z } from 'zod'

export const createViolationTypeSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  penalty_points: z.coerce.number().int().min(1).max(100),
  is_active: z.boolean().default(true),
})

export const updateViolationTypeSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  penalty_points: z.coerce.number().int().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
})

export type CreateViolationTypeInput = z.infer<typeof createViolationTypeSchema>
export type UpdateViolationTypeInput = z.infer<typeof updateViolationTypeSchema>
