import { requirePermission } from '../../utils/permissions'
import { dashboard } from '../../services/statistics.service'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'statistics.view')
  return await dashboard(db, actor.classIds)
})
