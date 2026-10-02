<script setup lang="ts">
defineProps<{ userName?: string }>()
defineEmits<{ menu: [] }>()
</script>

<template>
  <header class="admin-topbar">
    <button type="button" aria-label="Abrir menú administrativo" aria-controls="admin-sidebar" @click="$emit('menu')">
      <AppIcon name="menu" :size="24" />
    </button>
    <div><strong>Administración</strong><small v-if="userName">Sesión de {{ userName }}</small></div>
    <NuxtLink to="/" target="_blank" rel="noopener noreferrer">Ver sitio público <span aria-hidden="true">↗</span></NuxtLink>
  </header>
</template>

<style scoped>
.admin-topbar { min-height: 4.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .75rem clamp(1rem, 4vw, 2.5rem); background: white; border-bottom: 1px solid var(--admin-border); }
.admin-topbar button { display: none; width: 2.75rem; height: 2.75rem; place-items: center; padding: 0; color: var(--admin-primary-dark); background: var(--admin-soft); border: 1px solid var(--admin-border); border-radius: .65rem; cursor: pointer; }
.admin-topbar div { display: grid; }
.admin-topbar small { color: var(--color-muted); font-size: .72rem; }
.admin-topbar a { color: var(--admin-primary-dark); font-size: .86rem; font-weight: 850; }
@media (max-width: 900px) { .admin-topbar button { display: grid; } }
@media (max-width: 420px) { .admin-topbar div { display: none; } .admin-topbar a { margin-left: auto; } }
</style>
