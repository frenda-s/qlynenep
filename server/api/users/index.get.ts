import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { listUsers } from '../../repositories/users'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const users = await listUsers(db)
  return {
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      status: u.status,
      created_at: u.createdAt,
    })),
  }
})
