import { requireActor, assertClassAccess } from '../../../utils/permissions'
import { studentByQr } from '../../../services/students.service'
import { parseRouteParam } from '../../../utils/query'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requireActor(event)
  const raw = parseRouteParam(event, 'code')
  let code = raw
  try {
    code = decodeURIComponent(raw)
  } catch {
    // Giữ nguyên nếu mã QR chứa chuỗi % không hợp lệ — tránh lỗi 500 do URI malformed.
  }
  const student = await studentByQr(db, code)
  assertClassAccess(actor, student.class_id)
  return { student }
})
