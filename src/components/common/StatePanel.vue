<script setup lang="ts">
defineProps<{ title: string; message: string; role?: 'status' | 'alert' }>()
</script>
<template><div class="state-panel" :role="role || 'status'"><span class="state-panel__mark" aria-hidden="true">✦</span><div><h2>{{ title }}</h2><p>{{ message }}</p><div v-if="$slots.default" class="state-panel__action"><slot /></div></div></div></template>

<style scoped>
.state-panel {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.4rem;
  background: var(--color-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.state-panel__mark {
  display: grid;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: white;
  background: var(--color-primary);
  border-radius: 50%;
}

.state-panel h2 { font-size: 1.3rem; }
.state-panel p { color: var(--color-muted); }
.state-panel__action { margin-top: .65rem; }

:slotted(button) {
  padding: .45rem .7rem;
  color: white;
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: .5rem;
  cursor: pointer;
}
</style>
