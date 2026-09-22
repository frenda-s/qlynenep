import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { recordViolation } from '../../services/violations.service'
import { createViolationSchema } from '../../schemas/violations'
import { parseBody } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN', 'TEACHER', 'DISCIPLINE'])
  const db = useDB(event)
  const input = await parseBody(event, createViolationSchema)
  const result = await recordViolation(db, input, user)
  return result
})
