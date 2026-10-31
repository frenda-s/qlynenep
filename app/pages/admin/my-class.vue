<script setup lang="ts">
import { conductTone, type ConductRating } from '~/utils/conduct'

definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api, toast, errorMessage } = useApi()
const auth = useAuth()

type ClassStudent = {
  id: string
  student_code: string
  full_name: string
  points: number
  points_deducted: number
  violations: number
  rank: number
  classification: ConductRating
}

type RecentViolation = {
  id: string
  student: { full_name: string; class_name: string | null } | null
  total_points: number
  created_at: number
  note: string | null
  items: { name: string }[]
}

type MyClass = {
  rank: number
  class_id: string
  name: string
  grade: number
  academic_year: string
  size: number
  violations: number
  points_deducted: number
  avg_points: number
  perfect_students: number
  classification: ConductRating
  students: ClassStudent[]
  recent_violations: RecentViolation[]
}

type MineResponse = {
  period: string
  scoped: boolean
  summary: { classes: number; students: number; average_points: number; violations: number }
  classes: MyClass[]
}

const period = ref('month')
const data = ref<MineResponse | null>(null)
const selectedId = ref('')
const loading = ref(false)

const periodOptions = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'semester', label: 'Học kỳ' },
  { value: 'year', label: 'Năm học' },
]

const selected = computed(
  () => data.value?.classes.find((c) => c.class_id === selectedId.value) ?? data.value?.classes[0] ?? null,
)

function fmt(ts: number) {
  return new Date(ts + 7 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ')
}

async function load() {
  loading.value = true
  try {
    const res = await api<MineResponse>(`/api/classes/mine?period=${period.value}`)
    data.value = res
    if (!res.classes.some((c) => c.class_id === selectedId.value)) {
      selectedId.value = res.classes[0]?.class_id ?? ''
    }
  } catch (e: unknown) {
    toast.error('Không tải được lớp', errorMessage(e))
  } finally {
    loading.value = false
  }
}

watch(period, load, { immediate: true })
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="serif text-3xl font-bold">{{ auth.isTeacher.value ? 'Lớp của tôi' : 'Tổng quan lớp học' }}</h1>
        <p class="mt-1 text-sm text-ink-muted">
          {{ data?.scoped ? 'Bạn chỉ thấy lớp mình phụ trách.' : 'Toàn bộ lớp đang hoạt động.' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UiSelect v-if="(data?.classes.length ?? 0) > 1" v-model="selectedId" class="w-40">
          <option v-for="c in data?.classes" :key="c.class_id" :value="c.class_id">{{ c.name }}</option>
        </UiSelect>
        <UiSelect v-model="period" class="w-40">
          <option v-for="p in periodOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
        </UiSelect>
      </div>
    </div>

    <div v-if="loading" class="mt-10 text-center text-sm text-ink-muted">Đang tải…</div>

    <div v-else-if="!data || data.classes.length === 0" class="mt-10 rounded-[2px] border border-rule p-8 text-center">
      <p class="serif text-xl font-semibold">Chưa có lớp được phân công</p>
      <p class="mt-2 text-sm text-ink-muted">
        Liên hệ quản trị viên để được gán lớp chủ nhiệm. Sau khi được gán, lớp sẽ xuất hiện tại đây.
      </p>
    </div>

    <template v-else-if="selected">
      <div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <UiCard class="p-4">
          <p class="text-[11px] uppercase tracking-widest text-ink-muted">Sĩ số</p>
          <p class="serif mt-1 text-2xl font-bold">{{ selected.size }}</p>
        </UiCard>
        <UiCard class="p-4">
          <p class="text-[11px] uppercase tracking-widest text-ink-muted">Điểm TB lớp</p>
          <p class="serif mt-1 text-2xl font-bold">{{ selected.avg_points }}</p>
        </UiCard>
        <UiCard class="p-4">
          <p class="text-[11px] uppercase tracking-widest text-ink-muted">Xếp hạng</p>
          <p class="serif mt-1 text-2xl font-bold">#{{ selected.rank }}</p>
        </UiCard>
        <UiCard class="p-4">
          <p class="text-[11px] uppercase tracking-widest text-ink-muted">Vi phạm</p>
          <p class="serif mt-1 text-2xl font-bold">{{ selected.violations }}</p>
        </UiCard>
        <UiCard class="p-4">
          <p class="text-[11px] uppercase tracking-widest text-ink-muted">Hạnh kiểm</p>
          <p class="mt-2">
            <UiBadge :variant="conductTone(selected.classification)">{{ selected.classification }}</UiBadge>
          </p>
        </UiCard>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <NuxtLink :to="`/print/student-badges?class=${selected.class_id}`">
          <UiButton variant="outline">In thẻ lớp {{ selected.name }}</UiButton>
        </NuxtLink>
        <NuxtLink :to="`/admin/students?class_id=${selected.class_id}`">
          <UiButton variant="outline">Danh sách học sinh</UiButton>
        </NuxtLink>
        <NuxtLink to="/admin/rankings">
          <UiButton variant="outline">Xem xếp hạng</UiButton>
        </NuxtLink>
      </div>

      <div class="mt-8 grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <div class="flex items-center justify-between">
            <h2 class="serif text-xl font-bold">Danh sách lớp {{ selected.name }}</h2>
            <p class="text-xs text-ink-muted">{{ selected.academic_year }}</p>
          </div>
          <div class="mt-3 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
                  <th class="py-2 pr-4">#</th>
                  <th class="py-2 pr-4">Học sinh</th>
                  <th class="py-2 pr-4">Điểm</th>
                  <th class="py-2 pr-4">Vi phạm</th>
                  <th class="py-2">Hạnh kiểm</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in selected.students" :key="s.id" class="rule-b">
                  <td class="py-2.5 pr-4 serif font-bold">{{ s.rank }}</td>
                  <td class="py-2.5 pr-4">
                    <NuxtLink :to="`/admin/students/${s.id}`" class="font-medium hover:underline">
                      {{ s.full_name }}
                    </NuxtLink>
                    <span class="ml-2 font-mono text-[11px] text-ink-faint">{{ s.student_code }}</span>
                  </td>
                  <td class="py-2.5 pr-4 serif font-semibold">{{ s.points }}</td>
                  <td class="py-2.5 pr-4">{{ s.violations }}</td>
                  <td class="py-2.5">
                    <UiBadge :variant="conductTone(s.classification)">{{ s.classification }}</UiBadge>
                  </td>
                </tr>
                <tr v-if="selected.students.length === 0">
                  <td colspan="5" class="py-6 text-center text-ink-muted">Lớp chưa có học sinh</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 class="serif text-xl font-bold">Vi phạm gần đây</h2>
          <p class="text-xs text-ink-muted">Trong {{ periodOptions.find((p) => p.value === period)?.label.toLowerCase() }}</p>
          <ul v-if="selected.recent_violations.length" class="mt-3 divide-y divide-rule">
            <li v-for="v in selected.recent_violations" :key="v.id" class="py-3">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-sm font-medium">{{ v.student?.full_name ?? 'Học sinh' }}</p>
                  <p class="text-xs text-ink-muted">{{ v.items.map((i) => i.name).join(', ') }}</p>
                  <p class="mt-0.5 text-[11px] text-ink-faint">{{ fmt(v.created_at) }}</p>
                </div>
                <span class="serif font-bold text-accent">{{ v.total_points }}</span>
              </div>
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-ink-faint">Lớp chưa có vi phạm nào.</p>
        </div>
      </div>
    </template>
  </div>
</template>
