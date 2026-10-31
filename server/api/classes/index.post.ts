import { requirePermission } from '../../utils/permissions'
import { useDB } from '../../database/client'
import { createClass } from '../../services/classes.service'
import { createClassSchema } from '../../schemas/classes'
import { parseBody } from '../../utils/errors'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { actor } = await requirePermission(event, 'classes.manage')
  const db = useDB(event)
  const input = await parseBody(event, createClassSchema)
  const cls = await createClass(db, input)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'CREATE_CLASS',
    targetType: 'class',
    targetId: cls.id,
    metadata: { name: cls.name },
  })
  return { class: cls }
})
