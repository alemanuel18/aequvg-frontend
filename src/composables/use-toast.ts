export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

import { ref } from 'vue'

const fallbackToasts = ref<ToastItem[]>([])

export const useToast = () => {
  const toasts = typeof useState === 'function'
    ? useState<ToastItem[]>('app-toasts-list', () => [])
    : fallbackToasts

  const dismiss = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const show = (message: string, type: ToastType = 'info', duration = 4500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const item: ToastItem = { id, type, message, duration }
    toasts.value.push(item)

    if (duration > 0 && typeof window !== 'undefined') {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
    return id
  }

  const success = (message: string, duration?: number) => show(message, 'success', duration)
  const error = (message: string, duration?: number) => show(message, 'error', duration ?? 5500)
  const warning = (message: string, duration?: number) => show(message, 'warning', duration)
  const info = (message: string, duration?: number) => show(message, 'info', duration)
  const clear = () => { toasts.value = [] }

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    clear
  }
}
