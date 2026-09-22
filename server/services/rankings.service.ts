import type { DB } from '../database/client'
import * as rankingsRepo from '../repositories/rankings'
import { rangeFor, type Period } from '../utils/time'

export async function studentRanking(db: DB, period: Period) {
  const [from, to] = rangeFor(period)
  const rows = await rankingsRepo.studentPointsInRange(db, from, to)
  const sorted = [...rows].sort((a, b) => b.points - a.points)
  return {
    period,
    from,
    to,
    students: sorted.map((r, i) => ({
      rank: i + 1,
      student_id: r.studentId,
      full_name: r.fullName,
      student_code: r.studentCode,
      class_name: r.className,
      points: r.points,
      violations: r.violationCount,
    })),
  }
}

export async function classRanking(db: DB, period: Period) {
  const [from, to] = rangeFor(period)
  const [agg, sizes] = await Promise.all([
    rankingsRepo.classViolationAggregate(db, from, to),
    rankingsRepo.classStudentCounts(db),
  ])

  const sizeMap = new Map(sizes.map((s) => [s.classId, s.size]))

  const rows = agg
    .map((c) => {
      const size = sizeMap.get(c.classId) ?? 0
      const avg = size > 0 ? 100 + c.totalPoints / size : 100
      return {
        class_id: c.classId,
        name: c.name,
        size,
        violations: c.violationCount,
        points_deducted: -c.totalPoints,
        avg_points: Math.round(avg * 10) / 10,
      }
    })
    .sort((a, b) => b.avg_points - a.avg_points)

  return {
    period,
    from,
    to,
    classes: rows.map((r, i) => ({ rank: i + 1, ...r })),
  }
}
