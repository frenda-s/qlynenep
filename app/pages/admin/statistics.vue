<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api } = useApi()

type StatViolations = {
  by_type: { name: string; count: number; points: number }[]
  series: { ts: number; count: number; points: number }[]
}
type StatClasses = { classes: { name: string; count: number; points: number }[] }

const period = ref('month')
const byType = ref<StatViolations['by_type']>([])
const series = ref<StatViolations['series']>([])
const classes = ref<StatClasses['classes']>([])

const periodOptions = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'semester', label: 'Học kỳ' },
  { value: 'year', label: 'Năm học' },
]

const maxSeries = computed(() => Math.max(1, ...series.value.map((s) => s.count)))
const maxType = computed(() => Math.max(1, ...byType.value.map((t) => t.count)))

async function load() {
  try {
    const v = await api<StatViolations>(`/api/statistics/violations?period=${period.value}`)
    byType.value = v.by_type
    series.value = v.series
  } catch {
    // ignore
  }
  try {
    const c = await api<StatClasses>(`/api/statistics/classes?period=${period.value}`)
    classes.value = c.classes
  } catch {
    // ignore
  }
}

watch(period, load, { immediate: true })
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="serif text-3xl font-bold">Thống kê</h1>
      <UiSelect v-model="period" class="w-40">
        <option v-for="p in periodOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
      </UiSelect>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <UiCard class="p-5">
        <h2 class="serif text-lg font-bold">Vi phạm theo thời gian</h2>
        <div class="mt-4 flex h-40 items-end gap-1">
          <div v-for="(s, i) in series" :key="i" class="flex-1">
            <div class="w-full bg-ink" :style="{ height: `${Math.max(3, (s.count / maxSeries) * 120)}px` }" />
          </div>
        </div>
      </UiCard>

      <UiCard class="p-5">
        <h2 class="serif text-lg font-bold">Loại vi phạm</h2>
        <ul v-if="byType.length" class="mt-4 space-y-3">
          <li v-for="t in byType" :key="t.name">
            <div class="flex justify-between text-sm">
              <span>{{ t.name }}</span>
              <span class="font-semibold">{{ t.count }} <span class="text-ink-faint">({{ t.points }}đ)</span></span>
            </div>
            <div class="mt-1 h-2 w-full bg-paper-dim">
              <div class="h-2 bg-ink" :style="{ width: `${(t.count / maxType) * 100}%` }" />
            </div>
          </li>
        </ul>
        <p v-else class="mt-4 text-sm text-ink-faint">Chưa có dữ liệu</p>
      </UiCard>
    </div>

    <UiCard class="mt-6 p-5">
      <h2 class="serif text-lg font-bold">Thống kê theo lớp</h2>
      <table class="mt-4 w-full text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">Lớp</th>
            <th class="py-2 pr-4">Vi phạm</th>
            <th class="py-2">Điểm trừ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in classes" :key="c.name" class="rule-b">
            <td class="py-2.5 pr-4 font-medium">{{ c.name }}</td>
            <td class="py-2.5 pr-4">{{ c.count }}</td>
            <td class="py-2.5 serif font-semibold text-accent">-{{ c.points }}</td>
          </tr>
        </tbody>
      </table>
    </UiCard>
  </div>
</template>
