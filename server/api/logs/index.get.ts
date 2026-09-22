import { desc } from 'drizzle-orm'
import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { auditLogs } from '../../database/schema'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const q = getQuery(event)
  const page = Math.max(1, Number(q.page) || 1)
  const limit = Math.min(200, Math.max(1, Number(q.limit) || 50))

  const rows = await db.query.auditLogs.findMany({
    with: { user: true },
    orderBy: [desc(auditLogs.createdAt)],
    limit,
    offset: (page - 1) * limit,
  })

  return {
    logs: rows.map((l) => ({
      id: l.id,
      action: l.action,
      target_type: l.targetType,
      target_id: l.targetId,
      metadata: l.metadata ? safeJson(l.metadata) : null,
      created_at: l.createdAt,
      user: l.user
        ? { id: l.user.id, full_name: l.user.fullName, username: l.user.username, role: l.user.role }
        : null,
    })),
    page,
    limit,
  }
})

function safeJson(v: string): unknown {
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}
