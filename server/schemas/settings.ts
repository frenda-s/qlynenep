import { z } from 'zod'

export const updateSettingsSchema = z.object({
  school_name: z.string().max(200).optional(),
})
