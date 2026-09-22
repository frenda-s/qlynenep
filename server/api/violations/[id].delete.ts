import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { deleteViolation } from '../../services/violations.service'
import { parseRouteParam } from '../../utils/query'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const id = parseRouteParam(event, 'id')
  await deleteViolation(db, id, user)
  return { ok: true }
})
