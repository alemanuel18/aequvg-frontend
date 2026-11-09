<script setup lang="ts">
import { adminNavigation } from "~/router/navigation";
import { PublicApiError } from "~/services/api";

const session = useAdminSession();
const route = useRoute();
const menuOpen = ref(false);
const loggingOut = ref(false);
const logoutError = ref("");
const topbar = ref<{ focusMenuButton: () => void } | null>(null);

const closeMenu = () => {
  menuOpen.value = false;
  nextTick(() => topbar.value?.focusMenuButton());
};

const openMenu = () => {
  menuOpen.value = true;
};

const visibleNavigation = computed(() =>
  adminNavigation.filter(
    (item) =>
      !item.permission ||
      session.user.value?.permissions.includes(item.permission),
  ),
);

watch(
  () => route.fullPath,
  () => {
    if (menuOpen.value) closeMenu();
  },
);

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && menuOpen.value) closeMenu();
};

onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));

const logout = async () => {
  if (loggingOut.value) return;
  loggingOut.value = true;
  logoutError.value = "";
  try {
    await session.logout();
    await navigateTo("/administrador", { replace: true });
  } catch (error) {
    if (
      error instanceof PublicApiError &&
      [401, 403].includes(error.status ?? 0)
    ) {
      session.clear();
      await navigateTo("/administrador", { replace: true });
      return;
    }
    logoutError.value = "No pudimos cerrar la sesión. Intenta nuevamente.";
  } finally {
    loggingOut.value = false;
  }
};
</script>

<template>
  <div class="admin-shell">
    <a class="admin-skip-link" href="#admin-content">Saltar al contenido</a>
    <AdminSidebar
      :items="visibleNavigation"
      :open="menuOpen"
      :user="session.user.value"
      :logging-out="loggingOut"
      @close="closeMenu"
      @logout="logout"
    />
    <button
      v-if="menuOpen"
      class="admin-overlay"
      type="button"
      aria-label="Cerrar menú administrativo"
      @click="closeMenu"
    />
    <div class="admin-workspace">
      <AdminTopbar
        ref="topbar"
        :user-name="session.user.value?.name"
        @menu="openMenu"
      />
      <p v-if="logoutError" class="admin-alert" role="alert">
        {{ logoutError }}
      </p>
      <main id="admin-content" class="admin-content"><slot /></main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  --admin-primary: var(--theme-admin-primary);
  --admin-primary-dark: var(--theme-admin-primary-dark);
  --admin-soft: var(--theme-admin-soft);
  --admin-border: var(--theme-admin-border);
  --color-primary: var(--admin-primary);
  --color-primary-dark: var(--admin-primary-dark);
  --color-soft: var(--admin-soft);
  --color-border: var(--admin-border);
  min-height: 100vh;
  color: var(--color-ink);
  background: #f5f8f7;
}
.admin-workspace {
  min-height: 100vh;
  margin-left: 17rem;
}
.admin-content {
  width: min(var(--container-dashboard), calc(100% - 2rem));
  padding-block: clamp(2rem, 5vw, 4rem);
  margin-inline: auto;
}
.admin-skip-link {
  position: fixed;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 100;
  padding: 0.7rem 1rem;
  color: var(--color-ink);
  background: white;
  border-radius: 0.5rem;
  transform: translateY(-160%);
}
.admin-skip-link:focus {
  transform: none;
}
.admin-overlay {
  display: none;
}
.admin-alert {
  padding: 0.7rem 1rem;
  color: var(--color-danger);
  background: #fff0f0;
  border-bottom: 1px solid #d99;
  font-weight: 750;
  text-align: center;
}
@media (max-width: 900px) {
  .admin-workspace {
    margin-left: 0;
  }
  .admin-overlay {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: block;
    width: 100%;
    padding: 0;
    background: rgb(4 35 33 / 52%);
    border: 0;
  }
}
@media (max-width: 620px) {
  .admin-content {
    width: min(100% - 1.25rem, var(--container-dashboard));
    padding-block: 1.5rem 2.5rem;
  }
}
@media (max-width: 360px) {
  .admin-content { width: calc(100% - 1rem); }
}
</style>
