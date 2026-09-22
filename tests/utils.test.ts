import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../server/utils/hash'
import { genQrCode, genStudentCode, isValidUuid, genIdempotencyKey } from '../server/utils/id'
import { parseCsv } from '../server/utils/csv'
import { signSession, verifySession } from '../server/utils/jwt'
import { rangeFor, startOfDayLocal, startOfMonthLocal } from '../server/utils/time'

describe('hash', () => {
  it('mã hóa và xác minh mật khẩu đúng', async () => {
    const hash = await hashPassword('admin123')
    expect(await verifyPassword('admin123', hash)).toBe(true)
    expect(await verifyPassword('sai-pass', hash)).toBe(false)
  })

  it('mỗi lần băm sinh salt khác nhau', async () => {
    const a = await hashPassword('pass')
    const b = await hashPassword('pass')
    expect(a).not.toBe(b)
  })
})

describe('id', () => {
  it('genQrCode tạo mã STUDENT-xxxxxxxx (8 hex)', () => {
    expect(genQrCode()).toMatch(/^STUDENT-[0-9a-f]{8}$/)
  })

  it('genStudentCode đệm 4 chữ số', () => {
    expect(genStudentCode(1)).toBe('HS0001')
    expect(genStudentCode(999)).toBe('HS0999')
  })

  it('genIdempotencyKey sinh UUID hợp lệ', () => {
    expect(isValidUuid(genIdempotencyKey())).toBe(true)
  })
})

describe('csv', () => {
  it('parse dòng đơn giản', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('parse field chứa dấu phẩy trong nháy kép', () => {
    expect(parseCsv('name,"Nguyễn Văn, A",class')).toEqual([
      ['name', 'Nguyễn Văn, A', 'class'],
    ])
  })
})

describe('jwt', () => {
  it('sign + verify khớp payload', async () => {
    const token = await signSession({ sub: 'u1', role: 'ADMIN', name: 'Admin' }, 'secret')
    const payload = await verifySession(token, 'secret')
    expect(payload).toMatchObject({ sub: 'u1', role: 'ADMIN', name: 'Admin' })
  })

  it('verify với secret sai trả null', async () => {
    const token = await signSession({ sub: 'u1', role: 'ADMIN', name: 'Admin' }, 'secret')
    expect(await verifySession(token, 'wrong')).toBeNull()
  })
})

describe('time', () => {
  it('rangeFor trả [from, to] hợp lệ cho mọi period', () => {
    const now = Date.now()
    for (const p of ['today', 'week', 'month', 'semester', 'year'] as const) {
      const [from, to] = rangeFor(p, now)
      expect(from).toBeLessThanOrEqual(to)
      expect(to).toBe(now)
    }
  })

  it('startOfDayLocal là đầu ngày giờ VN (UTC+7)', () => {
    // 2026-09-09 03:00 UTC = 2026-09-09 10:00 VN
    const ts = Date.UTC(2026, 8, 9, 3, 0, 0)
    const start = startOfDayLocal(ts)
    // Đầu ngày 09/09 VN = 2026-09-08 17:00 UTC
    expect(start).toBe(Date.UTC(2026, 8, 8, 17, 0, 0))
  })

  it('startOfMonthLocal là đầu tháng', () => {
    const ts = Date.UTC(2026, 8, 15, 12, 0, 0)
    expect(startOfMonthLocal(ts)).toBe(Date.UTC(2026, 8, 1) - 7 * 3600 * 1000)
  })
})
