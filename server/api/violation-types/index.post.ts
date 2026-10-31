import { requirePermission } from '../../utils/permissions'
import { createViolationType } from '../../services/violation-types.service'
import { createViolationTypeSchema } from '../../schemas/violation-types'
import { parseBody } from '../../utils/errors'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'violation_types.manage')
  const input = await parseBody(event, createViolationTypeSchema)
  const type = await createViolationType(db, input)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'CREATE_VIOLATION_TYPE',
    targetType: 'violation_type',
    targetId: type.id,
    metadata: { name: type.name, penalty_points: type.penaltyPoints },
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
