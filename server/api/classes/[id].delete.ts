import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { deleteClass } from '../../services/classes.service'
import { parseRouteParam } from '../../utils/query'
import { writeAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const id = parseRouteParam(event, 'id')
  const cls = await deleteClass(db, id)
  await writeAudit(db, {
    userId: user.sub,
    action: 'UPDATE_CLASS',
    targetType: 'class',
    targetId: id,
    metadata: { status: 'inactive' },
  })
  return { class: cls }
})
