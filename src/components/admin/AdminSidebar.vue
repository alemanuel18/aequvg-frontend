<script setup lang="ts">
import type { AdminNavigationItem } from '~/router/navigation'
import type { AdminUser } from '~/types/api'

defineProps<{ items: readonly AdminNavigationItem[]; open: boolean; user: AdminUser | null; loggingOut: boolean }>()
defineEmits<{ close: []; logout: [] }>()

const isMobile = ref(false)
let mediaQuery: MediaQueryList | undefined
const updateViewport = () => { isMobile.value = mediaQuery?.matches ?? false }
onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 900px)')
  updateViewport()
  mediaQuery.addEventListener('change', updateViewport)
})
onBeforeUnmount(() => mediaQuery?.removeEventListener('change', updateViewport))
</script>

<template>
  <aside id="admin-sidebar" class="admin-sidebar" :class="{ 'admin-sidebar--open': open }" :aria-hidden="isMobile && !open ? true : undefined" :inert="isMobile && !open">
    <div class="admin-sidebar__brand">
      <NuxtLink to="/administrador/panel" aria-label="Ir al inicio del panel" @click="$emit('close')">
        <span class="admin-sidebar__mark"><AppIcon name="atom" :size="28" /></span>
        <span><strong>AsoQuímica</strong><small>Panel administrativo</small></span>
      </NuxtLink>
      <button class="admin-sidebar__close" type="button" aria-label="Cerrar menú administrativo" @click="$emit('close')">
        <AppIcon name="close" :size="24" />
      </button>
    </div>

    <nav class="admin-nav" aria-label="Navegación administrativa">
      <p class="admin-nav__label">Módulos</p>
      <ul>
        <li v-for="item in items" :key="item.label">
          <NuxtLink v-if="item.to && !item.disabled" :to="item.to" @click="$emit('close')">
            <AppIcon :name="item.icon" :size="20" />
            <span>{{ item.label }}</span>
          </NuxtLink>
          <span v-else class="admin-nav__disabled" aria-disabled="true">
            <AppIcon :name="item.icon" :size="20" />
            <span>{{ item.label }}<small>Próximamente</small></span>
          </span>
        </li>
      </ul>
    </nav>

    <div class="admin-sidebar__account">
      <span class="admin-sidebar__avatar" aria-hidden="true">{{ user?.name?.charAt(0).toUpperCase() || 'A' }}</span>
      <span class="admin-sidebar__identity"><strong>{{ user?.name || 'Administración' }}</strong><small>{{ user?.role || 'Cuenta autorizada' }}</small></span>
      <button type="button" :disabled="loggingOut" :aria-label="loggingOut ? 'Cerrando sesión' : 'Cerrar sesión'" @click="$emit('logout')">
        <AppIcon name="log-out" :size="20" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.admin-sidebar { position: fixed; inset: 0 auto 0 0; z-index: 40; width: 17.5rem; display: flex; flex-direction: column; color: #effafa; background: var(--admin-primary-dark); border-right: 1px solid rgb(255 255 255 / 12%); }
.admin-sidebar__brand { min-height: 5.5rem; display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: 1rem; border-bottom: 1px solid rgb(255 255 255 / 12%); }
.admin-sidebar__brand > a { display: flex; align-items: center; gap: .7rem; text-decoration: none; }
.admin-sidebar__mark { display: grid; width: 2.55rem; height: 2.55rem; flex: 0 0 auto; place-items: center; color: white; background: var(--admin-primary); border-radius: .75rem; }
.admin-sidebar__brand strong, .admin-sidebar__brand small { display: block; }
.admin-sidebar__brand small { color: #aad0cd; font-size: .68rem; letter-spacing: .06em; text-transform: uppercase; }
.admin-sidebar__close { display: none; }
.admin-nav { flex: 1; overflow-y: auto; padding: 1rem .75rem; }
.admin-nav__label { padding: 0 .65rem .55rem; color: #8dbbb8; font-size: .7rem; font-weight: 900; letter-spacing: .13em; text-transform: uppercase; }
.admin-nav ul { display: grid; gap: .22rem; padding: 0; margin: 0; list-style: none; }
.admin-nav a, .admin-nav__disabled { min-height: 2.8rem; display: flex; align-items: center; gap: .75rem; padding: .65rem .75rem; border-radius: .65rem; text-decoration: none; }
.admin-nav a:hover { background: rgb(255 255 255 / 9%); }
.admin-nav a[aria-current="page"] { color: white; background: var(--admin-primary); box-shadow: inset 3px 0 #80d0ca; }
.admin-nav__disabled { color: #8da3a1; cursor: not-allowed; }
.admin-nav__disabled small { display: block; font-size: .66rem; letter-spacing: .04em; text-transform: uppercase; }
.admin-sidebar__account { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .65rem; padding: 1rem; background: rgb(0 0 0 / 14%); border-top: 1px solid rgb(255 255 255 / 12%); }
.admin-sidebar__avatar { display: grid; width: 2.2rem; height: 2.2rem; place-items: center; color: var(--admin-primary-dark); background: #bde2df; border-radius: 50%; font-weight: 900; }
.admin-sidebar__identity { min-width: 0; }
.admin-sidebar__identity strong, .admin-sidebar__identity small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin-sidebar__identity strong { font-size: .82rem; }
.admin-sidebar__identity small { color: #a9c9c7; font-size: .7rem; }
.admin-sidebar button { display: grid; width: 2.5rem; height: 2.5rem; place-items: center; padding: 0; color: inherit; background: transparent; border: 0; border-radius: .5rem; cursor: pointer; }
.admin-sidebar button:hover { background: rgb(255 255 255 / 10%); }
.admin-sidebar button:disabled { cursor: wait; opacity: .6; }
@media (max-width: 900px) {
  .admin-sidebar { width: min(19rem, calc(100% - 2rem)); box-shadow: 18px 0 48px rgb(3 34 32 / 35%); transform: translateX(-105%); transition: transform .2s ease; }
  .admin-sidebar--open { transform: none; }
  .admin-sidebar__close { display: grid; }
}
</style>
