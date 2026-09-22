import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { studentRanking } from '../../services/rankings.service'
import { periodQuery } from '../../schemas/common'
import { parseQuery } from '../../utils/query'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN', 'TEACHER'])
  const db = useDB(event)
  const q = parseQuery(event, periodQuery)
  return await studentRanking(db, q.period)
})
