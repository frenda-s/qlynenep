<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import { X } from '@lucide/vue'

const open = defineModel<boolean>({ default: false })
defineProps<{ title?: string; description?: string }>()
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay fixed inset-0 z-40 bg-ink/50 backdrop-blur-[1px]" />
      <DialogContent
        class="dialog-content fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-ink bg-paper p-6 shadow-xl"
      >
        <DialogClose
          class="absolute right-4 top-4 rounded-lg p-1 text-ink-faint transition-colors hover:bg-paper-dim hover:text-ink"
          aria-label="Đóng"
        >
          <X class="h-4 w-4" />
        </DialogClose>
        <DialogTitle v-if="title" class="serif pr-8 text-xl font-semibold text-ink">
          {{ title }}
        </DialogTitle>
        <DialogDescription v-if="description" class="mt-1 text-sm text-ink-muted">
          {{ description }}
        </DialogDescription>
        <div class="mt-4">
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
