import { requirePermission } from '../../utils/permissions'
import { useDB } from '../../database/client'
import { deleteViolation } from '../../services/violations.service'
import { parseRouteParam } from '../../utils/query'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'violations.delete')
  const id = parseRouteParam(event, 'id')
  await deleteViolation(db, id, actor)
  return { ok: true }
})
