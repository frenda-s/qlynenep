import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { updateStudent } from '../../services/students.service'
import { updateStudentSchema } from '../../schemas/students'
import { parseBody } from '../../utils/errors'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const id = parseRouteParam(event, 'id')
  const input = await parseBody(event, updateStudentSchema)
  const student = await updateStudent(db, id, input)
  await writeAudit(db, {
    userId: user.sub,
    action: 'UPDATE_STUDENT',
    targetType: 'student',
    targetId: id,
    metadata: input,
  })
  return { student }
})
