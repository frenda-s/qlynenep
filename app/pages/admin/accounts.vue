<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api } = useApi()

type User = {
  id: string
  username: string
  fullName: string
  role: string
  status: string
  created_at: number
}

const users = ref<User[]>([])

const roleLabel: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  DISCIPLINE: 'Ban nề nếp',
}

function fmt(ts: number) {
  return new Date(ts + 7 * 3600 * 1000).toISOString().slice(0, 10)
}

onMounted(async () => {
  try {
    const res = await api<{ users: User[] }>('/api/users')
    users.value = res.users
  } catch {
    // ignore
  }
})
</script>

<template>
  <div>
    <h1 class="serif text-3xl font-bold">Tài khoản</h1>
    <p class="mt-1 text-sm text-ink-muted">{{ users.length }} tài khoản</p>

    <div class="mt-6 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">Tên đăng nhập</th>
            <th class="py-2 pr-4">Họ tên</th>
            <th class="py-2 pr-4">Vai trò</th>
            <th class="py-2 pr-4">Trạng thái</th>
            <th class="py-2">Tạo lúc</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="rule-b">
            <td class="py-2.5 pr-4 font-mono text-xs">{{ u.username }}</td>
            <td class="py-2.5 pr-4 font-medium">{{ u.fullName }}</td>
            <td class="py-2.5 pr-4">
              <UiBadge :variant="u.role === 'ADMIN' ? 'accent' : 'default'">
                {{ roleLabel[u.role] ?? u.role }}
              </UiBadge>
            </td>
            <td class="py-2.5 pr-4">{{ u.status }}</td>
            <td class="py-2.5">{{ fmt(u.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
