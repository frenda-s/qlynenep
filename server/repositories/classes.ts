import { and, eq, inArray, sql } from 'drizzle-orm'
import type { DB } from '../database/client'
import { classes, students, type NewClass } from '../database/schema'

export async function listClasses(db: DB, classIds?: string[] | null) {
  // classIds === null/undefined → không giới hạn; [] → không có lớp nào.
  if (classIds && classIds.length === 0) return []
  return db.query.classes.findMany({
    where: classIds ? inArray(classes.id, classIds) : undefined,
    orderBy: [classes.grade, classes.name],
    with: { teacher: true },
  })
}

export async function findClassById(db: DB, id: string) {
  return db.query.classes.findFirst({ where: eq(classes.id, id), with: { teacher: true } })
}

export async function createClass(db: DB, input: NewClass) {
  const [row] = await db.insert(classes).values(input).returning()
  return row
}

export async function updateClass(db: DB, id: string, patch: Partial<NewClass>) {
  const [row] = await db
    .update(classes)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(classes.id, id))
    .returning()
  return row
}

export async function countStudentsInClass(db: DB, classId: string): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .where(eq(students.classId, classId))
  return Number(count)
}

export async function countActiveClasses(db: DB, classIds?: string[] | null): Promise<number> {
  if (classIds && classIds.length === 0) return 0
  const where = [eq(classes.status, 'active')]
  if (classIds !== null && classIds !== undefined) where.push(inArray(classes.id, classIds))
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(classes)
    .where(and(...where))
  return Number(count)
}
