const ROUTE_PERMISSIONS: { prefix: string; permission: string }[] = [
  { prefix: '/admin/students', permission: 'students.view' },
  { prefix: '/admin/classes', permission: 'classes.manage' },
  { prefix: '/admin/violations', permission: 'violations.view' },
  { prefix: '/admin/violation-types', permission: 'violation_types.manage' },
  { prefix: '/admin/rankings', permission: 'rankings.view' },
  { prefix: '/admin/statistics', permission: 'statistics.view' },
  { prefix: '/admin/logs', permission: 'logs.view' },
  { prefix: '/admin/accounts', permission: 'users.manage' },
  { prefix: '/print/student-badges', permission: 'students.print' },
]

function requiredPermission(path: string): string | null {
  if (path === '/admin') return 'statistics.view'
  for (const rule of ROUTE_PERMISSIONS) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) return rule.permission
  }
  return null
}

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  if (!auth.user.value) {
    await auth.fetchMe()
  }
  if (!auth.user.value) {
    return navigateTo('/login')
  }
  if (auth.user.value.role === 'DISCIPLINE') {
    return navigateTo('/mobile')
  }

  const required = requiredPermission(to.path)
  if (required && !auth.can(required)) {
    if (auth.isTeacher.value) {
      return navigateTo('/admin/my-class')
    }
    return navigateTo('/login')
  }
})
