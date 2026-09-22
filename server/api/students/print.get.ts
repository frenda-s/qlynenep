import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { useDB } from '../../database/client'
import { listStudentsForPrint } from '../../repositories/students'
import { parseQuery } from '../../utils/query'

// Endpoint riêng cho trang in: không giới hạn phân trang (tối đa 2000),
// trả full ảnh thẻ + QR. Route list chung bị cap limit=200 nên trang in
// không dùng được.
const printQuerySchema = z.object({
  class_id: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDB(event)
  const q = parseQuery(event, printQuerySchema)
  const rows = await listStudentsForPrint(db, q.class_id)
  return {
    students: rows.map((r) => ({
      id: r.id,
      student_code: r.studentCode,
      full_name: r.fullName,
      qr_code: r.qrCode,
      photo: r.photo ?? null,
      class_name: r.className,
      status: r.status,
    })),
    total: rows.length,
  }
})
