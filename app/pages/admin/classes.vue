<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api, errorMessage, toast } = useApi()

type Cls = {
  id: string
  name: string
  grade: number
  academic_year: string
  status: 'active' | 'inactive'
  size: number
  teacher: { id: string; fullName: string } | null
}

type User = { id: string; fullName: string; role: string }

const classes = ref<Cls[]>([])
const teachers = ref<User[]>([])

const dialogOpen = ref(false)
const editing = ref<Cls | null>(null)
const form = reactive({ name: '', grade: 10, academic_year: '2025-2026', teacher_id: '' })

async function load() {
  try {
    const res = await api<{ classes: Cls[] }>('/api/classes')
    classes.value = res.classes
  } catch (e: unknown) {
    toast.error('Không tải được', errorMessage(e))
  }
}

async function loadTeachers() {
  try {
    const res = await api<{ users: User[] }>('/api/users')
    teachers.value = res.users.filter((u) => u.role === 'TEACHER')
  } catch {
    // ignore
  }
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.grade = 10
  form.academic_year = '2025-2026'
  form.teacher_id = ''
  dialogOpen.value = true
}

function openEdit(c: Cls) {
  editing.value = c
  form.name = c.name
  form.grade = c.grade
  form.academic_year = c.academic_year
  form.teacher_id = c.teacher?.id ?? ''
  dialogOpen.value = true
}

async function save() {
  if (!form.name) return
  const body = {
    name: form.name,
    grade: form.grade,
    academic_year: form.academic_year,
    teacher_id: form.teacher_id || null,
  }
  try {
    if (editing.value) {
      await api(`/api/classes/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Đã cập nhật lớp')
    } else {
      await api('/api/classes', { method: 'POST', body })
      toast.success('Đã tạo lớp')
    }
    dialogOpen.value = false
    await load()
  } catch (e: unknown) {
    toast.error('Lưu thất bại', errorMessage(e))
  }
}

async function remove(c: Cls) {
  if (!confirm(`Vô hiệu hóa lớp "${c.name}"?`)) return
  try {
    await api(`/api/classes/${c.id}`, { method: 'DELETE' })
    toast.success('Đã vô hiệu hóa lớp')
    await load()
  } catch (e: unknown) {
    toast.error('Thất bại', errorMessage(e))
  }
}

onMounted(() => {
  load()
  loadTeachers()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="serif text-3xl font-bold">Lớp</h1>
        <p class="mt-1 text-sm text-ink-muted">{{ classes.length }} lớp</p>
      </div>
      <UiButton @click="openCreate">+ Thêm lớp</UiButton>
    </div>

    <div class="mt-6 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">Tên lớp</th>
            <th class="py-2 pr-4">Khối</th>
            <th class="py-2 pr-4">Năm học</th>
            <th class="py-2 pr-4">Sĩ số</th>
            <th class="py-2 pr-4">Giáo viên</th>
            <th class="py-2 pr-4">Trạng thái</th>
            <th class="py-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in classes" :key="c.id" class="rule-b">
            <td class="py-2.5 pr-4 font-medium">{{ c.name }}</td>
            <td class="py-2.5 pr-4">{{ c.grade }}</td>
            <td class="py-2.5 pr-4">{{ c.academic_year }}</td>
            <td class="py-2.5 pr-4">{{ c.size }}</td>
            <td class="py-2.5 pr-4">{{ c.teacher?.fullName ?? '—' }}</td>
            <td class="py-2.5 pr-4">
              <UiBadge :variant="c.status === 'active' ? 'success' : 'muted'">
                {{ c.status === 'active' ? 'Hoạt động' : 'Vô hiệu' }}
              </UiBadge>
            </td>
            <td class="py-2.5">
              <div class="flex gap-3 text-xs">
                <button class="text-ink-muted hover:text-ink" @click="openEdit(c)">Sửa</button>
                <button class="text-accent hover:text-accent-ink" @click="remove(c)">Vô hiệu</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiDialog v-model="dialogOpen" :title="editing ? 'Sửa lớp' : 'Thêm lớp'">
      <div class="space-y-4">
        <div>
          <UiLabel>Tên lớp</UiLabel>
          <UiInput v-model="form.name" class="mt-1" placeholder="10A1" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <UiLabel>Khối</UiLabel>
            <UiInput v-model="form.grade" type="number" class="mt-1" />
          </div>
          <div>
            <UiLabel>Năm học</UiLabel>
            <UiInput v-model="form.academic_year" class="mt-1" />
          </div>
        </div>
        <div>
          <UiLabel>Giáo viên chủ nhiệm</UiLabel>
          <UiSelect v-model="form.teacher_id" class="mt-1" placeholder="Chưa gán">
            <option value="">Chưa gán</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.fullName }}</option>
          </UiSelect>
        </div>
        <div class="flex justify-end gap-2">
          <UiButton variant="outline" @click="dialogOpen = false">Hủy</UiButton>
          <UiButton @click="save">Lưu</UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>
