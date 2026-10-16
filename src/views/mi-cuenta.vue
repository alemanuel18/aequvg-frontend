<script setup lang="ts">
import { PublicApiError } from '~/services/api'

useSeoMeta({ title: 'Mi cuenta', description: 'Panel personal del portal estudiantil.', robots: 'noindex, nofollow' })
const session = useStudentSession()
const checking = ref(true)
const closing = ref(false)
const requestError = ref('')

onMounted(async () => {
  const user = await session.load(true)
  checking.value = false
  if (!user) await navigateTo('/acceso?returnTo=/mi-cuenta', { replace: true })
})

const logout = async () => {
  if (closing.value) return
  closing.value = true
  requestError.value = ''
  try {
    await session.logout()
    await navigateTo('/', { replace: true })
  } catch (error) {
    requestError.value = error instanceof PublicApiError ? error.message : 'No pudimos cerrar la sesión. Intenta nuevamente.'
  } finally {
    closing.value = false
  }
}
</script>

<template>
  <AppSection title="Mi cuenta" lead="Tu espacio personal dentro del portal estudiantil.">
    <StatePanel v-if="checking" title="Comprobando tu sesión" message="Estamos preparando tu espacio personal." />
    <section v-else-if="session.user.value" class="account" aria-labelledby="account-title">
      <div class="profile-placeholder" aria-label="Foto de perfil genérica"><AppIcon name="users" :size="42" /></div>
      <div>
        <EyebrowBadge>Cuenta estudiantil</EyebrowBadge>
        <h2 id="account-title">Hola, {{ session.user.value.name }}</h2>
        <p class="account__email">{{ session.user.value.email }}</p>
        <p>Tu sesión te permite participar en las funciones estudiantiles del portal, sin permisos administrativos.</p>
      </div>
      <p v-if="requestError" class="account__error" role="alert">{{ requestError }}</p>
      <AppButton variant="secondary" :disabled="closing" @click="logout">{{ closing ? 'Cerrando sesión…' : 'Cerrar sesión' }}</AppButton>
    </section>
  </AppSection>
</template>

<style scoped>
.account { max-width: 48rem; display: grid; justify-items: start; gap: 1.3rem; padding: clamp(1.5rem, 5vw, 3rem); margin-inline: auto; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow); }
.profile-placeholder { width: 6rem; height: 6rem; display: grid; place-items: center; color: white; background: var(--color-primary); border: .35rem solid var(--color-soft); border-radius: 50%; }
.account h2 { margin-top: .8rem; font-size: clamp(2.2rem, 7vw, 4rem); }
.account__email { margin-block: .5rem 1rem; color: var(--color-muted); font-weight: 750; }
.account__error { color: var(--color-danger); font-weight: 750; }
</style>
