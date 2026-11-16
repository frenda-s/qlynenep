<script setup lang="ts">
import { cn } from '~/utils/cn'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('rounded-lg border border-rule bg-paper shadow-xs', props.class)">
    <slot />
  </div>
</template>
