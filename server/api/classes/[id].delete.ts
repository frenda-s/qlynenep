import { requirePermission } from '../../utils/permissions'
import { useDB } from '../../database/client'
import { deleteClass } from '../../services/classes.service'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const { actor } = await requirePermission(event, 'classes.manage')
  const db = useDB(event)
  const id = parseRouteParam(event, 'id')
  const cls = await deleteClass(db, id)
  await writeAudit(db, {
    userId: actor.userId,
    action: 'UPDATE_CLASS',
    targetType: 'class',
    targetId: id,
    metadata: { status: 'inactive' },
  })
  return { class: cls }
})
