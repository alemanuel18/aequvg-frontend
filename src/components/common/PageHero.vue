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
