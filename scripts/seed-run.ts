import { getLocalDB } from './db'
import { seed } from './seed'

async function main() {
  const { db, dispose } = await getLocalDB()
  await seed(db)
  await dispose()
}

main().catch((err) => {
  console.error('❌ Seed thất bại:', err)
  process.exit(1)
})
