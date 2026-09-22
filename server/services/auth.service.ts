import type { DB } from '../database/client'
import type { LoginInput } from '../schemas/auth'
import * as usersRepo from '../repositories/users'
import { verifyPassword } from '../utils/hash'
import { signSession } from '../utils/jwt'
import { unauthorized } from '../utils/errors'
import { writeAudit } from '../utils/audit'
import type { User } from '../database/schema'

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
  }
}

export async function login(db: DB, input: LoginInput, secret: string) {
  const user = await usersRepo.findUserByUsername(db, input.username)
  if (!user || user.status !== 'active') {
    unauthorized('Sai tên đăng nhập hoặc mật khẩu')
  }
  const ok = await verifyPassword(input.password, user!.passwordHash)
  if (!ok) {
    unauthorized('Sai tên đăng nhập hoặc mật khẩu')
  }
  const token = await signSession(
    { sub: user!.id, role: user!.role, name: user!.fullName },
    secret,
  )
  await writeAudit(db, { userId: user!.id, action: 'LOGIN' })
  return { token, user: sanitizeUser(user!) }
}
