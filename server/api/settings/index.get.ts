import { requireAuth } from '../../utils/auth'
import { useDB } from '../../database/client'
import { listSettings } from '../../repositories/settings'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDB(event)
  const rows = await listSettings(db)
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value ?? ''
  return {
    settings: {
      school_name: map.school_name ?? '',
    },
  }
})
