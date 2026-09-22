interface ToastItem {
  id: number
  title: string
  description?: string
  variant: 'default' | 'success' | 'destructive'
}

const toasts = useState<ToastItem[]>('toasts', () => [])

export function useToast() {
  let seq = 0

  function push(toast: Omit<ToastItem, 'id'>) {
    const id = Date.now() + seq++
    toasts.value.push({ ...toast, id })
    setTimeout(() => dismiss(id), 4000)
  }

  function dismiss(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  return {
    toasts,
    dismiss,
    toast: (title: string, description?: string) => push({ title, description, variant: 'default' }),
    success: (title: string, description?: string) => push({ title, description, variant: 'success' }),
    error: (title: string, description?: string) => push({ title, description, variant: 'destructive' }),
  }
}
