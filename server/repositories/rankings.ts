import { and, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm'
import type { DB } from '../database/client'
import { classes, students, violations } from '../database/schema'

export interface RankingScope {
  /** Lọc theo một lớp cụ thể. */
  classId?: string
  /** null/undefined = tất cả lớp, [] = không lớp nào (giáo viên chưa phân công). */
  classIds?: string[] | null
  grade?: number
}

function studentScope(scope: RankingScope): SQL[] {
  const where: SQL[] = []
  if (scope.classId) where.push(eq(students.classId, scope.classId))
  if (scope.grade != null) where.push(eq(classes.grade, scope.grade))
  return where
}

export function isImpossibleScope(scope: RankingScope): boolean {
  return scope.classIds !== null && scope.classIds !== undefined && scope.classIds.length === 0
}

export async function studentPointsInRange(
  db: DB,
  from: number,
  to: number,
  scope: RankingScope = {},
) {
  if (isImpossibleScope(scope)) return []

  const where: SQL[] = [eq(students.status, 'active'), ...studentScope(scope)]
  if (scope.classIds !== null && scope.classIds !== undefined) {
    where.push(inArray(students.classId, scope.classIds))
  }

  return db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      studentCode: students.studentCode,
      classId: classes.id,
      className: classes.name,
      grade: classes.grade,
      academicYear: classes.academicYear,
      points: sql<number>`100 + coalesce(sum(${violations.totalPoints}), 0)`,
      violationCount: sql<number>`count(${violations.id})`,
    })
    .from(students)
    .innerJoin(classes, eq(students.classId, classes.id))
    .leftJoin(
      violations,
      and(
        eq(violations.studentId, students.id),
        gte(violations.createdAt, from),
        lte(violations.createdAt, to),
      ),
    )
    .where(and(...where))
    .groupBy(
      students.id,
      students.fullName,
      students.studentCode,
      classes.id,
      classes.name,
      classes.grade,
      classes.academicYear,
    )
}

export async function classViolationAggregate(
  db: DB,
  from: number,
  to: number,
  scope: RankingScope = {},
) {
  if (isImpossibleScope(scope)) return []

  const where: SQL[] = [eq(classes.status, 'active')]
  if (scope.classId) where.push(eq(classes.id, scope.classId))
  if (scope.grade != null) where.push(eq(classes.grade, scope.grade))
  if (scope.classIds !== null && scope.classIds !== undefined) {
    where.push(inArray(classes.id, scope.classIds))
  }

  return db
    .select({
      classId: classes.id,
      name: classes.name,
      grade: classes.grade,
      academicYear: classes.academicYear,
      violationCount: sql<number>`count(${violations.id})`,
      totalPoints: sql<number>`coalesce(sum(${violations.totalPoints}), 0)`,
    })
    .from(classes)
    .leftJoin(students, and(eq(students.classId, classes.id), eq(students.status, 'active')))
    .leftJoin(
      violations,
      and(
        eq(violations.studentId, students.id),
        gte(violations.createdAt, from),
        lte(violations.createdAt, to),
      ),
    )
    .where(and(...where))
    .groupBy(classes.id, classes.name, classes.grade, classes.academicYear)
}

export async function classStudentCounts(db: DB, scope: RankingScope = {}) {
  if (isImpossibleScope(scope)) return []

  const where: SQL[] = [eq(classes.status, 'active')]
  if (scope.classId) where.push(eq(classes.id, scope.classId))
  if (scope.grade != null) where.push(eq(classes.grade, scope.grade))
  if (scope.classIds !== null && scope.classIds !== undefined) {
    where.push(inArray(classes.id, scope.classIds))
  }

  return db
    .select({
      classId: classes.id,
      size: sql<number>`count(${students.id})`,
    })
    .from(classes)
    .leftJoin(students, and(eq(students.classId, classes.id), eq(students.status, 'active')))
    .where(and(...where))
    .groupBy(classes.id)
}
