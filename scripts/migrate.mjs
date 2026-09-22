import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

/**
 * Áp dụng migrations (không drop, không seed) — an toàn cho cả local file lẫn Turso remote.
 * Dùng chung cho `pnpm db:migrate` và entrypoint Docker.
 *
 * Env:
 *   LIBSQL_URL / TURSO_URL            — mặc định file:local.db
 *   LIBSQL_AUTH_TOKEN / TURSO_AUTH_TOKEN — bắt buộc khi dùng Turso remote
 */
const url = process.env.LIBSQL_URL || process.env.TURSO_URL || 'file:local.db'
const authToken = process.env.LIBSQL_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN

if (!url) {
  console.error('❌ Thiếu LIBSQL_URL / TURSO_URL')
  process.exit(1)
}

const client = createClient({ url, authToken })
const db = drizzle(client)

try {
  await migrate(db, { migrationsFolder: './drizzle/migrations' })
  console.log('✅ Migrations applied.')
} catch (err) {
  console.error('❌ Migration thất bại:', err)
  process.exit(1)
} finally {
  client.close()
}
