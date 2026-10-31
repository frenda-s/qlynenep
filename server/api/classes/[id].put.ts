import { requirePermission } from '../../utils/permissions'
import { useDB } from '../../database/client'
import { updateClass } from '../../services/classes.service'
import { updateClassSchema } from '../../schemas/classes'
import { parseBody } from '../../utils/errors'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { actor } = await requirePermission(event, 'classes.manage')
  const db = useDB(event)
  const id = parseRouteParam(event, 'id')
  const input = await parseBody(event, updateClassSchema)
  const cls = await updateClass(db, id, input)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'UPDATE_CLASS',
    targetType: 'class',
    targetId: id,
    metadata: input,
  })
  return { class: cls }
})
