export interface AuthUser {
  sub?: string
  id?: string
  username?: string
  fullName?: string
  name?: string
  role: 'ADMIN' | 'TEACHER' | 'DISCIPLINE'
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)

  async function fetchMe(): Promise<AuthUser | null> {
    try {
      const res = await $fetch<{ user: AuthUser | null }>('/api/auth/me', {
        credentials: 'include',
      })
      user.value = res.user
      return res.user
    } catch {
      user.value = null
      return null
    }
  }

  async function login(username: string, password: string) {
    const res = await $fetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: { username, password },
    })
    user.value = res.user
    return res.user
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // ignore
    }
    user.value = null
    await navigateTo('/login')
  }

  const displayName = computed(() => {
    const u = user.value
    return u?.name || u?.fullName || u?.username || 'Người dùng'
  })

  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isTeacher = computed(() => user.value?.role === 'TEACHER')
  const isDiscipline = computed(() => user.value?.role === 'DISCIPLINE')

  return { user, fetchMe, login, logout, displayName, isAdmin, isTeacher, isDiscipline }
}
