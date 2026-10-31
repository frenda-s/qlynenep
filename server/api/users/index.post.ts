import { requirePermission } from '../../utils/permissions'
import { createUserByAdmin } from '../../services/users.service'
import { createUserSchema } from '../../schemas/users'
import { parseBody } from '../../utils/errors'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'users.manage')
  const input = await parseBody(event, createUserSchema)
  const user = await createUserByAdmin(db, input)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'CREATE_USER',
    targetType: 'user',
    targetId: user.id,
    metadata: { username: user.username, role: user.role },
  })
  return { user }
})
