import type { DB } from '../database/client'
import * as typesRepo from '../repositories/violation-types'
import type { CreateViolationTypeInput, UpdateViolationTypeInput } from '../schemas/violation-types'
import { notFound } from '../utils/errors'

export async function createViolationType(db: DB, input: CreateViolationTypeInput) {
  return typesRepo.createViolationType(db, {
    name: input.name,
    description: input.description ?? null,
    penaltyPoints: input.penalty_points,
    isActive: input.is_active,
  })
}

export async function updateViolationType(db: DB, id: string, input: UpdateViolationTypeInput) {
  const existing = await typesRepo.findViolationTypeById(db, id)
  if (!existing) notFound('Không tìm thấy loại vi phạm')
  return typesRepo.updateViolationType(db, id, {
    name: input.name,
    description: input.description === undefined ? undefined : input.description,
    penaltyPoints: input.penalty_points,
    isActive: input.is_active,
  })
}

export async function deleteViolationType(db: DB, id: string) {
  const existing = await typesRepo.findViolationTypeById(db, id)
  if (!existing) notFound('Không tìm thấy loại vi phạm')
  await typesRepo.deleteViolationType(db, id)
}
