import { requirePermission } from '../../utils/permissions'
import { listStudents } from '../../repositories/students'
import { studentQuerySchema } from '../../schemas/students'
import { parseQuery } from '../../utils/query'
import { forbidden } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'students.view')
  const q = parseQuery(event, studentQuerySchema)

  // Giáo viên chỉ được xem học sinh thuộc lớp mình phụ trách.
  if (q.class_id && actor.classIds !== null && !actor.classIds.includes(q.class_id)) {
    forbidden('Bạn không phụ trách lớp này')
  }

  const { rows, total } = await listStudents(db, {
    q: q.q,
    classId: q.class_id,
    classIds: actor.classIds,
    grade: q.grade,
    status: q.status,
    page: q.page,
    limit: q.limit,
  })

  return {
    students: rows.map((r) => ({
      id: r.id,
      student_code: r.studentCode,
      full_name: r.fullName,
      qr_code: r.qrCode,
      has_photo: r.hasPhoto === 1,
      class: { id: r.classId, name: r.className, grade: r.classGrade },
      class_name: r.className,
      status: r.status,
      points: r.points,
      violation_count: r.violationCount,
      created_at: r.createdAt,
    })),
    total,
    page: q.page,
    limit: q.limit,
    scoped: actor.classIds !== null,
  }
})
