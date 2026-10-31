import { requirePermission } from '../../utils/permissions'
import { deactivateUser } from '../../services/users.service'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'users.manage')
  const id = parseRouteParam(event, 'id')
  const user = await deactivateUser(db, id, actor.userId)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'DEACTIVATE_USER',
    targetType: 'user',
    targetId: id,
    metadata: { username: user.username },
  })
  return { user }
})
