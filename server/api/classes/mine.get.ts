import { requirePermission } from '../../utils/permissions'
import { classRanking, studentRanking } from '../../services/rankings.service'
import { listViolations } from '../../services/violations.service'
import { periodQuery } from '../../schemas/common'
import { parseQuery } from '../../utils/query'

/**
 * Tổng quan lớp học dành cho giáo viên chủ nhiệm (và quản trị viên).
 * Giáo viên chỉ nhận đúng (các) lớp mình phụ trách.
 */
export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'classes.view')
  const q = parseQuery(event, periodQuery)

  const scope = { classIds: actor.classIds }
  // Xếp hạng lớp được tính trên toàn trường để thứ hạng có ý nghĩa,
  // nhưng giáo viên chỉ nhận dữ liệu lớp mình phụ trách.
  const [allClassData, studentData, recent] = await Promise.all([
    classRanking(db, q.period, {}),
    studentRanking(db, q.period, scope),
    listViolations(db, {
      classIds: actor.classIds,
      period: q.period,
      page: 1,
      limit: 40,
    }),
  ])

  const classData = {
    ...allClassData,
    classes:
      actor.classIds === null
        ? allClassData.classes
        : allClassData.classes.filter((c) => actor.classIds!.includes(c.class_id)),
  }

  const studentsByClass = new Map<string, typeof studentData.students>()
  for (const s of studentData.students) {
    const list = studentsByClass.get(s.class_id) ?? []
    list.push(s)
    studentsByClass.set(s.class_id, list)
  }

  const violationsByClass = new Map<string, typeof recent.rows>()
  for (const v of recent.rows) {
    const classId = v.student?.class_id
    if (!classId) continue
    const list = violationsByClass.get(classId) ?? []
    list.push(v)
    violationsByClass.set(classId, list)
  }

  return {
    period: q.period,
    from: classData.from,
    to: classData.to,
    scoped: actor.classIds !== null,
    summary: {
      classes: classData.classes.length,
      students: studentData.summary.total,
      average_points: studentData.summary.average_points,
      violations: recent.total,
    },
    classes: classData.classes.map((c) => ({
      ...c,
      students: (studentsByClass.get(c.class_id) ?? []).map((s) => ({
        id: s.student_id,
        student_code: s.student_code,
        full_name: s.full_name,
        points: s.points,
        points_deducted: s.points_deducted,
        violations: s.violations,
        rank: s.rank,
        classification: s.classification,
      })),
      recent_violations: (violationsByClass.get(c.class_id) ?? []).slice(0, 8),
    })),
  }
})
