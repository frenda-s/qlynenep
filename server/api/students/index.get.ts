import { requireAuth } from '../../utils/auth'
import { useDB } from '../../database/client'
import { listStudents } from '../../repositories/students'
import { studentQuerySchema } from '../../schemas/students'
import { parseQuery } from '../../utils/query'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDB(event)
  const q = parseQuery(event, studentQuerySchema)

  const { rows, total } = await listStudents(db, {
    q: q.q,
    classId: q.class_id,
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
  }
})
