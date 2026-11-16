import { requirePermission } from '../../utils/permissions'
import { weeklySummary } from '../../services/rankings.service'
import { parseQuery } from '../../utils/query'
import { z } from 'zod'
import { forbidden } from '../../utils/errors'

const querySchema = z.object({
  class_id: z.string().optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
})

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'rankings.view')
  const q = parseQuery(event, querySchema)

  if (q.class_id && actor.classIds !== null && !actor.classIds.includes(q.class_id)) {
    forbidden('Bạn không phụ trách lớp này')
  }

  return await weeklySummary(db, { classId: q.class_id, classIds: actor.classIds, grade: q.grade })
})
