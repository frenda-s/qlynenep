import { z } from 'zod'
import { requirePermission } from '../../utils/permissions'
import { listStudentsForPrint } from '../../repositories/students'
import { parseQuery } from '../../utils/query'
import { forbidden } from '../../utils/errors'

// Endpoint riêng cho trang in: không giới hạn phân trang (tối đa 2000),
// trả full ảnh thẻ + QR.
const printQuerySchema = z.object({
  class_id: z.string().optional(),
  student_id: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  q: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'students.print')
  const q = parseQuery(event, printQuerySchema)

  if (q.class_id && actor.classIds !== null && !actor.classIds.includes(q.class_id)) {
    forbidden('Bạn không phụ trách lớp này')
  }

  const rows = await listStudentsForPrint(db, {
    classId: q.class_id,
    classIds: actor.classIds,
    studentId: q.student_id,
    status: q.status,
    q: q.q,
  })

  return {
    students: rows.map((r) => ({
      id: r.id,
      student_code: r.studentCode,
      full_name: r.fullName,
      qr_code: r.qrCode,
      photo: r.photo ?? null,
      class_name: r.className,
      grade: r.grade,
      academic_year: r.academicYear,
      status: r.status,
    })),
    total: rows.length,
  }
})
