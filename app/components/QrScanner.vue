<script setup lang="ts">
import jsQR from 'jsqr'
import { SwitchCamera, CameraOff } from '@lucide/vue'

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
  <div class="relative aspect-square overflow-hidden rounded-lg bg-ink">
    <video ref="videoRef" class="h-full w-full object-cover" muted playsinline />
    <canvas ref="canvasRef" class="hidden" />

    <div
      v-if="error"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink p-6 text-center"
    >
      <CameraOff class="h-8 w-8 text-paper/70" />
      <p class="text-sm text-paper/90">{{ error }}</p>
      <button
        type="button"
        class="mt-1 rounded-lg border border-paper/60 px-3 py-1.5 text-xs text-paper transition-colors hover:bg-paper hover:text-ink"
        @click="start()"
      >
        Thử lại
      </button>
    </div>

    <template v-else>
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2">
          <span class="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-paper" />
          <span class="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-paper" />
          <span class="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-paper" />
          <span class="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-paper" />
          <span class="scan-sweep absolute inset-x-0 top-0 h-px bg-paper" />
        </div>
        <p class="absolute bottom-16 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-widest text-paper/80">
          Đưa mã QR vào khung
        </p>
      </div>
      <button
        type="button"
        class="absolute bottom-3 right-3 rounded-full bg-paper/20 p-3 text-paper backdrop-blur transition-colors active:bg-paper active:text-ink"
        aria-label="Đổi camera"
        @click="toggleFacing"
      >
        <SwitchCamera class="h-5 w-5" />
      </button>
    </template>
  </div>
</template>