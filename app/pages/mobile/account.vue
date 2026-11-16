<script setup lang="ts">
import { LogOut } from '@lucide/vue'

definePageMeta({ middleware: 'auth', layout: 'mobile' })

const auth = useAuth()

const roleLabel: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  DISCIPLINE: 'Ban nề nếp',
}

const initials = computed(() =>
  auth.displayName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join(''),
)
</script>

<template>
  <div>
    <header class="rule-b pb-4">
      <h1 class="serif text-2xl font-bold">Tài khoản</h1>
    </header>

    <UiCard class="mt-6 p-5">
      <div class="flex items-center gap-4 border-b border-rule pb-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink text-sm font-bold">
          {{ initials }}
        </div>
        <div class="min-w-0">
          <p class="text-[11px] uppercase tracking-widest text-ink-muted">Họ tên</p>
          <p class="serif mt-0.5 truncate text-xl font-bold">{{ auth.displayName }}</p>
        </div>
      </div>

      <dl class="mt-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <dt class="text-ink-muted">Vai trò</dt>
          <dd>{{ roleLabel[auth.user.value?.role ?? ''] ?? auth.user.value?.role }}</dd>
        </div>
      </dl>
    </UiCard>

    <UiButton variant="outline" size="lg" class="mt-6 w-full" @click="auth.logout()">
      <LogOut class="h-4 w-4" />
      Đăng xuất
    </UiButton>
  </div>
</template>
