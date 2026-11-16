/**
 * CSV export helpers — chống formula injection khi mở bằng Excel/Sheets
 * (ô bắt đầu bằng = + - @ TAB CR sẽ bị hiểu là công thức/điều khiển).
 */
export function csvCell(value: string | number | null | undefined): string {
  const s = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(s)) return `'${s}`
  return s
}

export function csvEscape(value: string | number | null | undefined): string {
  const s = csvCell(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(csvEscape).join(',')).join('\n')
}
