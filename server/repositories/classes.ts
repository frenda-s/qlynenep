import { eq, sql } from 'drizzle-orm'
import type { DB } from '../database/client'
import { classes, students, type NewClass } from '../database/schema'

export async function listClasses(db: DB) {
  return db.query.classes.findMany({
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

export async function countActiveClasses(db: DB): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(classes)
    .where(eq(classes.status, 'active'))
  return Number(count)
}
