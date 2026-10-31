import { requirePermission } from '../../../utils/permissions'
import { resetUserPassword } from '../../../services/users.service'
import { resetPasswordSchema } from '../../../schemas/users'
import { parseBody } from '../../../utils/errors'
import { parseRouteParam } from '../../../utils/query'
import { writeAudit } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'users.manage')
  const id = parseRouteParam(event, 'id')
  const input = await parseBody(event, resetPasswordSchema)
  await resetUserPassword(db, id, input.password)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'RESET_PASSWORD',
    targetType: 'user',
    targetId: id,
  })
  return { ok: true }
})
