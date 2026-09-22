import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { createClass } from '../../services/classes.service'
import { createClassSchema } from '../../schemas/classes'
import { parseBody } from '../../utils/errors'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const input = await parseBody(event, createClassSchema)
  const cls = await createClass(db, input)
  await writeAudit(db, {
    userId: user.sub,
    action: 'CREATE_CLASS',
    targetType: 'class',
    targetId: cls.id,
    metadata: { name: cls.name },
  })
  return { class: cls }
})
