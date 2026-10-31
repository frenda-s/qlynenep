import { requirePermission } from '../../utils/permissions'
import { studentRanking } from '../../services/rankings.service'
import { rankingQuerySchema } from '../../schemas/rankings'
import { parseQuery } from '../../utils/query'
import { forbidden } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'rankings.view')
  const q = parseQuery(event, rankingQuerySchema)

  if (q.class_id && actor.classIds !== null && !actor.classIds.includes(q.class_id)) {
    forbidden('Bạn không phụ trách lớp này')
  }

  return await studentRanking(db, q.period, {
    classId: q.class_id,
    classIds: actor.classIds,
    grade: q.grade,
    q: q.q,
    limit: q.limit,
  })
})
