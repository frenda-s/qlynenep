import { requirePermission } from '../../utils/permissions'
import { listClassesWithStats } from '../../services/classes.service'

export default defineEventHandler(async (event) => {
  const { db, actor } = await requirePermission(event, 'classes.view')
  // Giáo viên chỉ thấy lớp mình phụ trách; quản trị viên thấy tất cả.
  const classes = await listClassesWithStats(db, actor.classIds)
  return { classes }
})
