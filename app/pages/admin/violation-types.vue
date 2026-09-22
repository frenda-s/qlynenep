<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api, errorMessage, toast } = useApi()

type VType = {
  id: string
  name: string
  description: string | null
  penalty_points: number
  is_active: boolean
}

const types = ref<VType[]>([])

const dialogOpen = ref(false)
const editing = ref<VType | null>(null)
const form = reactive({ name: '', description: '', penalty_points: 5, is_active: true })

async function load() {
  try {
    const res = await api<{ types: VType[] }>('/api/violation-types')
    types.value = res.types
  } catch (e: unknown) {
    toast.error('Không tải được', errorMessage(e))
  }
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.description = ''
  form.penalty_points = 5
  form.is_active = true
  dialogOpen.value = true
}

function openEdit(t: VType) {
  editing.value = t
  form.name = t.name
  form.description = t.description ?? ''
  form.penalty_points = t.penalty_points
  form.is_active = t.is_active
  dialogOpen.value = true
}

async function save() {
  if (!form.name) return
  const body = {
    name: form.name,
    description: form.description || null,
    penalty_points: form.penalty_points,
    is_active: form.is_active,
  }
  try {
    if (editing.value) {
      await api(`/api/violation-types/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Đã cập nhật')
    } else {
      await api('/api/violation-types', { method: 'POST', body })
      toast.success('Đã thêm loại vi phạm')
    }
    dialogOpen.value = false
    await load()
  } catch (e: unknown) {
    toast.error('Lưu thất bại', errorMessage(e))
  }
}

async function toggleActive(t: VType) {
  try {
    await api(`/api/violation-types/${t.id}`, {
      method: 'PUT',
      body: { is_active: !t.is_active },
    })
    await load()
  } catch (e: unknown) {
    toast.error('Thất bại', errorMessage(e))
  }
}

async function remove(t: VType) {
  if (!confirm(`Xóa loại vi phạm "${t.name}"?`)) return
  try {
    await api(`/api/violation-types/${t.id}`, { method: 'DELETE' })
    toast.success('Đã xóa')
    await load()
  } catch (e: unknown) {
    toast.error('Thất bại', errorMessage(e))
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="serif text-3xl font-bold">Loại vi phạm</h1>
        <p class="mt-1 text-sm text-ink-muted">{{ types.length }} loại</p>
      </div>
      <UiButton @click="openCreate">+ Thêm loại vi phạm</UiButton>
    </div>

    <div class="mt-6 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">Tên lỗi</th>
            <th class="py-2 pr-4">Mô tả</th>
            <th class="py-2 pr-4">Điểm phạt</th>
            <th class="py-2 pr-4">Trạng thái</th>
            <th class="py-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in types" :key="t.id" class="rule-b">
            <td class="py-2.5 pr-4 font-medium">{{ t.name }}</td>
            <td class="py-2.5 pr-4 text-ink-muted">{{ t.description ?? '—' }}</td>
            <td class="py-2.5 pr-4 serif font-semibold text-accent">-{{ t.penalty_points }}</td>
            <td class="py-2.5 pr-4">
              <UiBadge :variant="t.is_active ? 'success' : 'muted'">
                {{ t.is_active ? 'Đang bật' : 'Đã tắt' }}
              </UiBadge>
            </td>
            <td class="py-2.5">
              <div class="flex gap-3 text-xs">
                <button class="text-ink-muted hover:text-ink" @click="openEdit(t)">Sửa</button>
                <button class="text-ink-muted hover:text-ink" @click="toggleActive(t)">
                  {{ t.is_active ? 'Tắt' : 'Bật' }}
                </button>
                <button class="text-accent hover:text-accent-ink" @click="remove(t)">Xóa</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiDialog v-model="dialogOpen" :title="editing ? 'Sửa loại vi phạm' : 'Thêm loại vi phạm'">
      <div class="space-y-4">
        <div>
          <UiLabel>Tên lỗi</UiLabel>
          <UiInput v-model="form.name" class="mt-1" placeholder="Không đeo bảng tên" />
        </div>
        <div>
          <UiLabel>Mô tả</UiLabel>
          <UiTextarea v-model="form.description" class="mt-1" placeholder="Mô tả ngắn gọn" />
        </div>
        <div>
          <UiLabel>Điểm phạt</UiLabel>
          <UiInput v-model="form.penalty_points" type="number" class="mt-1" />
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.is_active" type="checkbox" class="h-4 w-4" />
          Đang hoạt động
        </label>
        <div class="flex justify-end gap-2">
          <UiButton variant="outline" @click="dialogOpen = false">Hủy</UiButton>
          <UiButton @click="save">Lưu</UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>
