import { requirePermission, assertClassAccess } from '../../utils/permissions'
import { studentById } from '../../services/students.service'
import { parseRouteParam } from '../../utils/query'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'students.view')
  const id = parseRouteParam(event, 'id')
  const student = await studentById(db, id)
  assertClassAccess(actor, student.class_id)
  return { student }
})
