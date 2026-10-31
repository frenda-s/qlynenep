<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api, errorMessage, toast } = useApi()
const auth = useAuth()
const route = useRoute()

type PrintStudent = {
  id: string
  student_code: string
  full_name: string
  qr_code: string
  photo: string | null
  class_name: string
  grade: number
  academic_year: string
  status: string
}

type Cls = { id: string; name: string; grade: number }
type Template = 'student' | 'nameplate'
type SortBy = 'name' | 'code' | 'class'

const students = ref<PrintStudent[]>([])
const classes = ref<Cls[]>([])
const classId = ref('')
const status = ref<'active' | 'inactive'>('active')
const q = ref('')
const schoolName = ref('TRƯỜNG TRUNG HỌC PHỔ THÔNG')
const loading = ref(false)
const savingName = ref(false)

const orientation = ref<'horizontal' | 'vertical'>('horizontal')
const template = ref<Template>('student')
const sortBy = ref<SortBy>('name')
const startOffset = ref(0)
const zoom = ref('75')
const showPhoto = ref(true)
const showQr = ref(true)
const showSchool = ref(true)
const showYear = ref(true)
const showCode = ref(true)
const showBorder = ref(true)
const showGuides = ref(true)

const singleId = computed(() => (route.query.student ? String(route.query.student) : ''))
const canEditSettings = computed(() => auth.can('settings.manage'))
const scoped = computed(() => auth.user.value?.role === 'TEACHER')
const isVertical = computed(() => orientation.value === 'vertical')
const perPage = computed(() => (isVertical.value ? 9 : 8))
const qrSize = computed(() => (isVertical.value ? 56 : 80))
const zoomScale = computed(() => Number(zoom.value) / 100)

const templateLabel = computed(() =>
  template.value === 'nameplate' ? 'Bảng tên' : 'Thẻ học sinh',
)

const sortedStudents = computed(() => {
  const list = [...students.value]
  list.sort((a, b) => {
    if (sortBy.value === 'code') return a.student_code.localeCompare(b.student_code, 'vi')
    if (sortBy.value === 'class') {
      return (
        a.class_name.localeCompare(b.class_name, 'vi') ||
        a.full_name.localeCompare(b.full_name, 'vi')
      )
    }
    return a.full_name.localeCompare(b.full_name, 'vi')
  })
  return list
})

const pages = computed<(PrintStudent | null)[][]>(() => {
  const size = perPage.value
  const offset = Math.max(0, Math.min(startOffset.value, size - 1))
  const slots: (PrintStudent | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...sortedStudents.value,
  ]
  const result: (PrintStudent | null)[][] = []
  for (let i = 0; i < slots.length; i += size) {
    result.push(slots.slice(i, i + size))
  }
  // Không bao giờ in ra một trang chỉ toàn ô trống.
  return result.filter((page) => page.some((slot) => slot !== null))
})

const pageCount = computed(() => pages.value.length)
const blankSlots = computed(() => pages.value.reduce((n, p) => n + p.filter((s) => !s).length, 0))

const layoutHint = computed(() =>
  isVertical.value
    ? `A4 · 3 cột × 3 hàng · thẻ dọc 60 × 90 mm · ${perPage.value} thẻ/trang`
    : `A4 · 2 cột × 4 hàng · thẻ ngang 90 × 60 mm · ${perPage.value} thẻ/trang`,
)

async function loadSettings() {
  try {
    const res = await api<{ settings: { school_name: string } }>('/api/settings')
    if (res.settings.school_name) schoolName.value = res.settings.school_name
  } catch {
    // giữ mặc định
  }
}

async function saveSchoolName() {
  if (!canEditSettings.value) return
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

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ status: status.value })
    if (classId.value) params.set('class_id', classId.value)
    if (singleId.value) params.set('student_id', singleId.value)
    if (q.value.trim()) params.set('q', q.value.trim())
    const res = await api<{ students: PrintStudent[] }>(`/api/students/print?${params}`)
    students.value = res.students
    startOffset.value = Math.min(startOffset.value, perPage.value - 1)
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
    if (!classId.value && classes.value.length === 1) {
      classId.value = classes.value[0]!.id
    }
    const fromQuery = route.query.class ? String(route.query.class) : ''
    if (fromQuery && classes.value.some((c) => c.id === fromQuery)) {
      classId.value = fromQuery
    }
  } catch {
    // ignore
  }
}

function print() {
  if (students.value.length === 0) return
  window.print()
}

function initial(name: string) {
  const t = name.trim()
  return t ? t.charAt(0).toUpperCase() : '?'
}

function photoVisible() {
  return template.value === 'student' && showPhoto.value
}

function qrVisible() {
  return template.value === 'student' && showQr.value
}

// Ghi nhớ tùy chọn in giữa các lần sử dụng.
const SETTINGS_KEY = 'nenepos:print-settings'

function savePreferences() {
  if (!import.meta.client) return
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        orientation: orientation.value,
        template: template.value,
        sortBy: sortBy.value,
        startOffset: startOffset.value,
        zoom: zoom.value,
        showPhoto: showPhoto.value,
        showQr: showQr.value,
        showSchool: showSchool.value,
        showYear: showYear.value,
        showCode: showCode.value,
        showBorder: showBorder.value,
        showGuides: showGuides.value,
      }),
    )
  } catch {
    // ignore
  }
}

function loadPreferences() {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as Record<string, unknown>
    if (saved.orientation === 'vertical' || saved.orientation === 'horizontal') {
      orientation.value = saved.orientation
    }
    if (saved.template === 'student' || saved.template === 'nameplate') {
      template.value = saved.template
    }
    if (saved.sortBy === 'name' || saved.sortBy === 'code' || saved.sortBy === 'class') {
      sortBy.value = saved.sortBy
    }
    if (typeof saved.startOffset === 'number') startOffset.value = saved.startOffset
    if (typeof saved.zoom === 'string' && ['50', '75', '100'].includes(saved.zoom)) {
      zoom.value = saved.zoom
    }
    const flagMap = {
      showPhoto: showPhoto,
      showQr: showQr,
      showSchool: showSchool,
      showYear: showYear,
      showCode: showCode,
      showBorder: showBorder,
      showGuides: showGuides,
    } as const
    for (const key of Object.keys(flagMap) as (keyof typeof flagMap)[]) {
      const value = saved[key]
      if (typeof value === 'boolean') flagMap[key].value = value
    }
  } catch {
    // ignore
  }
}

watch(
  [
    orientation,
    template,
    sortBy,
    startOffset,
    zoom,
    showPhoto,
    showQr,
    showSchool,
    showYear,
    showCode,
    showBorder,
    showGuides,
  ],
  savePreferences,
)

// Khi đổi chiều thẻ, số ô mỗi trang thay đổi → giữ ô trống trong giới hạn.
watch(perPage, (size) => {
  startOffset.value = Math.min(startOffset.value, size - 1)
})

onMounted(async () => {
  loadPreferences()
  await Promise.all([loadClasses(), loadSettings()])
  await load()
})
</script>

<template>
  <div class="print-root">
    <!-- ── Thanh tiêu đề (ẩn khi in) ─────────────────────── -->
    <div class="no-print flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Xưởng in</p>
        <h1 class="serif mt-1 text-3xl font-bold">In thẻ học sinh</h1>
        <p class="mt-1 text-sm text-ink-muted">
          {{ sortedStudents.length }} thẻ · {{ pageCount }} trang A4
          <span v-if="blankSlots"> · {{ blankSlots }} ô trống</span>
          <span v-if="scoped"> · chỉ lớp bạn phụ trách</span>
          <span v-if="singleId"> · đang in một học sinh</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UiSelect v-model="zoom" class="w-28">
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
        </UiSelect>
        <UiButton :disabled="students.length === 0" @click="print">🖨 In thẻ</UiButton>
      </div>
    </div>

    <div class="print-layout mt-5 grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <!-- ── Cột cấu hình ─────────────────────────────────── -->
      <aside class="no-print space-y-4">
        <UiCard class="p-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Nguồn dữ liệu
          </p>
          <div class="mt-3 space-y-3">
            <div>
              <label class="text-[11px] uppercase tracking-widest text-ink-muted">Tên trường</label>
              <div class="mt-1 flex gap-2">
                <UiInput
                  v-model="schoolName"
                  class="w-full"
                  placeholder="Tên trường"
                  :disabled="!canEditSettings"
                />
                <UiButton
                  v-if="canEditSettings"
                  variant="outline"
                  :disabled="savingName"
                  @click="saveSchoolName"
                >
                  {{ savingName ? 'Lưu…' : 'Lưu' }}
                </UiButton>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] uppercase tracking-widest text-ink-muted">Lớp</label>
                <UiSelect v-model="classId" class="mt-1" @change="load">
                  <option value="">Tất cả lớp</option>
                  <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
                </UiSelect>
              </div>
              <div>
                <label class="text-[11px] uppercase tracking-widest text-ink-muted">Trạng thái</label>
                <UiSelect v-model="status" class="mt-1" @change="load">
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã vô hiệu hóa</option>
                </UiSelect>
              </div>
            </div>
            <div>
              <label class="text-[11px] uppercase tracking-widest text-ink-muted">Tìm học sinh</label>
              <UiInput
                v-model="q"
                class="mt-1"
                placeholder="Tên hoặc mã HS…"
                @keyup.enter="load"
              />
            </div>
          </div>
        </UiCard>

        <UiCard class="p-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Bố cục
          </p>
          <div class="mt-3 space-y-3">
            <div>
              <label class="text-[11px] uppercase tracking-widest text-ink-muted">Kiểu thẻ</label>
              <UiSelect v-model="template" class="mt-1">
                <option value="student">Thẻ học sinh</option>
                <option value="nameplate">Bảng tên để bàn</option>
              </UiSelect>
            </div>
            <div>
              <label class="text-[11px] uppercase tracking-widest text-ink-muted">Chiều thẻ</label>
              <UiSelect v-model="orientation" class="mt-1">
                <option value="horizontal">Ngang · 90 × 60 mm</option>
                <option value="vertical">Dọc · 60 × 90 mm</option>
              </UiSelect>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] uppercase tracking-widest text-ink-muted">Sắp xếp</label>
                <UiSelect v-model="sortBy" class="mt-1">
                  <option value="name">Theo tên</option>
                  <option value="code">Theo mã HS</option>
                  <option value="class">Theo lớp</option>
                </UiSelect>
              </div>
              <div>
                <label class="text-[11px] uppercase tracking-widest text-ink-muted">Ô trống đầu</label>
                <UiInput
                  v-model.number="startOffset"
                  type="number"
                  min="0"
                  :max="perPage - 1"
                  class="mt-1"
                />
              </div>
            </div>
            <p class="text-xs text-ink-muted">{{ layoutHint }}</p>
          </div>
        </UiCard>

        <UiCard class="p-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Hiển thị trên thẻ
          </p>
          <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <label class="flex items-center gap-2">
              <input v-model="showSchool" type="checkbox" class="h-4 w-4 accent-[#1a1917]" />
              Tên trường
            </label>
            <label class="flex items-center gap-2">
              <input v-model="showCode" type="checkbox" class="h-4 w-4 accent-[#1a1917]" />
              Mã HS
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="showPhoto"
                type="checkbox"
                class="h-4 w-4 accent-[#1a1917]"
                :disabled="template === 'nameplate'"
              />
              Ảnh thẻ
            </label>
            <label class="flex items-center gap-2">
              <input v-model="showYear" type="checkbox" class="h-4 w-4 accent-[#1a1917]" />
              Năm học
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="showQr"
                type="checkbox"
                class="h-4 w-4 accent-[#1a1917]"
                :disabled="template === 'nameplate'"
              />
              Mã QR
            </label>
            <label class="flex items-center gap-2">
              <input v-model="showBorder" type="checkbox" class="h-4 w-4 accent-[#1a1917]" />
              Viền thẻ
            </label>
            <label class="flex items-center gap-2">
              <input v-model="showGuides" type="checkbox" class="h-4 w-4 accent-[#1a1917]" />
              Đường cắt
            </label>
          </div>
          <p class="mt-3 text-xs text-ink-muted">
            Đường cắt chỉ mang tính hỗ trợ căn lề khi cắt thẻ.
          </p>
        </UiCard>

        <UiCard class="p-4">
          <div class="flex items-baseline justify-between">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Sẵn sàng in
            </p>
            <span class="serif text-2xl font-bold">{{ students.length }}</span>
          </div>
          <dl class="mt-2 space-y-1 text-sm">
            <div class="flex justify-between">
              <dt class="text-ink-muted">Số trang</dt>
              <dd>{{ pageCount }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-muted">Thẻ mỗi trang</dt>
              <dd>{{ perPage }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-muted">Khổ thẻ</dt>
              <dd>{{ isVertical ? '60 × 90 mm' : '90 × 60 mm' }}</dd>
            </div>
          </dl>
          <UiButton class="mt-4 w-full" :disabled="students.length === 0" @click="print">
            🖨 In thẻ
          </UiButton>
          <p class="mt-2 text-center text-[11px] text-ink-muted">
            Chọn khổ A4, tỉ lệ 100%, tắt “Headers and footers”.
          </p>
        </UiCard>
      </aside>

      <!-- ── Xem trước ────────────────────────────────────── -->
      <div class="min-w-0">
        <div class="no-print flex flex-wrap items-center justify-between gap-2 rounded-t-lg border border-b-0 border-rule bg-paper px-4 py-2.5">
          <p class="text-xs text-ink-muted">{{ layoutHint }}</p>
          <p class="text-xs text-ink-muted">Xem trước · {{ pageCount }} trang</p>
        </div>
        <div class="preview-stage">
          <div v-if="loading" class="py-16 text-center text-sm text-ink-muted">Đang tải…</div>
          <div v-else-if="sortedStudents.length === 0" class="py-16 text-center">
            <p class="serif text-lg font-semibold">Không có học sinh để in</p>
            <p class="mt-1 text-sm text-ink-muted">
              Thử đổi lớp, trạng thái hoặc từ khóa tìm kiếm.
            </p>
          </div>
          <div v-else class="pages" :style="{ zoom: zoomScale }">
            <section
              v-for="(page, pageIndex) in pages"
              :key="pageIndex"
              class="sheet"
              :class="{ 'with-guides': showGuides }"
            >
              <div class="cards" :class="{ 'cards-vertical': isVertical }">
                <template v-for="(s, slotIndex) in page" :key="slotIndex">
                  <div
                    v-if="!s"
                    class="badge badge-empty"
                    :class="{ 'badge-vertical': isVertical }"
                  >
                    <span class="badge-empty-label">Ô trống</span>
                  </div>
                  <div
                    v-else
                    class="badge"
                    :class="{
                      'badge-vertical': isVertical,
                      'badge-nameplate': template === 'nameplate',
                      'badge-noborder': !showBorder,
                    }"
                  >
                    <div class="badge-head">
                      <span v-if="showSchool" class="badge-school">{{ schoolName }}</span>
                      <span class="badge-label">{{ templateLabel }}</span>
                    </div>

                    <div class="badge-body">
                      <div v-if="photoVisible()" class="badge-photo">
                        <img
                          v-if="s.photo"
                          :src="s.photo"
                          class="h-full w-full object-cover"
                          alt=""
                        />
                        <span v-else class="badge-photo-initial">{{ initial(s.full_name) }}</span>
                      </div>

                      <div class="badge-info">
                        <p class="badge-name">{{ s.full_name }}</p>
                        <p class="badge-meta">Lớp {{ s.class_name }} · Khối {{ s.grade }}</p>
                        <p v-if="showCode" class="badge-meta">Mã HS {{ s.student_code }}</p>
                        <p v-if="showYear" class="badge-year">Năm học {{ s.academic_year }}</p>
                      </div>

                      <div v-if="qrVisible()" class="badge-qr">
                        <div class="badge-qr-box">
                          <QrCode :value="s.qr_code" :size="qrSize" :margin="1" />
                        </div>
                        <p class="badge-qr-code">{{ s.qr_code }}</p>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <p class="sheet-foot">
                <span>{{ schoolName }}</span>
                <span>Trang {{ pageIndex + 1 }}/{{ pageCount }}</span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Bối cảnh xem trước ─────────────────────────────── */
.preview-stage {
  max-height: calc(100vh - 12rem);
  overflow: auto;
  border: 1px solid var(--rule, #e3ded3);
  border-radius: 0 0 8px 8px;
  background: #edeae3;
  padding: 8mm;
}

.sheet {
  display: flex;
  flex-direction: column;
  width: 210mm;
  min-height: 297mm;
  box-sizing: border-box;
  padding: 8mm;
  margin: 0 auto 6mm;
  background: #fff;
  color: #1a1917;
  box-shadow: 0 2px 12px rgb(26 25 23 / 12%);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.sheet:last-child {
  margin-bottom: 0;
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, 90mm);
  grid-auto-rows: 60mm;
  gap: 4mm;
  align-content: start;
  justify-content: center;
  width: 100%;
}

.cards.cards-vertical {
  grid-template-columns: repeat(3, 60mm);
  grid-auto-rows: 90mm;
  gap: 3mm;
}

.sheet-foot {
  display: flex;
  justify-content: space-between;
  gap: 4mm;
  margin-top: auto;
  padding-top: 3mm;
  font-size: 7pt;
  color: #8a8478;
  letter-spacing: 0.02em;
}

/* ── Thẻ ─────────────────────────────────────────────── */
.badge {
  position: relative;
  width: 90mm;
  height: 60mm;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 3mm 4mm;
  border: 0.35mm solid #1a1917;
  background: #fff;
  color: #1a1917;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
}

.badge-noborder {
  border-color: transparent;
}

.badge-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0.3mm dashed #cfc9bd;
  background: transparent;
}

.badge-empty-label {
  font-size: 7pt;
  color: #b7b0a3;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Outline không bị cắt bởi overflow của thẻ. */
.with-guides .badge {
  outline: 0.2mm dashed #c3bcae;
  outline-offset: 1.8mm;
}

.with-guides .badge-empty {
  outline-style: dotted;
}

.badge-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 4mm;
  padding-bottom: 1.6mm;
  border-bottom: 0.5mm double #1a1917;
}

.badge-noborder .badge-head {
  border-bottom-color: transparent;
}

.badge-school {
  min-width: 0;
  font-family: 'Newsreader Variable', Georgia, serif;
  font-size: 3.2mm;
  font-weight: 600;
  letter-spacing: 0.4mm;
  text-transform: uppercase;
  line-height: 1.1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.badge-label {
  flex-shrink: 0;
  font-size: 2.4mm;
  letter-spacing: 0.5mm;
  text-transform: uppercase;
  color: #555;
  white-space: nowrap;
}

.badge-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  gap: 4mm;
  padding-top: 3mm;
}

.badge-photo {
  width: 22mm;
  height: 28mm;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 0.3mm solid #1a1917;
  background: #f4f1ea;
}

.badge-noborder .badge-photo {
  border-color: transparent;
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
  gap: 1.4mm;
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

.badge-year {
  font-size: 2.6mm;
  line-height: 1.2;
  letter-spacing: 0.2mm;
  color: #666;
  text-transform: uppercase;
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
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 1mm;
  border: 0.3mm solid #1a1917;
  background: #fff;
}

.badge-qr-box > :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

.badge-noborder .badge-qr-box {
  border-color: transparent;
}

.badge-qr-code {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 2.2mm;
  letter-spacing: 0.1mm;
  color: #333;
}

/* ── Bảng tên để bàn ────────────────────────────────── */
.badge-nameplate .badge-body {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2mm;
  padding-top: 2mm;
  text-align: center;
}

.badge-nameplate .badge-info {
  flex: 0 0 auto;
  align-items: center;
  text-align: center;
  gap: 2mm;
}

.badge-nameplate .badge-name {
  font-size: 8mm;
  line-height: 1.05;
}

.badge-nameplate .badge-meta {
  font-size: 4mm;
}

.badge-nameplate .badge-year {
  font-size: 2.8mm;
}

/* ── Thẻ dọc 60 × 90 mm ─────────────────────────────── */
.badge-vertical {
  width: 60mm;
  height: 90mm;
  padding: 3mm;
}

.badge-vertical .badge-head {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6mm;
  padding-bottom: 1.2mm;
}

.badge-vertical .badge-school {
  font-size: 2.8mm;
  letter-spacing: 0.3mm;
  line-height: 1.15;
  -webkit-line-clamp: 2;
}

.badge-vertical .badge-label {
  font-size: 2.1mm;
  letter-spacing: 0.4mm;
}

.badge-vertical .badge-body {
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 1.5mm;
  padding-top: 2mm;
}

.badge-vertical .badge-photo {
  width: 24mm;
  height: 30mm;
}

.badge-vertical .badge-info {
  flex: 0 0 auto;
  width: 100%;
  align-items: center;
  text-align: center;
  gap: 1mm;
}

.badge-vertical .badge-name {
  font-size: 5.4mm;
  line-height: 1.05;
}

.badge-vertical .badge-meta {
  font-size: 2.8mm;
}

.badge-vertical .badge-year {
  font-size: 2.4mm;
}

.badge-vertical .badge-qr {
  margin-top: auto;
  gap: 0.6mm;
}

.badge-vertical .badge-qr-box {
  width: 17mm;
  height: 17mm;
  padding: 0.6mm;
}

.badge-vertical .badge-qr-code {
  font-size: 1.9mm;
}

.badge-vertical.badge-nameplate .badge-name {
  font-size: 7mm;
}

/* ── In ──────────────────────────────────────────────── */
@media print {
  @page {
    size: A4;
    margin: 8mm;
  }

  .no-print {
    display: none !important;
  }

  .print-layout {
    display: block !important;
    margin: 0 !important;
  }

  .preview-stage {
    max-height: none;
    overflow: visible;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .pages {
    zoom: 1 !important;
  }

  .sheet {
    display: block;
    width: auto;
    min-height: 0;
    margin: 0;
    padding: 0;
    box-shadow: none;
    break-after: page;
    page-break-after: always;
  }

  .sheet:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  .cards,
  .cards.cards-vertical {
    margin: 0;
  }

  .sheet-foot {
    margin-top: 1.5mm;
    padding-top: 0;
    font-size: 6pt;
    line-height: 1.2;
    color: #918b7e;
  }

  .badge-empty {
    visibility: hidden;
    border-color: transparent;
  }

  .with-guides .badge-empty {
    outline-color: transparent;
  }
}
</style>
