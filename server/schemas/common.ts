import { z } from 'zod'

export const roleEnum = z.enum(['ADMIN', 'TEACHER', 'DISCIPLINE'])
export const statusEnum = z.enum(['active', 'inactive'])
export const periodEnum = z.enum(['today', 'week', 'month', 'semester', 'year'])

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const periodQuery = z.object({
  period: periodEnum.default('month'),
})

export type Pagination = z.infer<typeof paginationQuery>
export type Period = z.infer<typeof periodEnum>
