import type { DB } from '../database/client'
import * as classesRepo from '../repositories/classes'
import * as violationsRepo from '../repositories/violations'
import type { CreateClassInput, UpdateClassInput } from '../schemas/classes'
import { badRequest, notFound } from '../utils/errors'

export async function createClass(db: DB, input: CreateClassInput) {
  return classesRepo.createClass(db, {
    name: input.name,
    grade: input.grade,
    academicYear: input.academic_year,
    teacherId: input.teacher_id ?? null,
    status: input.status,
  })
}

export async function updateClass(db: DB, id: string, input: UpdateClassInput) {
  const existing = await classesRepo.findClassById(db, id)
  if (!existing) notFound('Không tìm thấy lớp')
  return classesRepo.updateClass(db, id, {
    name: input.name,
    grade: input.grade,
    academicYear: input.academic_year,
    teacherId: input.teacher_id === undefined ? undefined : input.teacher_id,
    status: input.status,
  })
}

export async function listClassesWithStats(db: DB) {
  const classes = await classesRepo.listClasses(db)
  return Promise.all(
    classes.map(async (c) => {
      const size = await classesRepo.countStudentsInClass(db, c.id)
      return {
        id: c.id,
        name: c.name,
        grade: c.grade,
        academic_year: c.academicYear,
        status: c.status,
        teacher: c.teacher
          ? { id: c.teacher.id, fullName: c.teacher.fullName, username: c.teacher.username }
          : null,
        size,
      }
    }),
  )
}

export async function deleteClass(db: DB, id: string) {
  const existing = await classesRepo.findClassById(db, id)
  if (!existing) notFound('Không tìm thấy lớp')
  const size = await classesRepo.countStudentsInClass(db, id)
  if (size > 0) badRequest(`Lớp còn ${size} học sinh, không thể xóa. Hãy vô hiệu hóa thay vì xóa.`)
  return classesRepo.updateClass(db, id, { status: 'inactive' })
}
