import { requireActor, assertClassAccess } from '../../../utils/permissions'
import { studentByQr } from '../../../services/students.service'
import { parseRouteParam } from '../../../utils/query'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requireActor(event)
  const code = parseRouteParam(event, 'code')
  const student = await studentByQr(db, decodeURIComponent(code))
  assertClassAccess(actor, student.class_id)
  return { student }
})
