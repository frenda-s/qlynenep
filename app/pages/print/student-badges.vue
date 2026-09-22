<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api, errorMessage, toast } = useApi()
const route = useRoute()

type PrintStudent = {
  id: string
  student_code: string
  full_name: string
  qr_code: string
  photo: string | null
  class_name: string
  status: string
}

type Cls = { id: string; name: string }

const students = ref<PrintStudent[]>([])
const classes = ref<Cls[]>([])
const classId = ref('')
const schoolName = ref('TRƯỜNG TRUNG HỌC PHỔ THÔNG')
const loading = ref(false)
const savingName = ref(false)

const singleId = computed(() => (route.query.student ? String(route.query.student) : ''))

async function loadSettings() {
  try {
    const res = await api<{ settings: { school_name: string } }>('/api/settings')
    if (res.settings.school_name) schoolName.value = res.settings.school_name
  } catch {
    // giữ mặc định
  }
}

async function saveSchoolName() {
  savingName.value = true
  try {
    await api('/api/settings', { method: 'PUT', body: { school_name: schoolName.value } })
    toast.success('Đã lưu tên trường')
  } catch (e: unknown) {
    toast.error('Lưu thất bại', errorMessage(e))
  } finally {
    savingName.value = false
  }
}

const filtered = computed(() => {
  if (singleId.value) return students.value.filter((s) => s.id === singleId.value)
  return students.value
})

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (classId.value) params.set('class_id', classId.value)
    const qs = params.toString()
    const res = await api<{ students: PrintStudent[] }>(`/api/students/print${qs ? `?${qs}` : ''}`)
    students.value = res.students
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

function print() {
  window.print()
}

function initial(name: string) {
  const t = name.trim()
  return t ? t.charAt(0).toUpperCase() : '?'
}

onMounted(() => {
  loadClasses()
  loadSettings()
  load()
})
</script>

<template>
  <div>
    <!-- Toolbar (ẩn khi in) -->
    <div class="no-print flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="serif text-3xl font-bold">In thẻ học sinh</h1>
        <p class="mt-1 text-sm text-ink-muted">{{ filtered.length }} thẻ</p>
      </div>
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="text-[11px] uppercase tracking-widest text-ink-muted">Tên trường</label>
          <div class="mt-1 flex gap-2">
            <UiInput v-model="schoolName" class="w-64" placeholder="Tên trường" />
            <UiButton variant="outline" :disabled="savingName" @click="saveSchoolName">
              {{ savingName ? 'Đang lưu…' : 'Lưu' }}
            </UiButton>
          </div>
        </div>
        <div>
          <label class="text-[11px] uppercase tracking-widest text-ink-muted">Lớp</label>
          <UiSelect v-model="classId" class="mt-1 w-40" placeholder="Tất cả lớp" @change="load">
            <option value="">Tất cả lớp</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </UiSelect>
        </div>
        <UiButton @click="print">🖨 In</UiButton>
      </div>
    </div>

    <!-- Cards -->
    <div v-if="loading" class="mt-10 text-center text-ink-muted">Đang tải…</div>
    <div v-else-if="filtered.length === 0" class="mt-10 text-center text-ink-muted">
      Không có học sinh để in
    </div>
    <div v-else class="cards mt-6">
      <div v-for="s in filtered" :key="s.id" class="badge">
        <div class="badge-head">
          <span class="badge-school">{{ schoolName }}</span>
          <span class="badge-label">Thẻ học sinh</span>
        </div>

        <div class="badge-body">
          <div class="badge-photo">
            <img v-if="s.photo" :src="s.photo" class="h-full w-full object-cover" alt="" />
            <span v-else class="badge-photo-initial">{{ initial(s.full_name) }}</span>
          </div>

          <div class="badge-info">
            <p class="badge-name">{{ s.full_name }}</p>
            <p class="badge-meta">Lớp {{ s.class_name }}</p>
            <p class="badge-meta">Mã HS {{ s.student_code }}</p>
          </div>

          <div class="badge-qr">
            <div class="badge-qr-box">
              <QrCode :value="s.qr_code" :size="88" :margin="1" />
            </div>
            <p class="badge-qr-code">{{ s.qr_code }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8mm;
}

.badge {
  width: 90mm;
  height: 60mm;
  display: flex;
  flex-direction: column;
  border: 0.35mm solid #1a1917;
  background: #fff;
  color: #1a1917;
  padding: 3mm 4mm;
  break-inside: avoid;
  page-break-inside: avoid;
  box-sizing: border-box;
}

.badge-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 4mm;
  padding-bottom: 1.6mm;
  border-bottom: 0.5mm double #1a1917;
}

.badge-school {
  font-family: 'Newsreader Variable', Georgia, serif;
  font-size: 3.2mm;
  font-weight: 600;
  letter-spacing: 0.4mm;
  text-transform: uppercase;
  line-height: 1.1;
}

.badge-label {
  font-size: 2.4mm;
  letter-spacing: 0.5mm;
  text-transform: uppercase;
  color: #555;
  white-space: nowrap;
}

.badge-body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4mm;
  padding-top: 3mm;
}

.badge-photo {
  width: 22mm;
  height: 28mm;
  flex-shrink: 0;
  border: 0.3mm solid #1a1917;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f4f1ea;
}

.badge-photo-initial {
  font-family: 'Newsreader Variable', Georgia, serif;
  font-size: 12mm;
  color: #b0a99c;
}

.badge-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.6mm;
}

.badge-name {
  font-family: 'Newsreader Variable', Georgia, serif;
  font-size: 6.5mm;
  font-weight: 700;
  line-height: 1.05;
  overflow-wrap: break-word;
}

.badge-meta {
  font-size: 3mm;
  line-height: 1.2;
  color: #333;
}

.badge-qr {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2mm;
}

.badge-qr-box {
  width: 24mm;
  height: 24mm;
  padding: 1mm;
  border: 0.3mm solid #1a1917;
  background: #fff;
}

.badge-qr-code {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 2.2mm;
  letter-spacing: 0.1mm;
  color: #333;
}

@media print {
  @page {
    size: A4;
    margin: 10mm;
  }

  .no-print {
    display: none !important;
  }

  .cards {
    gap: 0;
  }

  .badge {
    margin: 0 8mm 8mm 0;
  }
}
</style>
