import { requirePermission, assertClassAccess } from '../../utils/permissions'
import { deleteViolation } from '../../services/violations.service'
import { findViolationById } from '../../repositories/violations'
import { parseRouteParam } from '../../utils/query'
import { notFound } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'violations.delete')
  const id = parseRouteParam(event, 'id')

  // Chặn IDOR: giáo viên được cấp violations.delete vẫn chỉ xóa được
  // vi phạm thuộc lớp mình phụ trách.
  const v = await findViolationById(db, id)
  if (!v) notFound('Không tìm thấy vi phạm')
  if (v.student) assertClassAccess(actor, v.student.classId)

  await deleteViolation(db, id, actor)
  return { ok: true }
})
