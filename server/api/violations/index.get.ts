import { requireAuth } from '../../utils/auth'
import { useDB } from '../../database/client'
import { listViolations } from '../../services/violations.service'
import { violationQuerySchema } from '../../schemas/violations'
import { parseQuery } from '../../utils/query'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDB(event)
  const q = parseQuery(event, violationQuerySchema)

  // DISCIPLINE chỉ xem lịch sử của chính mình.
  const recordedBy = user.role === 'DISCIPLINE' ? user.sub : q.recorded_by

  const { rows, total } = await listViolations(db, {
    studentId: q.student_id,
    classId: q.class_id,
    recordedBy,
    period: q.period,
    page: q.page,
    limit: q.limit,
  })

  return { violations: rows, total, page: q.page, limit: q.limit }
})
