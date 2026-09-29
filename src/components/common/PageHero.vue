<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <header class="page-hero">
    <div class="container">
      <EyebrowBadge :text="eyebrow" />
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <slot />
    </div>
  </header>
</template>

<style scoped>
.page-hero {
  padding-block: clamp(3.4rem, 7vw, 5.5rem);
  background: linear-gradient(135deg, var(--color-soft), white);
  border-bottom: 1px solid var(--color-border);
}

.page-hero .container {
  display: grid;
  gap: 1rem;
}

.page-hero h1 {
  max-width: 56rem;
  font-size: clamp(2.4rem, 7vw, 4.5rem);
}

.page-hero p {
  max-width: 45rem;
  color: var(--color-muted);
  font-size: 1.1rem;
}
</style>
