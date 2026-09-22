<script setup lang="ts">
import qrcode from 'qrcode-generator'

definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api, errorMessage, toast } = useApi()

type Student = {
  id: string
  student_code: string
  full_name: string
  qr_code: string
  class: { id: string; name: string; grade: number } | null
  class_name: string
  status: 'active' | 'inactive'
  points: number
  violation_count: number
}

type Cls = { id: string; name: string; grade: number; size: number }

const students = ref<Student[]>([])
const classes = ref<Cls[]>([])
const total = ref(0)
const page = ref(1)
const limit = 50

const q = ref('')
const classId = ref('')
const grade = ref('')
const status = ref('')

const loading = ref(false)

// Dialog state
const dialogOpen = ref(false)
const editing = ref<Student | null>(null)
const form = reactive({ student_code: '', full_name: '', class_id: '', status: 'active' as 'active' | 'inactive', photo: '' })

const qrOpen = ref(false)
const qrStudent = ref<Student | null>(null)

const importOpen = ref(false)
const importText = ref('')
const importResult = ref<string | null>(null)
const importing = ref(false)
const fileInput = ref<HTMLInputElement>()
const photoInput = ref<HTMLInputElement>()

function triggerFile() {
  fileInput.value?.click()
}

function triggerPhoto() {
  photoInput.value?.click()
}

function onPhotoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
    toast.error('Định dạng không hợp lệ', 'Chỉ nhận PNG/JPEG/WebP')
    return
  }
  if (file.size > 4 * 1024 * 1024) {
    toast.error('Ảnh quá lớn', 'Tối đa 4MB')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    form.photo = String(reader.result ?? '')
  }
  reader.readAsDataURL(file)
}

function removePhoto() {
  form.photo = ''
}

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), limit: String(limit) })
    if (q.value) params.set('q', q.value)
    if (classId.value) params.set('class_id', classId.value)
    if (grade.value) params.set('grade', grade.value)
    if (status.value) params.set('status', status.value)
    const res = await api<{ students: Student[]; total: number }>(`/api/students?${params}`)
    students.value = res.students
    total.value = res.total
  } catch (e: unknown) {
    toast.error('Không tải được danh sách', errorMessage(e))
  } finally {
    loading.value = false
  }
}

async function loadClasses() {
  try {
    const res = await api<{ classes: Cls[] }>('/api/classes')
    classes.value = res.classes
  } catch {
    // ignore
  }
}

function openCreate() {
  editing.value = null
  form.student_code = ''
  form.full_name = ''
  form.class_id = classes.value[0]?.id ?? ''
  form.status = 'active'
  form.photo = ''
  dialogOpen.value = true
}

async function openEdit(s: Student) {
  editing.value = s
  form.student_code = s.student_code
  form.full_name = s.full_name
  form.class_id = s.class?.id ?? ''
  form.status = s.status
  form.photo = ''
  dialogOpen.value = true
  // Lấy ảnh thẻ hiện tại (list không trả ảnh để nhẹ payload)
  try {
    const res = await api<{ student: { photo?: string | null } }>(`/api/students/${s.id}`)
    form.photo = res.student.photo ?? ''
  } catch {
    // giữ nguyên
  }
}

async function save() {
  if (!form.full_name) {
    toast.error('Thiếu thông tin', 'Nhập họ tên học sinh')
    return
  }
  const body = {
    full_name: form.full_name,
    student_code: form.student_code || undefined,
    class_id: form.class_id || undefined,
    status: form.status,
    photo: form.photo || null,
  }
  try {
    if (editing.value) {
      await api(`/api/students/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Đã cập nhật học sinh')
    } else {
      await api('/api/students', { method: 'POST', body })
      toast.success('Đã thêm học sinh')
    }
    dialogOpen.value = false
    await load()
  } catch (e: unknown) {
    toast.error('Lưu thất bại', errorMessage(e))
  }
}

async function disableStudent(s: Student) {
  if (!confirm(`Vô hiệu hóa học sinh "${s.full_name}"?`)) return
  try {
    await api(`/api/students/${s.id}`, { method: 'DELETE' })
    toast.success('Đã vô hiệu hóa')
    await load()
  } catch (e: unknown) {
    toast.error('Thất bại', errorMessage(e))
  }
}

function showQr(s: Student) {
  qrStudent.value = s
  qrOpen.value = true
}

function downloadQr() {
  if (!qrStudent.value) return
  const qr = qrcode(0, 'M')
  qr.addData(qrStudent.value.qr_code)
  qr.make()
  const url = qr.createDataURL(8, 4)
  const a = document.createElement('a')
  a.href = url
  a.download = `${qrStudent.value.student_code}.png`
  a.click()
}

async function runImport() {
  if (!importText.value.trim()) return
  importing.value = true
  try {
    const res = await api<{ imported: number; errors: string[] }>('/api/students/import', {
      method: 'POST',
      body: { csv: importText.value },
    })
    importResult.value = `Đã nhập ${res.imported} học sinh. ${res.errors.length ? `Lỗi: ${res.errors.join('; ')}` : ''}`
    if (res.imported > 0) await load()
  } catch (e: unknown) {
    toast.error('Import thất bại', errorMessage(e))
  } finally {
    importing.value = false
  }
}

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    importText.value = String(reader.result ?? '')
  }
  reader.readAsText(file)
}

function exportCsv() {
  const header = ['student_code', 'full_name', 'class_name', 'points', 'violation_count', 'status']
  const lines = students.value.map((s) =>
    [s.student_code, s.full_name, s.class_name, s.points, s.violation_count, s.status].join(','),
  )
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'students.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))

onMounted(() => {
  loadClasses()
  load()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="serif text-3xl font-bold">Học sinh</h1>
        <p class="mt-1 text-sm text-ink-muted">{{ total }} học sinh</p>
      </div>
      <div class="flex gap-2">
        <UiButton variant="outline" @click="exportCsv">Xuất CSV</UiButton>
        <UiButton variant="outline" @click="importOpen = true">Nhập CSV</UiButton>
        <NuxtLink to="/print/student-badges">
          <UiButton variant="outline">In thẻ</UiButton>
        </NuxtLink>
        <UiButton @click="openCreate">+ Thêm học sinh</UiButton>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <UiInput v-model="q" placeholder="Tìm theo tên / mã HS" @keyup.enter="page = 1; load()" />
      <UiSelect v-model="classId" placeholder="Tất cả lớp" @change="page = 1; load()">
        <option value="">Tất cả lớp</option>
        <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
      </UiSelect>
      <UiSelect v-model="grade" placeholder="Tất cả khối" @change="page = 1; load()">
        <option value="">Tất cả khối</option>
        <option v-for="g in [10, 11, 12]" :key="g" :value="g">Khối {{ g }}</option>
      </UiSelect>
      <UiSelect v-model="status" placeholder="Trạng thái" @change="page = 1; load()">
        <option value="">Tất cả</option>
        <option value="active">Đang hoạt động</option>
        <option value="inactive">Đã vô hiệu hóa</option>
      </UiSelect>
    </div>

    <div class="mt-6 overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">Mã HS</th>
            <th class="py-2 pr-4">Họ tên</th>
            <th class="py-2 pr-4">Lớp</th>
            <th class="py-2 pr-4">Điểm</th>
            <th class="py-2 pr-4">Vi phạm</th>
            <th class="py-2 pr-4">Trạng thái</th>
            <th class="py-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="py-6 text-center text-ink-muted">Đang tải…</td>
          </tr>
          <tr v-else-if="students.length === 0">
            <td colspan="7" class="py-6 text-center text-ink-muted">Không có học sinh</td>
          </tr>
          <tr v-for="s in students" :key="s.id" class="rule-b">
            <td class="py-2.5 pr-4 font-mono text-xs">{{ s.student_code }}</td>
            <td class="py-2.5 pr-4">
              <NuxtLink :to="`/admin/students/${s.id}`" class="font-medium hover:underline">{{ s.full_name }}</NuxtLink>
            </td>
            <td class="py-2.5 pr-4">{{ s.class_name }}</td>
            <td class="py-2.5 pr-4 serif font-semibold">{{ s.points }}</td>
            <td class="py-2.5 pr-4">{{ s.violation_count }}</td>
            <td class="py-2.5 pr-4">
              <UiBadge :variant="s.status === 'active' ? 'success' : 'muted'">
                {{ s.status === 'active' ? 'Hoạt động' : 'Vô hiệu' }}
              </UiBadge>
            </td>
            <td class="py-2.5">
              <div class="flex gap-3 text-xs">
                <button class="text-ink-muted hover:text-ink" @click="openEdit(s)">Sửa</button>
                <button class="text-ink-muted hover:text-ink" @click="showQr(s)">QR</button>
                <button class="text-accent hover:text-accent-ink" @click="disableStudent(s)">Vô hiệu</button>
              </div>
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

    <!-- Create/Edit dialog -->
    <UiDialog v-model="dialogOpen" :title="editing ? 'Sửa học sinh' : 'Thêm học sinh'">
      <div class="space-y-4">
        <div>
          <UiLabel>Họ tên</UiLabel>
          <UiInput v-model="form.full_name" class="mt-1" placeholder="Nguyễn Văn A" />
        </div>
        <div>
          <UiLabel>Mã HS (để trống để tự sinh)</UiLabel>
          <UiInput v-model="form.student_code" class="mt-1" placeholder="HS001" />
        </div>
        <div>
          <UiLabel>Lớp</UiLabel>
          <UiSelect v-model="form.class_id" class="mt-1" placeholder="Chọn lớp">
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </UiSelect>
        </div>
        <div>
          <UiLabel>Ảnh thẻ</UiLabel>
          <div class="mt-1 flex items-center gap-3">
            <div v-if="form.photo" class="h-24 w-20 shrink-0 overflow-hidden border border-rule">
              <img :src="form.photo" class="h-full w-full object-cover" alt="Ảnh thẻ" />
            </div>
            <div v-else class="flex h-24 w-20 shrink-0 items-center justify-center border border-rule text-center text-[10px] leading-tight text-ink-faint">
              Chưa có ảnh
            </div>
            <div class="flex flex-col gap-2">
              <UiButton variant="outline" size="sm" @click="triggerPhoto">Chọn ảnh</UiButton>
              <UiButton v-if="form.photo" variant="outline" size="sm" @click="removePhoto">Xóa ảnh</UiButton>
              <p class="text-[10px] leading-tight text-ink-faint">PNG / JPEG / WebP · tối đa 4MB</p>
            </div>
            <input ref="photoInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onPhotoChange" />
          </div>
        </div>
        <div>
          <UiLabel>Trạng thái</UiLabel>
          <UiSelect v-model="form.status" class="mt-1">
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Vô hiệu hóa</option>
          </UiSelect>
        </div>
        <div class="flex justify-end gap-2">
          <UiButton variant="outline" @click="dialogOpen = false">Hủy</UiButton>
          <UiButton @click="save">{{ editing ? 'Lưu' : 'Thêm' }}</UiButton>
        </div>
      </div>
    </UiDialog>

    <!-- QR dialog -->
    <UiDialog v-model="qrOpen" :title="qrStudent?.full_name ?? 'QR'">
      <div v-if="qrStudent" class="flex flex-col items-center">
        <div class="border border-rule p-4">
          <QrCode :value="qrStudent.qr_code" :size="200" />
        </div>
        <p class="mt-3 font-mono text-sm">{{ qrStudent.qr_code }}</p>
        <div class="mt-4 flex gap-2">
          <UiButton variant="outline" @click="downloadQr">Tải PNG</UiButton>
          <NuxtLink :to="`/print/student-badges?student=${qrStudent.id}`">
            <UiButton>In bảng tên</UiButton>
          </NuxtLink>
        </div>
      </div>
    </UiDialog>

    <!-- Import dialog -->
    <UiDialog v-model="importOpen" title="Nhập học sinh từ CSV" description="Cột: full_name, student_code, class_name">
      <div class="space-y-4">
        <UiButton variant="outline" size="sm" @click="triggerFile">Chọn file CSV</UiButton>
        <input ref="fileInput" type="file" accept=".csv" class="hidden" @change="onFile" />
        <UiTextarea v-model="importText" class="min-h-40 font-mono text-xs" placeholder="full_name,student_code,class_name&#10;Nguyễn Văn A,HS101,10A1" />
        <p v-if="importResult" class="text-xs text-ink-muted">{{ importResult }}</p>
        <div class="flex justify-end gap-2">
          <UiButton variant="outline" @click="importOpen = false">Đóng</UiButton>
          <UiButton :disabled="importing" @click="runImport">{{ importing ? 'Đang nhập…' : 'Nhập' }}</UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>
