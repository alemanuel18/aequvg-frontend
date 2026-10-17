<script setup lang="ts">
defineProps<{ current: 'profile' | 'events' | 'comments' }>()
</script>

<template>
  <nav class="account-nav" aria-label="Navegación de Mi cuenta">
    <NuxtLink to="/mi-cuenta" :aria-current="current === 'profile' ? 'page' : undefined">Mi perfil</NuxtLink>
    <NuxtLink to="/mi-cuenta?section=events" :aria-current="current === 'events' ? 'page' : undefined">Mis eventos</NuxtLink>
    <NuxtLink to="/mi-cuenta?section=comments" :aria-current="current === 'comments' ? 'page' : undefined">Mis comentarios</NuxtLink>
  </nav>
</template>

<style scoped>
.account-nav { display: flex; gap: .5rem; overflow-x: auto; margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border); }
.account-nav a { display: inline-flex; align-items: center; min-height: 2.75rem; padding: .65rem 1rem; color: var(--color-primary); font-weight: 750; white-space: nowrap; text-decoration: none; border-bottom: 3px solid transparent; }
.account-nav a[aria-current="page"] { color: var(--color-ink); border-color: var(--color-primary); }
.account-nav a:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
</style>
