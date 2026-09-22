<script setup lang="ts">
import jsQR from 'jsqr'

const emit = defineEmits<{ scan: [string]; error: [string] }>()

const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const scanning = ref(false)
const error = ref('')

let stream: MediaStream | null = null
let rafId = 0
let lastScan = 0
let facing: 'environment' | 'user' = 'environment'

async function start(mode: 'environment' | 'user' = 'environment') {
  stop()
  error.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }
    scanning.value = true
    tick()
  } catch {
    error.value = 'Không truy cập được camera. Hãy cấp quyền camera.'
    emit('error', error.value)
  }
}

function tick() {
  if (!scanning.value) return
  rafId = requestAnimationFrame(tick)
  const now = Date.now()
  if (now - lastScan < 200) return
  lastScan = now
  decode()
}

function decode() {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas || !video.videoWidth) return
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
  if (code?.data) {
    stop()
    emit('scan', code.data)
  }
}

function stop() {
  scanning.value = false
  cancelAnimationFrame(rafId)
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
  if (videoRef.value) videoRef.value.srcObject = null
}

async function toggleFacing() {
  facing = facing === 'environment' ? 'user' : 'environment'
  await start(facing)
}

onMounted(() => start())
onBeforeUnmount(stop)

defineExpose({ start, stop })
</script>

<template>
  <div class="relative aspect-square overflow-hidden rounded-[2px] bg-ink">
    <video ref="videoRef" class="h-full w-full object-cover" muted playsinline />
    <canvas ref="canvasRef" class="hidden" />

    <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-ink p-6 text-center text-sm text-paper">
      {{ error }}
    </div>

    <template v-else>
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 border-2 border-paper/70" />
      </div>
      <button
        type="button"
        class="absolute bottom-3 right-3 rounded-full bg-paper/20 p-3 text-paper backdrop-blur"
        aria-label="Đổi camera"
        @click="toggleFacing"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      </button>
    </template>
  </div>
</template>
