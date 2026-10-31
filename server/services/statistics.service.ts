import type { DB } from '../database/client'
import * as studentsRepo from '../repositories/students'
import * as classesRepo from '../repositories/classes'
import * as violationsRepo from '../repositories/violations'
import { rangeFor, type Period } from '../utils/time'

export async function dashboard(db: DB, classIds?: string[] | null) {
  const [todayFrom] = rangeFor('today')
  const now = Date.now()

  const [students, classes, violationsToday, pointsToday] = await Promise.all([
    studentsRepo.countActiveStudents(db, classIds),
    classesRepo.countActiveClasses(db, classIds),
    violationsRepo.countViolationsInRange(db, todayFrom, now, classIds),
    violationsRepo.sumPointsInRange(db, todayFrom, now, classIds),
  ])

  return {
    students,
    classes,
    violations_today: violationsToday,
    points_today: -pointsToday, // dương = điểm đã trừ hôm nay
  }
}

export async function violationStatistics(db: DB, period: Period, classIds?: string[] | null) {
  const [from, to] = rangeFor(period)
  const byType = await violationsRepo.violationCountByType(db, from, to, classIds)

  // Series: chọn bucket theo period
  let bucketMs: number
  let buckets: number
  if (period === 'today') {
    bucketMs = 60 * 60 * 1000
    buckets = 24
  } else if (period === 'week') {
    bucketMs = 24 * 60 * 60 * 1000
    buckets = 7
  } else if (period === 'month') {
    bucketMs = 24 * 60 * 60 * 1000
    buckets = 31
  } else {
    bucketMs = 7 * 24 * 60 * 60 * 1000
    buckets = 27
  }

  const series = await violationsRepo.violationSeries(db, from, to, bucketMs, buckets, classIds)

  return {
    period,
    from,
    to,
    by_type: byType.map((r) => ({ name: r.name, count: r.count, points: r.points })),
    series: series.map((s) => ({ ts: s.ts, count: s.count, points: -s.points })),
  }
}

export async function classStatistics(db: DB, period: Period, classIds?: string[] | null) {
  const [from, to] = rangeFor(period)
  const rows = await violationsRepo.violationCountByClass(db, from, to, classIds)
  return {
    period,
    from,
    to,
    classes: rows.map((r) => ({ class_id: r.classId, name: r.name, count: r.count, points: -r.points })),
  }
}
