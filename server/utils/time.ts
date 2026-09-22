const TZ_OFFSET_MS = 7 * 60 * 60 * 1000 // Asia/Ho_Chi_Minh
const DAY_MS = 24 * 60 * 60 * 1000

export type Period = 'today' | 'week' | 'month' | 'semester' | 'year'
export const PERIODS: Period[] = ['today', 'week', 'month', 'semester', 'year']

export function startOfDayLocal(ts: number): number {
  return Math.floor((ts + TZ_OFFSET_MS) / DAY_MS) * DAY_MS - TZ_OFFSET_MS
}

export function startOfWeekLocal(ts: number): number {
  const dayStart = startOfDayLocal(ts)
  const localDay = new Date(dayStart + TZ_OFFSET_MS).getUTCDay() // 0=Sun..6=Sat
  const diffToMonday = (localDay + 6) % 7
  return dayStart - diffToMonday * DAY_MS
}

export function startOfMonthLocal(ts: number): number {
  const d = new Date(ts + TZ_OFFSET_MS)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - TZ_OFFSET_MS
}

export function startOfSchoolYear(ts: number): number {
  const d = new Date(ts + TZ_OFFSET_MS)
  const year = d.getUTCMonth() >= 8 ? d.getUTCFullYear() : d.getUTCFullYear() - 1 // Sep = month 8
  return Date.UTC(year, 8, 1) - TZ_OFFSET_MS
}

export function startOfSemester(ts: number): number {
  const d = new Date(ts + TZ_OFFSET_MS)
  const m = d.getUTCMonth()
  const y = d.getUTCFullYear()
  if (m >= 8 || m === 0) {
    // Học kỳ I: tháng 9 → tháng 1
    return Date.UTC(m >= 8 ? y : y - 1, 8, 1) - TZ_OFFSET_MS
  }
  if (m <= 4) {
    // Học kỳ II: tháng 2 → tháng 5
    return Date.UTC(y, 1, 1) - TZ_OFFSET_MS
  }
  // Nghỉ hè: quy về đầu năm học tới
  return Date.UTC(y, 8, 1) - TZ_OFFSET_MS
}

export function rangeFor(period: Period, now = Date.now()): [number, number] {
  switch (period) {
    case 'today':
      return [startOfDayLocal(now), now]
    case 'week':
      return [startOfWeekLocal(now), now]
    case 'month':
      return [startOfMonthLocal(now), now]
    case 'semester':
      return [startOfSemester(now), now]
    case 'year':
      return [startOfSchoolYear(now), now]
  }
}

export function fmtDate(ts: number): string {
  return new Date(ts + TZ_OFFSET_MS).toISOString().slice(0, 10)
}

export function fmtDateTime(ts: number): string {
  return new Date(ts + TZ_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ')
}
