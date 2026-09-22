import { eq } from 'drizzle-orm'
import type { DB } from '../database/client'
import { schoolSettings } from '../database/schema'

export async function listSettings(db: DB) {
  return db.select().from(schoolSettings)
}

export async function getSetting(db: DB, key: string) {
  const [row] = await db.select().from(schoolSettings).where(eq(schoolSettings.key, key))
  return row
}

export async function setSetting(db: DB, key: string, value: string) {
  const existing = await getSetting(db, key)
  if (existing) {
    await db
      .update(schoolSettings)
      .set({ value, updatedAt: Date.now() })
      .where(eq(schoolSettings.id, existing.id))
  } else {
    await db.insert(schoolSettings).values({ key, value })
  }
}
