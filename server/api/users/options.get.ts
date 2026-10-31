import { requirePermission } from '../../utils/permissions'
import {
  PERMISSION_GROUPS,
  PERMISSIONS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
} from '../../utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users.manage')
  return {
    roles: (Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((role) => ({
      value: role,
      label: ROLE_LABELS[role],
      description: ROLE_DESCRIPTIONS[role],
      permissions: ROLE_PERMISSIONS[role],
    })),
    permissions: PERMISSIONS,
    groups: PERMISSION_GROUPS,
  }
})
