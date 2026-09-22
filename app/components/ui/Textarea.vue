<script setup lang="ts">
import { cn } from '~/utils/cn'

const props = withDefaults(defineProps<{ class?: string; modelValue?: string }>(), {
  modelValue: '',
})
const emit = defineEmits<{ 'update:modelValue': [string] }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    :value="modelValue"
    :class="
      cn(
        'flex w-full rounded-[2px] border border-rule bg-paper px-3 py-2 text-sm text-ink',
        'placeholder:text-ink-faint focus:border-ink focus:outline-none focus:ring-0',
        props.class,
      )
    "
    @input="onInput"
  />
</template>
