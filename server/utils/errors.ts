import { createError, type H3Event } from 'h3'

export class ApiError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

export function badRequest(message = 'Yêu cầu không hợp lệ'): never {
  throw createError({ statusCode: 400, message: message })
}

export function unauthorized(message = 'Chưa đăng nhập'): never {
  throw createError({ statusCode: 401, message: message })
}

export function forbidden(message = 'Không có quyền truy cập'): never {
  throw createError({ statusCode: 403, message: message })
}

export function notFound(message = 'Không tìm thấy'): never {
  throw createError({ statusCode: 404, message: message })
}

export function conflict(message = 'Dữ liệu đã tồn tại'): never {
  throw createError({ statusCode: 409, message: message })
}

export async function parseBody<T>(event: H3Event, schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { message: string } } }): Promise<T> {
  const body = await readBody(event).catch(() => null)
  const result = schema.safeParse(body ?? {})
  if (!result.success) {
    const msg = result.error?.message ?? 'Yêu cầu không hợp lệ'
    badRequest(msg)
  }
  return result.data as T
}
