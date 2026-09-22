import { requireAuth } from '../../../utils/auth'
import { useDB } from '../../../database/client'
import { studentByQr } from '../../../services/students.service'
import { parseRouteParam } from '../../../utils/query'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDB(event)
  const code = parseRouteParam(event, 'code')
  return { student: await studentByQr(db, code) }
})
