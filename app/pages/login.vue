<script setup lang="ts">
import { UserRound, Lock, Eye, EyeOff, ArrowRight, TriangleAlert } from '@lucide/vue'

definePageMeta({ middleware: 'guest', layout: 'default' })

const auth = useAuth()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

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
    else if (user.role === 'TEACHER') await navigateTo('/admin/my-class')
    else await navigateTo('/admin')
  } catch (e: unknown) {
    error.value = (e as { message?: string })?.message || 'Đăng nhập thất bại'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center px-4 py-10">
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.04]"
      style="background-image: radial-gradient(var(--color-ink) 1px, transparent 1px); background-size: 18px 18px"
    />

    <div class="relative w-full max-w-sm">
      <div class="rule-b-thick flex flex-col items-center pb-6 text-center">
        <img
          src="/logo-circle.png"
          alt="NeNepOS Logo"
          class="mb-3 h-20 w-20 rounded-full border border-rule/50 shadow-sm"
        />
        <p class="serif text-4xl font-bold leading-none">NeNepOS</p>
        <p class="mt-2 text-[11px] uppercase tracking-[0.3em] text-ink-muted">
          Hệ thống quản lý nề nếp học sinh
        </p>
      </div>

      <form class="mt-8 space-y-4" @submit.prevent="submit">
        <div>
          <UiLabel for="username">Tên đăng nhập</UiLabel>
          <div class="relative mt-1">
            <UserRound class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <UiInput
              id="username"
              v-model="username"
              class="pl-9"
              placeholder="admin"
              autocomplete="username"
              :disabled="loading"
            />
          </div>
        </div>

        <div>
          <UiLabel for="password">Mật khẩu</UiLabel>
          <div class="relative mt-1">
            <Lock class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <UiInput
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="px-9"
              placeholder="••••••••"
              autocomplete="current-password"
              :disabled="loading"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-faint transition-colors hover:text-ink"
              :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
              @click="showPassword = !showPassword"
            >
              <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <p v-if="error" class="flex items-start gap-2 text-sm text-accent">
          <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0" />
          {{ error }}
        </p>

        <UiButton type="submit" size="lg" class="w-full" :disabled="loading">
          {{ loading ? 'Đang đăng nhập…' : 'Đăng nhập' }}
          <ArrowRight v-if="!loading" class="h-4 w-4" />
        </UiButton>
      </form>

      <p class="mt-8 text-center text-[11px] leading-relaxed text-ink-faint">
        Tài khoản mẫu: admin / admin123 · discipline1 / discipline123
      </p>
    </div>
  </div>
</template>
