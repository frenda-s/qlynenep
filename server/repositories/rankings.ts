import { and, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm'
import type { DB } from '../database/client'
import { classes, students, violationItems, violations, violationTypes } from '../database/schema'

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

export interface ClassViolationDetail {
  classId: string
  typeName: string
  count: number
  points: number
  studentCount: number
}

/** Chi tiết vi phạm theo từng loại cho mỗi lớp trong khoảng thời gian. */
export async function classViolationDetails(
  db: DB,
  from: number,
  to: number,
  scope: RankingScope = {},
): Promise<ClassViolationDetail[]> {
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
      typeName: violationTypes.name,
      count: sql<number>`count(distinct ${violations.id})`,
      points: sql<number>`coalesce(sum(${violationItems.penaltyPoints}), 0)`,
      studentCount: sql<number>`count(distinct ${students.id})`,
    })
    .from(classes)
    .innerJoin(students, and(eq(students.classId, classes.id), eq(students.status, 'active')))
    .innerJoin(
      violations,
      and(
        eq(violations.studentId, students.id),
        gte(violations.createdAt, from),
        lte(violations.createdAt, to),
      ),
    )
    .innerJoin(violationItems, eq(violationItems.violationId, violations.id))
    .innerJoin(violationTypes, eq(violationTypes.id, violationItems.violationTypeId))
    .where(and(...where))
    .groupBy(classes.id, violationTypes.id, violationTypes.name)
}

export interface StudentViolationDetail {
  studentId: string
  typeName: string
  count: number
  points: number
}

/** Chi tiết vi phạm theo từng loại cho mỗi học sinh trong khoảng thời gian. */
export async function studentViolationDetails(
  db: DB,
  from: number,
  to: number,
  scope: RankingScope = {},
): Promise<StudentViolationDetail[]> {
  if (isImpossibleScope(scope)) return []

  const where: SQL[] = [eq(students.status, 'active'), ...studentScope(scope)]
  if (scope.classIds !== null && scope.classIds !== undefined) {
    where.push(inArray(students.classId, scope.classIds))
  }

  return db
    .select({
      studentId: students.id,
      typeName: violationTypes.name,
      count: sql<number>`count(distinct ${violations.id})`,
      points: sql<number>`coalesce(sum(${violationItems.penaltyPoints}), 0)`,
    })
    .from(students)
    .innerJoin(classes, eq(students.classId, classes.id))
    .innerJoin(
      violations,
      and(
        eq(violations.studentId, students.id),
        gte(violations.createdAt, from),
        lte(violations.createdAt, to),
      ),
    )
    .innerJoin(violationItems, eq(violationItems.violationId, violations.id))
    .innerJoin(violationTypes, eq(violationTypes.id, violationItems.violationTypeId))
    .where(and(...where))
    .groupBy(students.id, violationTypes.id, violationTypes.name)
}

export interface ViolationDetailRow {
  id: string
  createdAt: number
  note: string | null
  totalPoints: number
  types: string
  fullName: string
  studentCode: string
  className: string
}

/** Danh sách vi phạm chi tiết (gộp tên loại vi phạm) cho drill-down. */
export async function violationDetailRows(
  db: DB,
  from: number,
  to: number,
  filter: { studentId?: string; classId?: string; classIds?: string[] | null },
): Promise<ViolationDetailRow[]> {
  if (filter.classIds !== null && filter.classIds !== undefined && filter.classIds.length === 0) {
    return []
  }

  const where: SQL[] = [gte(violations.createdAt, from), lte(violations.createdAt, to)]
  if (filter.studentId) where.push(eq(violations.studentId, filter.studentId))
  if (filter.classId) where.push(eq(students.classId, filter.classId))
  if (filter.classIds !== null && filter.classIds !== undefined) {
    where.push(inArray(students.classId, filter.classIds))
  }

  return db
    .select({
      id: violations.id,
      createdAt: violations.createdAt,
      note: violations.note,
      totalPoints: violations.totalPoints,
      types: sql<string>`group_concat(distinct ${violationTypes.name}, ', ')`,
      fullName: students.fullName,
      studentCode: students.studentCode,
      className: classes.name,
    })
    .from(violations)
    .innerJoin(students, eq(violations.studentId, students.id))
    .innerJoin(classes, eq(students.classId, classes.id))
    .leftJoin(violationItems, eq(violationItems.violationId, violations.id))
    .leftJoin(violationTypes, eq(violationTypes.id, violationItems.violationTypeId))
    .where(and(...where))
    .groupBy(violations.id)
    .orderBy(sql`${violations.createdAt} desc`)
    .limit(100)
}
