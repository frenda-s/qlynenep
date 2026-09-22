<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 flex-col gap-2">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto rounded-[2px] border bg-paper p-4"
        :class="{
          'border-ink': t.variant === 'default',
          'border-ok': t.variant === 'success',
          'border-accent': t.variant === 'destructive',
        }"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-sm font-semibold text-ink">{{ t.title }}</p>
            <p v-if="t.description" class="mt-0.5 text-xs text-ink-muted">{{ t.description }}</p>
          </div>
          <button class="text-ink-faint hover:text-ink" @click="dismiss(t.id)">✕</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
