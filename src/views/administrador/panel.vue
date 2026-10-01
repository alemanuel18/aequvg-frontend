<script setup lang="ts">
import { adminNavigation } from '~/router/navigation'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Panel administrativo', robots: 'noindex, nofollow' })

const session = useAdminSession()
const modules = computed(() => adminNavigation.filter(item =>
  item.to
  && item.to !== '/administrador/panel'
  && !item.disabled
  && (!item.permission || session.user.value?.permissions.includes(item.permission))
))
</script>

<template>
  <div class="dashboard">
    <AdminPageHeader
      eyebrow="Panel administrativo"
      :title="`Bienvenido${session.user.value?.name ? `, ${session.user.value.name.split(' ')[0]}` : ''}`"
      description="Accede a los módulos habilitados para tu cuenta. Cada sección mantiene separadas las operaciones internas del sitio público."
    />

    <section aria-labelledby="modules-title">
      <div class="dashboard__section-heading">
        <div><p>Accesos directos</p><h2 id="modules-title">Módulos disponibles</h2></div>
        <span>{{ modules.length }} {{ modules.length === 1 ? 'módulo' : 'módulos' }}</span>
      </div>
      <div v-if="modules.length" class="dashboard__grid">
        <AdminModuleCard v-for="item in modules" :key="item.label" :item="item" />
      </div>
      <StatePanel
        v-else
        title="No hay módulos asignados"
        message="Tu sesión está activa, pero la cuenta no tiene permisos de gestión. Solicita la revisión de tu rol a una persona administradora."
      />
    </section>

    <section class="dashboard__notice" aria-labelledby="pending-title">
      <span><AppIcon name="file-text" :size="22" /></span>
      <div><h2 id="pending-title">Tesis aún no está disponible</h2><p>El módulo se mantiene visible como referencia, pero no tiene un enlace activo en este sprint.</p></div>
    </section>
  </div>
</template>

<style scoped>
.dashboard { display: grid; gap: clamp(2.5rem, 6vw, 4.5rem); }
.dashboard section { display: grid; gap: 1.25rem; }
.dashboard__section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
.dashboard__section-heading p { color: var(--admin-primary); font-size: .72rem; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
.dashboard__section-heading h2 { margin-top: .2rem; font-size: clamp(1.65rem, 3.5vw, 2.35rem); }
.dashboard__section-heading > span { flex: 0 0 auto; padding: .35rem .7rem; color: var(--admin-primary-dark); background: var(--admin-soft); border: 1px solid var(--admin-border); border-radius: 999px; font-size: .78rem; font-weight: 850; }
.dashboard__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.dashboard__notice { grid-template-columns: auto minmax(0, 1fr); align-items: start; padding: 1.1rem 1.25rem; background: #edf3f2; border: 1px dashed #9cb8b5; border-radius: var(--radius-md); }
.dashboard__notice > span { display: grid; width: 2.5rem; height: 2.5rem; place-items: center; color: #536967; background: white; border-radius: .65rem; }
.dashboard__notice h2 { font-family: var(--font-body); font-size: 1rem; }
.dashboard__notice p { color: var(--color-muted); font-size: .9rem; }
@media (max-width: 1100px) { .dashboard__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) {
  .dashboard__grid { grid-template-columns: 1fr; }
  .dashboard__section-heading { align-items: start; }
  .dashboard__section-heading > span { margin-top: .25rem; }
}
</style>
