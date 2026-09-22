import { eq, and } from 'drizzle-orm'
import type { DB } from '../database/client'
import { users, type NewUser, type User } from '../database/schema'

export async function findUserByUsername(db: DB, username: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.username, username) })
}

export async function findUserById(db: DB, id: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, id) })
}

export async function listUsers(db: DB): Promise<User[]> {
  return db.query.users.findMany({ orderBy: [users.createdAt] })
}

export async function createUser(db: DB, input: NewUser): Promise<User> {
  const [row] = await db.insert(users).values(input).returning()
  return row
}

export async function updateUser(db: DB, id: string, patch: Partial<NewUser>): Promise<User | undefined> {
  const [row] = await db
    .update(users)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(users.id, id))
    .returning()
  return row
}

export async function findTeacherByClass(db: DB, classId: string): Promise<User | undefined> {
  const cls = await db.query.classes.findFirst({ where: eq(classes.id, classId) })
  if (!cls?.teacherId) return undefined
  return findUserById(db, cls.teacherId)
}

import { classes } from '../database/schema'
export { and }
