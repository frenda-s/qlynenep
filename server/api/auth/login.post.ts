import { login } from '../../services/auth.service'
import { loginSchema } from '../../schemas/auth'
import { parseBody } from '../../utils/errors'
import { setSessionCookie, getAuthSecret } from '../../utils/auth'
import { useDB } from '../../database/client'
import { rateLimit } from '../../utils/rate-limit'
import { createError, getRequestIP } from 'h3'

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    throw createError({ statusCode: 429, message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 1 phút.' })
  }

  const db = useDB(event)
  const authSecret = getAuthSecret(event)
  const input = await parseBody(event, loginSchema)
  const result = await login(db, input, authSecret)
  setSessionCookie(event, result.token)
  return { user: result.user }
})
