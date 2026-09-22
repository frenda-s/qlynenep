import { describe, it, expect } from 'vitest'
import { loginSchema } from '../server/schemas/auth'
import { createViolationSchema } from '../server/schemas/violations'
import { createStudentSchema } from '../server/schemas/students'
import { createClassSchema } from '../server/schemas/classes'
import { createViolationTypeSchema } from '../server/schemas/violation-types'

const UUID = '11111111-2222-4333-8444-555555555555'

describe('auth schema', () => {
  it('bắt buộc username + password', () => {
    expect(loginSchema.safeParse({}).success).toBe(false)
    expect(loginSchema.safeParse({ username: 'a', password: 'b' }).success).toBe(true)
  })
})

describe('violation schema', () => {
  const valid = {
    student_id: UUID,
    violation_type_ids: [UUID],
    note: 'ghi chú',
    idempotency_key: UUID,
  }

  it('chấp nhận input hợp lệ', () => {
    expect(createViolationSchema.safeParse(valid).success).toBe(true)
  })

  it('từ chối idempotency_key không phải UUID', () => {
    const r = createViolationSchema.safeParse({ ...valid, idempotency_key: 'not-a-uuid' })
    expect(r.success).toBe(false)
  })

  it('từ chối danh sách vi phạm rỗng', () => {
    expect(createViolationSchema.safeParse({ ...valid, violation_type_ids: [] }).success).toBe(false)
  })
})

describe('student schema', () => {
  it('bắt buộc full_name + class_id', () => {
    expect(createStudentSchema.safeParse({}).success).toBe(false)
    expect(createStudentSchema.safeParse({ full_name: 'A', class_id: UUID }).success).toBe(true)
  })
})

describe('class schema', () => {
  it('bắt buộc tên lớp', () => {
    expect(createClassSchema.safeParse({}).success).toBe(false)
    expect(createClassSchema.safeParse({ name: '10A1', grade: 10, academic_year: '2025-2026' }).success).toBe(true)
  })
})

describe('violation type schema', () => {
  it('bắt buộc tên + điểm phạt', () => {
    expect(createViolationTypeSchema.safeParse({}).success).toBe(false)
    expect(
      createViolationTypeSchema.safeParse({ name: 'Đi muộn', penalty_points: 3 }).success,
    ).toBe(true)
  })
})
