<script setup lang="ts">
import { classifyConduct, conductTone, type ConductRating } from '~/utils/conduct'
import { Download, Printer } from '@lucide/vue'
import { toCsv } from '~/utils/csv'

definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api, toast, errorMessage } = useApi()
const auth = useAuth()

type RatingSummary = { rating: string; count: number }
type Summary = { total: number; average_points: number; perfect?: number; by_rating: RatingSummary[] }
type Reason = { name: string; count: number; points: number; students?: number }

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
  reasons: Reason[]
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
  reasons: Reason[]
}

type Cls = { id: string; name: string; grade: number }

type WeeklyClass = ClassRank
type WeeklySummary = {
  from: number
  to: number
  label: string
  champions: WeeklyClass[]
  classes: WeeklyClass[]
}

type DetailViolation = {
  id: string
  created_at: number
  date: string
  note: string | null
  points: number
  types: string
  full_name: string
  student_code: string
  class_name: string
}
type Detail = { label: string; violations: DetailViolation[] }

const tab = ref<'students' | 'classes' | 'weekly'>('students')
const period = ref('month')
const classId = ref('')
const grade = ref('')
const q = ref('')
const loading = ref(false)

const students = ref<StudentRank[]>([])
const classes = ref<ClassRank[]>([])
const summary = ref<Summary | null>(null)
const classList = ref<Cls[]>([])
const weekly = ref<WeeklySummary | null>(null)

// Drill-down
const detailOpen = ref(false)
const detailLoading = ref(false)
const detailTitle = ref('')
const detail = ref<Detail | null>(null)

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
    if (tab.value === 'weekly') {
      const wparams = new URLSearchParams()
      if (classId.value) wparams.set('class_id', classId.value)
      if (grade.value) wparams.set('grade', grade.value)
      weekly.value = await api<WeeklySummary>(`/api/rankings/weekly?${wparams}`)
      classes.value = weekly.value.classes
    } else if (tab.value === 'students') {
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

function reasonText(reasons: Reason[]): string {
  return reasons.map((r) => `${r.name} ×${r.count}`).join(', ')
}

async function openDetail(filter: { student_id?: string; class_id?: string }, title: string) {
  detailTitle.value = title
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const params = new URLSearchParams()
    if (filter.student_id) params.set('student_id', filter.student_id)
    if (filter.class_id) params.set('class_id', filter.class_id)
    params.set('period', tab.value === 'weekly' ? 'week' : period.value)
    detail.value = await api<Detail>(`/api/rankings/detail?${params}`)
  } catch (e: unknown) {
    toast.error('Không tải được chi tiết', errorMessage(e))
  } finally {
    detailLoading.value = false
  }
}

function print() {
  window.print()
}

function exportCsv() {
  let rows: (string | number)[][]
  if (tab.value === 'students') {
    const header = ['rank', 'student_code', 'full_name', 'class_name', 'points', 'points_deducted', 'violations', 'classification']
    rows = [
      header,
      ...students.value.map((s) => [
        s.rank, s.student_code, s.full_name, s.class_name, s.points, s.points_deducted, s.violations, s.classification,
      ]),
    ]
  } else {
    const header = ['rank', 'class_name', 'grade', 'size', 'avg_points', 'violations', 'classification']
    rows = [
      header,
      ...classes.value.map((c) => [
        c.rank, c.name, c.grade, c.size, c.avg_points, c.violations, c.classification,
      ]),
    ]
  }
  const blob = new Blob(['\ufeff' + toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `xep-hang-${tab.value}-${tab.value === 'weekly' ? 'week' : period.value}.csv`
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
        <UiButton variant="outline" @click="exportCsv"><Download class="h-4 w-4" /> Xuất CSV</UiButton>
        <UiButton variant="outline" @click="print"><Printer class="h-4 w-4" /> In bảng</UiButton>
        <UiSelect v-if="tab !== 'weekly'" v-model="period" class="w-40">
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
    <div v-if="summary && tab !== 'weekly'" class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
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
      <button
        class="border-b-2 px-4 py-2 text-sm"
        :class="tab === 'weekly' ? 'border-ink font-semibold' : 'border-transparent text-ink-muted'"
        @click="tab = 'weekly'"
      >
        Tổng kết tuần
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
              <th class="py-2 pr-4">Loại vi phạm</th>
              <th class="py-2">Hạnh kiểm</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in students"
              :key="s.student_id"
              class="rule-b cursor-pointer transition-colors hover:bg-paper-dim"
              @click="openDetail({ student_id: s.student_id, class_id: s.class_id }, s.full_name)"
            >
              <td class="py-2.5 pr-4 serif font-bold">{{ s.rank }}</td>
              <td class="py-2.5 pr-4">
                <span class="font-medium">{{ s.full_name }}</span>
                <span class="ml-2 font-mono text-[11px] text-ink-faint">{{ s.student_code }}</span>
              </td>
              <td class="py-2.5 pr-4">{{ s.class_name }}</td>
              <td class="py-2.5 pr-4 serif font-semibold">{{ s.points }}</td>
              <td class="py-2.5 pr-4 text-accent">-{{ s.points_deducted }}</td>
              <td class="py-2.5 pr-4">{{ s.violations }}</td>
              <td class="py-2.5 pr-4">
                <span v-if="s.reasons.length" class="text-accent" :title="reasonText(s.reasons)">
                  {{ reasonText(s.reasons) }}
                </span>
                <span v-else class="text-ink-faint">Không vi phạm</span>
              </td>
              <td class="py-2.5">
                <UiBadge :variant="conductTone(s.classification as ConductRating)">{{ s.classification }}</UiBadge>
              </td>
            </tr>
            <tr v-if="students.length === 0">
              <td colspan="8" class="py-8 text-center text-ink-muted">Không có dữ liệu xếp hạng</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Class ranking -->
    <div v-else-if="tab === 'classes'" class="mt-6 overflow-x-auto">
      <table class="rank-table w-full text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">#</th>
            <th class="py-2 pr-4">Lớp</th>
            <th class="py-2 pr-4">Khối</th>
            <th class="py-2 pr-4">Sĩ số</th>
            <th class="py-2 pr-4">Vi phạm</th>
            <th class="py-2 pr-4">Điểm TB</th>
            <th class="py-2 pr-4">Loại vi phạm</th>
            <th class="py-2 pr-4">HS không vi phạm</th>
            <th class="py-2">Hạnh kiểm</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in classes"
            :key="c.class_id"
            class="rule-b cursor-pointer transition-colors hover:bg-paper-dim"
            @click="openDetail({ class_id: c.class_id }, c.name)"
          >
            <td class="py-2.5 pr-4 serif font-bold">{{ c.rank }}</td>
            <td class="py-2.5 pr-4 font-medium">{{ c.name }}</td>
            <td class="py-2.5 pr-4">{{ c.grade }}</td>
            <td class="py-2.5 pr-4">{{ c.size }}</td>
            <td class="py-2.5 pr-4">{{ c.violations }}</td>
            <td class="py-2.5 pr-4 serif font-semibold">{{ c.avg_points }}</td>
            <td class="py-2.5 pr-4">
              <span v-if="c.reasons.length" class="text-accent" :title="reasonText(c.reasons)">
                {{ reasonText(c.reasons) }}
              </span>
              <span v-else class="text-ink-faint">Không vi phạm</span>
            </td>
            <td class="py-2.5 pr-4">{{ c.perfect_students }}</td>
            <td class="py-2.5">
              <UiBadge :variant="conductTone(c.classification as ConductRating)">{{ c.classification }}</UiBadge>
            </td>
          </tr>
          <tr v-if="classes.length === 0">
            <td colspan="9" class="py-8 text-center text-ink-muted">Không có dữ liệu xếp hạng</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Weekly summary -->
    <div v-else-if="tab === 'weekly'" class="mt-6">
      <!-- Champion banner -->
      <div v-if="weekly?.champions.length" class="no-print mb-6 rounded-xl border-2 border-ink p-5">
        <p class="text-[11px] uppercase tracking-widest text-ink-muted">Nhất tuần · {{ weekly.label }}</p>
        <div class="mt-2 flex flex-wrap items-end gap-4">
          <template v-for="c in weekly.champions" :key="c.class_id">
            <div>
              <p class="serif text-3xl font-bold">{{ c.name }}</p>
              <p class="text-xs text-ink-muted">Khối {{ c.grade }}</p>
            </div>
          </template>
          <p class="serif ml-auto text-2xl font-bold text-ink">{{ weekly.champions[0]?.avg_points ?? '—' }}</p>
        </div>
        <p class="mt-2 text-xs text-ink-faint">
          {{ weekly.champions.length > 1 ? 'Nhiều lớp đồng hạng nhất tuần.' : 'Dẫn đầu bảng xếp hạng tuần.' }}
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="rank-table w-full text-sm">
          <thead>
            <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
              <th class="py-2 pr-4">#</th>
              <th class="py-2 pr-4">Lớp</th>
              <th class="py-2 pr-4">Khối</th>
              <th class="py-2 pr-4">Sĩ số</th>
              <th class="py-2 pr-4">Điểm TB</th>
              <th class="py-2 pr-4">Điểm trừ</th>
              <th class="py-2 pr-4">Vi phạm</th>
              <th class="py-2 pr-4">HS không vi phạm</th>
              <th class="py-2">Vi phạm tụt hạng</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in weekly?.classes"
              :key="c.class_id"
              class="rule-b align-top cursor-pointer transition-colors hover:bg-paper-dim"
              @click="openDetail({ class_id: c.class_id }, c.name)"
            >
              <td class="py-2.5 pr-4 serif font-bold">{{ c.rank }}</td>
              <td class="py-2.5 pr-4 font-medium">{{ c.name }}</td>
              <td class="py-2.5 pr-4">{{ c.grade }}</td>
              <td class="py-2.5 pr-4">{{ c.size }}</td>
              <td class="py-2.5 pr-4 serif font-semibold">{{ c.avg_points }}</td>
              <td class="py-2.5 pr-4 text-accent">-{{ c.points_deducted }}</td>
              <td class="py-2.5 pr-4">{{ c.violations }}</td>
              <td class="py-2.5 pr-4">{{ c.perfect_students }}</td>
              <td class="py-2.5">
                <template v-if="c.reasons.length">
                  <span v-for="(r, i) in c.reasons" :key="r.name" class="mr-1 inline-block">
                    <span class="text-accent">{{ r.name }} ×{{ r.count }}</span
                    ><span v-if="i < c.reasons.length - 1">, </span>
                  </span>
                </template>
                <span v-else class="text-ink-faint">Không vi phạm</span>
              </td>
            </tr>
            <tr v-if="!weekly?.classes.length">
              <td colspan="9" class="py-8 text-center text-ink-muted">Không có dữ liệu xếp hạng</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p class="mt-4 text-[11px] text-ink-faint">
      Xếp hạng đồng hạng khi bằng điểm. Hạnh kiểm: Tốt ≥ 90 · Khá 80–89 · Trung bình 65–79 · Yếu 50–64 · Kém &lt; 50.
    </p>

    <!-- Drill-down dialog -->
    <UiDialog v-model:open="detailOpen" :title="detailTitle" :description="detail?.label">
      <div v-if="detailLoading" class="py-8 text-center text-sm text-ink-muted">Đang tải…</div>
      <div v-else-if="detail && detail.violations.length" class="space-y-2">
        <div
          v-for="v in detail.violations"
          :key="v.id"
          class="rounded-lg border border-rule p-3 text-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-medium">{{ v.full_name }}</p>
              <p class="text-xs text-ink-muted">{{ v.class_name }} · {{ v.student_code }} · {{ v.date }}</p>
            </div>
            <span class="serif shrink-0 font-semibold text-accent">{{ v.points }}</span>
          </div>
          <p class="mt-1 text-xs text-ink-muted">
            <span class="font-medium text-ink">{{ v.types }}</span>
            <span v-if="v.note"> · Ghi chú: {{ v.note }}</span>
          </p>
        </div>
      </div>
      <p v-else class="py-8 text-center text-sm text-ink-faint">Không có vi phạm trong kỳ này</p>
    </UiDialog>
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
