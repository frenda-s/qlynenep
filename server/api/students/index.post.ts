import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { createStudent } from '../../services/students.service'
import { createStudentSchema } from '../../schemas/students'
import { parseBody } from '../../utils/errors'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const input = await parseBody(event, createStudentSchema)
  const student = await createStudent(db, input)
  await writeAudit(db, {
    userId: user.sub,
    action: 'CREATE_STUDENT',
    targetType: 'student',
    targetId: student.id,
    metadata: { student_code: student.student_code },
  })
  return { student }
})
