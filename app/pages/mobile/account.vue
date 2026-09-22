<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'mobile' })

const auth = useAuth()

const roleLabel: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  DISCIPLINE: 'Ban nề nếp',
}
</script>

<template>
  <div>
    <header class="rule-b pb-4">
      <h1 class="serif text-2xl font-bold">Tài khoản</h1>
    </header>

    <UiCard class="mt-6 p-5">
      <p class="text-[11px] uppercase tracking-widest text-ink-muted">Họ tên</p>
      <p class="serif mt-1 text-xl font-bold">{{ auth.displayName }}</p>

      <dl class="mt-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <dt class="text-ink-muted">Vai trò</dt>
          <dd>{{ roleLabel[auth.user?.role ?? ''] ?? auth.user?.role }}</dd>
        </div>
      </dl>
    </UiCard>

    <UiButton variant="outline" size="lg" class="mt-6 w-full" @click="auth.logout()">Đăng xuất</UiButton>
  </div>
</template>
