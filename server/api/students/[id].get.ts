import { requireAuth } from '../../utils/auth'
import { useDB } from '../../database/client'
import { studentById } from '../../services/students.service'
import { parseRouteParam } from '../../utils/query'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDB(event)
  const id = parseRouteParam(event, 'id')
  return { student: await studentById(db, id) }
})
