import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'turso',
  schema: './server/database/schema.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    url: process.env.LIBSQL_URL || process.env.TURSO_URL || 'file:local.db',
    authToken: process.env.LIBSQL_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
  },
})
