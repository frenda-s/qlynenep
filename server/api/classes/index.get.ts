import { requireAuth } from '../../utils/auth'
import { useDB } from '../../database/client'
import { listClassesWithStats } from '../../services/classes.service'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDB(event)
  return { classes: await listClassesWithStats(db) }
})
