<script setup lang="ts">
defineProps<{ text?: string }>()
</script>

<template>
  <span class="eyebrow">
    {{ text }}
    <slot />
  </span>
</template>

<style scoped>
.eyebrow {
  display: inline-flex;
  width: fit-content;
  min-height: 2rem;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  padding: .48rem .78rem;
  color: var(--color-primary);
  background: var(--color-soft);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: .76rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: .04em;
  text-align: center;
  text-transform: uppercase;
}
</style>
