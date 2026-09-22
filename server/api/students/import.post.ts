import { z } from 'zod'
import { requireRole } from '../../utils/auth'
import { useDB } from '../../database/client'
import { parseBody, badRequest } from '../../utils/errors'
import { parseCsv } from '../../utils/csv'
import { genQrCode, genStudentCode } from '../../utils/id'
import { listClasses } from '../../repositories/classes'
import { countStudents, createStudent } from '../../repositories/students'
import { writeAudit } from '../../utils/audit'

const importSchema = z.object({
  csv: z.string().min(1),
  class_id: z.string().optional(), // dùng chung cho mọi dòng nếu CSV không có cột lớp
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])
  const db = useDB(event)
  const input = await parseBody(event, importSchema)

  const classes = await listClasses(db)
  const classByName = new Map(classes.map((c) => [c.name.trim().toLowerCase(), c]))
  const classById = new Map(classes.map((c) => [c.id, c]))

  const rows = parseCsv(input.csv)
  if (rows.length === 0) badRequest('File CSV rỗng')

  // Header
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const idxName = header.findIndex((h) => h === 'full_name' || h === 'ho_ten' || h === 'họ tên' || h === 'hoten')
  const idxCode = header.findIndex((h) => h === 'student_code' || h === 'ma_hs' || h === 'mã hs' || h === 'mahs')
  const idxClass = header.findIndex((h) => h === 'class_name' || h === 'lop' || h === 'lớp' || h === 'class_id')

  if (idxName === -1) badRequest('CSV cần cột "full_name" (hoặc "ho_ten")')

  let seq = await countStudents(db)
  const imported: string[] = []
  const errors: string[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const fullName = (row[idxName] ?? '').trim()
    if (!fullName) {
      errors.push(`Dòng ${i + 1}: thiếu họ tên`)
      continue
    }

    let classId = input.class_id ?? null
    if (idxClass !== -1 && row[idxClass]) {
      const raw = row[idxClass].trim()
      const byId = classById.get(raw)
      const byName = classByName.get(raw.toLowerCase())
      classId = byId?.id ?? byName?.id ?? null
      if (!classId) {
        errors.push(`Dòng ${i + 1}: lớp "${raw}" không tồn tại`)
        continue
      }
    }
    if (!classId) {
      errors.push(`Dòng ${i + 1}: chưa xác định lớp`)
      continue
    }

    const code = idxCode !== -1 && row[idxCode] ? row[idxCode].trim() : genStudentCode(++seq)
    await createStudent(db, {
      studentCode: code,
      fullName,
      classId,
      qrCode: genQrCode(),
      status: 'active',
    })
    imported.push(fullName)
  }

  await writeAudit(db, {
    userId: user.sub,
    action: 'CREATE_STUDENT',
    targetType: 'student',
    metadata: { imported: imported.length, errors: errors.length },
  })

  return { imported: imported.length, errors }
})
