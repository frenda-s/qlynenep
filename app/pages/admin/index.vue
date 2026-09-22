<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api } = useApi()

type Dashboard = {
  students: number
  classes: number
  violations_today: number
  points_today: number
}

type Series = { ts: number; count: number; points: number }
type TypeStat = { name: string; count: number; points: number }

const dash = ref<Dashboard | null>(null)
const series = ref<Series[]>([])
const byType = ref<TypeStat[]>([])

const maxSeries = computed(() => Math.max(1, ...series.value.map((s) => s.count)))

function seriesLabel(ts: number) {
  return new Date(ts + 7 * 3600 * 1000).toISOString().slice(5, 10)
}

onMounted(async () => {
  try {
    dash.value = await api<Dashboard>('/api/statistics/dashboard')
  } catch {
    // ignore
  }
  try {
    const s = await api<{ series: Series[] }>('/api/statistics/violations?period=week')
    series.value = s.series
  } catch {
    // ignore
  }
  try {
    const t = await api<{ by_type: TypeStat[] }>('/api/statistics/violations?period=month')
    byType.value = t.by_type.slice(0, 6)
  } catch {
    // ignore
  }
})
</script>

<template>
  <div>
    <h1 class="serif text-3xl font-bold">Dashboard</h1>
    <p class="mt-1 text-sm text-ink-muted">Tổng quan tình hình nề nếp</p>

    <div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <UiCard class="p-5">
        <p class="text-[11px] uppercase tracking-widest text-ink-muted">Học sinh</p>
        <p class="serif mt-2 text-3xl font-bold">{{ dash?.students ?? '—' }}</p>
      </UiCard>
      <UiCard class="p-5">
        <p class="text-[11px] uppercase tracking-widest text-ink-muted">Lớp</p>
        <p class="serif mt-2 text-3xl font-bold">{{ dash?.classes ?? '—' }}</p>
      </UiCard>
      <UiCard class="p-5">
        <p class="text-[11px] uppercase tracking-widest text-ink-muted">Vi phạm hôm nay</p>
        <p class="serif mt-2 text-3xl font-bold">{{ dash?.violations_today ?? '—' }}</p>
      </UiCard>
      <UiCard class="p-5">
        <p class="text-[11px] uppercase tracking-widest text-ink-muted">Điểm trừ hôm nay</p>
        <p class="serif mt-2 text-3xl font-bold text-accent">-{{ dash?.points_today ?? '—' }}</p>
      </UiCard>
    </div>

    <div class="mt-8 grid gap-6 lg:grid-cols-2">
      <UiCard class="p-5">
        <h2 class="serif text-lg font-bold">Vi phạm theo thời gian</h2>
        <p class="text-xs text-ink-muted">7 ngày gần đây</p>
        <div class="mt-4 flex h-40 items-end gap-1">
          <div v-for="(s, i) in series" :key="i" class="flex flex-1 flex-col items-center gap-1">
            <div
              class="w-full bg-ink transition-all"
              :style="{ height: `${Math.max(4, (s.count / maxSeries) * 120)}px` }"
            />
            <span class="text-[9px] text-ink-faint">{{ seriesLabel(s.ts) }}</span>
          </div>
        </div>
      </UiCard>

      <UiCard class="p-5">
        <h2 class="serif text-lg font-bold">Loại vi phạm phổ biến</h2>
        <p class="text-xs text-ink-muted">Tháng này</p>
        <div v-if="byType.length === 0" class="mt-4 text-sm text-ink-faint">Chưa có dữ liệu</div>
        <ul v-else class="mt-4 space-y-3">
          <li v-for="t in byType" :key="t.name">
            <div class="flex justify-between text-sm">
              <span>{{ t.name }}</span>
              <span class="font-semibold">{{ t.count }}</span>
            </div>
            <div class="mt-1 h-2 w-full bg-paper-dim">
              <div
                class="h-2 bg-ink"
                :style="{ width: `${(t.count / Math.max(1, byType[0].count)) * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </UiCard>
    </div>
  </div>
</template>
