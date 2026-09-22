<script setup lang="ts">
import { cn } from '~/utils/cn'

type Variant = 'default' | 'outline' | 'accent' | 'success' | 'muted'

const props = withDefaults(defineProps<{ variant?: Variant; class?: string }>(), {
  variant: 'default',
})

const variants: Record<Variant, string> = {
  default: 'bg-ink text-paper',
  outline: 'bg-transparent text-ink border border-ink',
  accent: 'bg-accent/10 text-accent-ink border border-accent/30',
  success: 'bg-ok/10 text-ok border border-ok/30',
  muted: 'bg-paper-dim text-ink-muted border border-rule',
}
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center rounded-[2px] px-2 py-0.5 text-xs font-medium',
        variants[variant],
        props.class,
      )
    "
  >
    <slot />
  </span>
</template>
