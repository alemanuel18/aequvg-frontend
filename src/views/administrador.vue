<script setup lang="ts">
import type { AdminLoginErrors } from '~/composables/admin-login-validation'
import { PublicApiError } from '~/services/api'

definePageMeta({ layout: false })
useSeoMeta({ title: 'Acceso administrativo', description: 'Acceso privado al panel administrativo de AsoQuímica UVG.', robots: 'noindex, nofollow' })

const route = useRoute()
const session = useAdminSession()
const fields = reactive({ email: '', password: '' })
const errors = ref<AdminLoginErrors>({})
const requestError = ref('')
const statusMessage = ref('')
const submitting = ref(false)
const emailInput = ref<HTMLInputElement | null>(null)
const passwordInput = ref<HTMLInputElement | null>(null)

const safeReturnTo = computed(() => {
  const value = typeof route.query.returnTo === 'string' ? route.query.returnTo : ''
  return value.startsWith('/administrador/') && !value.startsWith('//') ? value : '/administrador/panel'
})

onMounted(async () => {
  const currentUser = await session.load()
  if (currentUser) await navigateTo(safeReturnTo.value, { replace: true })
})

const submit = async () => {
  if (submitting.value) return
  errors.value = validateAdminLogin(fields)
  requestError.value = ''
  statusMessage.value = ''

  if (Object.keys(errors.value).length) {
    await nextTick()
    if (errors.value.email) emailInput.value?.focus()
    else passwordInput.value?.focus()
    return
  }

  submitting.value = true
  try {
    await session.login({ email: fields.email.trim().toLowerCase(), password: fields.password })
    statusMessage.value = 'Sesión iniciada. Abriendo el panel administrativo.'
    await navigateTo(safeReturnTo.value, { replace: true })
  } catch (error) {
    requestError.value = error instanceof PublicApiError
      ? error.message
      : 'No pudimos iniciar sesión. Intenta nuevamente.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-shell">
    <a class="skip-link" href="#admin-login">Saltar al formulario</a>
    <header class="login-header">
      <NuxtLink class="brand" to="/" aria-label="Ir al sitio público de AsoQuímica UVG">
        <span class="brand__mark"><AppIcon name="atom" :size="30" /></span>
        <span><strong>AsoQuímica UVG</strong><small>Administración</small></span>
      </NuxtLink>
      <NuxtLink class="public-link" to="/">Volver al sitio público</NuxtLink>
    </header>

    <main class="login-main">
      <section class="login-intro" aria-labelledby="login-title">
        <span class="eyebrow">Acceso privado</span>
        <h1 id="login-title">Panel administrativo</h1>
        <p>Ingresa con la cuenta institucional autorizada para gestionar los módulos disponibles.</p>
      </section>

      <form id="admin-login" class="login-card" novalidate @submit.prevent="submit">
        <div>
          <h2>Iniciar sesión</h2>
          <p class="login-card__hint">Usa tus credenciales institucionales de UVG.</p>
        </div>

        <div class="field">
          <label for="admin-email">Correo institucional</label>
          <input
            id="admin-email"
            ref="emailInput"
            v-model="fields.email"
            name="email"
            type="email"
            inputmode="email"
            autocomplete="username"
            maxlength="254"
            :aria-invalid="Boolean(errors.email)"
            :aria-describedby="errors.email ? 'admin-email-error' : undefined"
            :disabled="submitting"
          >
          <p v-if="errors.email" id="admin-email-error" class="field__error">{{ errors.email }}</p>
        </div>

        <div class="field">
          <label for="admin-password">Contraseña</label>
          <input
            id="admin-password"
            ref="passwordInput"
            v-model="fields.password"
            name="password"
            type="password"
            autocomplete="current-password"
            maxlength="256"
            :aria-invalid="Boolean(errors.password)"
            :aria-describedby="errors.password ? 'admin-password-error' : undefined"
            :disabled="submitting"
          >
          <p v-if="errors.password" id="admin-password-error" class="field__error">{{ errors.password }}</p>
        </div>

        <p v-if="requestError" class="form-message form-message--error" role="alert">{{ requestError }}</p>
        <p class="sr-only" aria-live="polite">{{ statusMessage }}</p>

        <AppButton type="submit" :disabled="submitting">
          {{ submitting ? 'Verificando acceso…' : 'Iniciar sesión' }}
        </AppButton>
      </form>
    </main>
  </div>
</template>

<style scoped>
.login-shell {
  --admin-primary: #175f5b;
  --admin-primary-dark: #0b3d3a;
  min-height: 100vh;
  background: linear-gradient(145deg, var(--admin-primary-dark), var(--admin-primary) 50%, #3d7570);
}
.skip-link { position: fixed; top: .5rem; left: .5rem; z-index: 10; padding: .7rem 1rem; color: var(--color-ink); background: white; border-radius: .5rem; transform: translateY(-160%); }
.skip-link:focus { transform: none; }
.login-header { width: min(76rem, calc(100% - 2rem)); min-height: 5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-inline: auto; color: white; }
.brand { display: inline-flex; align-items: center; gap: .75rem; text-decoration: none; }
.brand__mark { display: grid; width: 2.8rem; height: 2.8rem; place-items: center; border: 1px solid rgb(255 255 255 / 45%); border-radius: 50%; }
.brand strong, .brand small { display: block; }
.brand small { color: rgb(255 255 255 / 76%); font-size: .76rem; letter-spacing: .08em; text-transform: uppercase; }
.public-link { font-weight: 800; text-underline-offset: .25em; }
.login-main { width: min(68rem, calc(100% - 2rem)); min-height: calc(100vh - 5rem); display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(18rem, .9fr); align-items: center; gap: clamp(2rem, 7vw, 6rem); padding-block: 3rem 6rem; margin-inline: auto; }
.login-intro { color: white; }
.eyebrow { display: inline-block; margin-bottom: 1rem; color: #dce6d4; font-size: .8rem; font-weight: 900; letter-spacing: .13em; text-transform: uppercase; }
.login-intro h1 { max-width: 9ch; font-size: clamp(2.7rem, 7vw, 5.3rem); }
.login-intro p { max-width: 35rem; margin-top: 1.25rem; color: rgb(255 255 255 / 82%); font-size: 1.08rem; }
.login-card { display: grid; gap: 1.25rem; padding: clamp(1.35rem, 5vw, 2.25rem); background: white; border: 1px solid rgb(255 255 255 / 50%); border-radius: var(--radius-lg); box-shadow: 0 28px 65px rgb(0 0 0 / 25%); }
.login-card h2 { font-size: 2rem; }
.login-card__hint { margin-top: .35rem; color: var(--color-muted); }
.field { display: grid; gap: .4rem; }
.field label { font-weight: 850; }
.field input { width: 100%; min-height: 3rem; padding: .7rem .8rem; color: var(--color-ink); background: white; border: 1px solid #9ca696; border-radius: .65rem; }
.field input[aria-invalid="true"] { border-color: var(--color-danger); border-width: 2px; }
.field__error, .form-message--error { color: var(--color-danger); font-weight: 750; }
.form-message { padding: .75rem; background: #fff0f0; border: 1px solid #d99; border-radius: .55rem; }
.login-card :deep(.button) { width: 100%; background: var(--admin-primary); border-color: var(--admin-primary); }
.login-card :deep(.button:hover) { background: var(--admin-primary-dark); }
@media (max-width: 720px) {
  .login-header { min-height: 4.5rem; }
  .brand small { display: none; }
  .public-link { font-size: .87rem; }
  .login-main { min-height: auto; grid-template-columns: 1fr; gap: 2rem; padding-block: 2.5rem 4rem; }
  .login-intro h1 { font-size: clamp(2.5rem, 14vw, 4rem); }
}
@media (max-width: 360px) {
  .brand strong { font-size: .9rem; }
  .brand__mark { width: 2.4rem; height: 2.4rem; }
  .public-link { max-width: 6rem; text-align: right; }
}
</style>
