import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from './schema'
import * as relations from './relations'

const fullSchema = { ...schema, ...relations }

export type DB = LibSQLDatabase<typeof fullSchema>

type MaybeEvent = { context?: { cloudflare?: { env?: Record<string, string> } } }

/**
 * Lấy URL + auth token cho libSQL/Turso.
 * Thứ tự: env node (nuxt dev / scripts / tests) → cloudflare env (worker).
 * Mặc định `file:local.db` để chạy local không cần token.
 */
function resolveConfig(event?: MaybeEvent) {
  const cfEnv = event?.context?.cloudflare?.env
  let runtimeCfg: Record<string, any> = {}
  try {
    if (event) {
      runtimeCfg = useRuntimeConfig(event as any) as Record<string, any>
    }
  } catch {
    // Không trong context H3 event (ví dụ: cli script hoặc test)
  }

  const url =
    cfEnv?.LIBSQL_URL ||
    cfEnv?.TURSO_URL ||
    runtimeCfg?.libsqlUrl ||
    runtimeCfg?.tursoUrl ||
    process.env.LIBSQL_URL ||
    process.env.TURSO_URL ||
    'file:local.db'

  const authToken =
    cfEnv?.LIBSQL_AUTH_TOKEN ||
    cfEnv?.TURSO_AUTH_TOKEN ||
    runtimeCfg?.libsqlAuthToken ||
    runtimeCfg?.tursoAuthToken ||
    process.env.LIBSQL_AUTH_TOKEN ||
    process.env.TURSO_AUTH_TOKEN ||
    undefined

  return { url, authToken }
}

export function createDB(client: Client): DB {
  return drizzle(client, { schema: fullSchema })
}

let client: Client | null = null
let currentKey: string | null = null

export function getClient(event?: MaybeEvent): Client {
  const { url, authToken } = resolveConfig(event)
  const key = `${url}::${authToken ?? ''}`

  // Cảnh báo nếu chạy trên Cloudflare Workers runtime nhưng vẫn trỏ vào file local
  if (
    (url === 'file:local.db' || url.startsWith('file:')) &&
    typeof (globalThis as any).WebSocketPair !== 'undefined'
  ) {
    console.error(
      '❌ [NeNepOS] Đang chạy trên Cloudflare Workers nhưng chưa cấu hình LIBSQL_URL (Turso). Vui lòng thêm secret LIBSQL_URL và LIBSQL_AUTH_TOKEN!',
    )
  }

  if (!client || currentKey !== key) {
    client = createClient({ url, authToken })
    currentKey = key
  }
  return client
}

export function useDB(event?: MaybeEvent): DB {
  return createDB(getClient(event))
}
