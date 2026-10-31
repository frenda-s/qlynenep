import { requirePermission, assertClassAccess } from '../../utils/permissions'
import { updateStudent, studentById } from '../../services/students.service'
import { updateStudentSchema } from '../../schemas/students'
import { parseBody } from '../../utils/errors'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'students.edit')
  const id = parseRouteParam(event, 'id')
  const existing = await studentById(db, id)
  assertClassAccess(actor, existing.class_id)
  const input = await parseBody(event, updateStudentSchema)
  if (input.class_id) assertClassAccess(actor, input.class_id)
  const student = await updateStudent(db, id, input)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'UPDATE_STUDENT',
    targetType: 'student',
    targetId: id,
    metadata: input,
  })
  return { student }
})
