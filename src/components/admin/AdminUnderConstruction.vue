<script setup lang="ts">defineProps<{ title: string; description: string }>()</script>
<template>
  <div class="admin-placeholder">
    <AdminPageHeader eyebrow="Módulo administrativo" :title="title" :description="description" />
    <StatePanel title="Módulo en construcción" message="La ruta y la navegación ya están disponibles. Las operaciones de este módulo se incorporarán en una tarea posterior." />
  </div>
</template>
<style scoped>
.admin-placeholder { display: grid; gap: 2rem; }
.admin-placeholder :deep(.state-panel) { background: var(--admin-soft); border-color: var(--admin-border); }
.admin-placeholder :deep(.state-panel__mark) { background: var(--admin-primary); }
</style>
