import { requireAuth, clearSessionCookie } from '../../utils/auth'
import { writeAudit } from '../../utils/audit'
import { useDB } from '../../database/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  await writeAudit(useDB(event), { userId: user.sub, action: 'LOGOUT' })
  clearSessionCookie(event)
  return { ok: true }
})
