<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })

const auth = useAuth()

onMounted(async () => {
  if (!auth.user.value) await auth.fetchMe()
  if (auth.user.value?.role === 'DISCIPLINE') {
    await navigateTo('/mobile')
  } else if (auth.user.value?.role === 'TEACHER') {
    await navigateTo('/admin/my-class')
  } else {
    await navigateTo('/admin')
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <p class="text-sm text-ink-muted">Đang chuyển hướng…</p>
  </div>
</template>
