import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, rmSync } from 'node:fs'
import { createClient, type Client } from '@libsql/client'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { eq } from 'drizzle-orm'
import { createDB, type DB } from '../server/database/client'
import { students, violationTypes, users } from '../server/database/schema'
import { seed } from '../scripts/seed'
import { login } from '../server/services/auth.service'
import { studentByQr } from '../server/services/students.service'
import { recordViolation } from '../server/services/violations.service'
import { studentRanking, classRanking } from '../server/services/rankings.service'
import { dashboard } from '../server/services/statistics.service'
import { genIdempotencyKey } from '../server/utils/id'

const DB_PATH = '.data/vitest.db'

let client: Client
let db: DB

let studentId: string
let qrCode: string
let typeA: string
let typeB: string
let disciplineId: string

beforeAll(async () => {
  mkdirSync('.data', { recursive: true })
  rmSync(DB_PATH, { force: true })

  client = createClient({ url: `file:${DB_PATH}` })
  db = createDB(client)

  await migrate(db, { migrationsFolder: './drizzle/migrations' })
  await seed(db)

  // Lấy 1 học sinh active + 2 loại vi phạm active + 1 tài khoản DISCIPLINE
  const st = await db
    .select({ id: students.id, qrCode: students.qrCode })
    .from(students)
    .where(eq(students.status, 'active'))
    .limit(1)
  studentId = st[0]!.id
  qrCode = st[0]!.qrCode

  const types = await db
    .select({ id: violationTypes.id })
    .from(violationTypes)
    .where(eq(violationTypes.isActive, true))
    .limit(2)
  typeA = types[0]!.id
  typeB = types[1]!.id

  const disc = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, 'discipline1'))
    .limit(1)
  disciplineId = disc[0]?.id ?? ''
}, 120000)

afterAll(async () => {
  client.close()
  rmSync(DB_PATH, { force: true })
})

describe('auth service', () => {
  it('đăng nhập đúng admin', async () => {
    const r = await login(db, { username: 'admin', password: 'admin123' }, 'test-secret')
    expect(r.user.role).toBe('ADMIN')
    expect(r.token).toBeTruthy()
  })

  it('đăng nhập sai mật khẩu bị từ chối', async () => {
    await expect(
      login(db, { username: 'admin', password: 'wrong-pass' }, 'test-secret'),
    ).rejects.toThrow('Sai tên đăng nhập hoặc mật khẩu')
  })
})

describe('QR lookup', () => {
  it('QR hợp lệ trả học sinh + điểm hiện tại', async () => {
    const s = await studentByQr(db, qrCode)
    expect(s.id).toBe(studentId)
    expect(typeof s.current_points).toBe('number')
  })

  it('QR không tồn tại bị từ chối', async () => {
    await expect(studentByQr(db, 'STUDENT-deadbeef')).rejects.toThrow('Mã QR không tồn tại')
  })
})

describe('violation service', () => {
  it('tạo violation: backend tự tính tổng điểm (âm)', async () => {
    const r = await recordViolation(
      db,
      {
        student_id: studentId,
        violation_type_ids: [typeA, typeB],
        note: 'test',
        idempotency_key: genIdempotencyKey(),
      },
      { sub: disciplineId || 'any', role: 'DISCIPLINE', name: 'Test' },
    )
    expect(r.duplicate).toBe(false)
    expect(r.violation!.total_points).toBeLessThan(0)
  })

  it('idempotency_key trùng không tạo bản ghi thứ hai', async () => {
    const key = genIdempotencyKey()
    const input = {
      student_id: studentId,
      violation_type_ids: [typeA],
      note: 'dup',
      idempotency_key: key,
    }
    const a = await recordViolation(db, input, {
      sub: disciplineId || 'any',
      role: 'DISCIPLINE',
      name: 'Test',
    })
    const b = await recordViolation(db, input, {
      sub: disciplineId || 'any',
      role: 'DISCIPLINE',
      name: 'Test',
    })
    expect(a.duplicate).toBe(false)
    expect(b.duplicate).toBe(true)
    expect(b.violation!.id).toBe(a.violation!.id)
  })

  it('loại vi phạm không tồn tại bị từ chối', async () => {
    await expect(
      recordViolation(
        db,
        {
          student_id: studentId,
          violation_type_ids: ['00000000-0000-4000-8000-000000000000'],
          note: '',
          idempotency_key: genIdempotencyKey(),
        },
        { sub: 'any', role: 'DISCIPLINE', name: 'Test' },
      ),
    ).rejects.toThrow('Loại vi phạm không tồn tại')
  })
})

describe('statistics + ranking', () => {
  it('dashboard trả các số liệu', async () => {
    const d = await dashboard(db)
    expect(typeof d.students).toBe('number')
    expect(typeof d.classes).toBe('number')
  })

  it('ranking học sinh sắp giảm dần theo điểm', async () => {
    const r = await studentRanking(db, 'month')
    expect(r.students.length).toBeGreaterThan(0)
    for (let i = 1; i < r.students.length; i++) {
      expect(r.students[i - 1]!.points).toBeGreaterThanOrEqual(r.students[i]!.points)
    }
  })

  it('ranking lớp có rank + điểm trung bình', async () => {
    const r = await classRanking(db, 'month')
    expect(r.classes.length).toBeGreaterThan(0)
    expect(typeof r.classes[0]!.avg_points).toBe('number')
  })
})
