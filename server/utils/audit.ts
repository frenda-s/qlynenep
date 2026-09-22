import { auditLogs } from '../database/schema'
import type { DB } from '../database/client'

export interface AuditEntry {
  userId: string | null
  action: string
  targetType?: string
  targetId?: string
  metadata?: unknown
}

export async function writeAudit(db: DB, entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    })
  } catch {
    // Audit must never break the main flow.
  }
}
