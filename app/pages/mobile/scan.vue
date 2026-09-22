<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'mobile' })

const { api, errorMessage, toast } = useApi()

type Student = {
  id: string
  student_code: string
  full_name: string
  photo: string | null
  class_name: string | null
  current_points: number
  total_violations: number
  recent_violations: { id: string; total_points: number; created_at: number; items: { name: string; penalty_points: number }[] }[]
}

type ViolationType = {
  id: string
  name: string
  description: string | null
  penalty_points: number
  is_active: boolean
}

type Step = 'scan' | 'student' | 'select' | 'confirm' | 'success'

const step = ref<Step>('scan')
const student = ref<Student | null>(null)
const types = ref<ViolationType[]>([])
const selected = ref<Set<string>>(new Set())
const note = ref('')
const loadingTypes = ref(false)
const submitting = ref(false)
const lastResult = ref<{ total: number; duplicate: boolean } | null>(null)
const idempotencyKey = ref('')

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

async function onScan(code: string) {
  try {
    const res = await api<{ student: Student }>(`/api/students/qr/${encodeURIComponent(code)}`)
    student.value = res.student
    step.value = 'student'
  } catch (e: unknown) {
    toast.error('Không thể xử lý mã QR', errorMessage(e))
    step.value = 'scan'
  }
}

function backToScan() {
  step.value = 'scan'
  student.value = null
  selected.value = new Set()
  note.value = ''
}

async function startSelect() {
  step.value = 'select'
  selected.value = new Set()
  note.value = ''
  if (types.value.length === 0) {
    loadingTypes.value = true
    try {
      const res = await api<{ types: ViolationType[] }>('/api/violation-types?active=1')
      types.value = res.types
    } catch (e: unknown) {
      toast.error('Không tải được danh sách lỗi', errorMessage(e))
    } finally {
      loadingTypes.value = false
    }
  }
}

function toggle(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

const selectedTypes = computed(() => types.value.filter((t) => selected.value.has(t.id)))
const previewTotal = computed(() => selectedTypes.value.reduce((s, t) => s + t.penalty_points, 0))

async function confirmSubmit() {
  if (!student.value) return
  submitting.value = true
  idempotencyKey.value = uuid()
  try {
    const res = await api<{ violation: { total_points: number } | null; duplicate: boolean }>(
      '/api/violations',
      {
        method: 'POST',
        body: {
          student_id: student.value.id,
          violation_type_ids: [...selected.value],
          note: note.value || null,
          idempotency_key: idempotencyKey.value,
        },
      },
    )
    lastResult.value = { total: res.violation?.total_points ?? -previewTotal.value, duplicate: res.duplicate }
    step.value = 'success'
  } catch (e: unknown) {
    toast.error('Ghi nhận thất bại', errorMessage(e))
    step.value = 'confirm'
  } finally {
    submitting.value = false
  }
}

function nextStudent() {
  backToScan()
}
</script>

<template>
  <div>
    <header class="rule-b pb-4">
      <button
        v-if="step !== 'scan'"
        class="mb-2 text-sm text-ink-muted hover:text-ink"
        @click="step === 'success' ? backToScan() : (step = 'student')"
      >
        ← Quay lại
      </button>
      <h1 class="serif text-2xl font-bold">{{ step === 'success' ? 'Đã ghi nhận' : 'Ghi nhận vi phạm' }}</h1>
    </header>

    <!-- SCAN -->
    <div v-if="step === 'scan'" class="mt-4">
      <p class="mb-3 text-sm text-ink-muted">Đưa mã QR vào khung hình</p>
      <ClientOnly>
        <QrScanner @scan="onScan" />
      </ClientOnly>
    </div>

    <!-- STUDENT -->
    <div v-else-if="step === 'student' && student" class="mt-4">
      <UiCard class="p-5">
        <div class="flex items-start gap-4">
          <div v-if="student.photo" class="h-24 w-20 shrink-0 overflow-hidden border border-rule">
            <img :src="student.photo" class="h-full w-full object-cover" alt="Ảnh thẻ" />
          </div>
          <div v-else class="flex h-24 w-20 shrink-0 items-center justify-center border border-rule text-center text-[10px] leading-tight text-ink-faint">
            Chưa có ảnh
          </div>
          <div class="min-w-0">
            <h2 class="serif text-2xl font-bold leading-tight">{{ student.full_name }}</h2>
            <p class="mt-1 text-sm text-ink-muted">{{ student.class_name ?? '—' }} · {{ student.student_code }}</p>
          </div>
        </div>

        <dl class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between border-b border-rule pb-2">
            <dt class="text-ink-muted">Lớp</dt>
            <dd class="font-medium">{{ student.class_name ?? '—' }}</dd>
          </div>
          <div class="flex justify-between border-b border-rule pb-2">
            <dt class="text-ink-muted">Mã HS</dt>
            <dd class="font-medium">{{ student.student_code }}</dd>
          </div>
        </dl>

        <div class="mt-4 border-t-2 border-ink pt-4">
          <p class="text-[11px] uppercase tracking-widest text-ink-muted">Điểm hiện tại</p>
          <p class="serif text-4xl font-bold">{{ student.current_points }}</p>
        </div>

        <div v-if="student.recent_violations.length" class="mt-4">
          <p class="text-[11px] uppercase tracking-widest text-ink-muted">Vi phạm gần đây</p>
          <ul class="mt-2 space-y-1 text-sm">
            <li v-for="v in student.recent_violations" :key="v.id" class="text-ink-muted">
              • {{ v.items.map((i) => i.name).join(', ') }}
            </li>
          </ul>
        </div>
      </UiCard>

      <UiButton size="lg" class="mt-6 w-full" @click="startSelect">GHI NHẬN VI PHẠM</UiButton>
    </div>

    <!-- SELECT -->
    <div v-else-if="step === 'select'" class="mt-4">
      <p v-if="loadingTypes" class="text-sm text-ink-muted">Đang tải danh sách lỗi…</p>
      <div v-else class="space-y-2">
        <button
          v-for="t in types"
          :key="t.id"
          type="button"
          class="flex w-full items-center justify-between rounded-[2px] border px-4 py-3 text-left transition-colors"
          :class="selected.has(t.id) ? 'border-ink bg-ink text-paper' : 'border-rule bg-paper text-ink hover:border-ink'"
          @click="toggle(t.id)"
        >
          <span class="flex items-center gap-3">
            <span class="flex h-5 w-5 items-center justify-center border text-xs" :class="selected.has(t.id) ? 'border-paper' : 'border-ink'">
              <span v-if="selected.has(t.id)">✓</span>
            </span>
            <span class="text-sm font-medium">{{ t.name }}</span>
          </span>
          <span class="text-sm" :class="selected.has(t.id) ? 'text-paper/80' : 'text-accent'">-{{ t.penalty_points }}</span>
        </button>
      </div>

      <div class="mt-4">
        <UiLabel>Ghi chú</UiLabel>
        <UiTextarea v-model="note" class="mt-1" placeholder="Không bắt buộc" />
      </div>

      <div class="mt-4 flex items-center justify-between border-t-2 border-ink pt-4">
        <span class="text-sm text-ink-muted">Tổng điểm</span>
        <span class="serif text-2xl font-bold text-accent">-{{ previewTotal }}</span>
      </div>

      <UiButton size="lg" class="mt-4 w-full" :disabled="selectedTypes.length === 0" @click="step = 'confirm'">
        XÁC NHẬN
      </UiButton>
    </div>

    <!-- CONFIRM -->
    <div v-else-if="step === 'confirm' && student" class="mt-4">
      <UiCard class="p-5">
        <h2 class="serif text-xl font-bold">{{ student.full_name }} <span class="text-ink-muted">· {{ student.class_name }}</span></h2>

        <p class="mt-4 text-[11px] uppercase tracking-widest text-ink-muted">Vi phạm</p>
        <ul class="mt-2 space-y-1 text-sm">
          <li v-for="t in selectedTypes" :key="t.id" class="flex justify-between">
            <span>✓ {{ t.name }}</span>
            <span class="text-accent">-{{ t.penalty_points }}</span>
          </li>
        </ul>

        <div class="mt-4 flex justify-between border-t-2 border-ink pt-3">
          <span class="text-sm font-medium">Tổng điểm</span>
          <span class="serif text-2xl font-bold text-accent">-{{ previewTotal }}</span>
        </div>

        <p v-if="note" class="mt-3 text-sm text-ink-muted">Ghi chú: {{ note }}</p>
      </UiCard>

      <div class="mt-6 grid grid-cols-2 gap-3">
        <UiButton variant="outline" size="lg" @click="step = 'select'">HỦY</UiButton>
        <UiButton size="lg" :disabled="submitting" @click="confirmSubmit">
          {{ submitting ? 'Đang gửi…' : 'XÁC NHẬN' }}
        </UiButton>
      </div>
    </div>

    <!-- SUCCESS -->
    <div v-else-if="step === 'success' && student" class="mt-4 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ok text-ok mx-auto">
        <span class="text-3xl">✓</span>
      </div>
      <h2 class="serif mt-4 text-2xl font-bold">Đã ghi nhận vi phạm</h2>
      <p class="mt-2 text-lg text-ink-muted">{{ student.full_name }} · {{ student.class_name }}</p>
      <p class="serif mt-4 text-3xl font-bold text-accent">Tổng điểm trừ: {{ lastResult?.total ?? 0 }}</p>
      <p v-if="lastResult?.duplicate" class="mt-2 text-xs text-ink-faint">Yêu cầu trùng lặp — đã bỏ qua ghi đè.</p>

      <UiButton size="lg" class="mt-8 w-full" @click="nextStudent">QUÉT HỌC SINH TIẾP THEO</UiButton>
    </div>
  </div>
</template>
