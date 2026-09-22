import { login } from '../../services/auth.service'
import { loginSchema } from '../../schemas/auth'
import { parseBody } from '../../utils/errors'
import { setSessionCookie } from '../../utils/auth'
import { useDB } from '../../database/client'

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const config = useRuntimeConfig(event) as { authSecret: string }
  const input = await parseBody(event, loginSchema)
  const result = await login(db, input, config.authSecret)
  setSessionCookie(event, result.token)
  return { user: result.user }
})
