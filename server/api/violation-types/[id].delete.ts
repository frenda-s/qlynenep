import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { deleteViolationType } from '../../services/violation-types.service'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const id = parseRouteParam(event, 'id')
  await deleteViolationType(db, id)
  await writeAudit(db, {
    userId: user.sub,
    action: 'UPDATE_VIOLATION_TYPE',
    targetType: 'violation_type',
    targetId: id,
    metadata: { deleted: true },
  })
  return { ok: true }
})
