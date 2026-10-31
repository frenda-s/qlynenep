import type { Role, User } from '../database/schema'

/**
 * Danh mục quyền chi tiết. Quyền của một tài khoản = quyền mặc định của role
 * (hoặc danh sách ghi đè trong cột users.permissions).
 *
 * File này KHÔNG import H3/Nitro để có thể dùng trong unit test và seed.
 */
export const PERMISSIONS = [
  'students.view',
  'students.create',
  'students.edit',
  'students.delete',
  'students.import',
  'students.print',
  'classes.view',
  'classes.manage',
  'violations.view',
  'violations.create',
  'violations.delete',
  'violation_types.manage',
  'rankings.view',
  'statistics.view',
  'users.manage',
  'logs.view',
  'settings.manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const PERMISSION_GROUPS: {
  group: string
  items: { key: Permission; label: string; description: string }[]
}[] = [
  {
    group: 'Học sinh',
    items: [
      { key: 'students.view', label: 'Xem học sinh', description: 'Xem danh sách và hồ sơ học sinh' },
      { key: 'students.create', label: 'Thêm học sinh', description: 'Tạo hồ sơ học sinh mới' },
      { key: 'students.edit', label: 'Sửa học sinh', description: 'Cập nhật hồ sơ, ảnh thẻ, lớp' },
      { key: 'students.delete', label: 'Vô hiệu hóa học sinh', description: 'Ngừng theo dõi học sinh' },
      { key: 'students.import', label: 'Nhập CSV', description: 'Import danh sách học sinh' },
      { key: 'students.print', label: 'In thẻ học sinh', description: 'In thẻ, bảng tên và QR' },
    ],
  },
  {
    group: 'Lớp học',
    items: [
      { key: 'classes.view', label: 'Xem lớp', description: 'Xem lớp học và sĩ số' },
      { key: 'classes.manage', label: 'Quản lý lớp', description: 'Tạo, sửa, phân công giáo viên' },
    ],
  },
  {
    group: 'Vi phạm',
    items: [
      { key: 'violations.view', label: 'Xem vi phạm', description: 'Xem lịch sử ghi nhận vi phạm' },
      { key: 'violations.create', label: 'Ghi nhận vi phạm', description: 'Quét QR và tạo biên bản' },
      { key: 'violations.delete', label: 'Xóa vi phạm', description: 'Xóa biên bản ghi nhận sai' },
      { key: 'violation_types.manage', label: 'Quản lý loại vi phạm', description: 'Thêm, sửa, tắt loại vi phạm' },
    ],
  },
  {
    group: 'Báo cáo',
    items: [
      { key: 'rankings.view', label: 'Xem xếp hạng', description: 'Bảng xếp hạng học sinh và lớp' },
      { key: 'statistics.view', label: 'Xem thống kê', description: 'Dashboard và báo cáo thống kê' },
    ],
  },
  {
    group: 'Hệ thống',
    items: [
      { key: 'users.manage', label: 'Quản lý tài khoản', description: 'Tạo, sửa, phân quyền tài khoản' },
      { key: 'logs.view', label: 'Xem nhật ký', description: 'Audit log hoạt động hệ thống' },
      { key: 'settings.manage', label: 'Cài đặt hệ thống', description: 'Tên trường và cấu hình in' },
    ],
  },
]

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  DISCIPLINE: 'Ban nề nếp',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Toàn quyền hệ thống, quản lý tài khoản và phân quyền',
  TEACHER: 'Giáo viên chủ nhiệm: xem lớp mình, ghi nhận và theo dõi nề nếp',
  DISCIPLINE: 'Ban nề nếp: quét QR và ghi nhận vi phạm',
}

/** Quyền mặc định khi tài khoản chưa được tùy chỉnh. */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [...PERMISSIONS],
  TEACHER: [
    'students.view',
    'students.print',
    'classes.view',
    'violations.view',
    'violations.create',
    'rankings.view',
    'statistics.view',
  ],
  DISCIPLINE: ['violations.view', 'violations.create'],
}

export function parsePermissions(raw: string | null | undefined): Permission[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((p): p is Permission => PERMISSIONS.includes(p))
  } catch {
    return null
  }
}

export function effectivePermissions(user: Pick<User, 'role' | 'permissions'>): Permission[] {
  // ADMIN luôn có toàn quyền để tránh tự khóa mình khỏi hệ thống.
  if (user.role === 'ADMIN') return [...PERMISSIONS]
  const custom = parsePermissions(user.permissions)
  return custom ?? [...ROLE_PERMISSIONS[user.role]]
}
