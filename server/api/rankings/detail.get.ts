import { requirePermission } from '../../utils/permissions'
import * as rankingsRepo from '../../repositories/rankings'
import { rangeFor, fmtDate, fmtDateTime, type Period } from '../../utils/time'
import { parseQuery } from '../../utils/query'
import { z } from 'zod'
import { forbidden } from '../../utils/errors'

const querySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'semester', 'year']).default('week'),
  student_id: z.string().optional(),
  class_id: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'rankings.view')
  const q = parseQuery(event, querySchema)

  if (q.class_id && actor.classIds !== null && !actor.classIds.includes(q.class_id)) {
    forbidden('Bạn không phụ trách lớp này')
  }

  const [from, to] = rangeFor(q.period)
  const rows = await rankingsRepo.violationDetailRows(db, from, to, {
    studentId: q.student_id,
    classId: q.class_id,
    classIds: actor.classIds,
  })

  return {
    period: q.period,
    label: `${fmtDate(from)} – ${fmtDate(to)}`,
    violations: rows.map((r) => ({
      id: r.id,
      created_at: r.createdAt,
      date: fmtDateTime(r.createdAt),
      note: r.note,
      points: r.totalPoints,
      types: r.types,
      full_name: r.fullName,
      student_code: r.studentCode,
      class_name: r.className,
    })),
  }
})
