import { requirePermission } from '../../utils/permissions'
import { updateUserByAdmin } from '../../services/users.service'
import { updateUserSchema } from '../../schemas/users'
import { parseBody } from '../../utils/errors'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'users.manage')
  const id = parseRouteParam(event, 'id')
  const input = await parseBody(event, updateUserSchema)
  const user = await updateUserByAdmin(db, id, input, actor.userId)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'UPDATE_USER',
    targetType: 'user',
    targetId: id,
    metadata: {
      role: input.role,
      status: input.status,
      password_changed: Boolean(input.password),
      permissions: input.permissions,
      class_ids: input.class_ids,
    },
  })
  return { user }
})
