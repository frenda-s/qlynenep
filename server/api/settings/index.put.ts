import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { setSetting } from '../../repositories/settings'
import { updateSettingsSchema } from '../../schemas/settings'
import { parseBody } from '../../utils/errors'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const input = await parseBody(event, updateSettingsSchema)
  if (input.school_name !== undefined) {
    await setSetting(db, 'school_name', input.school_name)
  }
  await writeAudit(db, {
    userId: user.sub,
    action: 'UPDATE_SETTINGS',
    targetType: 'settings',
    metadata: input,
  })
  return { ok: true }
})
