<script setup lang="ts">
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  School,
  TriangleAlert,
  Tags,
  Trophy,
  ChartColumn,
  ScrollText,
  ShieldCheck,
  Printer,
  LogOut,
  Menu,
  X,
} from '@lucide/vue'

const auth = useAuth()
const route = useRoute()

type NavItem = {
  label: string
  to: string
  icon: unknown
  permission?: string
  teacherOnly?: boolean
  adminOnly?: boolean
}

const allNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, permission: 'statistics.view' },
  { label: 'Lớp của tôi', to: '/admin/my-class', icon: GraduationCap, teacherOnly: true },
  { label: 'Học sinh', to: '/admin/students', icon: Users, permission: 'students.view' },
  { label: 'Lớp', to: '/admin/classes', icon: School, permission: 'classes.manage', adminOnly: true },
  { label: 'Vi phạm', to: '/admin/violations', icon: TriangleAlert, permission: 'violations.view' },
  { label: 'Loại vi phạm', to: '/admin/violation-types', icon: Tags, permission: 'violation_types.manage' },
  { label: 'Xếp hạng', to: '/admin/rankings', icon: Trophy, permission: 'rankings.view' },
  { label: 'Thống kê', to: '/admin/statistics', icon: ChartColumn, permission: 'statistics.view' },
  { label: 'Nhật ký', to: '/admin/logs', icon: ScrollText, permission: 'logs.view' },
  { label: 'Tài khoản', to: '/admin/accounts', icon: ShieldCheck, permission: 'users.manage' },
]

const nav = computed(() =>
  allNav.filter((item) => {
    if (item.teacherOnly) return auth.isTeacher.value
    if (item.adminOnly) return auth.isAdmin.value
    return !item.permission || auth.can(item.permission)
  }),
)

const roleLabel = computed(() => {
  switch (auth.user.value?.role) {
    case 'ADMIN':
      return 'Quản trị viên'
    case 'TEACHER':
      return 'Giáo viên'
    case 'DISCIPLINE':
      return 'Ban nề nếp'
    default:
      return 'Khách'
  }
})

const initials = computed(() =>
  auth.displayName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join(''),
)

const current = computed(() => {
  const hit = [...nav.value].reverse().find((i) => isActive(i.to))
  return hit?.label ?? 'Quản trị'
})

const drawerOpen = ref(false)

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
}

watch(() => route.path, () => (drawerOpen.value = false))

onMounted(() => {
  if (!auth.user.value) auth.fetchMe()
})
</script>

<template>
  <div class="flex min-h-screen bg-paper text-ink">
    <div
      v-if="drawerOpen"
      class="fixed inset-0 z-30 bg-ink/40 backdrop-blur-[1px] md:hidden"
      @click="drawerOpen = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-rule bg-paper transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0"
      :class="drawerOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center gap-3 border-b-2 border-ink px-5 py-4">
        <img src="/logo-circle.png" alt="NeNepOS Logo" class="h-10 w-10 shrink-0 rounded-full border border-rule/50" />
        <div class="min-w-0 flex-1">
          <p class="serif text-2xl font-bold leading-none">NeNepOS</p>
          <p class="mt-1 text-[11px] uppercase tracking-widest text-ink-muted">Nề nếp học sinh</p>
        </div>
        <button
          class="rounded-lg p-1 text-ink-muted hover:bg-paper-dim hover:text-ink md:hidden"
          aria-label="Đóng menu"
          @click="drawerOpen = false"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <nav class="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
          :class="
            isActive(item.to)
              ? 'bg-ink font-semibold text-paper'
              : 'text-ink-muted hover:bg-paper-dim hover:text-ink'
          "
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" :stroke-width="isActive(item.to) ? 2.4 : 1.8" />
          <span class="truncate">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="border-t border-rule px-2 py-3">
        <NuxtLink
          v-if="auth.can('students.print')"
          to="/print/student-badges"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-ink-muted transition-colors hover:bg-paper-dim hover:text-ink"
        >
          <Printer class="h-4 w-4 shrink-0" />
          In thẻ / bảng tên
        </NuxtLink>
        <div class="mt-2 flex items-center gap-2.5 px-3 py-2">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink text-[11px] font-bold"
          >
            {{ initials || '?' }}
          </span>
          <div class="min-w-0 flex-1 leading-tight">
            <p class="truncate text-xs font-semibold text-ink">{{ auth.displayName }}</p>
            <p class="truncate text-[10px] uppercase tracking-wider text-ink-faint">{{ roleLabel }}</p>
          </div>
          <button
            class="rounded-lg p-1 text-ink-faint transition-colors hover:bg-paper-dim hover:text-accent"
            title="Đăng xuất"
            aria-label="Đăng xuất"
            @click="auth.logout()"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-rule bg-paper/85 px-4 py-3 backdrop-blur md:px-8 md:py-4"
      >
        <div class="flex items-center gap-3">
          <button
            class="rounded-lg border border-rule p-1.5 text-ink transition-colors hover:bg-paper-dim md:hidden"
            aria-label="Mở menu"
            @click="drawerOpen = true"
          >
            <Menu class="h-5 w-5" />
          </button>
          <p class="text-sm uppercase tracking-widest text-ink-muted">{{ current }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="hidden text-sm text-ink sm:inline">{{ auth.displayName }}</span>
          <button
            class="hidden text-xs text-ink-muted underline-offset-2 hover:text-accent hover:underline sm:inline"
            @click="auth.logout()"
          >
            Đăng xuất
          </button>
        </div>
      </header>
      <main class="flex-1 px-4 py-5 md:px-8 md:py-6">
        <slot />
      </main>
    </div>

    <ToastHost />
  </div>
</template>
