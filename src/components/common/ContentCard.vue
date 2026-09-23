<script setup lang="ts">defineProps<{ eyebrow?: string; title: string; body: string }>()</script>
<template><article class="card"><EyebrowBadge v-if="eyebrow" :text="eyebrow" /><h3>{{ title }}</h3><p>{{ body }}</p><slot /></article></template>

<style scoped>
.card {
  display: grid;
  align-content: start;
  gap: .85rem;
  min-width: 0;
  padding: 1.5rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 25px rgb(26 43 24 / 6%);
}

.card p { color: var(--color-muted); }

:slotted(.card__link) {
  width: fit-content;
  margin-top: .3rem;
  font-weight: 800;
}
</style>
