<script setup lang="ts">
import { classifyConduct, conductTone, type ConductRating } from '~/utils/conduct'

definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api, toast, errorMessage } = useApi()
const auth = useAuth()

type RatingSummary = { rating: string; count: number }
type Summary = { total: number; average_points: number; perfect?: number; by_rating: RatingSummary[] }

type StudentRank = {
  rank: number
  student_id: string
  full_name: string
  student_code: string
  class_id: string
  class_name: string
  grade: number
  points: number
  points_deducted: number
  violations: number
  classification: string
}

type ClassRank = {
  rank: number
  class_id: string
  name: string
  grade: number
  size: number
  violations: number
  points_deducted: number
  avg_points: number
  perfect_students: number
  classification: string
}

type Cls = { id: string; name: string; grade: number }

const tab = ref<'students' | 'classes'>('students')
const period = ref('month')
const classId = ref('')
const grade = ref('')
const q = ref('')
const loading = ref(false)

const students = ref<StudentRank[]>([])
const classes = ref<ClassRank[]>([])
const summary = ref<Summary | null>(null)
const classList = ref<Cls[]>([])

const periodOptions = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'semester', label: 'Học kỳ' },
  { value: 'year', label: 'Năm học' },
]

const scoped = computed(() => auth.user.value?.role === 'TEACHER')
const topThree = computed(() => students.value.slice(0, 3))
const now = new Date().toLocaleDateString('vi-VN')

async function load() {
  loading.value = true
  const params = new URLSearchParams({ period: period.value })
  if (classId.value) params.set('class_id', classId.value)
  if (grade.value) params.set('grade', grade.value)
  if (q.value.trim()) params.set('q', q.value.trim())

  try {
    if (tab.value === 'students') {
      const res = await api<{ students: StudentRank[]; summary: Summary }>(
        `/api/rankings/students?${params}`,
      )
      students.value = res.students
      summary.value = res.summary
    } else {
      const res = await api<{ classes: ClassRank[]; summary: Summary }>(
        `/api/rankings/classes?${params}`,
      )
      classes.value = res.classes
      summary.value = res.summary
    }
  } catch (e: unknown) {
    toast.error('Không tải được xếp hạng', errorMessage(e))
  } finally {
    loading.value = false
  }
}

async function loadClasses() {
  try {
    const res = await api<{ classes: Cls[] }>('/api/classes')
    classList.value = res.classes
  } catch {
    // ignore
  }
}

function clearFilters() {
  classId.value = ''
  grade.value = ''
  q.value = ''
  load()
}

function print() {
  window.print()
}

function exportCsv() {
  let lines: string[]
  if (tab.value === 'students') {
    const header = ['rank', 'student_code', 'full_name', 'class_name', 'points', 'points_deducted', 'violations', 'classification']
    lines = [
      header.join(','),
      ...students.value.map((s) =>
        [s.rank, s.student_code, s.full_name, s.class_name, s.points, s.points_deducted, s.violations, s.classification].join(','),
      ),
    ]
  } else {
    const header = ['rank', 'class_name', 'grade', 'size', 'avg_points', 'violations', 'classification']
    lines = [
      header.join(','),
      ...classes.value.map((c) =>
        [c.rank, c.name, c.grade, c.size, c.avg_points, c.violations, c.classification].join(','),
      ),
    ]
  }
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `xep-hang-${tab.value}-${period.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

watch([tab, period, classId, grade], load, { immediate: true })
onMounted(loadClasses)
</script>

<template>
  <div>
    <div class="no-print flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="serif text-3xl font-bold">Xếp hạng nề nếp</h1>
        <p class="mt-1 text-sm text-ink-muted">
          Bảng xếp hạng theo điểm nề nếp
          <span v-if="scoped"> · chỉ lớp bạn phụ trách</span>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton variant="outline" @click="exportCsv">Xuất CSV</UiButton>
        <UiButton variant="outline" @click="print">🖨 In bảng</UiButton>
        <UiSelect v-model="period" class="w-40">
          <option v-for="p in periodOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
        </UiSelect>
      </div>
    </div>

    <!-- Bảng xếp hạng in ra có tiêu đề riêng -->
    <div class="print-head">
      <p class="text-xs uppercase tracking-widest">NeNepOS · Bảng xếp hạng nề nếp</p>
      <p class="text-xs">Ngày {{ now }} · {{ periodOptions.find((p) => p.value === period)?.label }}</p>
    </div>

    <div class="no-print mt-5 grid gap-3 lg:grid-cols-4">
      <UiInput v-model="q" placeholder="Tìm học sinh / lớp…" @keyup.enter="load" />
      <UiSelect v-model="classId">
        <option value="">Tất cả lớp</option>
        <option v-for="c in classList" :key="c.id" :value="c.id">{{ c.name }}</option>
      </UiSelect>
      <UiSelect v-model="grade">
        <option value="">Tất cả khối</option>
        <option v-for="g in [10, 11, 12]" :key="g" :value="g">Khối {{ g }}</option>
      </UiSelect>
      <UiButton variant="outline" @click="clearFilters">Xóa bộ lọc</UiButton>
    </div>

    <!-- Summary -->
    <div v-if="summary" class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
      <UiCard class="p-4">
        <p class="text-[11px] uppercase tracking-widest text-ink-muted">Tổng</p>
        <p class="serif mt-1 text-2xl font-bold">{{ summary.total }}</p>
      </UiCard>
      <UiCard class="p-4">
        <p class="text-[11px] uppercase tracking-widest text-ink-muted">Điểm TB</p>
        <p class="serif mt-1 text-2xl font-bold">{{ summary.average_points }}</p>
      </UiCard>
      <UiCard v-for="r in summary.by_rating.slice(0, 3)" :key="r.rating" class="p-4">
        <p class="text-[11px] uppercase tracking-widest text-ink-muted">{{ r.rating }}</p>
        <p class="serif mt-1 text-2xl font-bold">{{ r.count }}</p>
      </UiCard>
    </div>

    <div class="no-print mt-6 flex gap-1 border-b border-rule">
      <button
        class="border-b-2 px-4 py-2 text-sm"
        :class="tab === 'students' ? 'border-ink font-semibold' : 'border-transparent text-ink-muted'"
        @click="tab = 'students'"
      >
        Học sinh
      </button>
      <button
        class="border-b-2 px-4 py-2 text-sm"
        :class="tab === 'classes' ? 'border-ink font-semibold' : 'border-transparent text-ink-muted'"
        @click="tab = 'classes'"
      >
        Lớp
      </button>
    </div>

    <div v-if="loading" class="no-print mt-8 text-center text-sm text-ink-muted">Đang tải…</div>

    <!-- Student ranking -->
    <div v-else-if="tab === 'students'" class="mt-6">
      <!-- Podium chỉ hiển thị khi không lọc và có dữ liệu -->
      <div v-if="topThree.length && !q && !classId && !grade" class="no-print mb-6 grid gap-3 md:grid-cols-3">
        <UiCard
          v-for="s in topThree"
          :key="s.student_id"
          class="p-5"
          :class="s.rank === 1 ? 'border-ink' : ''"
        >
          <div class="flex items-start justify-between">
            <p class="text-[11px] uppercase tracking-widest text-ink-muted">Hạng {{ s.rank }}</p>
            <UiBadge :variant="conductTone(classifyConduct(s.points))">{{ s.classification }}</UiBadge>
          </div>
          <p class="serif mt-2 text-xl font-bold">{{ s.full_name }}</p>
          <p class="text-xs text-ink-muted">{{ s.class_name }} · {{ s.student_code }}</p>
          <p class="serif mt-3 text-3xl font-bold">{{ s.points }}</p>
        </UiCard>
      </div>

      <div class="overflow-x-auto">
        <table class="rank-table w-full text-sm">
          <thead>
            <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
              <th class="py-2 pr-4">#</th>
              <th class="py-2 pr-4">Học sinh</th>
              <th class="py-2 pr-4">Lớp</th>
              <th class="py-2 pr-4">Điểm</th>
              <th class="py-2 pr-4">Điểm trừ</th>
              <th class="py-2 pr-4">Vi phạm</th>
              <th class="py-2">Hạnh kiểm</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in students" :key="s.student_id" class="rule-b">
              <td class="py-2.5 pr-4 serif font-bold">{{ s.rank }}</td>
              <td class="py-2.5 pr-4">
                <span class="font-medium">{{ s.full_name }}</span>
                <span class="ml-2 font-mono text-[11px] text-ink-faint">{{ s.student_code }}</span>
              </td>
              <td class="py-2.5 pr-4">{{ s.class_name }}</td>
              <td class="py-2.5 pr-4 serif font-semibold">{{ s.points }}</td>
              <td class="py-2.5 pr-4 text-accent">-{{ s.points_deducted }}</td>
              <td class="py-2.5 pr-4">{{ s.violations }}</td>
              <td class="py-2.5">
                <UiBadge :variant="conductTone(s.classification as ConductRating)">{{ s.classification }}</UiBadge>
              </td>
            </tr>
            <tr v-if="students.length === 0">
              <td colspan="7" class="py-8 text-center text-ink-muted">Không có dữ liệu xếp hạng</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Class ranking -->
    <div v-else class="mt-6 overflow-x-auto">
      <table class="rank-table w-full text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">#</th>
            <th class="py-2 pr-4">Lớp</th>
            <th class="py-2 pr-4">Khối</th>
            <th class="py-2 pr-4">Sĩ số</th>
            <th class="py-2 pr-4">Vi phạm</th>
            <th class="py-2 pr-4">Điểm TB</th>
            <th class="py-2 pr-4">HS không vi phạm</th>
            <th class="py-2">Hạnh kiểm</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in classes" :key="c.class_id" class="rule-b">
            <td class="py-2.5 pr-4 serif font-bold">{{ c.rank }}</td>
            <td class="py-2.5 pr-4 font-medium">{{ c.name }}</td>
            <td class="py-2.5 pr-4">{{ c.grade }}</td>
            <td class="py-2.5 pr-4">{{ c.size }}</td>
            <td class="py-2.5 pr-4">{{ c.violations }}</td>
            <td class="py-2.5 pr-4 serif font-semibold">{{ c.avg_points }}</td>
            <td class="py-2.5 pr-4">{{ c.perfect_students }}</td>
            <td class="py-2.5">
              <UiBadge :variant="conductTone(c.classification as ConductRating)">{{ c.classification }}</UiBadge>
            </td>
          </tr>
          <tr v-if="classes.length === 0">
            <td colspan="8" class="py-8 text-center text-ink-muted">Không có dữ liệu xếp hạng</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-4 text-[11px] text-ink-faint">
      Xếp hạng đồng hạng khi bằng điểm. Hạnh kiểm: Tốt ≥ 90 · Khá 80–89 · Trung bình 65–79 · Yếu 50–64 · Kém &lt; 50.
    </p>
  </div>
</template>

<style scoped>
.print-head {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-head {
    display: block;
    margin-bottom: 8mm;
    border-bottom: 1px solid #1a1917;
    padding-bottom: 3mm;
  }

  .rank-table {
    font-size: 11px;
  }

  .rank-table th,
  .rank-table td {
    border-bottom: 1px solid #ddd;
    padding: 4px 6px;
  }
}
</style>
