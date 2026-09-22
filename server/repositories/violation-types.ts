import { desc, eq } from 'drizzle-orm'
import type { DB } from '../database/client'
import { violationTypes, type NewViolationType } from '../database/schema'

export async function listViolationTypes(db: DB, activeOnly = false) {
  return db.query.violationTypes.findMany({
    where: activeOnly ? eq(violationTypes.isActive, true) : undefined,
    orderBy: [desc(violationTypes.penaltyPoints)],
  })
}

export async function findViolationTypeById(db: DB, id: string) {
  return db.query.violationTypes.findFirst({ where: eq(violationTypes.id, id) })
}

export async function createViolationType(db: DB, input: NewViolationType) {
  const [row] = await db.insert(violationTypes).values(input).returning()
  return row
}

export async function updateViolationType(db: DB, id: string, patch: Partial<NewViolationType>) {
  const [row] = await db
    .update(violationTypes)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(violationTypes.id, id))
    .returning()
  return row
}

export async function deleteViolationType(db: DB, id: string) {
  await db.delete(violationTypes).where(eq(violationTypes.id, id))
}
