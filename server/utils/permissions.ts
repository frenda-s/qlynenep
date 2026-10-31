import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useDB, type DB } from '../database/client'
import { classes } from '../database/schema'
import { getAuthUser } from './auth'
import { forbidden, unauthorized } from './errors'
import type { SessionPayload } from './jwt'
import { findUserById } from '../repositories/users'
import { effectivePermissions, type Permission } from './rbac'

export * from './rbac'

export interface Actor extends SessionPayload {
  userId: string
  permissions: Permission[]
  /** Danh sách lớp được phép truy cập. null = không giới hạn. */
  classIds: string[] | null
}

/** Tạo actor từ session, đọc lại DB để quyền thay đổi có hiệu lực ngay. */
export async function buildActor(db: DB, session: SessionPayload): Promise<Actor | null> {
  const user = await findUserById(db, session.sub)
  if (!user || user.status !== 'active') return null

  let classIds: string[] | null = null
  if (user.role === 'TEACHER') {
    const rows = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.teacherId, user.id))
    classIds = rows.map((r) => r.id)
  }

  return {
    sub: user.id,
    userId: user.id,
    role: user.role,
    name: user.fullName,
    permissions: effectivePermissions(user),
    classIds,
  }
}

export async function getActor(event: H3Event): Promise<{ db: DB; actor: Actor } | null> {
  const session = await getAuthUser(event)
  if (!session) return null
  const db = useDB(event)
  const actor = await buildActor(db, session)
  if (!actor) return null
  return { db, actor }
}

export async function requireActor(event: H3Event): Promise<{ db: DB; actor: Actor }> {
  const ctx = await getActor(event)
  if (!ctx) unauthorized('Chưa đăng nhập hoặc tài khoản đã bị khóa')
  return ctx
}

export async function requirePermission(
  event: H3Event,
  permission: Permission,
): Promise<{ db: DB; actor: Actor }> {
  const ctx = await requireActor(event)
  if (!ctx.actor.permissions.includes(permission)) {
    forbidden(`Không có quyền: ${permission}`)
  }
  return ctx
}

export async function requireAnyPermission(
  event: H3Event,
  permissions: Permission[],
): Promise<{ db: DB; actor: Actor }> {
  const ctx = await requireActor(event)
  if (!permissions.some((p) => ctx.actor.permissions.includes(p))) {
    forbidden('Không có quyền truy cập')
  }
  return ctx
}

export function canAccessClass(actor: Actor, classId: string | null | undefined): boolean {
  if (!classId) return true
  if (actor.classIds === null) return true
  return actor.classIds.includes(classId)
}

export function assertClassAccess(actor: Actor, classId: string): void {
  if (!canAccessClass(actor, classId)) {
    forbidden('Bạn không phụ trách lớp này')
  }
}

/** true nếu actor bị giới hạn theo lớp (giáo viên chủ nhiệm). */
export function isClassScoped(actor: Actor): boolean {
  return actor.classIds !== null
}
