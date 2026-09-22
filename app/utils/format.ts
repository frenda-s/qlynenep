export const TZ = 7 * 3600 * 1000

export function fmtDate(ts: number): string {
  return new Date(ts + TZ).toISOString().slice(0, 10)
}

export function fmtDateTime(ts: number): string {
  return new Date(ts + TZ).toISOString().slice(0, 16).replace('T', ' ')
}

export function fmtTime(ts: number): string {
  return new Date(ts + TZ).toISOString().slice(11, 16)
}
