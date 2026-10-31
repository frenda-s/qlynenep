import { requireActor } from '../../utils/permissions'
import { listSettings } from '../../repositories/settings'

export default defineEventHandler(async (event) => {
  const { db } = await requireActor(event)
  const rows = await listSettings(db)
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value ?? ''
  return {
    settings: {
      school_name: map.school_name ?? '',
    },
  }
})
