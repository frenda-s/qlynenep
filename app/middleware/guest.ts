export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth()
  if (!auth.user.value) {
    await auth.fetchMe()
  }
  if (auth.user.value) {
    if (auth.user.value.role === 'DISCIPLINE') return navigateTo('/mobile')
    if (auth.user.value.role === 'TEACHER') return navigateTo('/admin/my-class')
    return navigateTo('/admin')
  }
})
