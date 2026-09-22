import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { dashboard } from '../../services/statistics.service'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN', 'TEACHER'])
  const db = useDB(event)
  return await dashboard(db)
})
