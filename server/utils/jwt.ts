import { SignJWT, jwtVerify } from 'jose'

export interface SessionPayload {
  sub: string
  role: string
  name: string
}

async function keyFromSecret(secret: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)))
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const key = await keyFromSecret(secret)
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

export async function verifySession(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const key = await keyFromSecret(secret)
    const { payload } = await jwtVerify(token, key)
    return {
      sub: payload.sub as string,
      role: (payload.role as string) ?? 'DISCIPLINE',
      name: (payload.name as string) ?? '',
    }
  } catch {
    return null
  }
}
