<script setup lang="ts">
import type { AdminNavigationItem } from '~/router/navigation'
defineProps<{ item: AdminNavigationItem }>()
</script>
<template>
  <NuxtLink v-if="item.to && !item.disabled" class="module-card" :to="item.to" :aria-label="`Abrir módulo: ${item.label}`">
    <span class="module-card__icon"><AppIcon :name="item.icon" :size="24" /></span>
    <span><strong>{{ item.label }}</strong><small>{{ item.description }}</small></span>
    <span class="module-card__arrow" aria-hidden="true">→</span>
  </NuxtLink>
</template>
<style scoped>
.module-card { min-height: 9rem; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: 1rem; padding: 1.25rem; color: var(--color-ink); background: white; border: 1px solid var(--admin-border); border-radius: var(--radius-md); box-shadow: 0 12px 28px rgb(12 63 60 / 7%); text-decoration: none; transition: border-color .15s ease, transform .15s ease; }
.module-card:hover { border-color: var(--admin-primary); transform: translateY(-2px); }
.module-card__icon { display: grid; width: 2.8rem; height: 2.8rem; place-items: center; color: var(--admin-primary-dark); background: var(--admin-soft); border-radius: .75rem; }
.module-card strong, .module-card small { display: block; }
.module-card strong { margin-top: .15rem; font-family: var(--font-display); font-size: 1.2rem; }
.module-card small { margin-top: .4rem; color: var(--color-muted); line-height: 1.45; }
.module-card__arrow { color: var(--admin-primary); font-size: 1.35rem; font-weight: 900; }
</style>
