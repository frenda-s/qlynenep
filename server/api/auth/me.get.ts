import { getActor } from '../../utils/permissions'
import { findUserById } from '../../repositories/users'

export default defineEventHandler(async (event) => {
  const ctx = await getActor(event)
  if (!ctx) {
    return { user: null }
  }
  const user = await findUserById(ctx.db, ctx.actor.userId)
  if (!user) return { user: null }
  return {
    user: {
      id: user.id,
      sub: user.id,
      username: user.username,
      fullName: user.fullName,
      name: user.fullName,
      role: user.role,
      status: user.status,
      permissions: ctx.actor.permissions,
      class_ids: ctx.actor.classIds,
    },
  }
})
