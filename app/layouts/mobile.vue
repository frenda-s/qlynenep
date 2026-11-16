<script setup lang="ts">
import { House, ScanLine, History, UserRound } from '@lucide/vue'

const route = useRoute()

const nav = [
  { label: 'Trang chủ', to: '/mobile', icon: House },
  { label: 'Quét QR', to: '/mobile/scan', icon: ScanLine },
  { label: 'Lịch sử', to: '/mobile/history', icon: History },
  { label: 'Tài khoản', to: '/mobile/account', icon: UserRound },
]

function isActive(to: string) {
  if (to === '/mobile') return route.path === '/mobile'
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <main class="mx-auto max-w-md px-4 pb-28 pt-6">
      <slot />
    </main>

    <nav
      class="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 backdrop-blur"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="mx-auto grid max-w-md grid-cols-4">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors"
          :class="isActive(item.to) ? 'font-semibold text-ink' : 'text-ink-faint'"
        >
          <span
            class="flex h-8 w-12 items-center justify-center rounded-lg transition-colors"
            :class="isActive(item.to) ? 'bg-ink text-paper' : 'text-ink-muted'"
          >
            <component :is="item.icon" class="h-[18px] w-[18px]" :stroke-width="isActive(item.to) ? 2.4 : 1.8" />
          </span>
          {{ item.label }}
        </NuxtLink>
      </div>
    </nav>

    <ToastHost />
  </div>
</template>
