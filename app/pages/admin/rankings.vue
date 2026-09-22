<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { api } = useApi()

type StudentRank = { rank: number; full_name: string; class_name: string; points: number; violations: number }
type ClassRank = { rank: number; name: string; size: number; violations: number; avg_points: number }

const tab = ref<'students' | 'classes'>('students')
const period = ref('month')

const students = ref<StudentRank[]>([])
const classes = ref<ClassRank[]>([])

const periodOptions = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'semester', label: 'Học kỳ' },
  { value: 'year', label: 'Năm học' },
]

async function load() {
  if (tab.value === 'students') {
    try {
      const res = await api<{ students: StudentRank[] }>(`/api/rankings/students?period=${period.value}`)
      students.value = res.students
    } catch {
      // ignore
    }
  } else {
    try {
      const res = await api<{ classes: ClassRank[] }>(`/api/rankings/classes?period=${period.value}`)
      classes.value = res.classes
    } catch {
      // ignore
    }
  }
}

watch([tab, period], load, { immediate: true })
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="serif text-3xl font-bold">Xếp hạng</h1>
      <UiSelect v-model="period" class="w-40">
        <option v-for="p in periodOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
      </UiSelect>
    </div>

    <div class="mt-6 flex gap-1 border-b border-rule">
      <button
        class="border-b-2 px-4 py-2 text-sm"
        :class="tab === 'students' ? 'border-ink font-semibold' : 'border-transparent text-ink-muted'"
        @click="tab = 'students'"
      >
        Học sinh
      </button>
      <button
        class="border-b-2 px-4 py-2 text-sm"
        :class="tab === 'classes' ? 'border-ink font-semibold' : 'border-transparent text-ink-muted'"
        @click="tab = 'classes'"
      >
        Lớp
      </button>
    </div>

    <!-- Student ranking -->
    <div v-if="tab === 'students'" class="mt-6 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">#</th>
            <th class="py-2 pr-4">Học sinh</th>
            <th class="py-2 pr-4">Lớp</th>
            <th class="py-2 pr-4">Điểm</th>
            <th class="py-2">Vi phạm</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in students" :key="s.rank" class="rule-b">
            <td class="py-2.5 pr-4 serif font-bold">{{ s.rank }}</td>
            <td class="py-2.5 pr-4 font-medium">{{ s.full_name }}</td>
            <td class="py-2.5 pr-4">{{ s.class_name }}</td>
            <td class="py-2.5 pr-4 serif font-semibold">{{ s.points }}</td>
            <td class="py-2.5">{{ s.violations }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Class ranking -->
    <div v-else class="mt-6 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="rule-b-thick text-left text-[11px] uppercase tracking-widest text-ink-muted">
            <th class="py-2 pr-4">#</th>
            <th class="py-2 pr-4">Lớp</th>
            <th class="py-2 pr-4">Sĩ số</th>
            <th class="py-2 pr-4">Vi phạm</th>
            <th class="py-2">Điểm TB</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in classes" :key="c.rank" class="rule-b">
            <td class="py-2.5 pr-4 serif font-bold">{{ c.rank }}</td>
            <td class="py-2.5 pr-4 font-medium">{{ c.name }}</td>
            <td class="py-2.5 pr-4">{{ c.size }}</td>
            <td class="py-2.5 pr-4">{{ c.violations }}</td>
            <td class="py-2.5 serif font-semibold">{{ c.avg_points }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
