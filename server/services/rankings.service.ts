import type { DB } from '../database/client'
import * as rankingsRepo from '../repositories/rankings'
import { rangeFor, type Period } from '../utils/time'
import { CONDUCT_ORDER, classifyConduct, type ConductRating } from '../utils/conduct'

export interface RankingFilter {
  classId?: string
  classIds?: string[] | null
  grade?: number
  q?: string
  limit?: number
}

function matchesQuery(q: string | undefined, ...values: (string | number)[]): boolean {
  if (!q?.trim()) return true
  const needle = q.trim().toLocaleLowerCase('vi')
  return values.some((v) => String(v).toLocaleLowerCase('vi').includes(needle))
}

function ratingSummary(ratings: ConductRating[]) {
  const map = Object.fromEntries(CONDUCT_ORDER.map((r) => [r, 0])) as Record<ConductRating, number>
  for (const r of ratings) map[r] += 1
  return CONDUCT_ORDER.map((rating) => ({ rating, count: map[rating] }))
}

/** Gán hạng kiểu thi đấu: bằng điểm thì đồng hạng, hạng kế tiếp nhảy cóc. */
function assignRanks<T>(rows: T[], valueOf: (row: T) => number): (T & { rank: number })[] {
  let previous: number | null = null
  let previousRank = 0
  return rows.map((row, index) => {
    const value = valueOf(row)
    let rank = index + 1
    if (previous !== null && value === previous) rank = previousRank
    previous = value
    previousRank = rank
    return { ...row, rank }
  })
}

export async function studentRanking(db: DB, period: Period, filter: RankingFilter = {}) {
  const [from, to] = rangeFor(period)
  const scope = { classId: filter.classId, classIds: filter.classIds, grade: filter.grade }
  const rows = await rankingsRepo.studentPointsInRange(db, from, to, scope)

  const mapped = rows
    .filter((r) => matchesQuery(filter.q, r.fullName, r.studentCode, r.className))
    .map((r) => ({
      student_id: r.studentId,
      full_name: r.fullName,
      student_code: r.studentCode,
      class_id: r.classId,
      class_name: r.className,
      grade: r.grade,
      points: r.points,
      points_deducted: Math.max(0, 100 - r.points),
      violations: r.violationCount,
      classification: classifyConduct(r.points),
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        a.violations - b.violations ||
        a.full_name.localeCompare(b.full_name, 'vi'),
    )

  const ranked = assignRanks(mapped, (r) => r.points)
  const limited = filter.limit ? ranked.slice(0, filter.limit) : ranked
  const average =
    mapped.length > 0
      ? Math.round((mapped.reduce((sum, r) => sum + r.points, 0) / mapped.length) * 10) / 10
      : 0

  return {
    period,
    from,
    to,
    summary: {
      total: mapped.length,
      average_points: average,
      perfect: mapped.filter((r) => r.violations === 0).length,
      by_rating: ratingSummary(mapped.map((r) => r.classification)),
    },
    students: limited,
  }
}

export async function classRanking(db: DB, period: Period, filter: RankingFilter = {}) {
  const [from, to] = rangeFor(period)
  const scope = { classId: filter.classId, classIds: filter.classIds, grade: filter.grade }
  const [agg, sizes, studentRows] = await Promise.all([
    rankingsRepo.classViolationAggregate(db, from, to, scope),
    rankingsRepo.classStudentCounts(db, scope),
    rankingsRepo.studentPointsInRange(db, from, to, scope),
  ])

  const sizeMap = new Map(sizes.map((s) => [s.classId, Number(s.size)]))
  const studentStats = new Map<string, { total: number; count: number; perfect: number }>()
  for (const s of studentRows) {
    const item = studentStats.get(s.classId) ?? { total: 0, count: 0, perfect: 0 }
    item.total += s.points
    item.count += 1
    if (s.violationCount === 0) item.perfect += 1
    studentStats.set(s.classId, item)
  }

  const rows = agg
    .filter((c) => matchesQuery(filter.q, c.name))
    .map((c) => {
      const size = sizeMap.get(c.classId) ?? 0
      const stats = studentStats.get(c.classId)
      const avg = size > 0 ? 100 + c.totalPoints / size : 100
      const avgPoints = Math.round(avg * 10) / 10
      return {
        class_id: c.classId,
        name: c.name,
        grade: c.grade,
        academic_year: c.academicYear,
        size,
        violations: c.violationCount,
        points_deducted: Math.max(0, -c.totalPoints),
        avg_points: avgPoints,
        student_avg: stats && stats.count > 0 ? Math.round((stats.total / stats.count) * 10) / 10 : 100,
        perfect_students: stats?.perfect ?? 0,
        classification: classifyConduct(avgPoints),
      }
    })
    .sort(
      (a, b) =>
        b.avg_points - a.avg_points ||
        a.violations - b.violations ||
        a.name.localeCompare(b.name, 'vi'),
    )

  const ranked = assignRanks(rows, (r) => r.avg_points)

  return {
    period,
    from,
    to,
    summary: {
      total: rows.length,
      average_points:
        rows.length > 0
          ? Math.round((rows.reduce((sum, r) => sum + r.avg_points, 0) / rows.length) * 10) / 10
          : 0,
      by_rating: ratingSummary(rows.map((r) => r.classification)),
    },
    classes: ranked,
  }
}
