import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm'
import type { DB } from '../database/client'
import {
  classes,
  students,
  users,
  violationItems,
  violationTypes,
  violations,
} from '../database/schema'
import { rangeFor, type Period } from '../utils/time'

export interface CreateViolationData {
  studentId: string
  recordedBy: string
  note: string | null
  totalPoints: number
  idempotencyKey: string
  items: { violationTypeId: string; penaltyPoints: number }[]
}

export async function findViolationByIdempotencyKey(db: DB, key: string) {
  return db.query.violations.findFirst({
    where: eq(violations.idempotencyKey, key),
    with: {
      student: { with: { class: true } },
      recordedByUser: true,
      items: { with: { violationType: true } },
    },
  })
}

export async function createViolation(db: DB, data: CreateViolationData) {
  const violationId = crypto.randomUUID()
  const now = Date.now()

  await db.batch([
    db.insert(violations).values({
      id: violationId,
      studentId: data.studentId,
      recordedBy: data.recordedBy,
      note: data.note,
      totalPoints: data.totalPoints,
      idempotencyKey: data.idempotencyKey,
      createdAt: now,
    }),
    ...data.items.map((it) =>
      db.insert(violationItems).values({
        id: crypto.randomUUID(),
        violationId,
        violationTypeId: it.violationTypeId,
        penaltyPoints: it.penaltyPoints,
      }),
    ),
  ])

  return db.query.violations.findFirst({
    where: eq(violations.id, violationId),
    with: {
      student: { with: { class: true } },
      recordedByUser: true,
      items: { with: { violationType: true } },
    },
  })
}

export interface ViolationListFilter {
  studentId?: string
  classId?: string
  recordedBy?: string
  period?: Period
  page: number
  limit: number
}

export async function listViolations(db: DB, f: ViolationListFilter) {
  const where: SQL[] = []
  if (f.studentId) where.push(eq(violations.studentId, f.studentId))
  if (f.classId) where.push(eq(students.classId, f.classId))
  if (f.recordedBy) where.push(eq(violations.recordedBy, f.recordedBy))
  if (f.period) {
    const [from, to] = rangeFor(f.period)
    where.push(gte(violations.createdAt, from), lte(violations.createdAt, to))
  }

  const rows = await db.query.violations.findMany({
    where: where.length ? and(...where) : undefined,
    with: {
      student: { with: { class: true } },
      recordedByUser: true,
      items: { with: { violationType: true } },
    },
    orderBy: [desc(violations.createdAt)],
    limit: f.limit,
    offset: (f.page - 1) * f.limit,
  })

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(violations)
    .innerJoin(students, eq(violations.studentId, students.id))
    .innerJoin(classes, eq(students.classId, classes.id))
    .where(where.length ? and(...where) : undefined)

  return { rows, total: Number(count) }
}

export async function listViolationsForStudent(db: DB, studentId: string, limit = 20) {
  return db.query.violations.findMany({
    where: eq(violations.studentId, studentId),
    with: {
      recordedByUser: true,
      items: { with: { violationType: true } },
    },
    orderBy: [desc(violations.createdAt)],
    limit,
  })
}

export async function deleteViolation(db: DB, id: string) {
  await db.delete(violationItems).where(eq(violationItems.violationId, id))
  await db.delete(violations).where(eq(violations.id, id))
}

export async function findViolationById(db: DB, id: string) {
  return db.query.violations.findFirst({
    where: eq(violations.id, id),
    with: { student: { with: { class: true } }, recordedByUser: true },
  })
}

// ── Aggregates ─────────────────────────────────────────────

export async function studentPointSum(db: DB, studentId: string): Promise<number> {
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${violations.totalPoints}), 0)` })
    .from(violations)
    .where(eq(violations.studentId, studentId))
  return Number(rows[0]?.total ?? 0)
}

export async function studentViolationCount(db: DB, studentId: string): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(violations)
    .where(eq(violations.studentId, studentId))
  return Number(count)
}

export async function countViolationsInRange(db: DB, from: number, to: number): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(violations)
    .where(and(gte(violations.createdAt, from), lte(violations.createdAt, to)))
  return Number(count)
}

export async function sumPointsInRange(db: DB, from: number, to: number): Promise<number> {
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${violations.totalPoints}), 0)` })
    .from(violations)
    .where(and(gte(violations.createdAt, from), lte(violations.createdAt, to)))
  return Number(rows[0]?.total ?? 0)
}

// ── Statistics ─────────────────────────────────────────────

export async function violationCountByType(db: DB, from: number, to: number) {
  return db
    .select({
      name: violationTypes.name,
      count: sql<number>`count(*)`,
      points: sql<number>`coalesce(sum(${violationItems.penaltyPoints}), 0)`,
    })
    .from(violationItems)
    .innerJoin(violationTypes, eq(violationItems.violationTypeId, violationTypes.id))
    .innerJoin(violations, eq(violationItems.violationId, violations.id))
    .where(and(gte(violations.createdAt, from), lte(violations.createdAt, to)))
    .groupBy(violationTypes.name)
    .orderBy(desc(sql<number>`count(*)`))
}

export async function violationCountByClass(db: DB, from: number, to: number) {
  return db
    .select({
      classId: classes.id,
      name: classes.name,
      count: sql<number>`count(*)`,
      points: sql<number>`coalesce(sum(${violations.totalPoints}), 0)`,
    })
    .from(violations)
    .innerJoin(students, eq(violations.studentId, students.id))
    .innerJoin(classes, eq(students.classId, classes.id))
    .where(and(gte(violations.createdAt, from), lte(violations.createdAt, to)))
    .groupBy(classes.id, classes.name)
    .orderBy(desc(sql<number>`count(*)`))
}

export async function violationSeries(db: DB, from: number, to: number, bucketMs: number, buckets: number) {
  const rows = await db
    .select({ createdAt: violations.createdAt, totalPoints: violations.totalPoints })
    .from(violations)
    .where(and(gte(violations.createdAt, from), lte(violations.createdAt, to)))

  const series = new Array<{ ts: number; count: number; points: number }>(buckets)
  for (let i = 0; i < buckets; i++) {
    series[i] = { ts: from + i * bucketMs, count: 0, points: 0 }
  }
  for (const r of rows) {
    const idx = Math.min(buckets - 1, Math.max(0, Math.floor((r.createdAt - from) / bucketMs)))
    series[idx].count += 1
    series[idx].points += r.totalPoints
  }
  return series
}
