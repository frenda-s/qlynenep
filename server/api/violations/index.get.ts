import { requirePermission } from '../../utils/permissions'
import { listViolations } from '../../services/violations.service'
import { violationQuerySchema } from '../../schemas/violations'
import { parseQuery } from '../../utils/query'
import { forbidden } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'violations.view')
  const q = parseQuery(event, violationQuerySchema)

  // DISCIPLINE chỉ xem lịch sử của chính mình.
  const recordedBy = actor.role === 'DISCIPLINE' ? actor.userId : q.recorded_by

  if (q.class_id && actor.classIds !== null && !actor.classIds.includes(q.class_id)) {
    forbidden('Bạn không phụ trách lớp này')
  }

  const { rows, total } = await listViolations(db, {
    studentId: q.student_id,
    classId: q.class_id,
    classIds: actor.classIds,
    recordedBy,
    period: q.period,
    page: q.page,
    limit: q.limit,
  })

  return { violations: rows, total, page: q.page, limit: q.limit }
})
