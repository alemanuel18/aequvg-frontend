<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'primary' | 'danger' | 'warning'
    loading?: boolean
  }>(),
  {
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    variant: 'primary',
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const modalRef = ref<HTMLDivElement | null>(null)
const confirmButtonRef = ref<HTMLButtonElement | null>(null)
const cancelButtonRef = ref<HTMLButtonElement | null>(null)
let previousActiveElement: HTMLElement | null = null

const onKeydown = (event: KeyboardEvent) => {
  if (!props.open) return

  if (event.key === 'Escape') {
    event.preventDefault()
    if (!props.loading) emit('cancel')
    return
  }

  if (event.key === 'Tab') {
    const focusable = modalRef.value?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable || focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (!first || !last) return

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (import.meta.client) {
      if (isOpen) {
        previousActiveElement = document.activeElement as HTMLElement | null
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', onKeydown)
        await nextTick()
        // Focus the confirm or cancel button depending on variant
        if (props.variant === 'danger') {
          cancelButtonRef.value?.focus()
        } else {
          confirmButtonRef.value?.focus()
        }
      } else {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', onKeydown)
        if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
          previousActiveElement.focus()
        }
      }
    }
  }
)

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="!loading && emit('cancel')">
        <div
          ref="modalRef"
          class="modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-desc"
        >
          <div class="modal-panel__header">
            <div :class="['modal-icon', `modal-icon--${variant}`]" aria-hidden="true">
              <!-- Danger icon -->
              <svg v-if="variant === 'danger'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <!-- Warning icon -->
              <svg v-else-if="variant === 'warning'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <!-- Primary / Check icon -->
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>

            <div class="modal-panel__copy">
              <h3 id="confirm-modal-title" class="modal-panel__title">{{ title }}</h3>
              <p id="confirm-modal-desc" class="modal-panel__desc">{{ message }}</p>
            </div>
          </div>

          <div class="modal-panel__actions">
            <button
              ref="cancelButtonRef"
              type="button"
              class="modal-btn modal-btn--secondary"
              :disabled="loading"
              @click="emit('cancel')"
            >
              {{ cancelLabel }}
            </button>
            <button
              ref="confirmButtonRef"
              type="button"
              :class="['modal-btn', `modal-btn--${variant}`]"
              :disabled="loading"
              @click="emit('confirm')"
            >
              {{ loading ? 'Procesando...' : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: rgb(11 38 35 / 55%);
  backdrop-filter: blur(3px);
}

.modal-panel {
  width: min(32rem, 100%);
  background: white;
  border-radius: var(--radius-md);
  padding: clamp(1.25rem, 3.5vw, 1.75rem);
  box-shadow: 0 20px 45px rgb(0 0 0 / 22%), 0 4px 12px rgb(0 0 0 / 8%);
  border: 1px solid var(--admin-border, #bfd8d5);
  display: grid;
  gap: 1.5rem;
}

.modal-panel__header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.modal-icon {
  flex: 0 0 auto;
  width: 2.75rem;
  height: 2.75rem;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
}

.modal-icon--primary {
  background: var(--admin-soft, #e3f2f0);
  color: var(--admin-primary, #17645f);
}

.modal-icon--danger {
  background: #fee2e2;
  color: #991b1b;
}

.modal-icon--warning {
  background: #fef3c7;
  color: #92400e;
}

.modal-panel__copy {
  display: grid;
  gap: .4rem;
  min-width: 0;
}

.modal-panel__title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-ink, #1a2b18);
  font-weight: 750;
  line-height: 1.3;
}

.modal-panel__desc {
  margin: 0;
  color: var(--color-muted, #4d5a49);
  font-size: .95rem;
  line-height: 1.5;
}

.modal-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
  flex-wrap: wrap;
  padding-top: 1rem;
  border-top: 1px solid var(--admin-border, #bfd8d5);
}

.modal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: .65rem 1.25rem;
  font-size: .92rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all .15s ease;
}

.modal-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.modal-btn--secondary {
  background: white;
  color: var(--color-ink, #1a2b18);
  border: 1px solid var(--admin-border, #bfd8d5);
}

.modal-btn--secondary:hover:not(:disabled) {
  background: var(--admin-soft, #e3f2f0);
}

.modal-btn--primary {
  background: var(--admin-primary, #17645f);
  color: white;
  border: 1px solid var(--admin-primary-dark, #0b3d3a);
}

.modal-btn--primary:hover:not(:disabled) {
  background: var(--admin-primary-dark, #0b3d3a);
}

.modal-btn--danger {
  background: #dc2626;
  color: white;
  border: 1px solid #b91c1c;
}

.modal-btn--danger:hover:not(:disabled) {
  background: #b91c1c;
}

.modal-btn--warning {
  background: #d97706;
  color: white;
  border: 1px solid #b45309;
}

.modal-btn--warning:hover:not(:disabled) {
  background: #b45309;
}

/* Animations */
.modal-enter-from {
  opacity: 0;
}

.modal-enter-from .modal-panel {
  transform: scale(0.95) translateY(0.5rem);
}

.modal-enter-to {
  opacity: 1;
}

.modal-enter-to .modal-panel {
  transform: scale(1) translateY(0);
}

.modal-leave-from {
  opacity: 1;
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to .modal-panel {
  transform: scale(0.95);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity .2s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform .2s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (max-width: 480px) {
  .modal-panel__header {
    flex-direction: column;
  }
  .modal-panel__actions {
    flex-direction: column-reverse;
  }
  .modal-btn {
    width: 100%;
  }
}
</style>
