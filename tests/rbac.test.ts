import { describe, it, expect } from 'vitest'
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  effectivePermissions,
  parsePermissions,
} from '../server/utils/rbac'
import { classifyConduct } from '../server/utils/conduct'

describe('rbac', () => {
  it('admin luôn có toàn quyền', () => {
    expect(effectivePermissions({ role: 'ADMIN', permissions: '[]' })).toEqual([...PERMISSIONS])
  })

  it('teacher dùng quyền mặc định khi chưa tùy chỉnh', () => {
    expect(effectivePermissions({ role: 'TEACHER', permissions: null })).toEqual(
      ROLE_PERMISSIONS.TEACHER,
    )
    expect(effectivePermissions({ role: 'TEACHER', permissions: null })).toContain('students.print')
    expect(effectivePermissions({ role: 'TEACHER', permissions: null })).not.toContain('users.manage')
  })

  it('quyền tùy chỉnh được ưu tiên và lọc key lạ', () => {
    const custom = JSON.stringify(['students.view', 'khong.ton.tai'])
    expect(effectivePermissions({ role: 'TEACHER', permissions: custom })).toEqual(['students.view'])
    expect(parsePermissions('[]')).toEqual([])
    expect(parsePermissions('bad-json')).toBeNull()
  })

  it('discipline mặc định chỉ ghi nhận + xem vi phạm', () => {
    expect(ROLE_PERMISSIONS.DISCIPLINE).toEqual(['violations.view', 'violations.create'])
  })
})

describe('conduct classification', () => {
  it('phân loại đúng ngưỡng', () => {
    expect(classifyConduct(100)).toBe('Tốt')
    expect(classifyConduct(90)).toBe('Tốt')
    expect(classifyConduct(89)).toBe('Khá')
    expect(classifyConduct(80)).toBe('Khá')
    expect(classifyConduct(79)).toBe('Trung bình')
    expect(classifyConduct(65)).toBe('Trung bình')
    expect(classifyConduct(64)).toBe('Yếu')
    expect(classifyConduct(50)).toBe('Yếu')
    expect(classifyConduct(49)).toBe('Kém')
  })
})
