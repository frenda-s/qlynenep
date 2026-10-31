<script setup lang="ts">
const auth = useAuth()
const route = useRoute()

type NavItem = {
  label: string
  to: string
  permission?: string
  teacherOnly?: boolean
  adminOnly?: boolean
}

const allNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin', permission: 'statistics.view' },
  { label: 'Lớp của tôi', to: '/admin/my-class', teacherOnly: true },
  { label: 'Học sinh', to: '/admin/students', permission: 'students.view' },
  { label: 'Lớp', to: '/admin/classes', permission: 'classes.manage', adminOnly: true },
  { label: 'Vi phạm', to: '/admin/violations', permission: 'violations.view' },
  { label: 'Loại vi phạm', to: '/admin/violation-types', permission: 'violation_types.manage' },
  { label: 'Xếp hạng', to: '/admin/rankings', permission: 'rankings.view' },
  { label: 'Thống kê', to: '/admin/statistics', permission: 'statistics.view' },
  { label: 'Nhật ký', to: '/admin/logs', permission: 'logs.view' },
  { label: 'Tài khoản', to: '/admin/accounts', permission: 'users.manage' },
]

const nav = computed(() =>
  allNav.filter((item) => {
    if (item.teacherOnly) return auth.isTeacher.value
    if (item.adminOnly) return auth.isAdmin.value
    return !item.permission || auth.can(item.permission)
  }),
)

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
}

onMounted(() => {
  if (!auth.user.value) auth.fetchMe()
})
</script>

<template>
  <div class="flex min-h-screen bg-paper text-ink">
    <aside class="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-rule">
      <div class="flex items-center gap-3 border-b-2 border-ink px-5 py-4">
        <img src="/logo-circle.png" alt="NeNepOS Logo" class="h-10 w-10 shrink-0 rounded-full border border-rule/50" />
        <div>
          <p class="serif text-2xl font-bold leading-none">NeNepOS</p>
          <p class="mt-1 text-[11px] uppercase tracking-widest text-ink-muted">Nề nếp học sinh</p>
        </div>
      </div>
      <nav class="flex-1 overflow-y-auto py-3">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="block border-l-2 px-5 py-2.5 text-sm transition-colors"
          :class="
            isActive(item.to)
              ? 'border-ink bg-paper-dim font-semibold text-ink'
              : 'border-transparent text-ink-muted hover:bg-paper-dim hover:text-ink'
          "
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="border-t border-rule px-5 py-3">
        <NuxtLink
          v-if="auth.can('students.print')"
          to="/print/student-badges"
          class="text-xs text-ink-muted underline-offset-2 hover:underline"
        >
          In thẻ / bảng tên
        </NuxtLink>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex items-center justify-between border-b border-rule px-8 py-4">
        <p class="text-sm uppercase tracking-widest text-ink-muted">Quản trị</p>
        <div class="flex items-center gap-4">
          <span class="text-sm text-ink">{{ auth.displayName }}</span>
          <button class="text-xs text-ink-muted underline-offset-2 hover:underline" @click="auth.logout()">
            Đăng xuất
          </button>
        </div>
      </header>
      <main class="flex-1 px-8 py-6">
        <slot />
      </main>
    </div>

    <ToastHost />
  </div>
</template>
