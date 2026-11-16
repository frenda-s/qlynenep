import type { FetchOptions } from 'ofetch'

export interface ApiError {
  statusCode: number
  message?: string
  data?: unknown
}

type ApiOpts = FetchOptions<'json'> & Record<string, unknown>

export function useApi() {
  const toast = useToast()

  async function api<T>(path: string, opts: ApiOpts = {}): Promise<T> {
    try {
      return (await $fetch(path, {
        credentials: 'include',
        ...opts,
      } as never)) as T
    } catch (err: unknown) {
      const e = err as { statusCode?: number; statusMessage?: string; data?: unknown }
      if (e?.statusCode === 401 && path !== '/api/auth/me') {
        const auth = useAuth()
        auth.user.value = null
        await navigateTo('/login')
      }
      throw {
        statusCode: e?.statusCode ?? 500,
        message: e?.statusMessage || 'Lỗi không xác định',
        data: e?.data,
      } satisfies ApiError
    }
  }

  function errorMessage(err: unknown, fallback = 'Đã xảy ra lỗi'): string {
    const e = err as ApiError | undefined
    return e?.message || fallback
  }

  return { api, errorMessage, toast }
}
