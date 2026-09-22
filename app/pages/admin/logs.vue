<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api } = useApi()

type Log = {
  id: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata: unknown
  created_at: number
  user: { full_name: string; role: string } | null
}

const logs = ref<Log[]>([])

function fmt(ts: number) {
  return new Date(ts + 7 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ')
}

onMounted(async () => {
  try {
    const res = await api<{ logs: Log[] }>('/api/logs?limit=200')
    logs.value = res.logs
  } catch {
    // ignore
  }
})
</script>

<template>
  <div>
    <h1 class="serif text-3xl font-bold">Nhật ký hoạt động</h1>
    <p class="mt-1 text-sm text-ink-muted">Audit log hệ thống</p>

    <div class="mt-6 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">Thời gian</th>
            <th class="py-2 pr-4">Người dùng</th>
            <th class="py-2 pr-4">Hành động</th>
            <th class="py-2">Đối tượng</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in logs" :key="l.id" class="rule-b">
            <td class="py-2.5 pr-4 text-xs text-ink-muted">{{ fmt(l.created_at) }}</td>
            <td class="py-2.5 pr-4">{{ l.user?.full_name ?? '—' }}</td>
            <td class="py-2.5 pr-4 font-mono text-xs">{{ l.action }}</td>
            <td class="py-2.5 font-mono text-xs text-ink-muted">
              {{ l.target_type ? `${l.target_type}:${l.target_id}` : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
