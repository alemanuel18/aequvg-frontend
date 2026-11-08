<script setup lang="ts">
defineProps<{
  to: string;
  label: string;
}>();
</script>

<template>
  <div class="detail-back-link-wrap container">
    <NuxtLink class="detail-back-link" :to="to">
      <span aria-hidden="true">←</span>
      {{ label }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.detail-back-link-wrap {
  padding-top: clamp(1rem, 3vw, 1.75rem);
}

.detail-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.75rem;
  padding: 0.55rem 0.75rem;
  color: var(--color-primary-dark, var(--color-primary));
  border-radius: var(--radius-sm);
  font-weight: 800;
  text-decoration: none;
}

.detail-back-link:hover {
  background: var(--color-soft);
}

.detail-back-link:focus-visible {
  outline: 3px solid var(--color-accent, var(--color-primary));
  outline-offset: 2px;
}
</style>
