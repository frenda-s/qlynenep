<script setup lang="ts">
import { cn } from '~/utils/cn'

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'link'
type Size = 'sm' | 'default' | 'lg' | 'icon'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    class?: string
  }>(),
  { variant: 'default', size: 'default', type: 'button', disabled: false },
)

const variants: Record<Variant, string> = {
  default: 'bg-ink text-paper hover:bg-ink/90 border border-ink',
  outline: 'bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper',
  ghost: 'bg-transparent text-ink hover:bg-paper-dim border border-transparent',
  destructive: 'bg-accent text-paper hover:bg-accent-ink border border-accent',
  link: 'bg-transparent text-ink underline underline-offset-4 hover:text-accent border-0 px-0',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  default: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="
      cn(
        'inline-flex items-center justify-center gap-2 rounded-[2px] font-sans font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        props.class,
      )
    "
  >
    <slot />
  </button>
</template>
