import { sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { getLocalDB } from './db'
import { seed } from './seed'

async function main() {
  const { db, dispose } = await getLocalDB()

  // Xóa toàn bộ bảng + bảng tracking migration của drizzle.
  const tables = [
    '__drizzle_migrations',
    'audit_logs',
    'violation_items',
    'violations',
    'violation_types',
    'students',
    'classes',
    'school_settings',
    'users',
  ]
  for (const t of tables) {
    await db.run(sql.raw(`DROP TABLE IF EXISTS ${t}`))
  }

  await migrate(db, { migrationsFolder: './drizzle/migrations' })
  console.log('✅ Đã áp dụng migrations.')

  await seed(db)
  await dispose()
}

main().catch((err) => {
  console.error('❌ Reset thất bại:', err)
  process.exit(1)
})
