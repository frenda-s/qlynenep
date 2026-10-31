import { requirePermission } from '../../utils/permissions'
import { listUsersWithMeta } from '../../services/users.service'

export default defineEventHandler(async (event) => {
  const { db } = await requirePermission(event, 'users.manage')
  const users = await listUsersWithMeta(db)
  return { users }
})
