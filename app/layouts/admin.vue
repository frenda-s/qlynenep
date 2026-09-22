<script setup lang="ts">
const auth = useAuth()
const route = useRoute()

const nav = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Học sinh', to: '/admin/students' },
  { label: 'Lớp', to: '/admin/classes' },
  { label: 'Vi phạm', to: '/admin/violations' },
  { label: 'Loại vi phạm', to: '/admin/violation-types' },
  { label: 'Xếp hạng', to: '/admin/rankings' },
  { label: 'Thống kê', to: '/admin/statistics' },
  { label: 'Nhật ký', to: '/admin/logs' },
  { label: 'Tài khoản', to: '/admin/accounts' },
]

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
      <div class="border-b-2 border-ink px-5 py-5">
        <p class="serif text-2xl font-bold leading-none">NeNepOS</p>
        <p class="mt-1 text-[11px] uppercase tracking-widest text-ink-muted">Nề nếp học sinh</p>
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
        <NuxtLink to="/print/student-badges" class="text-xs text-ink-muted underline-offset-2 hover:underline">
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
