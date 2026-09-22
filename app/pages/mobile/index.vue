<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'mobile' })

const auth = useAuth()
const { api } = useApi()

const todayCount = ref(0)
const todayPoints = ref(0)

onMounted(async () => {
  try {
    const res = await api<{ violations: { total_points: number }[] }>(
      '/api/violations?period=today&limit=200',
    )
    todayCount.value = res.violations.length
    todayPoints.value = res.violations.reduce((s, v) => s + Math.abs(v.total_points), 0)
  } catch {
    // ignore
  }
})
</script>

<template>
  <div>
    <header class="rule-b pb-4">
      <p class="text-[11px] uppercase tracking-widest text-ink-muted">Nề nếp học sinh</p>
      <h1 class="serif mt-1 text-3xl font-bold">Xin chào, {{ auth.displayName }}</h1>
    </header>

    <section class="mt-6">
      <p class="text-[11px] uppercase tracking-widest text-ink-muted">Hôm nay</p>
      <div class="mt-2 grid grid-cols-2 gap-3">
        <UiCard class="p-4">
          <p class="serif text-3xl font-bold">{{ todayCount }}</p>
          <p class="mt-1 text-xs text-ink-muted">Đã kiểm tra</p>
        </UiCard>
        <UiCard class="p-4">
          <p class="serif text-3xl font-bold text-accent">-{{ todayPoints }}</p>
          <p class="mt-1 text-xs text-ink-muted">Điểm đã trừ</p>
        </UiCard>
      </div>
    </section>

    <NuxtLink
      to="/mobile/scan"
      class="mt-8 flex h-40 w-full flex-col items-center justify-center gap-3 rounded-[2px] border-2 border-ink bg-ink text-paper transition-colors active:bg-paper active:text-ink"
    >
      <span class="serif text-4xl font-bold">QUÉT QR</span>
      <span class="text-xs uppercase tracking-widest text-paper/70">Bắt đầu kiểm tra</span>
    </NuxtLink>

    <p class="mt-8 text-center text-[11px] text-ink-faint">
      Quét mã QR trên bảng tên học sinh để ghi nhận vi phạm.
    </p>
  </div>
</template>
