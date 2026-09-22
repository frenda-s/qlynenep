<script setup lang="ts">
definePageMeta({ middleware: 'guest', layout: 'default' })

const auth = useAuth()
const toast = useToast()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  if (!username.value || !password.value) {
    error.value = 'Nhập đầy đủ tên đăng nhập và mật khẩu'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const user = await auth.login(username.value.trim(), password.value)
    if (user.role === 'DISCIPLINE') await navigateTo('/mobile')
    else await navigateTo('/admin')
  } catch (e: unknown) {
    error.value = (e as { message?: string })?.message || 'Đăng nhập thất bại'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="rule-b-thick flex flex-col items-center pb-6 text-center">
        <img src="/logo-circle.png" alt="NeNepOS Logo" class="mb-3 h-20 w-20 rounded-full border border-rule/50 shadow-xs" />
        <p class="serif text-4xl font-bold leading-none">NeNepOS</p>
        <p class="mt-2 text-[11px] uppercase tracking-[0.3em] text-ink-muted">Hệ thống quản lý nề nếp học sinh</p>
      </div>

      <form class="mt-8 space-y-4" @submit.prevent="submit">
        <div>
          <UiLabel for="username">Tên đăng nhập</UiLabel>
          <UiInput id="username" v-model="username" class="mt-1" placeholder="admin" autocomplete="username" />
        </div>
        <div>
          <UiLabel for="password">Mật khẩu</UiLabel>
          <UiInput id="password" v-model="password" type="password" class="mt-1" placeholder="••••••••" autocomplete="current-password" />
        </div>

        <p v-if="error" class="text-sm text-accent">{{ error }}</p>

        <UiButton type="submit" size="lg" class="w-full" :disabled="loading">
          {{ loading ? 'Đang đăng nhập…' : 'Đăng nhập' }}
        </UiButton>
      </form>

      <p class="mt-8 text-center text-[11px] text-ink-faint">
        Tài khoản mẫu: admin / admin123 · discipline1 / discipline123
      </p>
    </div>
  </div>
</template>
