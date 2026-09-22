import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { updateStudent } from '../../services/students.service'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const id = parseRouteParam(event, 'id')
  const student = await updateStudent(db, id, { status: 'inactive' })
  await writeAudit(db, {
    userId: user.sub,
    action: 'UPDATE_STUDENT',
    targetType: 'student',
    targetId: id,
    metadata: { status: 'inactive' },
  })
  return { student }
})
