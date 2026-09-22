<script setup lang="ts">
const route = useRoute()

const nav = [
  { label: 'Trang chủ', to: '/mobile' },
  { label: 'Quét QR', to: '/mobile/scan' },
  { label: 'Lịch sử', to: '/mobile/history' },
  { label: 'Tài khoản', to: '/mobile/account' },
]

function isActive(to: string) {
  if (to === '/mobile') return route.path === '/mobile'
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <main class="mx-auto max-w-md px-4 pb-24 pt-6">
      <slot />
    </main>

    <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper">
      <div class="mx-auto grid max-w-md grid-cols-4">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-1 py-2.5 text-[11px]"
          :class="isActive(item.to) ? 'font-semibold text-ink' : 'text-ink-muted'"
        >
          <span class="h-1 w-6" :class="isActive(item.to) ? 'bg-ink' : 'bg-transparent'" />
          {{ item.label }}
        </NuxtLink>
      </div>
    </nav>

    <ToastHost />
  </div>
</template>
