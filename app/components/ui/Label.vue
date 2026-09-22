<script setup lang="ts">
import { cn } from '~/utils/cn'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <label :class="cn('text-xs font-medium uppercase tracking-wide text-ink-muted', props.class)">
    <slot />
  </label>
</template>
