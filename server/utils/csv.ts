/**
 * CSV parser tối giản, đủ cho import học sinh.
 * Hỗ trợ dấu nháy kép và dấu phẩy trong field.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') pushField()
      else if (ch === '\n') pushRow()
      else if (ch === '\r') {
        if (text[i + 1] === '\n') i++
        pushRow()
      } else field += ch
    }
  }
  if (field.length > 0 || row.length > 0) pushRow()

  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}
