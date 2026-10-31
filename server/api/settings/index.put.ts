import { requirePermission } from '../../utils/permissions'
import { setSetting } from '../../repositories/settings'
import { updateSettingsSchema } from '../../schemas/settings'
import { parseBody } from '../../utils/errors'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'settings.manage')
  const input = await parseBody(event, updateSettingsSchema)
  if (input.school_name !== undefined) {
    await setSetting(db, 'school_name', input.school_name)
  }
  await writeAudit(db, {
    userId: actor.userId,
    action: 'UPDATE_SETTINGS',
    targetType: 'settings',
    metadata: input,
  })
  return { ok: true }
})
