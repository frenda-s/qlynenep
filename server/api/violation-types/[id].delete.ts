import { requirePermission } from '../../utils/permissions'
import { deleteViolationType } from '../../services/violation-types.service'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'violation_types.manage')
  const id = parseRouteParam(event, 'id')
  await deleteViolationType(db, id)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'UPDATE_VIOLATION_TYPE',
    targetType: 'violation_type',
    targetId: id,
    metadata: { deleted: true },
  })
  return { ok: true }
})
