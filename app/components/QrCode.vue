<script setup lang="ts">
import qrcode from 'qrcode-generator'

const props = withDefaults(
  defineProps<{ value: string; size?: number; margin?: number; class?: string }>(),
  { size: 128, margin: 2 },
)

const svg = computed(() => {
  const qr = qrcode(0, 'M')
  qr.addData(props.value)
  qr.make()
  // cellSize cố định 4 → crisp; margin là quiet zone để máy quét đọc được.
  const cellSize = 4
  return qr
    .createSvgTag({ cellSize, margin: props.margin, scalable: true })
    .replace('<rect width="100%" height="100%" fill="white"', '<rect width="100%" height="100%" fill="#ffffff"')
    .replace('stroke="transparent" fill="black"', 'stroke="transparent" fill="currentColor"')
    .replace('fill="white"', 'fill="#ffffff"')
})
</script>

<template>
  <div
    :class="props.class"
    :style="{ width: `${size}px`, height: `${size}px` }"
    class="text-ink [&_svg]:h-full [&_svg]:w-full"
    v-html="svg"
  />
</template>
