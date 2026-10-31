import { requirePermission, assertClassAccess } from '../../utils/permissions'
import { createStudent } from '../../services/students.service'
import { createStudentSchema } from '../../schemas/students'
import { parseBody } from '../../utils/errors'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'students.create')
  const input = await parseBody(event, createStudentSchema)
  assertClassAccess(actor, input.class_id)
  const student = await createStudent(db, input)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'CREATE_STUDENT',
    targetType: 'student',
    targetId: student.id,
    metadata: { student_code: student.student_code },
  })
  return { student }
})
