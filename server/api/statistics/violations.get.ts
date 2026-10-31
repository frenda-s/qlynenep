import { requirePermission } from '../../utils/permissions'
import { violationStatistics } from '../../services/statistics.service'
import { periodQuery } from '../../schemas/common'
import { parseQuery } from '../../utils/query'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'statistics.view')
  const q = parseQuery(event, periodQuery)
  return await violationStatistics(db, q.period, actor.classIds)
})
