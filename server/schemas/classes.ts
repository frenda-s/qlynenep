import { z } from 'zod'
import { statusEnum } from './common'

export const createClassSchema = z.object({
  name: z.string().min(1).max(64),
  grade: z.coerce.number().int().min(1).max(12),
  academic_year: z.string().min(4).max(16),
  teacher_id: z.string().nullable().optional(),
  status: statusEnum.default('active'),
})

export const updateClassSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  academic_year: z.string().min(4).max(16).optional(),
  teacher_id: z.string().nullable().optional(),
  status: statusEnum.optional(),
})

export type CreateClassInput = z.infer<typeof createClassSchema>
export type UpdateClassInput = z.infer<typeof updateClassSchema>
