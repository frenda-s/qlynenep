<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api } = useApi()
const route = useRoute()
const id = computed(() => String(route.params.id))

type Student = {
  id: string
  student_code: string
  full_name: string
  qr_code: string
  photo: string | null
  class_name: string | null
  current_points: number
  total_violations: number
}

type Violation = {
  id: string
  total_points: number
  created_at: number
  note: string | null
  recorded_by: { full_name: string } | null
  items: { name: string; penalty_points: number }[]
}

const student = ref<Student | null>(null)
const history = ref<Violation[]>([])

// Điểm theo thời gian: áp dụng vi phạm theo thứ tự cũ → mới.
const pointsTimeline = computed(() => {
  const reversed = [...history.value].reverse()
  let acc = 100
  const pts = [{ ts: reversed[0]?.created_at ?? Date.now(), points: acc }]
  for (const v of reversed) {
    acc += v.total_points
    pts.push({ ts: v.created_at, points: acc })
  }
  return pts
})

const svgPoints = computed(() => {
  const pts = pointsTimeline.value
  if (pts.length < 2) return ''
  const w = 600
  const h = 120
  const pad = 10
  const minY = Math.min(...pts.map((p) => p.points), 0) - 10
  const maxY = 105
  const minTs = pts[0].ts
  const maxTs = pts[pts.length - 1].ts || minTs + 1
  const x = (ts: number) => pad + ((ts - minTs) / Math.max(1, maxTs - minTs)) * (w - pad * 2)
  const y = (p: number) => pad + ((maxY - p) / (maxY - minY)) * (h - pad * 2)
  return pts.map((p) => `${x(p.ts).toFixed(1)},${y(p.points).toFixed(1)}`).join(' ')
})

function fmtDate(ts: number) {
  return new Date(ts + 7 * 3600 * 1000).toISOString().slice(0, 10)
}

onMounted(async () => {
  try {
    const s = await api<{ student: Student }>(`/api/students/${id.value}`)
    student.value = s.student
  } catch {
    // ignore
  }
  try {
    const v = await api<{ violations: Violation[] }>(`/api/violations?student_id=${id.value}&limit=100`)
    history.value = v.violations
  } catch {
    // ignore
  }
})
</script>

<template>
  <div>
    <NuxtLink to="/admin/students" class="text-sm text-ink-muted hover:text-ink">← Học sinh</NuxtLink>

    <div class="mt-3 flex items-start justify-between gap-6">
      <div class="flex items-start gap-5">
        <div v-if="student?.photo" class="h-28 w-22 shrink-0 overflow-hidden border border-rule">
          <img :src="student.photo" class="h-full w-full object-cover" alt="Ảnh thẻ" />
        </div>
        <div v-else class="flex h-28 w-22 shrink-0 items-center justify-center border border-rule text-center text-[11px] leading-tight text-ink-faint">
          Chưa có ảnh
        </div>
        <div>
          <h1 class="serif text-3xl font-bold">{{ student?.full_name ?? 'Học sinh' }}</h1>
          <p class="mt-1 text-sm text-ink-muted">
            Lớp {{ student?.class_name ?? '—' }} · {{ student?.student_code }}
          </p>
        </div>
      </div>
      <UiCard class="px-6 py-3 text-center">
        <p class="text-[11px] uppercase tracking-widest text-ink-muted">Điểm hiện tại</p>
        <p class="serif text-4xl font-bold">{{ student?.current_points ?? '—' }}</p>
      </UiCard>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <UiCard class="p-5">
        <h2 class="serif text-lg font-bold">Biến động điểm</h2>
        <svg v-if="svgPoints" viewBox="0 0 600 120" class="mt-4 w-full">
          <polyline :points="svgPoints" fill="none" stroke="#1a1917" stroke-width="2" />
        </svg>
        <p v-else class="mt-4 text-sm text-ink-faint">Chưa có dữ liệu vi phạm</p>
      </UiCard>

      <UiCard class="p-5">
        <h2 class="serif text-lg font-bold">Tổng quan</h2>
        <dl class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-ink-muted">Tổng vi phạm</dt>
            <dd class="font-semibold">{{ student?.total_violations ?? 0 }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-muted">Mã QR</dt>
            <dd class="font-mono text-xs">{{ student?.qr_code }}</dd>
          </div>
        </dl>
      </UiCard>
    </div>

    <UiCard class="mt-6 p-5">
      <h2 class="serif text-lg font-bold">Lịch sử vi phạm</h2>
      <div v-if="history.length === 0" class="mt-4 text-sm text-ink-faint">Không có vi phạm</div>
      <ul v-else class="mt-4 divide-y divide-rule">
        <li v-for="v in history" :key="v.id" class="flex items-start justify-between py-3">
          <div>
            <p class="text-sm font-medium">{{ v.items.map((i) => i.name).join(', ') }}</p>
            <p class="mt-0.5 text-xs text-ink-muted">
              {{ fmtDate(v.created_at) }} · bởi {{ v.recorded_by?.full_name ?? '—' }}
            </p>
          </div>
          <span class="serif text-lg font-bold text-accent">{{ v.total_points }}</span>
        </li>
      </ul>
    </UiCard>
  </div>
</template>
