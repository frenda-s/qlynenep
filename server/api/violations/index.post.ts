import { requirePermission, assertClassAccess } from '../../utils/permissions'
import { recordViolation } from '../../services/violations.service'
import { createViolationSchema } from '../../schemas/violations'
import { parseBody } from '../../utils/errors'
import { findStudentById } from '../../repositories/students'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'violations.create')
  const input = await parseBody(event, createViolationSchema)
  const student = await findStudentById(db, input.student_id)
  if (student) assertClassAccess(actor, student.classId)
  return await recordViolation(db, input, actor)
})
