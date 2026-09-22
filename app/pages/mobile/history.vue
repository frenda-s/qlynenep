<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'mobile' })

const { api } = useApi()

type Violation = {
  id: string
  student: { full_name: string; class_name: string | null } | null
  note: string | null
  total_points: number
  created_at: number
  items: { name: string; penalty_points: number }[]
}

const items = ref<Violation[]>([])
const loading = ref(true)

function fmt(ts: number) {
  return new Date(ts + 7 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ')
}

onMounted(async () => {
  try {
    const res = await api<{ violations: Violation[] }>('/api/violations?limit=100')
    items.value = res.violations
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <header class="rule-b pb-4">
      <h1 class="serif text-2xl font-bold">Lịch sử kiểm tra</h1>
      <p class="mt-1 text-xs text-ink-muted">Các lần ghi nhận của bạn</p>
    </header>

    <div v-if="loading" class="mt-6 text-sm text-ink-muted">Đang tải…</div>

    <div v-else-if="items.length === 0" class="mt-6 text-sm text-ink-muted">
      Chưa có lần ghi nhận nào.
    </div>

    <ul v-else class="mt-4 divide-y divide-rule">
      <li v-for="v in items" :key="v.id" class="py-3">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-sm font-semibold">{{ v.student?.full_name ?? 'Học sinh' }}</p>
            <p class="text-xs text-ink-muted">{{ v.student?.class_name ?? '' }}</p>
          </div>
          <span class="serif text-lg font-bold text-accent">{{ v.total_points }}</span>
        </div>
        <p class="mt-1 text-xs text-ink-muted">{{ v.items.map((i) => i.name).join(', ') }}</p>
        <p class="mt-0.5 text-[11px] text-ink-faint">{{ fmt(v.created_at) }}</p>
      </li>
    </ul>
  </div>
</template>
