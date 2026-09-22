import { getQuery, type H3Event } from 'h3'
import { badRequest } from './errors'

export function parseQuery<T>(
  event: H3Event,
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { message: string } } },
): T {
  const query = getQuery(event)
  const result = schema.safeParse(query)
  if (!result.success) {
    badRequest(result.error?.message ?? 'Tham số truy vấn không hợp lệ')
  }
  return result.data as T
}

export function parseRouteParam(event: H3Event, name: string): string {
  const value = getRouterParam(event, name)
  if (!value) badRequest(`Thiếu tham số "${name}"`)
  return value
}
