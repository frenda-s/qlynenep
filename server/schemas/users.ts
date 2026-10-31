import { z } from 'zod'
import { statusEnum } from './common'

export const userRoleEnum = z.enum(['ADMIN', 'TEACHER', 'DISCIPLINE'])

const permissionsSchema = z.array(z.string()).nullable().optional()

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(128),
  full_name: z.string().min(1, 'Nhập họ tên').max(120),
  role: userRoleEnum,
  status: statusEnum.default('active'),
  permissions: permissionsSchema,
  class_ids: z.array(z.string()).optional(),
})

export const updateUserSchema = z.object({
  full_name: z.string().min(1).max(120).optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(128).optional(),
  role: userRoleEnum.optional(),
  status: statusEnum.optional(),
  permissions: permissionsSchema,
  class_ids: z.array(z.string()).optional(),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(128),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
