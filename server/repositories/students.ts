import { and, desc, eq, like, or, sql, type SQL } from 'drizzle-orm'
import type { DB } from '../database/client'
import { classes, students, users, violations, violationItems, violationTypes, type NewStudent } from '../database/schema'

// ── Students ──────────────────────────────────────────────

export interface StudentListFilter {
  q?: string
  classId?: string
  grade?: number
  status?: 'active' | 'inactive'
  page: number
  limit: number
}

export async function listStudents(db: DB, f: StudentListFilter) {
  const where: SQL[] = []
  if (f.q) {
    const term = `%${f.q}%`
    where.push(or(like(students.fullName, term), like(students.studentCode, term)))
  }
  if (f.classId) where.push(eq(students.classId, f.classId))
  if (f.grade != null) where.push(eq(classes.grade, f.grade))
  if (f.status) where.push(eq(students.status, f.status))

  const rows = await db
    .select({
      id: students.id,
      studentCode: students.studentCode,
      fullName: students.fullName,
      qrCode: students.qrCode,
      classId: students.classId,
      className: classes.name,
      classGrade: classes.grade,
      status: students.status,
      hasPhoto: sql<number>`case when ${students.photo} is not null then 1 else 0 end`,
      createdAt: students.createdAt,
      points: sql<number>`100 + coalesce(sum(${violations.totalPoints}), 0)`,
      violationCount: sql<number>`count(${violations.id})`,
    })
    .from(students)
    .innerJoin(classes, eq(students.classId, classes.id))
    .leftJoin(violations, eq(violations.studentId, students.id))
    .where(where.length ? and(...where) : undefined)
    .groupBy(students.id, classes.name, classes.grade)
    .orderBy(desc(students.createdAt))
    .limit(f.limit)
    .offset((f.page - 1) * f.limit)

  const [{ count }] = await db
    .select({ count: sql<number>`count(distinct ${students.id})` })
    .from(students)
    .innerJoin(classes, eq(students.classId, classes.id))
    .where(where.length ? and(...where) : undefined)

  return { rows, total: Number(count) }
}

export async function findStudentById(db: DB, id: string) {
  return db.query.students.findFirst({ where: eq(students.id, id), with: { class: true } })
}

export async function listStudentsForPrint(db: DB, classId?: string) {
  return db
    .select({
      id: students.id,
      studentCode: students.studentCode,
      fullName: students.fullName,
      qrCode: students.qrCode,
      photo: students.photo,
      className: classes.name,
      status: students.status,
    })
    .from(students)
    .innerJoin(classes, eq(students.classId, classes.id))
    .where(classId ? eq(students.classId, classId) : undefined)
    .orderBy(classes.name, students.fullName)
}

export async function findStudentByCode(db: DB, code: string) {
  return db.query.students.findFirst({ where: eq(students.studentCode, code), with: { class: true } })
}

export async function findStudentByQr(db: DB, qrCode: string) {
  return db.query.students.findFirst({ where: eq(students.qrCode, qrCode), with: { class: true } })
}

export async function createStudent(db: DB, input: NewStudent) {
  const [row] = await db.insert(students).values(input).returning()
  return row
}

export async function updateStudent(db: DB, id: string, patch: Partial<NewStudent>) {
  const [row] = await db
    .update(students)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(students.id, id))
    .returning()
  return row
}

export async function countStudents(db: DB): Promise<number> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(students)
  return Number(count)
}

export async function countActiveStudents(db: DB): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .where(eq(students.status, 'active'))
  return Number(count)
}

// ── Classes ────────────────────────────────────────────────

export async function listClasses(db: DB) {
  return db.query.classes.findMany({
    orderBy: [classes.grade, classes.name],
    with: { teacher: true },
  })
}

export async function findClassById(db: DB, id: string) {
  return db.query.classes.findFirst({ where: eq(classes.id, id), with: { teacher: true } })
}

export async function countClasses(db: DB): Promise<number> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(classes)
  return Number(count)
}

// ── Violation types ────────────────────────────────────────

export async function listViolationTypes(db: DB, activeOnly = false) {
  return db.query.violationTypes.findMany({
    where: activeOnly ? eq(violationTypes.isActive, true) : undefined,
    orderBy: [desc(violationTypes.penaltyPoints)],
  })
}

export async function findViolationTypeById(db: DB, id: string) {
  return db.query.violationTypes.findFirst({ where: eq(violationTypes.id, id) })
}
