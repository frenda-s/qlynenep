import { requirePermission } from '../../utils/permissions'
import { updateViolationType } from '../../services/violation-types.service'
import { updateViolationTypeSchema } from '../../schemas/violation-types'
import { parseBody } from '../../utils/errors'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'violation_types.manage')
  const id = parseRouteParam(event, 'id')
  const input = await parseBody(event, updateViolationTypeSchema)
  const type = await updateViolationType(db, id, input)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'UPDATE_VIOLATION_TYPE',
    targetType: 'violation_type',
    targetId: id,
    metadata: input,
  })
  return {
    type: {
      id: type.id,
      name: type.name,
      description: type.description,
      penalty_points: type.penaltyPoints,
      is_active: type.isActive,
    },
  }
})
