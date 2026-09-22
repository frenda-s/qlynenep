<script setup lang="ts">
import { cn } from '~/utils/cn'

const props = withDefaults(defineProps<{ class?: string; modelValue?: string | number }>(), {
  modelValue: '',
})
const emit = defineEmits<{ 'update:modelValue': [string | number] }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    :value="modelValue"
    :class="
      cn(
        'flex h-10 w-full rounded-[2px] border border-rule bg-paper px-3 text-sm text-ink',
        'placeholder:text-ink-faint focus:border-ink focus:outline-none focus:ring-0',
        props.class,
      )
    "
    @input="onInput"
  />
</template>
