import { z } from 'zod'
import { statusEnum } from './common'

// Ảnh thẻ học sinh: data URL PNG/JPEG/WebP, tối đa ~4.5MB (base64). Không cho SVG.
const photoSchema = z
  .string()
  .max(6_000_000, 'Ảnh quá lớn (tối đa 4MB)')
  .refine(
    (v) => v === '' || /^data:image\/(png|jpe?g|webp);base64,/.test(v),
    'Ảnh phải là PNG/JPEG/WebP base64',
  )
  .optional()

export const createStudentSchema = z.object({
  student_code: z.string().max(32).optional(),
  full_name: z.string().min(1).max(120),
  class_id: z.string().min(1),
  photo: photoSchema,
  status: statusEnum.default('active'),
})

export const updateStudentSchema = z.object({
  student_code: z.string().min(1).max(32).optional(),
  full_name: z.string().min(1).max(120).optional(),
  class_id: z.string().min(1).optional(),
  photo: photoSchema,
  status: statusEnum.optional(),
})

export const studentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().optional(),
  class_id: z.string().optional(),
  grade: z.coerce.number().int().optional(),
  status: statusEnum.optional(),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
