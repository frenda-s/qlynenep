<script setup lang="ts">
import { CircleCheck, CircleAlert, Info, X } from '@lucide/vue'

const { toasts, dismiss } = useToast()

const icons = {
  default: Info,
  success: CircleCheck,
  destructive: CircleAlert,
} as const

const tones = {
  default: 'border-ink text-ink',
  success: 'border-ok text-ok',
  destructive: 'border-accent text-accent',
} as const
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:w-80">
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto w-full rounded-lg border border-l-4 bg-paper p-4 shadow-sm"
          :class="tones[t.variant ?? 'default']"
        >
          <div class="flex items-start gap-3">
            <component :is="icons[t.variant ?? 'default']" class="mt-0.5 h-4 w-4 shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-ink">{{ t.title }}</p>
              <p v-if="t.description" class="mt-0.5 text-xs text-ink-muted">{{ t.description }}</p>
            </div>
            <button class="shrink-0 text-ink-faint transition-colors hover:text-ink" aria-label="Đóng" @click="dismiss(t.id)">
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
