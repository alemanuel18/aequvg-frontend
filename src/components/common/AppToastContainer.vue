<script setup lang="ts">
import { useToast, type ToastType } from '~/composables/use-toast'

const { toasts, dismiss } = useToast()

const getIconName = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'check'
    case 'error':
      return 'alert-circle'
    case 'warning':
      return 'alert-triangle'
    case 'info':
    default:
      return 'info'
  }
}
</script>

<template>
  <div class="toast-container" aria-label="Notificaciones del sistema">
    <TransitionGroup name="toast" tag="div" class="toast-list">
      <div
        v-for="item in toasts"
        :key="item.id"
        :class="['toast-item', `toast-item--${item.type}`]"
        :role="item.type === 'error' ? 'alert' : 'status'"
        :aria-live="item.type === 'error' ? 'assertive' : 'polite'"
      >
        <div class="toast-item__icon" aria-hidden="true">
          <!-- Check icon -->
          <svg v-if="getIconName(item.type) === 'check'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <!-- Alert circle icon -->
          <svg v-else-if="getIconName(item.type) === 'alert-circle'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <!-- Alert triangle icon -->
          <svg v-else-if="getIconName(item.type) === 'alert-triangle'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <!-- Info icon -->
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>

        <p class="toast-item__message">{{ item.message }}</p>

        <button
          type="button"
          class="toast-item__close"
          aria-label="Cerrar notificación"
          @click="dismiss(item.id)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 10000;
  pointer-events: none;
  max-width: min(28rem, calc(100vw - 2rem));
  width: 100%;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: .65rem;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  padding: .9rem 1.1rem;
  background: white;
  border-radius: var(--radius-sm);
  box-shadow: 0 10px 30px rgb(0 0 0 / 12%), 0 2px 6px rgb(0 0 0 / 6%);
  font-size: .92rem;
  line-height: 1.45;
  transition: all .25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-item--success {
  background: #f0fdf4;
  color: #14532d;
  border: 1px solid #86efac;
}

.toast-item--error {
  background: #fef2f2;
  color: #7f1d1d;
  border: 1px solid #fca5a5;
}

.toast-item--warning {
  background: #fffbeb;
  color: #78350f;
  border: 1px solid #fcd34d;
}

.toast-item--info {
  background: #f0f9ff;
  color: #0c4a6e;
  border: 1px solid #7dd3fc;
}

.toast-item__icon {
  flex: 0 0 auto;
  margin-top: .15rem;
}

.toast-item__message {
  flex: 1 1 auto;
  margin: 0;
  font-weight: 600;
}

.toast-item__close {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  margin-left: .25rem;
  margin-top: -.1rem;
  background: transparent;
  color: currentColor;
  opacity: .6;
  border: 0;
  border-radius: .3rem;
  cursor: pointer;
  transition: opacity .15s ease, background .15s ease;
}

.toast-item__close:hover,
.toast-item__close:focus-visible {
  opacity: 1;
  background: rgb(0 0 0 / 7%);
}

/* Animations */
.toast-enter-from {
  opacity: 0;
  transform: translateY(-1rem) scale(0.95);
}

.toast-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.toast-leave-from {
  opacity: 1;
  transform: scale(1);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(2rem) scale(0.95);
}

@media (max-width: 480px) {
  .toast-container {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: calc(100vw - 2rem);
  }
}
</style>
