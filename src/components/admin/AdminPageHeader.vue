<script setup lang="ts">
defineProps<{ eyebrow?: string; title: string; description: string }>();
</script>
<template>
  <header class="admin-page-header">
    <p v-if="eyebrow">{{ eyebrow }}</p>
    <h1>{{ title }}</h1>
    <span>{{ description }}</span>
  </header>
</template>
<style scoped>
.admin-page-header {
  max-width: 52rem;
}
.admin-page-header p {
  margin-bottom: 0.55rem;
  color: var(--admin-primary);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.admin-page-header h1 {
  font-size: clamp(2.1rem, 5vw, 3.7rem);
}
.admin-page-header span {
  display: block;
  margin-top: 0.75rem;
  color: var(--color-muted);
  font-size: 1.02rem;
}
</style>
