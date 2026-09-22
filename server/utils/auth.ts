import { createError, getCookie, setCookie, deleteCookie, getRequestURL, type H3Event } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { verifySession, type SessionPayload } from './jwt'

export const SESSION_COOKIE = 'nenepos_session'

export function setSessionCookie(event: H3Event, token: string): void {
  const secure = getRequestURL(event).protocol === 'https:'
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    maxAge: 7 * 24 * 3600,
  })
}

export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export function getSessionToken(event: H3Event): string | null {
  return getCookie(event, SESSION_COOKIE) ?? null
}

export function getAuthSecret(event: H3Event): string {
  const cfEnv = (event.context as any)?.cloudflare?.env
  let runtimeSecret: string | undefined
  try {
    const config = useRuntimeConfig(event) as { authSecret?: string }
    runtimeSecret = config?.authSecret
  } catch {}
  return (
    cfEnv?.AUTH_SECRET ||
    cfEnv?.NUXT_AUTH_SECRET ||
    runtimeSecret ||
    process.env.AUTH_SECRET ||
    'dev-secret-change-me-in-production'
  )
}

export async function getAuthUser(event: H3Event): Promise<SessionPayload | null> {
  const ctx = event.context as { _authUser?: SessionPayload | null }
  if ('_authUser' in ctx) return ctx._authUser!

  const token = getSessionToken(event)
  if (!token) {
    ctx._authUser = null
    return null
  }
  const secret = getAuthSecret(event)
  const user = await verifySession(token, secret)
  ctx._authUser = user
  return user
}

export async function requireAuth(event: H3Event): Promise<SessionPayload> {
  const user = await getAuthUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Chưa đăng nhập' })
  }
  return user
}

export async function requireRole(event: H3Event, roles: readonly string[]): Promise<SessionPayload> {
  const user = await requireAuth(event)
  if (!roles.includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Không có quyền truy cập' })
  }
  return user
}
