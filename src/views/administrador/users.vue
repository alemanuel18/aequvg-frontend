<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: "admin-auth",
  alias: ["/administrador/usuarios"],
});
useSeoMeta({ title: "Usuarios · Administración", robots: "noindex, nofollow" });
</script>
<template>
  <AdminUnderConstruction
    title="Usuarios"
    description="Gestiona las cuentas autorizadas y sus permisos administrativos."
  />
</template>
