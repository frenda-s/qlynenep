<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api, errorMessage, toast } = useApi()

type Violation = {
  id: string
  student: { full_name: string; class_name: string | null } | null
  recorded_by: { full_name: string } | null
  note: string | null
  total_points: number
  created_at: number
  items: { name: string; penalty_points: number }[]
}

const items = ref<Violation[]>([])
const total = ref(0)
const page = ref(1)
const limit = 50
const period = ref('')
const classId = ref('')

function fmtDateTime(ts: number) {
  return new Date(ts + 7 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ')
}

async function load() {
  try {
    const params = new URLSearchParams({ page: String(page.value), limit: String(limit) })
    if (period.value) params.set('period', period.value)
    if (classId.value) params.set('class_id', classId.value)
    const res = await api<{ violations: Violation[]; total: number }>(`/api/violations?${params}`)
    items.value = res.violations
    total.value = res.total
  } catch (e: unknown) {
    toast.error('Không tải được', errorMessage(e))
  }
}

async function remove(v: Violation) {
  if (!confirm('Xóa bản ghi vi phạm này?')) return
  try {
    await api(`/api/violations/${v.id}`, { method: 'DELETE' })
    toast.success('Đã xóa')
    await load()
  } catch (e: unknown) {
    toast.error('Thất bại', errorMessage(e))
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))

onMounted(load)
</script>

<template>
  <div>
    <h1 class="serif text-3xl font-bold">Vi phạm</h1>
    <p class="mt-1 text-sm text-ink-muted">{{ total }} bản ghi</p>

    <div class="mt-4 flex flex-wrap gap-3">
      <UiSelect v-model="period" class="w-44" placeholder="Mọi thời gian" @change="page = 1; load()">
        <option value="">Mọi thời gian</option>
        <option value="today">Hôm nay</option>
        <option value="week">Tuần này</option>
        <option value="month">Tháng này</option>
        <option value="semester">Học kỳ</option>
        <option value="year">Năm học</option>
      </UiSelect>
    </div>

    <div class="mt-6 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">Thời gian</th>
            <th class="py-2 pr-4">Học sinh</th>
            <th class="py-2 pr-4">Lỗi vi phạm</th>
            <th class="py-2 pr-4">Điểm</th>
            <th class="py-2 pr-4">Ghi bởi</th>
            <th class="py-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in items" :key="v.id" class="rule-b">
            <td class="py-2.5 pr-4 text-xs text-ink-muted">{{ fmtDateTime(v.created_at) }}</td>
            <td class="py-2.5 pr-4">
              <p class="font-medium">{{ v.student?.full_name ?? '—' }}</p>
              <p class="text-xs text-ink-muted">{{ v.student?.class_name ?? '' }}</p>
            </td>
            <td class="py-2.5 pr-4">{{ v.items.map((i) => i.name).join(', ') }}</td>
            <td class="py-2.5 pr-4 serif font-semibold text-accent">{{ v.total_points }}</td>
            <td class="py-2.5 pr-4">{{ v.recorded_by?.full_name ?? '—' }}</td>
            <td class="py-2.5">
              <button class="text-xs text-accent hover:text-accent-ink" @click="remove(v)">Xóa</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex items-center justify-between text-sm">
      <span class="text-ink-muted">Trang {{ page }} / {{ totalPages }}</span>
      <div class="flex gap-2">
        <UiButton variant="outline" size="sm" :disabled="page <= 1" @click="page--; load()">Trước</UiButton>
        <UiButton variant="outline" size="sm" :disabled="page >= totalPages" @click="page++; load()">Sau</UiButton>
      </div>
    </div>
  </div>
</template>
