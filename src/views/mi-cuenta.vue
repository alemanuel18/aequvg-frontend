<script setup lang="ts">
import { PublicApiError } from '~/services/api'

useSeoMeta({ title: 'Mi perfil', description: 'Consulta y actualiza tu perfil estudiantil.', robots: 'noindex, nofollow' })
const session = useStudentSession()
const toast = useToast()
const route = useRoute()
const currentTab = computed(() => route.query.section === 'events' ? 'events' : route.query.section === 'comments' ? 'comments' : 'profile')
const checking = ref(true)
const saving = ref(false)
const closing = ref(false)
const requestError = ref('')
const firstNames = ref('')
const lastNames = ref('')

onMounted(async () => {
  const user = await session.load(true)
  checking.value = false
  if (!user) {
    await navigateTo('/acceso?returnTo=/mi-cuenta', { replace: true })
    return
  }
  firstNames.value = user.firstNames
  lastNames.value = user.lastNames
})

const saveProfile = async () => {
  if (saving.value || !session.user.value) return
  saving.value = true
  requestError.value = ''
  try {
    const user = await session.updateProfile({ firstNames: firstNames.value, lastNames: lastNames.value })
    firstNames.value = user.firstNames
    lastNames.value = user.lastNames
    toast.success('Tu perfil se actualizó correctamente.')
  } catch (error) {
    requestError.value = error instanceof PublicApiError ? error.message : 'No pudimos guardar los cambios. Intenta nuevamente.'
    toast.error(requestError.value)
  } finally {
    saving.value = false
  }
}

const logout = async () => {
  if (closing.value) return
  closing.value = true
  requestError.value = ''
  try {
    await session.logout()
    await navigateTo('/', { replace: true })
  } catch (error) {
    requestError.value = error instanceof PublicApiError ? error.message : 'No pudimos cerrar la sesión. Intenta nuevamente.'
    toast.error(requestError.value)
  } finally {
    closing.value = false
  }
}
</script>

<template>
  <AppSection title="Mi cuenta" lead="Gestiona tu presencia en el portal estudiantil.">
    <StatePanel v-if="checking" title="Comprobando tu sesión" message="Estamos preparando tu espacio personal." />
    <div v-else-if="session.user.value" class="panel">
      <AccountNavigation :current="currentTab" />
      <StatePanel v-if="currentTab === 'events'" title="Mis eventos" message="Aquí encontrarás tus eventos. La integración del listado está a cargo del equipo de eventos." />
      <StatePanel v-else-if="currentTab === 'comments'" title="Mis comentarios" message="Aquí encontrarás tus comentarios. La integración del listado está a cargo del equipo de comentarios." />
      <section v-else class="account" aria-labelledby="account-title">
        <div class="profile-placeholder" aria-label="Foto de perfil genérica"><AppIcon name="users" :size="42" /></div>
        <div class="account__heading">
          <EyebrowBadge>Cuenta estudiantil</EyebrowBadge>
          <h2 id="account-title">Hola, {{ session.user.value.name }}</h2>
          <p>Actualiza tus nombres y apellidos. Tu correo institucional identifica tu cuenta y no se puede cambiar aquí.</p>
        </div>
        <form class="profile-form" @submit.prevent="saveProfile">
          <label for="first-names">Nombres</label>
          <input id="first-names" v-model="firstNames" name="firstNames" autocomplete="given-name" minlength="2" maxlength="80" required>
          <label for="last-names">Apellidos</label>
          <input id="last-names" v-model="lastNames" name="lastNames" autocomplete="family-name" minlength="2" maxlength="80" required>
          <label for="email">Correo institucional</label>
          <input id="email" :value="session.user.value.email" autocomplete="email" readonly aria-describedby="email-help">
          <small id="email-help">El correo no forma parte de los datos editables del perfil.</small>
          <p class="student-type">Tipo de cuenta: Estudiante UVG</p>
          <p v-if="requestError" class="form-error" role="alert">{{ requestError }}</p>
          <div class="actions">
            <AppButton type="submit" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar cambios' }}</AppButton>
            <AppButton variant="secondary" :disabled="closing" @click="logout">{{ closing ? 'Cerrando sesión…' : 'Cerrar sesión' }}</AppButton>
          </div>
        </form>
      </section>
    </div>
  </AppSection>
</template>

<style scoped>
.panel { max-width: 54rem; margin-inline: auto; }
.profile-form input:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
.account { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 1.5rem; padding: clamp(1.25rem, 5vw, 2.5rem); background: white; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow); }
.profile-placeholder { width: 5rem; height: 5rem; display: grid; place-items: center; color: white; background: var(--color-primary); border: .3rem solid var(--color-soft); border-radius: 50%; }
.account__heading h2 { margin-block: .6rem; font-size: clamp(1.8rem, 6vw, 2.8rem); overflow-wrap: anywhere; }
.account__heading p, .profile-form small { color: var(--color-muted); }
.profile-form { grid-column: 1 / -1; display: grid; gap: .65rem; }
.profile-form label { margin-top: .5rem; font-weight: 750; }
.profile-form input { width: 100%; min-height: 2.8rem; padding: .65rem .8rem; color: var(--color-ink); background: white; border: 1px solid var(--color-border); border-radius: .5rem; font: inherit; }
.profile-form input[readonly] { background: var(--color-soft); }
.student-type { display: flex; align-items: center; gap: .5rem; margin-block: .75rem; color: var(--color-primary); font-weight: 750; }
.form-error { color: var(--color-danger); font-weight: 700; }
.actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: .5rem; }
@media (max-width: 480px) { .account { grid-template-columns: 1fr; } .profile-form { grid-column: 1; } }
</style>
