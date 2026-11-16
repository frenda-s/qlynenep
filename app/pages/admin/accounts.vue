<script setup lang="ts">
import { Plus, Pencil, Ban } from '@lucide/vue'

definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api, errorMessage, toast } = useApi()
const auth = useAuth()

type Cls = { id: string; name: string; grade: number }
type UserClass = { id: string; name: string }
type User = {
  id: string
  username: string
  fullName: string
  full_name: string
  role: string
  role_label: string
  status: string
  permissions: string[]
  custom_permissions: string[] | null
  is_custom_permissions: boolean
  class_ids: string[]
  classes: UserClass[]
  last_login_at: number | null
  created_at: number
}

type PermissionItem = { key: string; label: string; description: string }
type PermissionGroup = { group: string; items: PermissionItem[] }
type RoleOption = {
  value: string
  label: string
  description: string
  permissions: string[]
}

const users = ref<User[]>([])
const classes = ref<Cls[]>([])
const groups = ref<PermissionGroup[]>([])
const roles = ref<RoleOption[]>([])
const loading = ref(false)

const dialogOpen = ref(false)
const editing = ref<User | null>(null)
const saving = ref(false)
const form = reactive({
  username: '',
  password: '',
  full_name: '',
  role: 'TEACHER',
  status: 'active',
  class_ids: [] as string[],
  permissions: [] as string[],
})

// true = dùng bộ quyền tùy chỉnh; false = theo mặc định của vai trò.
const permissionsCustom = ref(false)

const roleMap = computed(() => new Map(roles.value.map((r) => [r.value, r])))
const currentRole = computed(() => roleMap.value.get(form.role))
const defaultPermissions = computed(() => currentRole.value?.permissions ?? [])

function fmt(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts + 7 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ')
}

function roleBadge(role: string) {
  if (role === 'ADMIN') return 'accent'
  if (role === 'TEACHER') return 'default'
  return 'muted'
}

async function load() {
  loading.value = true
  try {
    const res = await api<{ users: User[] }>('/api/users')
    users.value = res.users
  } catch (e: unknown) {
    toast.error('Không tải được tài khoản', errorMessage(e))
  } finally {
    loading.value = false
  }
}

async function loadMeta() {
  try {
    const [options, cls] = await Promise.all([
      api<{ roles: RoleOption[]; groups: PermissionGroup[] }>('/api/users/options'),
      api<{ classes: Cls[] }>('/api/classes'),
    ])
    roles.value = options.roles
    groups.value = options.groups
    classes.value = cls.classes
  } catch {
    // ignore
  }
}

function applyRoleDefaults() {
  form.permissions = [...(roleMap.value.get(form.role)?.permissions ?? [])]
}

function onRoleChange() {
  permissionsCustom.value = false
  applyRoleDefaults()
  if (form.role !== 'TEACHER') form.class_ids = []
}

function openCreate() {
  editing.value = null
  form.username = ''
  form.password = ''
  form.full_name = ''
  form.role = 'TEACHER'
  form.status = 'active'
  form.class_ids = []
  permissionsCustom.value = false
  applyRoleDefaults()
  dialogOpen.value = true
}

function openEdit(u: User) {
  editing.value = u
  form.username = u.username
  form.password = ''
  form.full_name = u.fullName
  form.role = u.role
  form.status = u.status
  form.class_ids = [...u.class_ids]
  permissionsCustom.value = u.is_custom_permissions
  form.permissions = [...(u.custom_permissions ?? defaultPermissions.value)]
  dialogOpen.value = true
}

function togglePermission(key: string) {
  permissionsCustom.value = true
  const set = new Set(form.permissions)
  if (set.has(key)) set.delete(key)
  else set.add(key)
  form.permissions = [...set]
}

function selectAllPermissions() {
  permissionsCustom.value = true
  form.permissions = groups.value.flatMap((g) => g.items.map((i) => i.key))
}

function clearPermissions() {
  permissionsCustom.value = true
  form.permissions = []
}

function resetToRoleDefaults() {
  permissionsCustom.value = false
  applyRoleDefaults()
}

function toggleClass(id: string) {
  const set = new Set(form.class_ids)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  form.class_ids = [...set]
}

async function save() {
  if (!form.full_name.trim()) {
    toast.error('Thiếu thông tin', 'Nhập họ tên')
    return
  }
  if (!editing.value && !form.username.trim()) {
    toast.error('Thiếu thông tin', 'Nhập tên đăng nhập')
    return
  }
  if (!editing.value && form.password.length < 6) {
    toast.error('Mật khẩu quá ngắn', 'Mật khẩu tối thiểu 6 ký tự')
    return
  }
  if (editing.value && form.password && form.password.length < 6) {
    toast.error('Mật khẩu quá ngắn', 'Mật khẩu tối thiểu 6 ký tự')
    return
  }

  saving.value = true
  try {
    if (editing.value) {
      const body: Record<string, unknown> = {
        full_name: form.full_name.trim(),
        role: form.role,
        status: form.status,
        class_ids: form.class_ids,
        permissions: form.role === 'ADMIN' ? null : permissionsCustom.value ? form.permissions : null,
      }
      if (form.password) body.password = form.password
      await api(`/api/users/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Đã cập nhật tài khoản')
    } else {
      await api('/api/users', {
        method: 'POST',
        body: {
          username: form.username.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          role: form.role,
          status: form.status,
          class_ids: form.class_ids,
          permissions: form.role === 'ADMIN' ? null : permissionsCustom.value ? form.permissions : null,
        },
      })
      toast.success('Đã tạo tài khoản')
    }
    dialogOpen.value = false
    await load()
  } catch (e: unknown) {
    toast.error('Lưu thất bại', errorMessage(e))
  } finally {
    saving.value = false
  }
}

async function deactivate(u: User) {
  if (!confirm(`Khóa tài khoản "${u.username}"?`)) return
  try {
    await api(`/api/users/${u.id}`, { method: 'DELETE' })
    toast.success('Đã khóa tài khoản')
    await load()
  } catch (e: unknown) {
    toast.error('Thất bại', errorMessage(e))
  }
}

onMounted(() => {
  loadMeta()
  load()
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="serif text-3xl font-bold">Tài khoản & phân quyền</h1>
        <p class="mt-1 text-sm text-ink-muted">
          {{ users.length }} tài khoản · phân quyền chi tiết theo từng người dùng
        </p>
      </div>
      <UiButton @click="openCreate"><Plus class="h-4 w-4" /> Thêm tài khoản</UiButton>
    </div>

    <div class="mt-6 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">Tên đăng nhập</th>
            <th class="py-2 pr-4">Họ tên</th>
            <th class="py-2 pr-4">Vai trò</th>
            <th class="py-2 pr-4">Lớp phụ trách</th>
            <th class="py-2 pr-4">Quyền</th>
            <th class="py-2 pr-4">Trạng thái</th>
            <th class="py-2 pr-4">Đăng nhập cuối</th>
            <th class="py-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="py-6 text-center text-ink-muted">Đang tải…</td>
          </tr>
          <tr v-for="u in users" :key="u.id" class="rule-b">
            <td class="py-2.5 pr-4 font-mono text-xs">{{ u.username }}</td>
            <td class="py-2.5 pr-4 font-medium">
              {{ u.fullName }}
              <span v-if="auth.user.value?.id === u.id" class="ml-1 text-[10px] text-ink-faint">(bạn)</span>
            </td>
            <td class="py-2.5 pr-4">
              <UiBadge :variant="roleBadge(u.role)">{{ u.role_label }}</UiBadge>
            </td>
            <td class="py-2.5 pr-4 text-xs">
              <span v-if="u.classes.length">{{ u.classes.map((c) => c.name).join(', ') }}</span>
              <span v-else class="text-ink-faint">—</span>
            </td>
            <td class="py-2.5 pr-4 text-xs">
              <span v-if="u.role === 'ADMIN'">Toàn quyền</span>
              <span v-else>
                {{ u.permissions.length }} quyền
                <span v-if="u.is_custom_permissions" class="text-ink-faint">· tùy chỉnh</span>
                <span v-else class="text-ink-faint">· mặc định</span>
              </span>
            </td>
            <td class="py-2.5 pr-4">
              <UiBadge :variant="u.status === 'active' ? 'success' : 'muted'">
                {{ u.status === 'active' ? 'Hoạt động' : 'Đã khóa' }}
              </UiBadge>
            </td>
            <td class="py-2.5 pr-4 text-xs text-ink-muted">{{ fmt(u.last_login_at) }}</td>
            <td class="py-2.5">
              <div class="flex items-center gap-3 text-xs">
                <button class="inline-flex items-center gap-1 text-ink-muted hover:text-ink" @click="openEdit(u)">
                  <Pencil class="h-3.5 w-3.5" /> Sửa
                </button>
                <button
                  v-if="u.status === 'active' && auth.user.value?.id !== u.id"
                  class="inline-flex items-center gap-1 text-accent hover:text-accent-ink"
                  @click="deactivate(u)"
                >
                  <Ban class="h-3.5 w-3.5" /> Khóa
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiDialog
      v-model="dialogOpen"
      :title="editing ? 'Sửa tài khoản' : 'Thêm tài khoản'"
      description="Vai trò quyết định quyền mặc định; bạn có thể tùy chỉnh từng quyền bên dưới."
    >
      <div class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <UiLabel>Tên đăng nhập</UiLabel>
            <UiInput
              v-model="form.username"
              class="mt-1"
              placeholder="teacher3"
              :disabled="Boolean(editing)"
            />
          </div>
          <div>
            <UiLabel>{{ editing ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu' }}</UiLabel>
            <UiInput v-model="form.password" type="password" class="mt-1" placeholder="Tối thiểu 6 ký tự" />
          </div>
        </div>

        <div>
          <UiLabel>Họ tên</UiLabel>
          <UiInput v-model="form.full_name" class="mt-1" placeholder="Nguyễn Văn A" />
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <UiLabel>Vai trò</UiLabel>
            <UiSelect v-model="form.role" class="mt-1" @change="onRoleChange">
              <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
            </UiSelect>
            <p class="mt-1 text-[11px] text-ink-faint">{{ currentRole?.description }}</p>
          </div>
          <div>
            <UiLabel>Trạng thái</UiLabel>
            <UiSelect v-model="form.status" class="mt-1">
              <option value="active">Hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </UiSelect>
          </div>
        </div>

        <div v-if="form.role === 'TEACHER'">
          <UiLabel>Lớp phụ trách</UiLabel>
          <p class="mt-1 text-[11px] text-ink-faint">
            Giáo viên chỉ xem, ghi nhận vi phạm và in thẻ cho học sinh thuộc các lớp này.
          </p>
          <div class="mt-2 grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-rule p-3 sm:grid-cols-2">
            <label v-for="c in classes" :key="c.id" class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                :checked="form.class_ids.includes(c.id)"
                class="h-4 w-4 accent-[#1a1917]"
                @change="toggleClass(c.id)"
              />
              <span>{{ c.name }}</span>
              <span class="text-[11px] text-ink-faint">Khối {{ c.grade }}</span>
            </label>
            <p v-if="classes.length === 0" class="text-xs text-ink-faint">Chưa có lớp nào.</p>
          </div>
        </div>

        <div class="rounded-lg border border-rule p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-sm font-semibold">Quyền chi tiết</p>
              <p class="text-[11px] text-ink-faint">
                {{ form.role === 'ADMIN' ? 'Quản trị viên luôn có toàn quyền.' : permissionsCustom ? 'Đang dùng bộ quyền tùy chỉnh.' : 'Đang dùng quyền mặc định của vai trò.' }}
              </p>
            </div>
            <div v-if="form.role !== 'ADMIN'" class="flex flex-wrap gap-2">
              <button class="text-xs text-ink-muted underline-offset-2 hover:underline" @click="resetToRoleDefaults">
                Mặc định vai trò
              </button>
              <button class="text-xs text-ink-muted underline-offset-2 hover:underline" @click="selectAllPermissions">
                Chọn tất cả
              </button>
              <button class="text-xs text-ink-muted underline-offset-2 hover:underline" @click="clearPermissions">
                Bỏ chọn
              </button>
            </div>
          </div>

          <div v-if="form.role === 'ADMIN'" class="mt-3 text-sm text-ink-muted">
            Toàn bộ {{ groups.reduce((s, g) => s + g.items.length, 0) }} quyền được bật.
          </div>

          <div v-else class="mt-3 space-y-3">
            <div v-for="group in groups" :key="group.group">
              <p class="text-[11px] uppercase tracking-widest text-ink-muted">{{ group.group }}</p>
              <div class="mt-1 grid gap-1.5 sm:grid-cols-2">
                <label
                  v-for="p in group.items"
                  :key="p.key"
                  class="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1 hover:bg-paper-dim"
                >
                  <input
                    type="checkbox"
                    :checked="form.permissions.includes(p.key)"
                    class="mt-0.5 h-4 w-4 shrink-0 accent-[#1a1917]"
                    @change="togglePermission(p.key)"
                  />
                  <span>
                    <span class="block text-sm leading-tight">{{ p.label }}</span>
                    <span class="block text-[10px] leading-tight text-ink-faint">{{ p.description }}</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <UiButton variant="outline" @click="dialogOpen = false">Hủy</UiButton>
          <UiButton :disabled="saving" @click="save">{{ saving ? 'Đang lưu…' : 'Lưu' }}</UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>
