import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { updateViolationType } from '../../services/violation-types.service'
import { updateViolationTypeSchema } from '../../schemas/violation-types'
import { parseBody } from '../../utils/errors'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const id = parseRouteParam(event, 'id')
  const input = await parseBody(event, updateViolationTypeSchema)
  const type = await updateViolationType(db, id, input)
  await writeAudit(db, {
    userId: user.sub,
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
