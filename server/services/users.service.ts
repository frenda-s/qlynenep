import { and, eq, inArray, ne, notInArray, sql } from 'drizzle-orm'
import type { DB } from '../database/client'
import {
  classes,
  users,
  type NewUser,
  type Role,
  type User,
} from '../database/schema'
import {
  PERMISSIONS,
  ROLE_LABELS,
  effectivePermissions,
  parsePermissions,
  type Permission,
} from '../utils/rbac'
import { hashPassword } from '../utils/hash'
import { badRequest, conflict, notFound } from '../utils/errors'
import type { CreateUserInput, UpdateUserInput } from '../schemas/users'

function cleanPermissions(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null
  if (!Array.isArray(raw)) return null
  const valid = raw.filter((p): p is Permission => PERMISSIONS.includes(p as Permission))
  return JSON.stringify([...new Set(valid)])
}

async function classMapForUsers(db: DB) {
  const rows = await db
    .select({ id: classes.id, name: classes.name, teacherId: classes.teacherId })
    .from(classes)
  const map = new Map<string, { id: string; name: string }[]>()
  for (const row of rows) {
    if (!row.teacherId) continue
    const list = map.get(row.teacherId) ?? []
    list.push({ id: row.id, name: row.name })
    map.set(row.teacherId, list)
  }
  return map
}

export function serializeUser(
  user: User,
  assignedClasses: { id: string; name: string }[] = [],
) {
  const custom = parsePermissions(user.permissions)
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    full_name: user.fullName,
    role: user.role,
    role_label: ROLE_LABELS[user.role],
    status: user.status,
    permissions: effectivePermissions(user),
    custom_permissions: custom,
    is_custom_permissions: custom !== null,
    class_ids: assignedClasses.map((c) => c.id),
    classes: assignedClasses,
    last_login_at: user.lastLoginAt,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  }
}

export async function listUsersWithMeta(db: DB) {
  const [rows, map] = await Promise.all([
    db.query.users.findMany({ orderBy: [users.createdAt] }),
    classMapForUsers(db),
  ])
  return rows.map((u) => serializeUser(u, map.get(u.id) ?? []))
}

export async function getUserWithMeta(db: DB, id: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!user) notFound('Không tìm thấy tài khoản')
  const assigned = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(eq(classes.teacherId, id))
  return serializeUser(user, assigned)
}

async function assertUsernameAvailable(db: DB, username: string, exceptId?: string) {
  const existing = await db.query.users.findFirst({ where: eq(users.username, username) })
  if (existing && existing.id !== exceptId) conflict('Tên đăng nhập đã tồn tại')
}

async function syncTeacherClasses(db: DB, userId: string, classIds: string[]) {
  // Bỏ phân công cũ không còn trong danh sách.
  if (classIds.length > 0) {
    await db
      .update(classes)
      .set({ teacherId: null, updatedAt: Date.now() })
      .where(and(eq(classes.teacherId, userId), notInArray(classes.id, classIds)))
  } else {
    await db
      .update(classes)
      .set({ teacherId: null, updatedAt: Date.now() })
      .where(eq(classes.teacherId, userId))
  }

  if (classIds.length > 0) {
    const found = await db
      .select({ id: classes.id })
      .from(classes)
      .where(inArray(classes.id, classIds))
    if (found.length !== classIds.length) badRequest('Một hoặc nhiều lớp không tồn tại')
    await db
      .update(classes)
      .set({ teacherId: userId, updatedAt: Date.now() })
      .where(inArray(classes.id, classIds))
  }
}

async function activeAdminCount(db: DB) {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.role, 'ADMIN'), eq(users.status, 'active')))
  return Number(rows[0]?.count ?? 0)
}

export async function createUserByAdmin(db: DB, input: CreateUserInput) {
  const username = input.username.trim().toLowerCase()
  await assertUsernameAvailable(db, username)

  const row: NewUser = {
    username,
    passwordHash: await hashPassword(input.password),
    fullName: input.full_name.trim(),
    role: input.role,
    status: input.status,
    permissions: input.role === 'ADMIN' ? null : cleanPermissions(input.permissions),
  }
  const [created] = await db.insert(users).values(row).returning()
  if (!created) badRequest('Không tạo được tài khoản')

  if (input.role === 'TEACHER' && input.class_ids) {
    await syncTeacherClasses(db, created.id, input.class_ids)
  }
  return getUserWithMeta(db, created.id)
}

export async function updateUserByAdmin(
  db: DB,
  id: string,
  input: UpdateUserInput,
  actorId: string,
) {
  const existing = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!existing) notFound('Không tìm thấy tài khoản')

  const nextRole: Role = input.role ?? existing.role
  const nextStatus = input.status ?? existing.status

  const removingAdmin =
    existing.role === 'ADMIN' &&
    (nextRole !== 'ADMIN' || nextStatus !== 'active')
  if (removingAdmin) {
    if (id === actorId) badRequest('Không thể tự hạ quyền hoặc khóa tài khoản của mình')
    if ((await activeAdminCount(db)) <= 1) {
      badRequest('Hệ thống cần ít nhất một quản trị viên đang hoạt động')
    }
  }

  const patch: Partial<NewUser> = {
    fullName: input.full_name?.trim(),
    role: nextRole,
    status: nextStatus,
  }
  if (input.password) patch.passwordHash = await hashPassword(input.password)
  if (nextRole === 'ADMIN') {
    patch.permissions = null
  } else if (input.permissions !== undefined) {
    patch.permissions = cleanPermissions(input.permissions)
  }

  await db.update(users).set({ ...patch, updatedAt: Date.now() }).where(eq(users.id, id))

  if (nextRole !== 'TEACHER') {
    await db
      .update(classes)
      .set({ teacherId: null, updatedAt: Date.now() })
      .where(eq(classes.teacherId, id))
  } else if (input.class_ids !== undefined) {
    await syncTeacherClasses(db, id, input.class_ids ?? [])
  }

  return getUserWithMeta(db, id)
}

export async function deactivateUser(db: DB, id: string, actorId: string) {
  const existing = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!existing) notFound('Không tìm thấy tài khoản')
  if (id === actorId) badRequest('Không thể tự khóa tài khoản của mình')
  if (existing.role === 'ADMIN' && (await activeAdminCount(db)) <= 1) {
    badRequest('Hệ thống cần ít nhất một quản trị viên đang hoạt động')
  }

  await db
    .update(users)
    .set({ status: 'inactive', updatedAt: Date.now() })
    .where(eq(users.id, id))
  await db
    .update(classes)
    .set({ teacherId: null, updatedAt: Date.now() })
    .where(eq(classes.teacherId, id))

  return getUserWithMeta(db, id)
}

export async function resetUserPassword(db: DB, id: string, password: string) {
  const existing = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!existing) notFound('Không tìm thấy tài khoản')
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), updatedAt: Date.now() })
    .where(eq(users.id, id))
  return { ok: true }
}

export async function teacherClassIds(db: DB, userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.teacherId, userId), ne(classes.status, 'inactive')))
  return rows.map((r) => r.id)
}
