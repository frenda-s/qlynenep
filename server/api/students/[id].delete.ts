import { requirePermission, assertClassAccess } from '../../utils/permissions'
import { updateStudent, studentById } from '../../services/students.service'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'students.delete')
  const id = parseRouteParam(event, 'id')
  const existing = await studentById(db, id)
  assertClassAccess(actor, existing.class_id)
  const student = await updateStudent(db, id, { status: 'inactive' })
  await writeAudit(db, {
    userId: actor.userId,
    action: 'UPDATE_STUDENT',
    targetType: 'student',
    targetId: id,
    metadata: { status: 'inactive' },
  })
  return { student }
})
