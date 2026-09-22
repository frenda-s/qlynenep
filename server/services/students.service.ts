import type { DB } from '../database/client'
import * as studentsRepo from '../repositories/students'
import * as classesRepo from '../repositories/classes'
import * as violationsRepo from '../repositories/violations'
import type { CreateStudentInput, UpdateStudentInput } from '../schemas/students'
import { genQrCode, genStudentCode } from '../utils/id'
import { badRequest, notFound } from '../utils/errors'
import type { NewStudent } from '../database/schema'

export const BASE_POINTS = 100

export function currentPoints(totalPenalty: number): number {
  return BASE_POINTS + totalPenalty // totalPenalty is negative
}

export async function studentProfile(db: DB, studentId: string) {
  const student = await studentsRepo.findStudentById(db, studentId)
  if (!student) notFound('Không tìm thấy học sinh')

  const [penaltySum, violationCount, recent] = await Promise.all([
    violationsRepo.studentPointSum(db, studentId),
    violationsRepo.studentViolationCount(db, studentId),
    violationsRepo.listViolationsForStudent(db, studentId, 5),
  ])

  return {
    id: student.id,
    student_code: student.studentCode,
    full_name: student.fullName,
    qr_code: student.qrCode,
    photo: student.photo ?? null,
    status: student.status,
    class: student.class ? { id: student.class.id, name: student.class.name, grade: student.class.grade } : null,
    class_name: student.class?.name ?? null,
    current_points: currentPoints(penaltySum),
    total_violations: violationCount,
    recent_violations: recent.map((v) => ({
      id: v.id,
      total_points: v.totalPoints,
      created_at: v.createdAt,
      items: v.items.map((i) => ({ name: i.violationType.name, penalty_points: i.penaltyPoints })),
    })),
  }
}

export async function createStudent(db: DB, input: CreateStudentInput) {
  const cls = await classesRepo.findClassById(db, input.class_id)
  if (!cls) badRequest('Lớp không tồn tại')

  const count = await studentsRepo.countStudents(db)
  const qr = genQrCode()
  const row = await studentsRepo.createStudent(db, {
    studentCode: input.student_code || genStudentCode(count + 1),
    fullName: input.full_name,
    classId: input.class_id,
    qrCode: qr,
    photo: input.photo || null,
    status: input.status,
  })
  return studentProfile(db, row.id)
}

export async function updateStudent(db: DB, id: string, input: UpdateStudentInput) {
  const existing = await studentsRepo.findStudentById(db, id)
  if (!existing) notFound('Không tìm thấy học sinh')
  if (input.class_id) {
    const cls = await classesRepo.findClassById(db, input.class_id)
    if (!cls) badRequest('Lớp không tồn tại')
  }
  const patch: Partial<NewStudent> = {
    studentCode: input.student_code,
    fullName: input.full_name,
    classId: input.class_id,
    status: input.status,
  }
  if (input.photo !== undefined) patch.photo = input.photo || null
  await studentsRepo.updateStudent(db, id, patch)
  return studentProfile(db, id)
}

export async function studentByQr(db: DB, qrCode: string) {
  const student = await studentsRepo.findStudentByQr(db, qrCode)
  if (!student) notFound('Mã QR không tồn tại')
  if (student.status !== 'active') badRequest('Học sinh đã bị vô hiệu hóa')
  return studentProfile(db, student.id)
}

export async function studentById(db: DB, id: string) {
  return studentProfile(db, id)
}
