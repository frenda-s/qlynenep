import { login } from '../../services/auth.service'
import { loginSchema } from '../../schemas/auth'
import { parseBody } from '../../utils/errors'
import { setSessionCookie, getAuthSecret } from '../../utils/auth'
import { useDB } from '../../database/client'

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const authSecret = getAuthSecret(event)
  const input = await parseBody(event, loginSchema)
  const result = await login(db, input, authSecret)
  setSessionCookie(event, result.token)
  return { user: result.user }
})
