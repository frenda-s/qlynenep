import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { createViolationType } from '../../services/violation-types.service'
import { createViolationTypeSchema } from '../../schemas/violation-types'
import { parseBody } from '../../utils/errors'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const input = await parseBody(event, createViolationTypeSchema)
  const type = await createViolationType(db, input)
  await writeAudit(db, {
    userId: user.sub,
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
