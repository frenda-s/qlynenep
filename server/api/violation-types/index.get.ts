import { requireActor } from '../../utils/permissions'
import { listViolationTypes } from '../../repositories/violation-types'

export default defineEventHandler(async (event) => {
  const { db } = await requireActor(event)
  const q = getQuery(event)
  const activeOnly = q.active === '1' || q.active === 'true'
  const types = await listViolationTypes(db, activeOnly)
  return {
    types: types.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      penalty_points: t.penaltyPoints,
      is_active: t.isActive,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    })),
  }
})
