import type { DB } from '../database/client'
import * as studentsRepo from '../repositories/students'
import * as typesRepo from '../repositories/violation-types'
import * as violationsRepo from '../repositories/violations'
import type { CreateViolationInput } from '../schemas/violations'
import { badRequest, notFound } from '../utils/errors'
import { writeAudit } from '../utils/audit'
import type { SessionPayload } from '../utils/jwt'

type ViolationWithRelations = {
  id: string
  student: { id: string; fullName: string; studentCode: string; class: { name: string } | null } | null
  recordedByUser: { id: string; fullName: string } | null
  note: string | null
  totalPoints: number
  createdAt: number
  items: { violationTypeId: string; violationType: { name: string }; penaltyPoints: number }[]
}

export function serializeViolation(v: ViolationWithRelations) {
  return {
    id: v.id,
    student: v.student
      ? {
          id: v.student.id,
          full_name: v.student.fullName,
          student_code: v.student.studentCode,
          class_name: v.student.class?.name ?? null,
        }
      : null,
    recorded_by: v.recordedByUser
      ? { id: v.recordedByUser.id, full_name: v.recordedByUser.fullName }
      : null,
    note: v.note,
    total_points: v.totalPoints,
    created_at: v.createdAt,
    items: v.items.map((i) => ({
      violation_type_id: i.violationTypeId,
      name: i.violationType.name,
      penalty_points: i.penaltyPoints,
    })),
  }
}

export async function recordViolation(
  db: DB,
  input: CreateViolationInput,
  actor: SessionPayload,
) {
  // Idempotency — chống duplicate khi mạng yếu gửi lại request.
  const existing = await violationsRepo.findViolationByIdempotencyKey(db, input.idempotency_key)
  if (existing) {
    return { violation: serializeViolation(existing), duplicate: true }
  }

  const student = await studentsRepo.findStudentById(db, input.student_id)
  if (!student) notFound('Học sinh không tồn tại')
  if (student.status !== 'active') badRequest('Học sinh đã bị vô hiệu hóa')

  const typeIds = [...new Set(input.violation_type_ids)]
  const types = await Promise.all(typeIds.map((id) => typesRepo.findViolationTypeById(db, id)))
  for (let i = 0; i < types.length; i++) {
    if (!types[i]) badRequest('Loại vi phạm không tồn tại')
    if (!types[i]!.isActive) badRequest(`Loại vi phạm "${types[i]!.name}" đã bị tắt`)
  }

  // Backend tính tổng điểm — frontend không được quyết định điểm phạt.
  const totalPenalty = types.reduce((s, t) => s + t!.penaltyPoints, 0)
  const totalPoints = -totalPenalty

  const violation = await violationsRepo.createViolation(db, {
    studentId: student.id,
    recordedBy: actor.sub,
    note: input.note ?? null,
    totalPoints,
    idempotencyKey: input.idempotency_key,
    items: types.map((t) => ({ violationTypeId: t!.id, penaltyPoints: t!.penaltyPoints })),
  })

  await writeAudit(db, {
    userId: actor.sub,
    action: 'CREATE_VIOLATION',
    targetType: 'violation',
    targetId: violation!.id,
    metadata: { studentId: student.id, totalPoints },
  })

  return { violation: violation ? serializeViolation(violation) : null, duplicate: false }
}

export async function listViolations(
  db: DB,
  filter: Parameters<typeof violationsRepo.listViolations>[1],
) {
  const { rows, total } = await violationsRepo.listViolations(db, filter)
  return { rows: rows.map(serializeViolation), total }
}

export async function deleteViolation(db: DB, id: string, actor: SessionPayload) {
  const v = await violationsRepo.findViolationById(db, id)
  if (!v) notFound('Không tìm thấy vi phạm')
  await violationsRepo.deleteViolation(db, id)
  await writeAudit(db, {
    userId: actor.sub,
    action: 'DELETE_VIOLATION',
    targetType: 'violation',
    targetId: id,
    metadata: { studentId: v.studentId },
  })
}
