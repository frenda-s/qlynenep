import { and, eq, gte, lte, sql } from 'drizzle-orm'
import type { DB } from '../database/client'
import { classes, students, violations } from '../database/schema'

export async function studentPointsInRange(db: DB, from: number, to: number) {
  return db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      studentCode: students.studentCode,
      classId: classes.id,
      className: classes.name,
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
    .where(eq(students.status, 'active'))
    .groupBy(students.id, students.fullName, students.studentCode, classes.id, classes.name)
}

export async function classViolationAggregate(db: DB, from: number, to: number) {
  return db
    .select({
      classId: classes.id,
      name: classes.name,
      violationCount: sql<number>`count(${violations.id})`,
      totalPoints: sql<number>`coalesce(sum(${violations.totalPoints}), 0)`,
    })
    .from(classes)
    .leftJoin(students, eq(students.classId, classes.id))
    .leftJoin(
      violations,
      and(
        eq(violations.studentId, students.id),
        gte(violations.createdAt, from),
        lte(violations.createdAt, to),
      ),
    )
    .where(eq(classes.status, 'active'))
    .groupBy(classes.id, classes.name)
}

export async function classStudentCounts(db: DB) {
  return db
    .select({
      classId: classes.id,
      size: sql<number>`count(${students.id})`,
    })
    .from(classes)
    .leftJoin(students, and(eq(students.classId, classes.id), eq(students.status, 'active')))
    .where(eq(classes.status, 'active'))
    .groupBy(classes.id)
}
