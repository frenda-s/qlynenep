import { createDB, getClient } from '../server/database/client'

/**
 * Lấy DB libSQL (file:local.db mặc định, hoặc Turso remote khi có env).
 * KHÔNG đụng database production khi chưa set LIBSQL_URL / LIBSQL_AUTH_TOKEN.
 */
export async function getLocalDB() {
  const db = createDB(getClient())
  return {
    db,
    dispose: async () => {
      getClient().close()
    },
  }
}
